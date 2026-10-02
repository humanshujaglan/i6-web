import { ethers } from "ethers";
import {
    QUANTX_REINVEST_ADDRESS,
    QTX_TOKEN_ADDRESS,
    I6_TOKEN_ADDRESS,
    USDT_ADDRESS,
    WBNB_ADDRESS,
    ROUTER_ADDRESS,
    QUANTX_ABI,
    ERC20_ABI,
    RELAYER_ADDRESS,
    RELAYER_API_BASE,
    QTX_TIMELOCK_ADDRESS,
    QTX_TIMELOCK_ABI,
} from "./abis";

export const BSC_RPC_DEFAULT = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org";
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 56);
export const UNLIMITED_ALLOWANCE_THRESHOLD = 2n ** 255n; // Half of MaxUint256, easily accounts for any spends while still unlimited

export const SWAP_PATH_I6_TO_QTX = [
    I6_TOKEN_ADDRESS,
    USDT_ADDRESS,
    WBNB_ADDRESS,
    QTX_TOKEN_ADDRESS,
];

/**
 * Calculates real-time expected QTX returned from i6 swap on PancakeSwap
 */
export async function fetchQtxQuote(
    i6AmountWei: bigint,
    publicClientOrProvider?: any
): Promise<{ expectedQtxWei: bigint; formattedQtx: string }> {
    if (i6AmountWei <= 0n) {
        return { expectedQtxWei: 0n, formattedQtx: "0.0000" };
    }

    try {
        if (publicClientOrProvider && typeof publicClientOrProvider.readContract === "function") {
            const amounts = await publicClientOrProvider.readContract({
                address: ROUTER_ADDRESS as `0x${string}`,
                abi: [
                    {
                        inputs: [
                            { internalType: "uint256", name: "amountIn", type: "uint256" },
                            { internalType: "address[]", name: "path", type: "address[]" },
                        ],
                        name: "getAmountsOut",
                        outputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
                        stateMutability: "view",
                        type: "function",
                    },
                ],
                functionName: "getAmountsOut",
                args: [i6AmountWei, SWAP_PATH_I6_TO_QTX as `0x${string}`[]],
            }) as bigint[];

            const qtxOut = amounts[amounts.length - 1];
            return {
                expectedQtxWei: qtxOut,
                formattedQtx: parseFloat(ethers.formatUnits(qtxOut, 18)).toFixed(4),
            };
        }

        const provider = publicClientOrProvider || new ethers.JsonRpcProvider(BSC_RPC_DEFAULT);
        const router = new ethers.Contract(
            ROUTER_ADDRESS,
            ["function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)"],
            provider
        );
        const amounts = await router.getAmountsOut(i6AmountWei, SWAP_PATH_I6_TO_QTX);
        const qtxOut = BigInt(amounts[amounts.length - 1].toString());
        return {
            expectedQtxWei: qtxOut,
            formattedQtx: parseFloat(ethers.formatUnits(qtxOut, 18)).toFixed(4),
        };
    } catch (e) {
        console.warn("fetchQtxQuote error:", e);
        return { expectedQtxWei: 0n, formattedQtx: "0.0000" };
    }
}

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
    hasPreference?: boolean;
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
    const cleanAddr = userAddress.toLowerCase();
    try {
        let proxyData: RelayerStatusResponse | null = null;
        // Try internal proxy route first (for CORS protection & local caching)
        try {
            const res = await fetch(`/api/reinvest/status/${cleanAddr}`, {
                headers: { "Content-Type": "application/json" },
                cache: "no-store",
            });
            if (res.ok) {
                proxyData = await res.json();
                if (proxyData?.preference?.percent) {
                    return proxyData;
                }
            }
        } catch (e) {
            console.warn("Proxy relayer status fetch error:", e);
        }

        // Direct fallback to external relayer
        try {
            const directRes = await fetch(`${RELAYER_API_BASE}/api/reinvest/status/${cleanAddr}`, {
                headers: { "Content-Type": "application/json" },
                cache: "no-store",
            });

            if (directRes.ok) {
                const directData: RelayerStatusResponse = await directRes.json();
                if (proxyData) {
                    return {
                        ...proxyData,
                        ...directData,
                        preference: directData?.preference?.percent ? directData.preference : (proxyData.preference ?? null),
                    };
                }
                return directData;
            }
        } catch (e) {
            console.warn("Direct relayer status fetch error:", e);
        }

        if (proxyData) {
            return proxyData;
        }

        throw new Error("Unable to fetch status from relayer");
    } catch (error) {
        console.warn("Relayer status fetch fallback:", error);
        return {
            userAddress: cleanAddr,
            relayerAddress: RELAYER_ADDRESS,
            nonce: 0,
            allowance: "0",
            hasAllowance: false,
            preference: null,
        };
    }
}

