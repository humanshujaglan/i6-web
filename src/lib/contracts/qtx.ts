import { ethers } from "ethers";
import {
    QUANTX_REINVEST_ADDRESS,
    QTX_TOKEN_ADDRESS,
    I6_TOKEN_ADDRESS,
    QUANTX_ABI,
    ERC20_ABI,
    RELAYER_ADDRESS,
    RELAYER_API_BASE
} from "./abis";

export const BSC_RPC_DEFAULT = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org";
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 56);

export interface UserAllocationResult {
    finalQtxAmount: bigint;
    claimedQtxAmount: bigint;
    lockExpiry: bigint;
    lastClaimTimestamp: bigint;
    isClaimable: boolean;
    formattedAllocated: string;
    formattedClaimed: string;
}

export interface RelayerStatusResponse {
    userAddress: string;
    relayerAddress: string;
    nonce: number;
    allowance: string;
    hasAllowance: boolean;
    preference: {
        userAddress: string;
        percent: number;
        signature: string;
        deadline: number;
    } | null;
}

/**
 * Reads user allocation directly from the QuantX Launchpad contract
 * launchpad address: 0x8F0d64d3484CAFb09f6fD8BBBaeb24049E11ad16
 */
export async function fetchUserAllocation(
    userAddress: string,
    providerOrSigner?: ethers.Provider | ethers.Signer
): Promise<UserAllocationResult> {
    try {
        const provider = providerOrSigner || new ethers.JsonRpcProvider(BSC_RPC_DEFAULT);
        const contract = new ethers.Contract(QUANTX_REINVEST_ADDRESS, QUANTX_ABI, provider);

        const allocation = await contract.getUserAllocation(userAddress);
        const finalQtxAmount = BigInt(allocation[0]?.toString() || "0");
        const claimedQtxAmount = BigInt(allocation[1]?.toString() || "0");
        const lockExpiry = BigInt(allocation[2]?.toString() || "0");
        const lastClaimTimestamp = BigInt(allocation[3]?.toString() || "0");
        const isClaimable = Boolean(allocation[4]);

        return {
            finalQtxAmount,
            claimedQtxAmount,
            lockExpiry,
            lastClaimTimestamp,
            isClaimable,
            formattedAllocated: parseFloat(ethers.formatUnits(finalQtxAmount, 18)).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
            }),
            formattedClaimed: parseFloat(ethers.formatUnits(claimedQtxAmount, 18)).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
            }),
        };
    } catch (err) {
        console.error("fetchUserAllocation error:", err);
        return {
            finalQtxAmount: 0n,
            claimedQtxAmount: 0n,
            lockExpiry: 0n,
            lastClaimTimestamp: 0n,
            isClaimable: false,
            formattedAllocated: "0.00",
            formattedClaimed: "0.00",
        };
    }
}

/**
 * Retrieves relayer status from relayer backend API or internal proxy
 */
export async function getRelayerStatus(userAddress: string): Promise<RelayerStatusResponse> {
    try {
        // Try internal proxy route first (for CORS protection & local caching)
        const res = await fetch(`/api/reinvest/status/${userAddress}`, {
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
        });

        if (res.ok) {
            return await res.json();
        }

        // Direct fallback
        const directRes = await fetch(`${RELAYER_API_BASE}/api/reinvest/status/${userAddress}`, {
            headers: { "Content-Type": "application/json" },
        });

        if (directRes.ok) {
            return await directRes.json();
        }

        throw new Error("Unable to fetch status from relayer");
    } catch (error) {
        console.warn("Relayer status fetch fallback:", error);
        return {
            userAddress,
            relayerAddress: RELAYER_ADDRESS,
            nonce: 0,
            allowance: "0",
            hasAllowance: false,
            preference: null,
        };
    }
}

/**
 * Signs and submits user reinvestment preference using EIP-712 standard
 */
export async function submitReinvestPreference(
    signer: any,
    userAddress: string,
    percent: number = 75,
    nonce: number = 0
): Promise<any> {
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour validity

    const domain = {
        name: "QTX Reinvestment Engine",
        version: "1",
        chainId: CHAIN_ID,
        verifyingContract: QUANTX_REINVEST_ADDRESS,
    };

    const types = {
        ReinvestPreference: [
            { name: "user", type: "address" },
            { name: "token", type: "address" },
            { name: "percent", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ],
    };

    const value = {
        user: userAddress,
        token: I6_TOKEN_ADDRESS,
        percent,
        nonce,
        deadline,
    };

    let signature = "0x";
    if (signer && typeof signer.signTypedData === "function") {
        signature = await signer.signTypedData(domain, types, value);
    } else if (signer && typeof signer._signTypedData === "function") {
        signature = await signer._signTypedData(domain, types, value);
    }

    const payload = {
        userAddress,
        percent,
        nonce,
        deadline,
        signature,
    };

    // Save to local proxy first
    try {
        await fetch("/api/reinvest/preference", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    } catch (e) {
        console.warn("Local preference proxy failed:", e);
    }

    // Also forward to external relayer
    try {
        const prefRes = await fetch(`${RELAYER_API_BASE}/api/reinvest/preference`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (prefRes.ok) {
            return await prefRes.json();
        }
    } catch (e) {
        console.warn("External relayer preference submission failed:", e);
    }

    return { success: true, preference: payload };
}
