"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ethers } from "ethers";
import { useAccount, useWriteContract, usePublicClient, useSwitchChain, useSignTypedData } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { bsc } from "@reown/appkit/networks";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowSwapHorizontal,
    Wallet3,
    TickCircle,
    CloseCircle,
    InfoCircle,
    Flash,
    ShieldTick,
    Coin1,
    Lock1,
    Clock,
    Refresh2,
    ExportSquare,
    TrendUp,
    DocumentText,
    Key,
    Setting2,
    Danger,
} from "iconsax-react";

import BackButton from "../components/BackButton";
import StickyActionCard from "../components/StickyActionCard";
import TransactionReceiptModal, { TransactionReceiptData } from "../components/TransactionReceiptModal";
import MetalBorder from "../components/MetalBorder";
import I6PriceCard from "../components/cards/I6PriceCard";
import CompoundingTimerWidget from "../components/widgets/CompoundingTimerWidget";
import { useTheme } from "@/app/context/ThemeContext";
import { useDashboard } from "../DashboardContext";
import {
    QUANTX_REINVEST_ADDRESS,
    QTX_TOKEN_ADDRESS,
    I6_TOKEN_ADDRESS,
    RELAYER_ADDRESS,
    RELAYER_API_BASE,
    QTX_TIMELOCK_ADDRESS,
    ERC20_ABI,
    QUANTX_ABI,
} from "@/lib/contracts/abis";
import {
    fetchUserAllocation,
    UserAllocationResult,
    getRelayerStatus,
    RelayerStatusResponse,
    fetchQtxQuote,
    UNLIMITED_ALLOWANCE_THRESHOLD,
    fetchQtxTimelockInfo,
    TimelockInfo,
} from "@/lib/contracts/qtx";

function formatLockCountdown(lockExpiry: bigint): { text: string; isUnlocked: boolean } {
    if (!lockExpiry || lockExpiry === 0n) {
        return { text: "No Lock Scheduled", isUnlocked: true };
    }
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (lockExpiry <= now) {
        return { text: "Unlocked • Ready to Claim", isUnlocked: true };
    }
    const diffSeconds = Number(lockExpiry - now);
    const days = Math.floor(diffSeconds / 86400);
    const hours = Math.floor((diffSeconds % 86400) / 3600);
    const mins = Math.floor((diffSeconds % 3600) / 60);
    return {
        text: `${days}d ${hours}h ${mins}m left`,
        isUnlocked: false,
    };
}

