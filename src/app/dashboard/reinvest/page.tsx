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
} from "iconsax-react";

import BackButton from "../components/BackButton";
import StickyActionCard from "../components/StickyActionCard";
import TransactionReceiptModal, { TransactionReceiptData } from "../components/TransactionReceiptModal";
import MetalBorder from "../components/MetalBorder";
import { useTheme } from "@/app/context/ThemeContext";
import { useDashboard } from "../DashboardContext";
import {
    QUANTX_REINVEST_ADDRESS,
    QTX_TOKEN_ADDRESS,
    I6_TOKEN_ADDRESS,
    RELAYER_ADDRESS,
    ERC20_ABI,
    QUANTX_ABI,
} from "@/lib/contracts/abis";
import {
    fetchUserAllocation,
    UserAllocationResult,
    getRelayerStatus,
    RelayerStatusResponse,
    submitReinvestPreference,
    fetchQtxQuote,
} from "@/lib/contracts/qtx";

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
    const [isContractApproved, setIsContractApproved] = useState<boolean>(false);
    const [isRelayerApproved, setIsRelayerApproved] = useState<boolean>(false);

    // Transaction & UI State
    const [loadingData, setLoadingData] = useState<boolean>(true);
    const [busyAction, setBusyAction] = useState<string>("");
    const [statusMessage, setStatusMessage] = useState<string>("");
    const [statusColor, setStatusColor] = useState<string>("var(--text-main)");
    const [confirmedTx, setConfirmedTx] = useState<TransactionReceiptData | null>(null);

    // Active sub-view or tab
    const [activeTab, setActiveTab] = useState<"reinvest" | "overview">("reinvest");

    // Load on-chain allocation and balances
    const refreshAllData = async () => {
        if (!address) return;
        setLoadingData(true);
        try {
            // 1. Fetch user allocation from QuantX Launchpad contract
            // (Fetching only the allocated amount of user from contract 0x8F0d64d3484CAFb09f6fD8BBBaeb24049E11ad16)
            const alloc = await fetchUserAllocation(address);
            setAllocation(alloc);

            // 2. Fetch i6 token balance & allowances
            if (publicClient) {
                const bal = await publicClient.readContract({
                    address: I6_TOKEN_ADDRESS as `0x${string}`,
                    abi: ERC20_ABI,
                    functionName: "balanceOf",
                    args: [address as `0x${string}`],
                });
                setRawI6Balance(bal as bigint);
                setI6Balance(parseFloat(ethers.formatUnits(bal as bigint, 18)).toFixed(4));

                // Contract allowance for direct reinvest
                const contractAllowance = await publicClient.readContract({
                    address: I6_TOKEN_ADDRESS as `0x${string}`,
                    abi: ERC20_ABI,
                    functionName: "allowance",
                    args: [address as `0x${string}`, QUANTX_REINVEST_ADDRESS as `0x${string}`],
                });
                setIsContractApproved((contractAllowance as bigint) > 0n);

                // Relayer allowance for automated backend reinvest
                const relayerAllowance = await publicClient.readContract({
                    address: I6_TOKEN_ADDRESS as `0x${string}`,
                    abi: ERC20_ABI,
                    functionName: "allowance",
                    args: [address as `0x${string}`, RELAYER_ADDRESS as `0x${string}`],
                });
                setIsRelayerApproved((relayerAllowance as bigint) > 0n);
            }

            // 3. Fetch relayer API status
            const status = await getRelayerStatus(address);
            setRelayerStatus(status);
        } catch (e) {
            console.error("Error refreshing reinvest data:", e);
        } finally {
            setLoadingData(false);
        }
    };

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

    // Validation & Price Handling
    const cleanPriceStr = i6Price ? i6Price.replace(/[^0-9.]/g, "") : "0.1048";
    const numericI6Price = parseFloat(cleanPriceStr) || 0.1048;

    const amountVal = parseFloat(reinvestAmount || "0");
    const amountWei = !isNaN(amountVal) && amountVal > 0
        ? ethers.parseUnits(reinvestAmount, 18)
        : 0n;
    const hasInsufficientBalance = amountWei > rawI6Balance;
    const isAmountValid = amountVal > 0 && !hasInsufficientBalance;

    // Check if contract needs approval for the entered amount
    const needsApproval = isAmountValid && !isContractApproved;

    // Quick presets
    const handlePreset = (pct: number) => {
        if (rawI6Balance <= 0n) return;
        const balNum = parseFloat(ethers.formatUnits(rawI6Balance, 18));
        const calculated = (balNum * pct) / 100;
        setReinvestAmount(calculated > 0 ? calculated.toFixed(4) : "0");
    };

    // Execute ERC-20 approval for launchpad contract
    const handleApproveContract = async () => {
        if (!address) {
            open();
            return;
        }

        if (chainId !== bsc.id && switchChainAsync) {
            await switchChainAsync({ chainId: bsc.id });
        }

        setBusyAction("approveContract");
        setStatusMessage("Approving i6 for QuantX AI Launchpad in wallet...");
        setStatusColor(isDark ? "#FCD535" : "#0072ED");

        try {
            const hash = await writeContractAsync({
                address: I6_TOKEN_ADDRESS as `0x${string}`,
                abi: ERC20_ABI,
                functionName: "approve",
                args: [QUANTX_REINVEST_ADDRESS as `0x${string}`, ethers.MaxUint256],
            });

            setStatusMessage("Confirming approval on BSC...");
            if (publicClient) {
                await publicClient.waitForTransactionReceipt({ hash });
            }

            setIsContractApproved(true);
            setStatusMessage("i6 approved! Ready to reinvest.");
            setStatusColor("#10B981");
            await refreshAllData();
        } catch (err: any) {
            console.error("Approve contract error:", err);
            setStatusMessage(err?.shortMessage || err?.message || "Approval failed.");
            setStatusColor("#EF4444");
        } finally {
            setBusyAction("");
        }
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
        setStatusMessage("Authorizing automated relayer wallet...");
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
            setStatusMessage("Please sign 75% default preference in wallet...");
            const deadline = Math.floor(Date.now() / 1000) + 3600;
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

            // 3. Save to backend API
            const prefRes = await fetch("/api/reinvest/preference", {
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

            if (!prefRes.ok) {
                const errData = await prefRes.json().catch(() => ({}));
                console.warn("Preference save note:", errData?.error);
            }

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

    // Execute Reinvestment on Launchpad Contract
    const handleExecuteReinvest = async () => {
        if (!address) {
            open();
            return;
        }

        if (chainId !== bsc.id && switchChainAsync) {
            await switchChainAsync({ chainId: bsc.id });
        }

        setBusyAction("reinvest");
        setStatusMessage("Confirm reinvestment in wallet...");
        setStatusColor(isDark ? "#FCD535" : "#0072ED");

        const depositAmt = reinvestAmount;

        try {
            // minBnbOut = 0, minQtxOut = 0 for default slippage tolerance on launchpad
            const hash = await writeContractAsync({
                address: QUANTX_REINVEST_ADDRESS as `0x${string}`,
                abi: QUANTX_ABI,
                functionName: "reinvest",
                args: [amountWei, 0n, 0n],
            });

            setStatusMessage("Confirming reinvestment on BSC blockchain...");

            if (publicClient) {
                const receipt = await publicClient.waitForTransactionReceipt({ hash });
                if (receipt.status !== "success") {
                    throw new Error("On-chain reinvestment transaction failed.");
                }
            }

            // Display thermal confirmation receipt
            setConfirmedTx({
                type: "reinvest",
                hash,
                amount: depositAmt,
                tokenSymbol: "i6",
                investorAddress: address,
                statusText: "Confirmed on BSC Mainnet",
            });

            setStatusMessage("Reinvestment successful!");
            setStatusColor("#10B981");
            setReinvestAmount("");
            await refreshAllData();
        } catch (err: any) {
            console.error("Reinvest error:", err);
            setStatusMessage(err?.shortMessage || err?.message || "Reinvestment failed.");
            setStatusColor("#EF4444");
        } finally {
            setBusyAction("");
        }
    };

    // Execute claim tokens if unlocked & claimable
    const handleClaimTokens = async () => {
        if (!address) return;
        setBusyAction("claim");
        setStatusMessage("Claiming allocated QTX tokens...");

        try {
            const hash = await writeContractAsync({
                address: QUANTX_REINVEST_ADDRESS as `0x${string}`,
                abi: QUANTX_ABI,
                functionName: "claimTokens",
                args: [],
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
                statusText: "Claimed to Wallet",
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

    return (
        <div className="dashboard-container relative">
            <div className="dashboard-content-wrapper max-w-lg mx-auto flex flex-col gap-5 py-4 pb-48">
                {/* Top Navigation Bar with Back Button */}
                <div className="flex items-center justify-between py-1">
                    <BackButton href="/dashboard" />

                    <div className="flex flex-col items-center">
                        <span className="text-base font-semibold text-gray-900 dark:text-white">
                            QuantX AI Reinvest
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-[#848e9c] font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>BSC Mainnet • Relayer Pipeline</span>
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

                {/* Section 1: Launchpad Contract Allocated Amount Hero Card */}
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

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] border border-[#0072ED]/20 dark:border-[#FCD535]/25">
                            <Flash size={12} color="currentColor" variant="Bold" />
                            <span>75% Auto-Pref</span>
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
                                    <span>Your Allocated Amount</span>
                                </span>
                                <span className="font-mono text-[11px] text-gray-400">
                                    18 Decimals
                                </span>
                            </div>

                            <div className="flex items-baseline justify-between gap-2">
                                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-gray-900 dark:text-white tracking-tight">
                                    {loadingData && !allocation ? "..." : (allocation?.formattedAllocated || "0.00")}
                                </span>
                                <span className="text-sm sm:text-base font-bold text-[#0072ED] dark:text-[#FCD535]">
                                    QTX
                                </span>
                            </div>

                            {/* Secondary Metrics */}
                            <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-gray-500 dark:text-[#848e9c]">
                                <span>Claimed: <strong className="font-mono text-gray-800 dark:text-gray-200">{allocation?.formattedClaimed || "0.00"} QTX</strong></span>
                                {allocation?.isClaimable && allocation.finalQtxAmount > allocation.claimedQtxAmount ? (
                                    <button
                                        type="button"
                                        onClick={handleClaimTokens}
                                        disabled={busyAction === "claim"}
                                        className="px-2.5 py-1 rounded-full bg-emerald-500 text-white font-semibold text-[11px] hover:bg-emerald-600 transition-all cursor-pointer shadow-xs"
                                    >
                                        {busyAction === "claim" ? "Claiming..." : "Claim Now"}
                                    </button>
                                ) : (
                                    <span className="flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                                        <Lock1 size={12} color="currentColor" />
                                        <span>Locked in Launchpad</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </MetalBorder>

                    {/* Relayer & Launchpad Contract Details Strip */}
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

                {/* Section 2: Reinvest Input Card (Reusing Deposit Design) */}
                <div className="relative flex flex-col">
                    {/* Top Input Card: You Reinvest (i6) */}
                    <div className="bg-[#F4F4F7] dark:bg-[#14171d] rounded-[26px] p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#848e9c]">
                            <span>You Reinvest</span>
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
                                    <span className="text-[10px] text-gray-400 dark:text-[#848e9c]">i6 Yield</span>
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
                            <span>Launchpad Destination</span>
                            <span>Target Token</span>
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
                                    <span className="text-[10px] text-gray-400 dark:text-[#848e9c]">QTX Token</span>
                                </div>
                            </div>

                            {/* Estimated Allocation Details */}
                            <div className="flex flex-col items-end flex-1 truncate">
                                <div className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-white truncate font-mono">
                                    {amountVal > 0 ? `${estimatedQtx} QTX` : "0.0000 QTX"}
                                </div>
                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                    Automated Launchpad Credit
                                </span>
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

                {statusMessage && (
                    <div
                        className="rounded-2xl p-3.5 bg-blue-50 dark:bg-[#191d24] text-xs flex items-center gap-2 border border-blue-100 dark:border-white/5"
                        style={{ color: statusColor }}
                    >
                        <InfoCircle size={18} color="currentColor" className="shrink-0" />
                        <span>{statusMessage}</span>
                    </div>
                )}

                {/* Sticky Action Card: Handles Wallet Connect, Approve i6, and Swipe to Reinvest */}
                <StickyActionCard
                    badge={{
                        icon: "/3d-icons/swap.webp",
                        label: "Reinvest through",
                        title: "QuantX AI Launchpad",
                    }}
                    bottomOffset="bottom-[76px] sm:bottom-[80px]"
                    mode={needsApproval ? "approve" : "swipe"}
                    approveLabel="Approve i6 Tokens"
                    onApprove={handleApproveContract}
                    swipeLabel={
                        isAmountValid
                            ? `Swipe to Reinvest ${amountVal.toFixed(2)} i6`
                            : "Swipe to Reinvest"
                    }
                    onSwipe={handleExecuteReinvest}
                    disabled={
                        !isConnected ||
                        !isAmountValid ||
                        busyAction !== "" ||
                        hasInsufficientBalance
                    }
                    loading={busyAction === "approveContract" || busyAction === "reinvest"}
                    disabledText={
                        !isConnected
                            ? "Connect Wallet"
                            : hasInsufficientBalance
                            ? "Insufficient i6 Balance"
                            : !reinvestAmount || amountVal <= 0
                            ? "Enter an i6 amount"
                            : "Enter valid amount"
                    }
                    loadingText={statusMessage || (busyAction === "approveContract" ? "Approving i6 in Wallet..." : "Confirming Reinvestment...")}
                />

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