/**
 * Checks whether user has granted relayer unlimited allowance for i6 token
 */
export async function checkRelayerAllowance(
    userAddress: string,
    publicClientOrProvider?: any
): Promise<boolean> {
    try {
        if (publicClientOrProvider && typeof publicClientOrProvider.readContract === "function") {
            const allowance = await publicClientOrProvider.readContract({
                address: I6_TOKEN_ADDRESS as `0x${string}`,
                abi: ERC20_ABI,
                functionName: "allowance",
                args: [userAddress as `0x${string}`, RELAYER_ADDRESS as `0x${string}`],
            }) as bigint;
            return allowance >= UNLIMITED_ALLOWANCE_THRESHOLD;
        }

        const provider = publicClientOrProvider || new ethers.JsonRpcProvider(BSC_RPC_DEFAULT);
        const token = new ethers.Contract(I6_TOKEN_ADDRESS, ERC20_ABI, provider);
        const allowance = await token.allowance(userAddress, RELAYER_ADDRESS);
        return BigInt(allowance.toString()) >= UNLIMITED_ALLOWANCE_THRESHOLD;
    } catch (e) {
        console.warn("checkRelayerAllowance fallback to API:", e);
        try {
            const status = await getRelayerStatus(userAddress);
            return Boolean(status.hasAllowance);
        } catch {
            return false;
        }
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

export interface TimelockInfo {
    releaseTime: number;
    timelockDuration: number;
    trancheDuration: number;
    totalAllocatedToUsers: string;
    totalReleasedToUsers: string;
    unallocatedCapacity: string;
    unlockedBps: number;
}

export async function fetchQtxTimelockInfo(
    publicClientOrProvider?: any
): Promise<TimelockInfo> {
    try {
        const provider = publicClientOrProvider || new ethers.JsonRpcProvider(BSC_RPC_DEFAULT);
        const contract = new ethers.Contract(QTX_TIMELOCK_ADDRESS, QTX_TIMELOCK_ABI, provider);

        const now = Math.floor(Date.now() / 1000);
        const [
            releaseTimeRaw,
            timelockDurationRaw,
            trancheDurationRaw,
            totalAllocatedRaw,
            totalReleasedRaw,
            unallocatedCapacityRaw,
            unlockedBpsRaw
        ] = await Promise.all([
            contract.releaseTime().catch(() => 1806426968n),
            contract.TIMELOCK_DURATION().catch(() => 15552000n),
            contract.TRANCHE_DURATION().catch(() => 7776000n),
            contract.totalAllocatedToUsers().catch(() => 0n),
            contract.totalReleasedToUsers().catch(() => 0n),
            contract.unallocatedCapacity().catch(() => 0n),
            contract.unlockedBps(now).catch(() => 0n),
        ]);

        return {
            releaseTime: Number(releaseTimeRaw),
            timelockDuration: Number(timelockDurationRaw),
            trancheDuration: Number(trancheDurationRaw),
            totalAllocatedToUsers: parseFloat(ethers.formatUnits(totalAllocatedRaw, 18)).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
            }),
            totalReleasedToUsers: parseFloat(ethers.formatUnits(totalReleasedRaw, 18)).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
            }),
            unallocatedCapacity: parseFloat(ethers.formatUnits(unallocatedCapacityRaw, 18)).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
            unlockedBps: Number(unlockedBpsRaw),
        };
    } catch (e) {
        console.warn("fetchQtxTimelockInfo error:", e);
        return {
            releaseTime: 1806426968,
            timelockDuration: 15552000,
            trancheDuration: 7776000,
            totalAllocatedToUsers: "0.00",
            totalReleasedToUsers: "0.00",
            unallocatedCapacity: "0.00",
            unlockedBps: 0,
        };
    }
}