function ReinvestContent() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const { address, isConnected, chainId } = useAccount();
    const { open } = useAppKit();
    const { switchChainAsync } = useSwitchChain();
    const { writeContractAsync } = useWriteContract();
    const { signTypedDataAsync } = useSignTypedData();
    const publicClient = usePublicClient();
    const { i6Price } = useDashboard();

    // User State
    const [i6Balance, setI6Balance] = useState<string>("0.00");
    const [rawI6Balance, setRawI6Balance] = useState<bigint>(0n);
    const [reinvestAmount, setReinvestAmount] = useState<string>("");
    const [estimatedQtx, setEstimatedQtx] = useState<string>("0.0000");
    const [allocation, setAllocation] = useState<UserAllocationResult | null>(null);
    const [relayerStatus, setRelayerStatus] = useState<RelayerStatusResponse | null>(null);
    const [isRelayerApproved, setIsRelayerApproved] = useState<boolean>(false);
    const [selectedRoutePercent, setSelectedRoutePercent] = useState<number>(75);
    const [qtxPrice, setQtxPrice] = useState<number>(25.84);
    const [qtxChange, setQtxChange] = useState<number>(2.77);
    const [timelockInfo, setTimelockInfo] = useState<TimelockInfo | null>(null);
    const [timelockSecondsRemaining, setTimelockSecondsRemaining] = useState<number>(() => {
        const now = Math.floor(Date.now() / 1000);
        return Math.max(0, 1806426968 - now);
    });

    // Transaction & UI State
    const [activeTab, setActiveTab] = useState<"accumulated" | "automated" | "reinvest">("accumulated");
    const [loadingData, setLoadingData] = useState<boolean>(true);
    const [busyAction, setBusyAction] = useState<string>("");
    const [statusMessage, setStatusMessage] = useState<string>("");
    const [statusColor, setStatusColor] = useState<string>("var(--text-main)");
    const [confirmedTx, setConfirmedTx] = useState<TransactionReceiptData | null>(null);

    // Load on-chain allocation and balances
    const refreshAllData = async () => {
        if (!address) return;
        setLoadingData(true);
        try {
            // 1. Fetch user allocation directly from QuantX Launchpad contract (0x8F0d64d3484CAFb09f6fD8BBBaeb24049E11ad16)
            const alloc = await fetchUserAllocation(address);
            setAllocation(alloc);

            // 2. Fetch i6 token balance & relayer allowance
            if (publicClient) {
                const bal = await publicClient.readContract({
                    address: I6_TOKEN_ADDRESS as `0x${string}`,
                    abi: ERC20_ABI,
                    functionName: "balanceOf",
                    args: [address as `0x${string}`],
                });
                setRawI6Balance(bal as bigint);
                setI6Balance(parseFloat(ethers.formatUnits(bal as bigint, 18)).toFixed(4));

                // Relayer allowance for automated backend reinvest
                const relayerAllowance = await publicClient.readContract({
                    address: I6_TOKEN_ADDRESS as `0x${string}`,
                    abi: ERC20_ABI,
                    functionName: "allowance",
                    args: [address as `0x${string}`, RELAYER_ADDRESS as `0x${string}`],
                }) as bigint;
                setIsRelayerApproved(relayerAllowance >= UNLIMITED_ALLOWANCE_THRESHOLD);
            }

            // 3. Fetch relayer API status (current locked preference & nonce)
            const status = await getRelayerStatus(address);
            setRelayerStatus(status);
            if (status?.preference?.percent) {
                setSelectedRoutePercent(status.preference.percent);
            }

            // 4. Fetch QTX timelock contract info (0xbcB5850c6a369a91A30d764f35a116034668fb56)
            try {
                const tl = await fetchQtxTimelockInfo(publicClient);
                setTimelockInfo(tl);
                const nowSec = Math.floor(Date.now() / 1000);
                setTimelockSecondsRemaining(Math.max(0, tl.releaseTime - nowSec));
            } catch (tlErr) {
                console.warn("Failed to load timelock info:", tlErr);
            }
        } catch (e) {
            console.error("Error refreshing reinvest data:", e);
        } finally {
            setLoadingData(false);
        }
    };

    // Fetch live QTX market price from /api/token-price?token=qtx
    const fetchQtxPrice = async () => {
        try {
            const res = await fetch("/api/token-price?token=qtx");
            if (res.ok) {
                const data = await res.json();
                if (data.price) setQtxPrice(data.price);
                if (data.change24h !== undefined) setQtxChange(data.change24h);
            }
        } catch (e) {
            console.warn("Failed to load QTX price:", e);
        }
    };

    useEffect(() => {
        fetchQtxPrice();
        fetchQtxTimelockInfo(publicClient).then((tl) => {
            setTimelockInfo(tl);
            const nowSec = Math.floor(Date.now() / 1000);
            setTimelockSecondsRemaining(Math.max(0, tl.releaseTime - nowSec));
        }).catch(() => {});

        const priceTimer = setInterval(fetchQtxPrice, 12000);
        return () => clearInterval(priceTimer);
    }, [publicClient]);

    // Live 1-second ticker for timelock countdown
    useEffect(() => {
        const target = timelockInfo?.releaseTime || 1806426968;
        const ticker = setInterval(() => {
            const nowSec = Math.floor(Date.now() / 1000);
            setTimelockSecondsRemaining(Math.max(0, target - nowSec));
        }, 1000);
        return () => clearInterval(ticker);
    }, [timelockInfo?.releaseTime]);

    useEffect(() => {
        if (isConnected && address) {
            refreshAllData();
            const timer = setInterval(refreshAllData, 15000);
            return () => clearInterval(timer);
        } else {
            setI6Balance("0.00");
            setRawI6Balance(0n);
            setAllocation(null);
            setRelayerStatus(null);
            setLoadingData(false);
        }
    }, [isConnected, address]);

    // Live QTX Quote Calculation via PancakeSwap (i6 -> USDT -> WBNB -> QTX)
    useEffect(() => {
        let isCurrent = true;
        const computeQuote = async () => {
            const val = parseFloat(reinvestAmount || "0");
            if (isNaN(val) || val <= 0) {
                setEstimatedQtx("0.0000");
                return;
            }
            try {
                const wei = ethers.parseUnits(val.toString(), 18);
                const res = await fetchQtxQuote(wei, publicClient);
                if (isCurrent) {
                    setEstimatedQtx(res.formattedQtx);
                }
            } catch (err) {
                if (isCurrent) setEstimatedQtx("0.0000");
            }
        };

        const debounce = setTimeout(computeQuote, 250);
        return () => {
            isCurrent = false;
            clearTimeout(debounce);
        };
    }, [reinvestAmount, publicClient]);

    // Price helpers
    const cleanPriceStr = i6Price ? i6Price.replace(/[^0-9.]/g, "") : "0.1048";
    const numericI6Price = parseFloat(cleanPriceStr) || 0.1048;

    const amountVal = parseFloat(reinvestAmount || "0");
    const amountWei = !isNaN(amountVal) && amountVal > 0
        ? ethers.parseUnits(reinvestAmount, 18)
        : 0n;
    const hasInsufficientBalance = amountWei > rawI6Balance;
    const isAmountValid = amountVal > 0 && !hasInsufficientBalance;

    // Quick presets
    const handlePreset = (pct: number) => {
        if (rawI6Balance <= 0n) return;
        const balNum = parseFloat(ethers.formatUnits(rawI6Balance, 18));
        const calculated = (balNum * pct) / 100;
        setReinvestAmount(calculated > 0 ? calculated.toFixed(4) : "0");
    };

    // Execute ERC-20 approval for Relayer (Automated Pipeline)
    const handleAuthorizeRelayer = async () => {
        if (!address) {
            open();
            return;
        }

        if (chainId !== bsc.id && switchChainAsync) {
            await switchChainAsync({ chainId: bsc.id });
        }

        setBusyAction("authorizeRelayer");
        setStatusMessage("Authorizing automated relayer wallet in wallet...");
        setStatusColor(isDark ? "#FCD535" : "#0072ED");

        try {
            // 1. Approve relayer to pull tokens when reinvestment executes
            const hash = await writeContractAsync({
                address: I6_TOKEN_ADDRESS as `0x${string}`,
                abi: ERC20_ABI,
                functionName: "approve",
                args: [RELAYER_ADDRESS as `0x${string}`, ethers.MaxUint256],
            });

            setStatusMessage("Confirming relayer allowance on BSC...");
            if (publicClient) {
                await publicClient.waitForTransactionReceipt({ hash });
            }

            // 2. Sign and submit default 75% preference via EIP-712
            setStatusMessage("Please sign 75% preference in wallet...");
            const deadline = Math.floor(Date.now() / 1000) + 3600 * 24 * 30;
            const nonce = relayerStatus?.nonce || 0;

            let signature = "";
            try {
                signature = await signTypedDataAsync({
                    domain: {
                        name: "QTX Reinvestment Engine",
                        version: "1",
                        chainId: 56,
                        verifyingContract: QUANTX_REINVEST_ADDRESS as `0x${string}`,
                    },
                    types: {
                        ReinvestPreference: [
                            { name: "user", type: "address" },
                            { name: "token", type: "address" },
                            { name: "percent", type: "uint256" },
                            { name: "nonce", type: "uint256" },
                            { name: "deadline", type: "uint256" },
                        ],
                    },
                    primaryType: "ReinvestPreference",
                    message: {
                        user: address as `0x${string}`,
                        token: I6_TOKEN_ADDRESS as `0x${string}`,
                        percent: BigInt(75),
                        nonce: BigInt(nonce),
                        deadline: BigInt(deadline),
                    },
                });
            } catch (signErr: any) {
                console.warn("Wallet EIP-712 signature skipped or rejected:", signErr);
            }

            // 3. Save directly to backend API
            try {
                await fetch(`${RELAYER_API_BASE}/api/reinvest/preference`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userAddress: address.toLowerCase(),
                        percent: 75,
                        nonce,
                        deadline,
                        signature,
                    }),
                });
            } catch (apiErr) {
                console.warn("Direct relayer preference submit note:", apiErr);
            }

            localStorage.setItem(`i6_reinvest_pref_${address.toLowerCase()}`, "75");

            setIsRelayerApproved(true);
            setStatusMessage("Automated Relayer successfully authorized!");
            setStatusColor("#10B981");
            await refreshAllData();
        } catch (err: any) {
            console.error("Authorize relayer error:", err);
            setStatusMessage(err?.shortMessage || err?.message || "Relayer authorization failed.");
            setStatusColor("#EF4444");
        } finally {
            setBusyAction("");
        }
    };

    // Update Reinvestment Preference Route via EIP-712 (25% | 50% | 75% | 100%)
    const handleUpdatePreference = async (newPercent: number) => {
        if (!address) {
            open();
            return;
        }

        if (chainId !== bsc.id && switchChainAsync) {
            await switchChainAsync({ chainId: bsc.id });
        }

        setBusyAction("updatePref");
        setStatusMessage(`Signing ${newPercent}% preference in wallet...`);
        setStatusColor(isDark ? "#FCD535" : "#0072ED");

        try {
            const deadline = Math.floor(Date.now() / 1000) + 3600 * 24 * 30;
            const nonce = relayerStatus?.nonce ?? 0;

            const signature = await signTypedDataAsync({
                domain: {
                    name: "QTX Reinvestment Engine",
                    version: "1",
                    chainId: 56,
                    verifyingContract: QUANTX_REINVEST_ADDRESS as `0x${string}`,
                },
                types: {
                    ReinvestPreference: [
                        { name: "user", type: "address" },
                        { name: "token", type: "address" },
                        { name: "percent", type: "uint256" },
                        { name: "nonce", type: "uint256" },
                        { name: "deadline", type: "uint256" },
                    ],
                },
                primaryType: "ReinvestPreference",
                message: {
                    user: address as `0x${string}`,
                    token: I6_TOKEN_ADDRESS as `0x${string}`,
                    percent: BigInt(newPercent),
                    nonce: BigInt(nonce),
                    deadline: BigInt(deadline),
                },
            });

            // Post to backend API
            const res = await fetch(`${RELAYER_API_BASE}/api/reinvest/preference`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userAddress: address.toLowerCase(),
                    percent: newPercent,
                    nonce,
                    deadline,
                    signature,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData?.error || "Failed to update preference on relayer");
            }

            setSelectedRoutePercent(newPercent);
            localStorage.setItem(`i6_reinvest_pref_${address.toLowerCase()}`, newPercent.toString());
            setStatusMessage(`Successfully updated to ${newPercent}% automated route!`);
            setStatusColor("#10B981");
            await refreshAllData();
        } catch (err: any) {
            console.error("Update preference error:", err);
            setStatusMessage(err?.shortMessage || err?.message || "Failed to update preference.");
            setStatusColor("#EF4444");
        } finally {
            setBusyAction("");
        }
    };

    // Execute Instant Manual Reinvestment through Relayer Pipeline (EOA caller bypasses contract restriction)
    const handleInstantReinvest = async () => {
        if (!address) {
            open();
            return;
        }

        if (chainId !== bsc.id && switchChainAsync) {
            await switchChainAsync({ chainId: bsc.id });
        }

        if (!isRelayerApproved) {
            await handleAuthorizeRelayer();
            return;
        }

        setBusyAction("instantReinvest");
        setStatusMessage("Please sign manual reinvestment in wallet...");
        setStatusColor(isDark ? "#FCD535" : "#0072ED");

        try {
            const deadline = Math.floor(Date.now() / 1000) + 3600;
            const nonce = relayerStatus?.nonce ?? 0;

            const signature = await signTypedDataAsync({
                domain: {
                    name: "QTX Reinvestment Engine",
                    version: "1",
                    chainId: 56,
                    verifyingContract: QUANTX_REINVEST_ADDRESS as `0x${string}`,
                },
                types: {
                    ManualReinvest: [
                        { name: "user", type: "address" },
                        { name: "token", type: "address" },
                        { name: "amount", type: "uint256" },
                        { name: "nonce", type: "uint256" },
                        { name: "deadline", type: "uint256" },
                    ],
                },
                primaryType: "ManualReinvest",
                message: {
                    user: address as `0x${string}`,
                    token: I6_TOKEN_ADDRESS as `0x${string}`,
                    amount: amountWei,
                    nonce: BigInt(nonce),
                    deadline: BigInt(deadline),
                },
            });

            setStatusMessage("Broadcasting via Relayer Pipeline...");
            const res = await fetch(`${RELAYER_API_BASE}/api/reinvest/process`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userAddress: address.toLowerCase(),
                    amount: amountWei.toString(),
                    nonce,
                    deadline,
                    signature,
                }),
            });

            const resData = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(resData?.error || "Relayer manual reinvestment failed");
            }

            setConfirmedTx({
                type: "reinvest",
                hash: resData?.taskId || "RELAYER_EXECUTION",
                amount: reinvestAmount,
                tokenSymbol: "i6",
                investorAddress: address,
                statusText: "Queued & Processing via Relayer Pipeline",
            });

            setStatusMessage("Reinvestment queued! Relayer is settling on-chain.");
            setStatusColor("#10B981");
            setReinvestAmount("");
            await refreshAllData();
        } catch (err: any) {
            console.error("Instant reinvest error:", err);
            setStatusMessage(err?.shortMessage || err?.message || "Instant reinvestment failed.");
            setStatusColor("#EF4444");
        } finally {
            setBusyAction("");
        }
    };

    // Execute claim tokens if unlocked & claimable on contract
    const handleClaimTokens = async () => {
        if (!address) return;
        setBusyAction("claim");
        setStatusMessage("Claiming allocated QTX tokens in wallet...");

        try {
            const hash = await writeContractAsync({
                address: QUANTX_REINVEST_ADDRESS as `0x${string}`,
                abi: QUANTX_ABI,
                functionName: "claimTokens",
                args: [],
                gas: 500000n,
            });

            if (publicClient) {
                await publicClient.waitForTransactionReceipt({ hash });
            }

            setConfirmedTx({
                type: "reinvest",
                hash,
                amount: allocation ? allocation.formattedAllocated : "0",
                tokenSymbol: "QTX",
                investorAddress: address,
                statusText: "Claimed to Wallet on BSC",
            });

            setStatusMessage("QTX Tokens claimed successfully!");
            setStatusColor("#10B981");
            await refreshAllData();
        } catch (err: any) {
            console.error("Claim tokens error:", err);
            setStatusMessage(err?.shortMessage || err?.message || "Token claim failed.");
            setStatusColor("#EF4444");
        } finally {
            setBusyAction("");
        }
    };

    const effectiveLockExpiry = (allocation?.lockExpiry && allocation.lockExpiry > 0n)
        ? allocation.lockExpiry
        : BigInt(timelockInfo?.releaseTime || 1806426968);
    const lockStatus = formatLockCountdown(effectiveLockExpiry);
    const currentLockedPercent = relayerStatus?.preference?.percent ?? 75;

    return (
        <div className="dashboard-container relative">
            <div className={`dashboard-content-wrapper max-w-lg mx-auto flex flex-col gap-5 py-4 ${activeTab === "reinvest" ? "pb-36" : "pb-12"}`}>
                {/* Top Navigation Bar with Back Button */}
                <div className="flex items-center justify-between py-1">
                    <BackButton href="/dashboard" />

                    <div className="flex flex-col items-center">
                        <span className="text-base font-semibold text-gray-900 dark:text-white">
                            QuantX AI Reinvest
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-[#848e9c] font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>QTX: <strong className="font-mono text-gray-900 dark:text-white">${qtxPrice.toFixed(2)}</strong></span>
                            {qtxChange !== 0 && (
                                <span className={`text-[10px] font-bold ${qtxChange >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                    {qtxChange >= 0 ? `+${qtxChange.toFixed(1)}%` : `${qtxChange.toFixed(1)}%`}
                                </span>
                            )}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={refreshAllData}
                        disabled={loadingData}
                        className="relative inline-flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 hover:scale-105 active:translate-y-0.5 cursor-pointer shrink-0"
                        title="Refresh On-Chain Data"
                    >
                        <div
                            className="absolute inset-0 rounded-full pointer-events-none"
                            style={{
                                transform: "translateY(3.5px)",
                                background: isDark
                                    ? "linear-gradient(90deg, #ffe87a 0%, #FCD535 50%, #ffe87a 100%)"
                                    : "linear-gradient(90deg, #7CD4FD 0%, #0072ED 50%, #7CD4FD 100%)",
                                boxShadow: isDark
                                    ? "0px 6px 18px rgba(252, 213, 53, 0.3)"
                                    : "0px 6px 18px rgba(0, 114, 237, 0.32)",
                            }}
                        />
                        <div className="relative z-10 w-full h-full rounded-full bg-white dark:bg-[#14171d] flex items-center justify-center shadow-xs text-gray-900 dark:text-white border border-transparent dark:border-white/5">
                            <Refresh2
                                size={18}
                                color="currentColor"
                                className={loadingData ? "animate-spin text-[#0072ED] dark:text-[#FCD535]" : ""}
                            />
                        </div>
                    </button>
                </div>

                {/* Live QTX Market Price & Telemetry Card */}
                {/* <I6PriceCard /> */}

                {/* Capsule Segmented Tab Switcher */}
                <div className="flex items-center p-1 bg-[#F4F4F7] dark:bg-[#14171d] rounded-full max-w-md mx-auto w-full relative">
                    <button
                        type="button"
                        onClick={() => setActiveTab("accumulated")}
                        className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer relative z-10 ${
                            activeTab === "accumulated"
                                ? (isDark ? "text-[#0b0e14] font-bold" : "text-white font-semibold")
                                : "text-gray-500 dark:text-[#848e9c] hover:text-[#0f172a] dark:hover:text-white"
                        }`}
                    >
                        {activeTab === "accumulated" && (
                            <motion.div
                                layoutId="activeReinvestTab"
                                className="absolute inset-0 rounded-full"
                                style={isDark ? {
                                    background: "#FCD535",
                                    boxShadow: "0 2px 10px rgba(252, 213, 53, 0.35)",
                                } : {
                                    background: "#0072ED",
                                    boxShadow: "inset 4px 6px 10.8px rgba(255, 255, 255, 0.4)",
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <Coin1 size={15} color="currentColor" className="relative z-10 shrink-0" />
                        <span className="relative z-10 truncate hidden sm:inline">Total QTX Accumulated</span>
                        <span className="relative z-10 truncate sm:hidden">Total QTX</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("automated")}
                        className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer relative z-10 ${
                            activeTab === "automated"
                                ? (isDark ? "text-[#0b0e14] font-bold" : "text-white font-semibold")
                                : "text-gray-500 dark:text-[#848e9c] hover:text-[#0f172a] dark:hover:text-white"
                        }`}
                    >
                        {activeTab === "automated" && (
                            <motion.div
                                layoutId="activeReinvestTab"
                                className="absolute inset-0 rounded-full"
                                style={isDark ? {
                                    background: "#FCD535",
                                    boxShadow: "0 2px 10px rgba(252, 213, 53, 0.35)",
                                } : {
                                    background: "#0072ED",
                                    boxShadow: "inset 4px 6px 10.8px rgba(255, 255, 255, 0.4)",
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <Flash size={15} color="currentColor" className="relative z-10 shrink-0" />
                        <span className="relative z-10 truncate">Automated</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("reinvest")}
                        className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer relative z-10 ${
                            activeTab === "reinvest"
                                ? (isDark ? "text-[#0b0e14] font-bold" : "text-white font-semibold")
                                : "text-gray-500 dark:text-[#848e9c] hover:text-[#0f172a] dark:hover:text-white"
                        }`}
                    >
                        {activeTab === "reinvest" && (
                            <motion.div
                                layoutId="activeReinvestTab"
                                className="absolute inset-0 rounded-full"
                                style={isDark ? {
                                    background: "#FCD535",
                                    boxShadow: "0 2px 10px rgba(252, 213, 53, 0.35)",
                                } : {
                                    background: "#0072ED",
                                    boxShadow: "inset 4px 6px 10.8px rgba(255, 255, 255, 0.4)",
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <ArrowSwapHorizontal size={15} color="currentColor" className="relative z-10 shrink-0" />
                        <span className="relative z-10 truncate">Reinvest</span>
                    </button>
                </div>

                {/* Status / Alert Message */}
                {statusMessage && (
                    <div
                        className="rounded-2xl p-3.5 bg-blue-50 dark:bg-[#191d24] text-xs flex items-center gap-2 border border-blue-100 dark:border-white/5"
                        style={{ color: statusColor }}
                    >
                        <InfoCircle size={18} color="currentColor" className="shrink-0" />
                        <span>{statusMessage}</span>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {/* Tab 1: Total QTX Accumulated */}
                    {activeTab === "accumulated" && (
                        <motion.div
                            key="accumulated"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                            className="flex flex-col gap-4"
                        >
                            {/* Section 1: Launchpad Contract Allocated Amount Hero Card & Vesting Status */}
                            <div
                                className="relative w-full overflow-hidden p-5 sm:p-6 flex flex-col gap-4 select-none rounded-[28px] transition-all duration-200"
                                style={{
                                    background: isDark
                                        ? "linear-gradient(135deg, #14171d 0%, #0a0c0f 100%)"
                                        : "linear-gradient(135deg, rgba(201, 224, 255, 0.65) 0%, #FFFFFF 85%)",
                                    border: isDark
                                        ? "1px solid rgba(255, 255, 255, 0.12)"
                                        : "1.5px solid #FFFFFF",
                                    boxShadow: isDark
                                        ? "inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 8px 30px rgba(0, 0, 0, 0.55)"
                                        : "0 6px 24px rgba(12, 50, 99, 0.08)",
                                }}
                            >
                                {/* Top-left corner 3D swap icon */}
                                <div className="absolute top-0 left-0 w-24 h-24 sm:w-28 sm:h-28 pointer-events-none z-0 overflow-hidden rounded-tl-[28px]">
                                    <Image
                                        src="/3d-icons/swap.webp"
                                        alt="QuantX AI"
                                        width={112}
                                        height={112}
                                        className="w-full h-full object-contain object-left-top"
                                        priority
                                    />
                                </div>

                                {/* Header info */}
                                <div className="flex items-center justify-between gap-2 relative z-10 pl-20 sm:pl-24 min-h-[44px]">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-semibold text-gray-500 dark:text-[#848e9c] uppercase tracking-wider">
                                            Launchpad Allocation
                                        </span>
                                        <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                                            QuantX AI (QTX)
                                        </span>
                                    </div>
                                </div>

                                {/* Main Allocated Metric with Metallic Border */}
                                <MetalBorder
                                    preset="chromatic"
                                    borderRadius={24}
                                    className="w-full relative z-10"
                                >
                                    <div className="p-4 sm:p-5 flex flex-col gap-2 rounded-[24px]">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-500 dark:text-[#848e9c] font-medium flex items-center gap-1.5">
                                                <Coin1 size={15} color="currentColor" className="text-[#0072ED] dark:text-[#FCD535]" />
                                                <span>Total QTX Accumulated</span>
                                            </span>
                                            <span className="font-mono text-[11px] text-gray-400">
                                                180-Day Vault
                                            </span>
                                        </div>

                                        <div className="flex items-baseline justify-between gap-2 flex-wrap">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-gray-900 dark:text-white tracking-tight">
                                                    {loadingData && !allocation ? "..." : (allocation?.formattedAllocated || "0.00")}
                                                </span>
                                                <span className="text-sm sm:text-base font-bold text-[#0072ED] dark:text-[#FCD535]">
                                                    QTX
                                                </span>
                                            </div>
                                            {qtxPrice > 0 && (
                                                <span className="text-xs sm:text-sm font-semibold font-mono text-gray-500 dark:text-[#848e9c]">
                                                    ≈ ${(parseFloat(allocation?.formattedAllocated || "0") * qtxPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                                                </span>
                                            )}
                                        </div>

                                        {/* Secondary Metrics & Vault Lock Status */}
                                        <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-gray-500 dark:text-[#848e9c] flex-wrap gap-2">
                                            <span>
                                                Claimed: <strong className="font-mono text-gray-800 dark:text-gray-200">{allocation?.formattedClaimed || "0.00"} QTX</strong>
                                                {qtxPrice > 0 && parseFloat(allocation?.formattedClaimed || "0") > 0 && (
                                                    <span className="text-gray-400 font-mono text-[11px] ml-1">
                                                        (≈${(parseFloat(allocation?.formattedClaimed || "0") * qtxPrice).toFixed(2)})
                                                    </span>
                                                )}
                                            </span>

                                            <div className="flex items-center gap-2">
                                                <span className="flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                                                    <Clock size={12} color="currentColor" />
                                                    <span>{lockStatus.text}</span>
                                                </span>

                                                {allocation?.isClaimable && allocation.finalQtxAmount > allocation.claimedQtxAmount && (
                                                    <button
                                                        type="button"
                                                        onClick={handleClaimTokens}
                                                        disabled={busyAction === "claim"}
                                                        className="px-2.5 py-1 rounded-full bg-emerald-500 text-white font-semibold text-[11px] hover:bg-emerald-600 transition-all cursor-pointer shadow-xs"
                                                    >
                                                        {busyAction === "claim" ? "Claiming..." : "Claim QTX"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </MetalBorder>

                                {/* Relayer Health & Authorization Status Strip */}
                                <div className="relative z-10 flex flex-col gap-2 pt-1 text-xs">
                                    <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F9FB] dark:bg-[#191d24] border border-gray-100 dark:border-white/5">
                                        <div className="flex items-center gap-2">
                                            <ShieldTick size={16} color="currentColor" className="text-emerald-500 shrink-0" />
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900 dark:text-white text-[11px]">
                                                    Automated Relayer Status
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-mono">
                                                    {RELAYER_ADDRESS.slice(0, 6)}...{RELAYER_ADDRESS.slice(-4)}
                                                </span>
                                            </div>
                                        </div>

                                        {isRelayerApproved ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                <TickCircle size={12} color="currentColor" variant="Bold" />
                                                <span>Authorized</span>
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleAuthorizeRelayer}
                                                disabled={busyAction === "authorizeRelayer"}
                                                className="px-3 py-1 rounded-full bg-[#0072ED] dark:bg-[#FCD535] text-white dark:text-[#0b0e14] font-semibold text-[11px] hover:brightness-105 transition-all cursor-pointer shadow-xs"
                                            >
                                                {busyAction === "authorizeRelayer" ? "Authorizing..." : "Authorize Relayer"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Dedicated Animated Next Compounding Timelock Timer Card */}
                            <div
                                className="p-5 sm:p-6 rounded-[28px] flex flex-col items-center gap-3 transition-all"
                                style={{
                                    background: isDark
                                        ? "linear-gradient(135deg, #14171d 0%, #0a0c0f 100%)"
                                        : "linear-gradient(135deg, rgba(201, 224, 255, 0.45) 0%, #FFFFFF 85%)",
                                    border: isDark
                                        ? "1px solid rgba(255, 255, 255, 0.12)"
                                        : "1.5px solid #FFFFFF",
                                    boxShadow: isDark
                                        ? "inset 0 1px 1px rgba(255, 255, 255, 0.12), 0 8px 30px rgba(0, 0, 0, 0.45)"
                                        : "0 6px 24px rgba(12, 50, 99, 0.08)",
                                }}
                            >
                                <CompoundingTimerWidget
                                    secondsRemaining={timelockSecondsRemaining}
                                    hasActiveInvestments={true}
                                    title="Timelock Release Time"
                                    subtitle="180-Day QTX Timelock Vault"
                                    hideProjection={true}
                                    idPrefix="qtx-timelock"
                                    countdownText={timelockSecondsRemaining <= 0 ? "Timelock Unlocked • Ready to Claim" : undefined}
                                />

                                {/* Timelock Target & Vesting Details */}
                                <div className="w-full pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-gray-500 dark:text-[#848e9c] flex-wrap gap-2">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>Target Release: <strong className="font-mono text-gray-800 dark:text-gray-200">March 30, 2027</strong></span>
                                    </span>
                                    <span className="font-mono text-[11px] text-gray-400">
                                        25% Tranches / 90 Days
                                    </span>
                                </div>
                            </div>

                            {/* Additional Vault & Allocation Transparency Card */}
                            <div className="bg-[#F4F4F7] dark:bg-[#14171d] rounded-[26px] p-5 flex flex-col gap-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Lock1 size={16} color="currentColor" className="text-[#0072ED] dark:text-[#FCD535]" />
                                        <span>Vault Schedule & Token Contract</span>
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                                    <div className="p-3 rounded-2xl bg-white dark:bg-[#191d24] border border-gray-200/60 dark:border-white/5 flex flex-col gap-1">
                                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Vesting Duration</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">180 Days</span>
                                        <span className="text-[10px] text-gray-500 dark:text-[#848e9c]">From first allocation</span>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-white dark:bg-[#191d24] border border-gray-200/60 dark:border-white/5 flex flex-col gap-1">
                                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Lock Status</span>
                                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">{lockStatus.isUnlocked ? "Unlocked" : "Locked"}</span>
                                        <span className="text-[10px] text-gray-500 dark:text-[#848e9c] truncate">{lockStatus.text}</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-2xl bg-white dark:bg-[#191d24] border border-gray-200/60 dark:border-white/5 flex items-center justify-between text-xs">
                                    <span className="text-gray-500 dark:text-[#848e9c] text-[11px]">QTX Market Price</span>
                                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                        <span className="font-bold text-gray-900 dark:text-white">${qtxPrice.toFixed(2)} USD</span>
                                        {qtxChange !== 0 && (
                                            <span className={`font-semibold ${qtxChange >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                ({qtxChange >= 0 ? `+${qtxChange.toFixed(1)}%` : `${qtxChange.toFixed(1)}%`})
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-3 rounded-2xl bg-white dark:bg-[#191d24] border border-gray-200/60 dark:border-white/5 flex items-center justify-between text-xs">
                                    <span className="text-gray-500 dark:text-[#848e9c] text-[11px]">QTX Timelock Contract</span>
                                    <a
                                        href={`https://bscscan.com/address/${QTX_TIMELOCK_ADDRESS}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 font-mono text-[11px] text-[#0072ED] dark:text-[#FCD535] hover:underline"
                                    >
                                        <span>{QTX_TIMELOCK_ADDRESS.slice(0, 6)}...{QTX_TIMELOCK_ADDRESS.slice(-4)}</span>
                                        <ExportSquare size={12} color="currentColor" />
                                    </a>
                                </div>
                                <div className="p-3 rounded-2xl bg-white dark:bg-[#191d24] border border-gray-200/60 dark:border-white/5 flex items-center justify-between text-xs">
                                    <span className="text-gray-500 dark:text-[#848e9c] text-[11px]">Timelock Total Allocated</span>
                                    <span className="font-mono text-[11px] font-semibold text-gray-900 dark:text-white">
                                        {timelockInfo?.totalAllocatedToUsers || "88.55"} QTX
                                    </span>
                                </div>
                                <div className="p-3 rounded-2xl bg-white dark:bg-[#191d24] border border-gray-200/60 dark:border-white/5 flex items-center justify-between text-xs">
                                    <span className="text-gray-500 dark:text-[#848e9c] text-[11px]">QTX Token Contract</span>
                                    <a
                                        href={`https://bscscan.com/token/${QTX_TOKEN_ADDRESS}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 font-mono text-[11px] text-[#0072ED] dark:text-[#FCD535] hover:underline"
                                    >
                                        <span>{QTX_TOKEN_ADDRESS.slice(0, 6)}...{QTX_TOKEN_ADDRESS.slice(-4)}</span>
                                        <ExportSquare size={12} color="currentColor" />
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Tab 2: Automated */}
                    {activeTab === "automated" && (
                        <motion.div
                            key="automated"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                            className="flex flex-col gap-4"
                        >
                            {/* Relayer Authorization Strip */}
                            <div className="p-4 sm:p-5 rounded-[26px] bg-[#F4F4F7] dark:bg-[#14171d] flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ShieldTick size={18} color="currentColor" className="text-emerald-500 shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900 dark:text-white text-xs">
                                                Automated Relayer Status
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-mono">
                                                Pipeline EOA: {RELAYER_ADDRESS.slice(0, 6)}...{RELAYER_ADDRESS.slice(-4)}
                                            </span>
                                        </div>
                                    </div>

                                    {isRelayerApproved ? (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                            <TickCircle size={14} color="currentColor" variant="Bold" />
                                            <span>Authorized</span>
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleAuthorizeRelayer}
                                            disabled={busyAction === "authorizeRelayer"}
                                            className="px-4 py-1.5 rounded-full bg-[#0072ED] dark:bg-[#FCD535] text-white dark:text-[#0b0e14] font-semibold text-xs hover:brightness-105 transition-all cursor-pointer shadow-xs"
                                        >
                                            {busyAction === "authorizeRelayer" ? "Authorizing..." : "Authorize Relayer"}
                                        </button>
                                    )}
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-[#848e9c]">
                                    One-time ERC-20 approval gives the relayer permission to convert your selected withdrawal proportion into QTX automatically.
                                </p>
                            </div>

                            {/* Section 2: Automated Yield Route Controller (Radio Selector: 25% | 50% | 75% | 100%) */}
                            <div className="bg-[#F4F4F7] dark:bg-[#14171d] rounded-[26px] p-5 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Setting2 size={16} color="currentColor" className="text-[#0072ED] dark:text-[#FCD535]" />
                                        <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                            Automated Yield Route
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-gray-400 dark:text-[#848e9c]">
                                        Active: <strong className="text-[#0072ED] dark:text-[#FCD535] font-mono">{currentLockedPercent}%</strong>
                                    </span>
                                </div>

                                <p className="text-[11px] text-gray-500 dark:text-[#848e9c]">
                                    Automatically converts your i6 withdrawal into QTX allocations without contract fees or manual transactions.
                                </p>

                                <div className="grid grid-cols-4 gap-2 pt-1">
                                    {[25, 50, 75, 100].map((pct) => {
                                        const isSelected = selectedRoutePercent === pct;
                                        return (
                                            <button
                                                key={pct}
                                                type="button"
                                                onClick={() => setSelectedRoutePercent(pct)}
                                                className={`py-2.5 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                                                    isSelected
                                                        ? "bg-[#0072ED]/10 dark:bg-[#FCD535]/15 border-[#0072ED] dark:border-[#FCD535] text-[#0072ED] dark:text-[#FCD535]"
                                                        : "bg-white dark:bg-[#191d24] border-gray-200/60 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                                                }`}
                                            >
                                                <span className="text-sm font-bold font-mono">{pct}%</span>
                                                <span className="text-[9px] uppercase tracking-wider font-semibold opacity-75">
                                                    {pct === 75 ? "Default" : pct === 100 ? "Max" : "Route"}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {selectedRoutePercent !== currentLockedPercent && (
                                    <div className="pt-2 flex items-center justify-between">
                                        <span className="text-[11px] text-gray-400">
                                            Update route from {currentLockedPercent}% → {selectedRoutePercent}%
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleUpdatePreference(selectedRoutePercent)}
                                            disabled={busyAction === "updatePref"}
                                            className="px-3.5 py-1.5 rounded-full bg-[#0072ED] dark:bg-[#FCD535] text-white dark:text-[#0b0e14] font-semibold text-xs hover:brightness-105 transition-all cursor-pointer shadow-xs"
                                        >
                                            {busyAction === "updatePref" ? "Updating..." : "Update Allocation"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* How Automated Pipeline Works Card */}
                            <div className="bg-[#F4F4F7] dark:bg-[#14171d] rounded-[26px] p-5 flex flex-col gap-3">
                                <span className="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Flash size={16} color="currentColor" className="text-[#0072ED] dark:text-[#FCD535]" />
                                    <span>How Automated Pipeline Works</span>
                                </span>
                                <div className="flex flex-col gap-2.5 pt-1 text-xs">
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-5 h-5 rounded-full bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                                        <span className="text-gray-600 dark:text-[#848e9c]">Request withdrawal of your available earnings anytime.</span>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-5 h-5 rounded-full bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                                        <span className="text-gray-600 dark:text-[#848e9c]">The backend relayer routes <strong className="text-gray-900 dark:text-white">{currentLockedPercent}%</strong> into QuantX Launchpad contract at live market rates.</span>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-5 h-5 rounded-full bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                                        <span className="text-gray-600 dark:text-[#848e9c]">Remaining <strong className="text-gray-900 dark:text-white">{100 - currentLockedPercent}%</strong> is credited directly to your connected wallet. Zero gas fee on your end.</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Tab 3: Reinvest */}
                    {activeTab === "reinvest" && (
                        <motion.div
                            key="reinvest"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                            className="flex flex-col gap-4"
                        >
                            {/* Section 3: Live QTX Quote Calculator via PancakeSwap Multi-Hop */}
                            <div className="relative flex flex-col">
                                {/* Top Input Card: You Reinvest (i6) */}
                                <div className="bg-[#F4F4F7] dark:bg-[#14171d] rounded-[26px] p-5 flex flex-col gap-3">
                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#848e9c]">
                                        <span className="font-medium flex items-center gap-1.5">
                                            <span>Live QTX Quote Calculator</span>
                                            {qtxPrice > 0 && (
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white dark:bg-[#1f242d] text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-white/5">
                                                    1 QTX = ${qtxPrice.toFixed(2)}
                                                </span>
                                            )}
                                        </span>
                                        <span>
                                            Wallet Bal: <strong className="text-gray-900 dark:text-white font-medium">{i6Balance} i6</strong>
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3">
                                        {/* Token Icon & Symbol */}
                                        <div className="flex items-center gap-2.5 shrink-0">
                                            <Image
                                                src="/3d-icons/i6-coin-icon.webp"
                                                alt="i6 Coin"
                                                width={44}
                                                height={44}
                                                className="w-11 h-11 rounded-full object-contain"
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-base text-gray-900 dark:text-white">Infinity Six</span>
                                                <span className="text-[10px] text-gray-400 dark:text-[#848e9c]">i6 Token</span>
                                            </div>
                                        </div>

                                        {/* Large Input Field */}
                                        <div className="flex flex-col items-end flex-1">
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                min="0"
                                                step="any"
                                                value={reinvestAmount}
                                                onChange={(e) => setReinvestAmount(e.target.value)}
                                                className="w-full text-right bg-transparent text-2xl sm:text-3xl font-medium text-gray-900 dark:text-white outline-none placeholder:text-gray-400 border-none font-mono"
                                            />
                                            <span className="text-xs text-gray-400 dark:text-[#848e9c] font-normal font-mono">
                                                ≈${(amountVal * numericI6Price).toFixed(2)} USD
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Center Floating Exchange Icon Button */}
                                <div className="flex justify-center -my-3.5 z-20 relative">
                                    <div className="relative inline-flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 hover:scale-105">
                                        <div
                                            className="absolute inset-0 rounded-full pointer-events-none"
                                            style={{
                                                transform: "translateY(3.5px)",
                                                background: isDark
                                                    ? "linear-gradient(90deg, #ffe87a 0%, #FCD535 50%, #ffe87a 100%)"
                                                    : "linear-gradient(90deg, #7CD4FD 0%, #0072ED 50%, #7CD4FD 100%)",
                                                boxShadow: isDark
                                                    ? "0px 6px 18px rgba(252, 213, 53, 0.3)"
                                                    : "0px 6px 18px rgba(0, 114, 237, 0.32)",
                                            }}
                                        />
                                        <div className="relative z-10 w-full h-full rounded-full bg-white dark:bg-[#14171d] text-[#0f172a] dark:text-white flex items-center justify-center shadow-xs border border-transparent dark:border-white/5">
                                            <ArrowSwapHorizontal size={20} color="currentColor" />
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Estimated Output Card: QTX Allocated */}
                                <div className="bg-[#F4F4F7] dark:bg-[#14171d] rounded-[26px] p-5 flex flex-col gap-3">
                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#848e9c]">
                                        <span>PancakeSwap Route</span>
                                        <span>[i6 → USDT → WBNB → QTX]</span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3">
                                        {/* QTX Token Badge */}
                                        <div className="flex items-center gap-2.5 shrink-0">
                                            <div className="w-11 h-11 rounded-full bg-[#0072ED]/10 dark:bg-[#FCD535]/15 flex items-center justify-center border border-[#0072ED]/20 dark:border-[#FCD535]/25">
                                                <Image
                                                    src="/3d-icons/swap.webp"
                                                    alt="QTX"
                                                    width={28}
                                                    height={28}
                                                    className="object-contain"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-base text-gray-900 dark:text-white">QuantX AI</span>
                                                <span className="text-[10px] text-gray-400 dark:text-[#848e9c]">Estimated QTX</span>
                                            </div>
                                        </div>

                                        {/* Estimated Allocation Details */}
                                        <div className="flex flex-col items-end flex-1 truncate">
                                            <div className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-white truncate font-mono">
                                                {amountVal > 0 ? `${estimatedQtx} QTX` : "0.0000 QTX"}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] justify-end flex-wrap">
                                                {qtxPrice > 0 && amountVal > 0 && (
                                                    <span className="font-mono text-gray-500 dark:text-[#848e9c]">
                                                        ≈${(parseFloat(estimatedQtx || "0") * qtxPrice).toFixed(2)} USD •
                                                    </span>
                                                )}
                                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                                    Live DEX Multi-Hop Quote
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Presets */}
                            <div className="flex items-center justify-between gap-2 px-1">
                                {[25, 50, 75, 100].map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => handlePreset(preset)}
                                        className="flex-1 py-2 text-xs font-semibold rounded-xl bg-[#F4F4F7] dark:bg-[#191d24] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#20252d] active:scale-95 transition-all cursor-pointer"
                                    >
                                        {preset === 100 ? "MAX" : `${preset}%`}
                                    </button>
                                ))}
                            </div>

                            {/* Error / Status Messages */}
                            {hasInsufficientBalance && (
                                <div className="rounded-2xl p-3.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 border border-red-200 dark:border-red-900/30">
                                    <CloseCircle size={18} color="currentColor" className="shrink-0" />
                                    <span>Insufficient i6 token balance in your wallet.</span>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Sticky Action Card: Authorize Relayer or Execute Instant Reinvestment (Only on Reinvest tab) */}
                {activeTab === "reinvest" && (
                    <StickyActionCard
                        badge={{
                            icon: "/3d-icons/swap.webp",
                            label: "Processed through",
                            title: "Relayer Pipeline EOA",
                        }}
                        bottomOffset="bottom-4 sm:bottom-6"
                        mode={!isRelayerApproved ? "approve" : "swipe"}
                        approveLabel="Authorize Relayer (Unlimited)"
                        onApprove={handleAuthorizeRelayer}
                        swipeLabel={
                            isAmountValid
                                ? `Swipe to Reinvest ${amountVal.toFixed(2)} i6`
                                : "Enter an amount above"
                        }
                        onSwipe={handleInstantReinvest}
                        disabled={
                            !isConnected ||
                            !isAmountValid ||
                            busyAction !== "" ||
                            hasInsufficientBalance
                        }
                        loading={busyAction === "authorizeRelayer" || busyAction === "instantReinvest"}
                        disabledText={
                            !isConnected
                                ? "Connect Wallet"
                                : hasInsufficientBalance
                                ? "Insufficient i6 Balance"
                                : !reinvestAmount || amountVal <= 0
                                ? "Enter an i6 amount"
                                : "Enter valid amount"
                        }
                        loadingText={statusMessage || (busyAction === "authorizeRelayer" ? "Authorizing Relayer..." : "Confirming via Relayer Pipeline...")}
                    />
                )}

                {/* 3D Thermal Receipt Dispenser Modal */}
                <TransactionReceiptModal
                    isOpen={Boolean(confirmedTx)}
                    txData={confirmedTx}
                    onClose={() => setConfirmedTx(null)}
                    onViewHistory={() => setConfirmedTx(null)}
                />
            </div>
        </div>
    );
}

export default function ReinvestPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)]">
                    <div className="w-10 h-10 border-4 border-[#0072ED] dark:border-[#FCD535] border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <ReinvestContent />
        </Suspense>
    );
}
