"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useDashboard } from "../DashboardContext";
import UserGate from "../UserGate";
import { ethers } from "ethers";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MAIN_CONTRACT_ADDRESS as MLM_CONTRACT_ADDR,
    GENESIS_ADDRESS,
} from "@/lib/contracts/abis";
import SwipeButton from "../components/SwipeButton";
import StickyActionCard from "../components/StickyActionCard";
import BackButton from "../components/BackButton";
import WithdrawalTicket, { WithdrawalTicketLiveData } from "../components/WithdrawalTicket";
import TransactionReceiptModal, { TransactionReceiptData } from "../components/TransactionReceiptModal";
import WithdrawImpactModal from "../components/modals/WithdrawImpactModal";
import { useTheme } from "@/app/context/ThemeContext";
import {
    ArrowDown2,
    MoneySend,
    ReceiptText,
    Clock,
    InfoCircle,
    CloseCircle,
    TickCircle,
    ShieldSecurity,
    TrendUp,
    People,
    Hierarchy,
    Award,
    Cup,
    Flash,
    Copy,
    ExportSquare,
} from "iconsax-react";

const MLM_ABI = [
    {
        "inputs": [],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

function WithdrawContent() {
    const { 
        userAddress, user, investments, pendingSalary, 
        directAvailableNow, levelPendingDynamic, levelRatePerDay, 
        exactLiveUpline, spotPrice, lastWithdrawTime,
        rawI6Balance, refreshData, error
    } = useDashboard();
    const { address, isConnected } = useAccount();
    const { open } = useAppKit();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient();
    const searchParams = useSearchParams();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [activeTab, setActiveTab] = useState<"withdraw" | "history">("withdraw");
    const [historyList, setHistoryList] = useState<Array<{
        txHash: string;
        usdtAmount: string;
        usdtAmountFloat: number;
        tokenAmount: string;
        tokenAmountFloat: number;
        timestamp: number;
        blockNumber: number;
    }>>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [breakdownSnapshots, setBreakdownSnapshots] = useState<Record<string, WithdrawalTicketLiveData>>({});
    const [confirmedTx, setConfirmedTx] = useState<TransactionReceiptData | null>(null);

    useEffect(() => {
        if (!userAddress) return;
        try {
            const raw = localStorage.getItem(`withdrawal_breakdown_${userAddress}`);
            setBreakdownSnapshots(raw ? JSON.parse(raw) : {});
        } catch {
            setBreakdownSnapshots({});
        }
    }, [userAddress, historyList]);

    useEffect(() => {
        const activeAddr = address || userAddress;
        if (!activeAddr) return;
        try {
            const cached = localStorage.getItem(`i6_withdrawals_cache_${activeAddr}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setHistoryList(parsed);
                }
            }
        } catch {}
    }, [userAddress, address]);

    const fetchWithdrawalHistory = async () => {
        const activeAddr = address || userAddress;
        if (!activeAddr) return;
        if (historyList.length === 0) {
            setIsHistoryLoading(true);
        }
        try {
            const res = await fetch(`/api/withdrawals/${activeAddr}`);
            if (res.ok) {
                const data = await res.json();
                if (data.withdrawals) {
                    setHistoryList(data.withdrawals);
                    try {
                        localStorage.setItem(`i6_withdrawals_cache_${activeAddr}`, JSON.stringify(data.withdrawals));
                    } catch {}
                }
            }
        } catch (e) {
            console.error("Failed to fetch withdrawal history", e);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawalHistory();
    }, [userAddress, address]);

    useEffect(() => {
        const tabParam = searchParams.get("tab");
        if (tabParam === "history") {
            setActiveTab("history");
        }
    }, [searchParams]);

    const [userPlan, setUserPlan] = useState<{ plan: "flexible" | "lockin"; lockinDays?: number; timestamp?: number } | null>(null);

    useEffect(() => {
        const activeAddr = address || userAddress;
        if (!activeAddr) return;
        try {
            const raw = localStorage.getItem(`i6_user_plan_${activeAddr.toLowerCase()}`);
            if (raw) {
                setUserPlan(JSON.parse(raw));
            }
        } catch {}

        fetch(`/api/user/plan?address=${activeAddr.toLowerCase()}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && data.plan) {
                    setUserPlan(data);
                }
            })
            .catch(() => {});
    }, [userAddress, address]);

    const [liveData, setLiveData] = useState({
        totalAvailable: 0,
        totalWithdrawn: 0,
        directBonus: 0,
        pendingRWP: 0,
        pendingLevel: 0,
        pendingUpline: 0,
        floatSalary: 0,
        i6Estimate: 0,
        netReceive: 0,
        isCappedVisual: false,
        canWithdraw: false,
        maxCap: 0,
        capSpace: 0,
        capPercent: 0,
        hasWithdrawableRoi: false,
        roiRemainingText: "INACTIVE",
        roiStatusClass: "bg-gray-100 text-gray-400",
        levelStatusText: "INACTIVE",
        levelStatusClass: "bg-gray-100 text-gray-400",
        salaryStatusText: "INACTIVE",
        salaryStatusClass: "bg-gray-100 text-gray-400",
        btnDisabled: true,
        btnText: "Process Withdrawal",
        isLockinActive: false,
        lockDaysRemaining: 0,
        unlockDateStr: "",
        userI6Worth: 0,
        hasEnoughI6Worth: true,
        spotPriceFloat: 0,
        effectiveI6Balance: 0,
    });

    const [loading, setLoading] = useState(false);
    const [txStatus, setTxStatus] = useState("");
    const [txStatusColor, setTxStatusColor] = useState("var(--text-main)");
    const [isStreamsOpen, setIsStreamsOpen] = useState(false);

    const lastRpcLevelRef = useRef<number>(-1);
    const baseLevelForMathRef = useRef<number>(0);
    const baseLevelTimeRef = useRef<number>(0);

    const lastRpcUplineRef = useRef<number>(-1);
    const baseUplineForMathRef = useRef<number>(0);
    const baseUplineTimeRef = useRef<number>(0);
    const uplineRatePerSecRef = useRef<number>(0);

    const getCompoundMultiplier = (rate: number) => 1 + (rate / 1000);

    // Live math ticking engine
    useEffect(() => {
        if (!user) return;

        const fetchTimestamp = Date.now() / 1000;

        // Sync sliding base for Level Income
        if (lastRpcLevelRef.current === -1 || levelPendingDynamic < lastRpcLevelRef.current || levelPendingDynamic > lastRpcLevelRef.current) {
            lastRpcLevelRef.current = levelPendingDynamic;
            baseLevelForMathRef.current = levelPendingDynamic;
            baseLevelTimeRef.current = fetchTimestamp;
        }

        // Sync sliding base for Upline Income
        if (lastRpcUplineRef.current === -1 || exactLiveUpline < lastRpcUplineRef.current) {
            lastRpcUplineRef.current = exactLiveUpline;
            baseUplineForMathRef.current = exactLiveUpline;
            baseUplineTimeRef.current = fetchTimestamp;
            uplineRatePerSecRef.current = 0;
        } else if (exactLiveUpline > lastRpcUplineRef.current) {
            const timeDiff = fetchTimestamp - baseUplineTimeRef.current;
            if (timeDiff > 0) {
                uplineRatePerSecRef.current = (exactLiveUpline - lastRpcUplineRef.current) / timeDiff;
            }
            lastRpcUplineRef.current = exactLiveUpline;
            baseUplineForMathRef.current = exactLiveUpline;
            baseUplineTimeRef.current = fetchTimestamp;
        }

        const interval = setInterval(() => {
            const currentTime = Date.now() / 1000;
            const timeSinceFetch = currentTime - fetchTimestamp;
            const activeUserAddress = (userAddress || address || "").toLowerCase();
            const isGenesis = (activeUserAddress === GENESIS_ADDRESS);
            
            let pendingRWP = 0;
            let hasWithdrawableRoi = false;
            let hasActiveRoiPackage = false;
            let nextUnlockSecondsRemaining = 86400;

            if (!user.isCapped) {
                const userRate = Number(user.currentRwpRate) === 0 ? 5 : Number(user.currentRwpRate);
                
                for (const inv of investments) {
                    if (inv.isActive) {
                        hasActiveRoiPackage = true;
                        let compoundedPrincipal = parseFloat(ethers.formatUnits(inv.compoundedPrincipal, 18));
                        const invAmount = parseFloat(ethers.formatUnits(inv.amount, 18));
                        const rwpWithdrawn = parseFloat(ethers.formatUnits(inv.rwpWithdrawn, 18));
                        const lastUpdateTime = Number(inv.lastUpdateTime);
                        
                        const timeElapsed = currentTime - lastUpdateTime;
                        const daysElapsed = Math.floor(timeElapsed / 86400);
                        const secondsElapsed = timeElapsed % 86400;
                        const packageSecondsRemaining = 86400 - secondsElapsed;

                        if (daysElapsed > 0) {
                            const multiplier = getCompoundMultiplier(userRate + Number(inv.boostperc));
                            compoundedPrincipal *= Math.pow(multiplier, daysElapsed);
                            hasWithdrawableRoi = true;
                        }

                        let currentTicking = 0;
                        if (secondsElapsed > 0) {
                            currentTicking = (compoundedPrincipal * (userRate + Number(inv.boostperc)) * secondsElapsed) / (1000 * 86400);
                        }
                        compoundedPrincipal += currentTicking;

                        let available = compoundedPrincipal - invAmount;
                        const generated = available + rwpWithdrawn;

                        if (!isGenesis) {
                            const maxRwpAllowed = invAmount * 2.5;
                            if (generated >= maxRwpAllowed) {
                                const excess = generated - maxRwpAllowed;
                                if (available >= excess) available -= excess;
                                else available = 0;
                            }
                        }

                        if (available < 0) available = 0;
                        pendingRWP += available;

                        if (packageSecondsRemaining < nextUnlockSecondsRemaining) {
                            nextUnlockSecondsRemaining = packageSecondsRemaining;
                        }
                    }
                }
            }

            let roiRemainingText = "INACTIVE";
            let roiStatusClass = "bg-gray-100 text-gray-400";
            if (hasActiveRoiPackage && !user.isCapped) {
                roiRemainingText = "ACTIVE";
                roiStatusClass = "bg-emerald-100 text-emerald-700";
            }

            let pendingLevel = baseLevelForMathRef.current;
            if (levelRatePerDay > 0 && !user.isCapped) {
                const lvlTimeSinceBase = currentTime - baseLevelTimeRef.current;
                pendingLevel += (levelRatePerDay / 86400) * Math.max(0, lvlTimeSinceBase);
            }

            let floatSalary = parseFloat(ethers.formatUnits(pendingSalary, 18));
            const rank = Number(user.currentRank);
            const salaryEndTime = Number(user.salaryEndTime);
            if (rank > 0 && !user.isCapped && currentTime < salaryEndTime) {
                const rankIncomeMap = [0, 50, 200, 1000, 3000, 10000, 40000, 200000, 1000000, 4000000, 20000000];
                const expectedPerSec = (rankIncomeMap[rank] || 0) / (30 * 86400);
                const liveAccrued = expectedPerSec * Math.max(0, timeSinceFetch);
                floatSalary += liveAccrued;
            }

            let pendingUpline = baseUplineForMathRef.current;
            if (uplineRatePerSecRef.current > 0 && !user.isCapped) {
                pendingUpline += uplineRatePerSecRef.current * Math.max(0, timeSinceFetch);
            }

            // Cap Constraints
            const totalDepositsFloat = parseFloat(ethers.formatUnits(user.totalDeposits, 18));
            const totalWithdrawn = parseFloat(ethers.formatUnits(user.totalWithdrawn, 18));
            const directCount = Number(user.directCount || 0);
            const capMultiplier = directCount > 0 ? 6 : 2.5;
            const maxCap = isGenesis ? Infinity : totalDepositsFloat * capMultiplier;
            const capSpace = isGenesis ? Infinity : Math.max(0, maxCap - totalWithdrawn);
            const capPercent = maxCap === Infinity ? 0 : (maxCap > 0 ? ((totalWithdrawn / maxCap) * 100) : 0);

            // Per Stream 2.5x Constraints
            const directLimit = totalDepositsFloat * 2.5;
            const scaledDirect = isGenesis ? directAvailableNow : (directLimit > 0 ? Math.min(directAvailableNow, directLimit) : directAvailableNow);

            const levelLimit = totalDepositsFloat * 2.5;
            const scaledLevel = isGenesis ? pendingLevel : (levelLimit > 0 ? Math.min(pendingLevel, levelLimit) : pendingLevel);

            const uplineLimit = totalDepositsFloat * 2.5;
            const scaledUpline = isGenesis ? pendingUpline : (uplineLimit > 0 ? Math.min(pendingUpline, uplineLimit) : pendingUpline);

            const salaryLimit = totalDepositsFloat * 2.5;
            const scaledSalary = isGenesis ? floatSalary : (salaryLimit > 0 ? Math.min(floatSalary, salaryLimit) : floatSalary);

            let rawTotal = scaledDirect + pendingRWP + scaledLevel + scaledUpline + scaledSalary;
            let totalAvailable = isGenesis ? rawTotal : (maxCap > 0 ? Math.min(rawTotal, capSpace) : rawTotal);

            const isHardCapped = (maxCap > 0 && maxCap !== Infinity && totalWithdrawn >= maxCap);
            const isCappedVisual = isGenesis ? false : (user.isCapped || isHardCapped || (maxCap > 0 && maxCap !== Infinity && capSpace <= 0));

            // Status Badges logic
            let levelStatusText = "ACTIVE";
            let levelStatusClass = "bg-emerald-100 text-emerald-700";
            if (totalDepositsFloat === 0) {
                levelStatusText = "INACTIVE";
                levelStatusClass = "bg-gray-100 text-gray-400";
            } else if (isCappedVisual) {
                levelStatusText = "CAPPED";
                levelStatusClass = "bg-red-100 text-red-700";
            }

            let salaryStatusText = "ACTIVE";
            let salaryStatusClass = "bg-emerald-100 text-emerald-700";
            if (totalDepositsFloat === 0) {
                salaryStatusText = "INACTIVE";
                salaryStatusClass = "bg-gray-100 text-gray-400";
            } else if (isCappedVisual) {
                salaryStatusText = "CAPPED";
                salaryStatusClass = "bg-red-100 text-red-700";
            }

            // Conversion Estimations
            let i6Estimate = 0;
            let netReceive = 0;
            if (spotPrice > 0n && totalAvailable > 0) {
                const totalWei = ethers.parseUnits(totalAvailable.toFixed(18), 18);
                const tokensWei = (totalWei * ethers.WeiPerEther) / spotPrice;
                i6Estimate = parseFloat(ethers.formatUnits(tokensWei, 18));
                netReceive = i6Estimate * 0.95; // 5% Fee deduction
            }

            const spotPriceFloat = spotPrice > 0n 
                ? parseFloat(ethers.formatUnits(spotPrice, 18)) 
                : 0.6431;

            const effectiveI6Balance = rawI6Balance > 0 ? rawI6Balance : 0;
            const userI6Worth = effectiveI6Balance * spotPriceFloat;
            const hasEnoughI6Worth = totalAvailable <= 0 ? true : (userI6Worth >= totalAvailable);

            // Calculate 252-day lock-in status
            const isLockinPlan = userPlan?.plan === "lockin";
            let activationTimeSec = 0;
            if (user.activeon && Number(user.activeon) > 0) {
                activationTimeSec = Number(user.activeon);
            } else if (userPlan?.timestamp) {
                activationTimeSec = Math.floor(userPlan.timestamp / 1000);
            }
            const lockDurationSec = (userPlan?.lockinDays || 252) * 86400;
            const unlockTimestamp = activationTimeSec > 0 ? activationTimeSec + lockDurationSec : 0;
            const lockSecondsRemaining = isLockinPlan && unlockTimestamp > 0 ? Math.max(0, unlockTimestamp - currentTime) : 0;
            const isLockinActive = isLockinPlan && (lockSecondsRemaining > 0 || (isLockinPlan && activationTimeSec === 0));
            const lockDaysRemaining = Math.max(1, Math.ceil((lockSecondsRemaining || lockDurationSec) / 86400));
            const unlockDateStr = unlockTimestamp > 0 
                ? new Date(unlockTimestamp * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                : "252 Days from Activation";

            // Button Disabling & Text State Logic: Active whenever user has withdrawable balance
            let btnDisabled = false;
            let btnText = "Process Withdrawal";

            if (totalAvailable <= 0) {
                btnDisabled = true;
                btnText = "Zero Withdrawable Balance";
            } else if (isLockinActive) {
                btnDisabled = true;
                btnText = `Withdrawal Locked (${lockDaysRemaining}d left)`;
            // Minimum $20 withdrawal condition commented out:
            // } else if (totalAvailable < 20) {
            //     btnDisabled = true;
            //     btnText = "Min $20.00 Withdrawal Required";
            } else if (!hasEnoughI6Worth) {
                btnDisabled = true;
                btnText = `Hold Equal i6 Tokens ($${userI6Worth.toFixed(2)} / $${totalAvailable.toFixed(2)})`;
            }

            setLiveData({
                totalAvailable,
                totalWithdrawn,
                directBonus: scaledDirect,
                pendingRWP,
                pendingLevel: scaledLevel,
                pendingUpline: scaledUpline,
                floatSalary: scaledSalary,
                i6Estimate,
                netReceive,
                isCappedVisual,
                canWithdraw: !btnDisabled,
                maxCap,
                capSpace,
                capPercent,
                hasWithdrawableRoi,
                roiRemainingText,
                roiStatusClass,
                levelStatusText,
                levelStatusClass,
                salaryStatusText,
                salaryStatusClass,
                btnDisabled,
                btnText,
                isLockinActive,
                lockDaysRemaining,
                unlockDateStr,
                userI6Worth,
                hasEnoughI6Worth,
                spotPriceFloat,
                effectiveI6Balance,
            });

        }, 50);

        return () => clearInterval(interval);

    }, [user, investments, pendingSalary, directAvailableNow, levelPendingDynamic, levelRatePerDay, exactLiveUpline, spotPrice, userAddress, rawI6Balance, userPlan]);

    // Handle withdrawal
    const saveBreakdownSnapshot = (txHash: string) => {
        if (!userAddress) return;
        try {
            const key = `withdrawal_breakdown_${userAddress}`;
            const existing = JSON.parse(localStorage.getItem(key) || "{}");
            existing[txHash] = {
                pendingRWP: liveData.pendingRWP,
                roiStatusClass: liveData.roiStatusClass,
                roiRemainingText: liveData.roiRemainingText,
                directBonus: liveData.directBonus,
                pendingLevel: liveData.pendingLevel,
                levelStatusClass: liveData.levelStatusClass,
                levelStatusText: liveData.levelStatusText,
                pendingUpline: liveData.pendingUpline,
                floatSalary: liveData.floatSalary,
                salaryStatusClass: liveData.salaryStatusClass,
                salaryStatusText: liveData.salaryStatusText,
            };
            localStorage.setItem(key, JSON.stringify(existing));
        } catch (e) {
            console.error("Failed to save withdrawal breakdown snapshot", e);
        }
    };

    const [showImpactModal, setShowImpactModal] = useState(false);

    const lastWithdrawTimestamp = (lastWithdrawTime && Number(lastWithdrawTime) > 0) 
        ? Number(lastWithdrawTime) 
        : (user?.activeon ? Number(user.activeon) : Math.floor(Date.now() / 1000));
    const streakDays = Math.max(1, Math.floor((Math.floor(Date.now() / 1000) - lastWithdrawTimestamp) / 86400));

    const handleWithdraw = async () => {
        if (liveData.btnDisabled || loading) return;

        if (liveData.isLockinActive) {
            setTxStatus(`Withdrawal is locked for 252 days (${liveData.lockDaysRemaining} days remaining).`);
            setTxStatusColor("var(--brand-blue)");
            return;
        }

        // Minimum $20 withdrawal condition commented out:
        // if (liveData.totalAvailable < 20) {
        //     setTxStatus("Minimum withdrawal amount is $20.00 USD.");
        //     setTxStatusColor("var(--brand-blue)");
        //     return;
        // }

        if (!liveData.hasEnoughI6Worth) {
            setTxStatus(`Insufficient i6 token holding in wallet. $${liveData.totalAvailable.toFixed(2)} USD worth required.`);
            setTxStatusColor("var(--brand-blue)");
            return;
        }

        if (!address && !isConnected) {
            open();
            return;
        }

        // Intercept with Compound Reset Warning if user has accrued ROI profit
        if (liveData.pendingRWP > 0.1) {
            setShowImpactModal(true);
            return;
        }

        executeWithdrawal();
    };

    const executeWithdrawal = async () => {
        setShowImpactModal(false);
        setLoading(true);
        setTxStatus("Confirming in Wallet...");
        setTxStatusColor("var(--brand-gold)");

        const withdrawTotal = liveData.totalAvailable.toFixed(2);
        const activeAddr = address || userAddress;

        try {
            const hash = await writeContractAsync({
                address: MLM_CONTRACT_ADDR as `0x${string}`,
                abi: MLM_ABI,
                functionName: "withdraw",
            });

            // Capture the real per-category breakdown at the moment of this withdrawal,
            // keyed by txHash — the contract only ever stores the combined total, so this
            // is the only place an honest historical split can come from.
            saveBreakdownSnapshot(hash);

            setTxStatus("Processing withdrawal on blockchain...");
            setTxStatusColor("var(--brand-gold)");

            if (publicClient) {
                const receipt = await publicClient.waitForTransactionReceipt({ hash });
                if (receipt.status !== "success") {
                    throw new Error("Withdrawal transaction failed on-chain.");
                }
            }

            // Trigger receipt modal ONLY after confirmed on-chain
            setConfirmedTx({
                type: "withdraw",
                hash,
                amount: withdrawTotal,
                tokenSymbol: "i6",
                investorAddress: activeAddr,
                statusText: "Confirmed on BSC",
            });

            setTxStatus("Success! Withdrawal completed.");
            setTxStatusColor("var(--brand-green)");
            refreshData();
            fetchWithdrawalHistory();
        } catch (err: any) {
            console.error("Withdraw error", err);
            setTxStatus(err?.shortMessage || err?.message || "Withdrawal Failed / Rejected");
            setTxStatusColor("var(--brand-blue)");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <UserGate error={error} onRetry={refreshData} />;

    const formattedTwap = spotPrice > 0n 
        ? parseFloat(ethers.formatUnits(spotPrice, 18)).toFixed(4)
        : "...";

    const isGenesis = (userAddress || address || "").toLowerCase() === GENESIS_ADDRESS;

    return (
        <div className="dashboard-container relative">
            <div className="dashboard-content-wrapper max-w-lg mx-auto flex flex-col gap-5 py-4 pb-56">

                {/* Top Navigation Bar with Back Button */}
                <div className="flex items-center justify-between py-1">
                    <BackButton href="/dashboard" />

                    <div className="flex items-center gap-1.5 cursor-pointer">
                        <span className="text-base font-semibold text-[#0f172a] dark:text-white">Withdraw</span>
                        <ArrowDown2 size={14} color="currentColor" className="text-[#0f172a] dark:text-white" />
                    </div>

                    <button
                        type="button"
                        onClick={() => setActiveTab(activeTab === "withdraw" ? "history" : "withdraw")}
                        className="relative inline-flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 hover:scale-105 active:translate-y-0.5 cursor-pointer shrink-0"
                        title={activeTab === "withdraw" ? "View Withdrawal History" : "New Withdrawal"}
                    >
                        {/* 3D Diminishing Bottom Crescent */}
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
                        <div className="relative z-10 w-full h-full rounded-full bg-white dark:bg-[#14171d] flex items-center justify-center shadow-xs text-[#0f172a] dark:text-white border border-transparent dark:border-white/5">
                            {activeTab === "withdraw" ? <Clock size={20} color="currentColor" /> : <MoneySend size={20} color="currentColor" />}
                        </div>
                    </button>
                </div>

                {/* Capsule Segmented Tab Switcher */}
                <div className="flex items-center p-1 bg-[#F4F4F7] dark:bg-[#14171d] rounded-full max-w-sm mx-auto w-full relative">
                    <button
                        type="button"
                        onClick={() => setActiveTab("withdraw")}
                        className={`flex-1 py-2.5 px-4 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer relative z-10 ${
                            activeTab === "withdraw"
                                ? (isDark ? "text-[#0b0e14] font-bold" : "text-white font-semibold")
                                : "text-gray-500 dark:text-[#848e9c] hover:text-[#0f172a] dark:hover:text-white"
                        }`}
                    >
                        {activeTab === "withdraw" && (
                            <motion.div
                                layoutId="activeWithdrawTab"
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
                        <MoneySend size={16} color="currentColor" className="relative z-10" />
                        <span className="relative z-10">Withdraw</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("history")}
                        className={`flex-1 py-2.5 px-4 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer relative z-10 ${
                            activeTab === "history"
                                ? (isDark ? "text-[#0b0e14] font-bold" : "text-white font-semibold")
                                : "text-gray-500 dark:text-[#848e9c] hover:text-[#0f172a] dark:hover:text-white"
                        }`}
                    >
                        {activeTab === "history" && (
                            <motion.div
                                layoutId="activeWithdrawTab"
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
                        <ReceiptText size={16} color="currentColor" className="relative z-10" />
                        <span className="relative z-10">History</span>
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === "withdraw" ? (
                        /* ================= WITHDRAW VIEW ================= */
                        <motion.div 
                            key="withdraw"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                            className="w-full flex flex-col gap-4"
                        >
                            {/* Main Available Streaming Balance Card */}
                            <div className="bg-[#F4F4F7] dark:bg-[#14171d] rounded-[26px] p-5 flex flex-col gap-3">
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#848e9c]">
                                    <span>You receive (Estimated)</span>
                                    <span>Status: <strong className="text-emerald-600 dark:text-[#0ecb81] font-medium">{isGenesis ? "Uncapped" : "Active"}</strong></span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    {/* Token Pill */}
                                    <div className="flex items-center gap-2 bg-white dark:bg-[#191d24] px-3 py-1.5 rounded-full shadow-xs shrink-0">
                                        <Image 
                                            src="/3d-icons/i6-coin-icon.webp" 
                                            alt="i6 Token" 
                                            width={48} 
                                            height={48} 
                                            className="w-12 h-12 rounded-full object-contain" 
                                        />
                                        <div className="flex flex-col pr-1">
                                            <span className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">Infinity Six</span>
                                        </div>
                                    </div>

                                    {/* Large Dynamic Amount Display */}
                                    <div className="flex flex-col items-end flex-1">
                                        <div className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-white font-mono tracking-tight">
                                            ${liveData.totalAvailable.toFixed(6)}
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-[#848e9c] font-mono">
                                            ≈ {liveData.netReceive.toFixed(4)} i6 Net
                                        </span>
                                    </div>
                                </div>

                                {/* Subtle minimum withdrawal info note (commented out) */}
                                {/* <div className="flex items-center justify-between pt-2.5 border-t border-gray-200/60 dark:border-white/5 text-[11px] text-gray-500 dark:text-[#848e9c]">
                                    <span>Minimum withdrawal: $20.00</span>
                                    {liveData.totalAvailable > 0 && liveData.totalAvailable < 20 && (
                                        <span className="text-rose-500 dark:text-rose-400 font-medium">
                                            Below $20 minimum
                                        </span>
                                    )}
                                </div> */}
                            </div>

                            {/* 252-Day Lock-in Notice */}
                            {liveData.isLockinActive && (
                                <div className="w-full rounded-2xl p-4 bg-amber-500/10 border border-amber-500/25 flex flex-col gap-2.5 text-xs">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-[#FCD535]">
                                            <ShieldSecurity size={18} color="currentColor" />
                                            <span>252-Day Lock-in Plan Active (2.5x ROI)</span>
                                        </div>
                                        <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-800 dark:text-[#FCD535] px-2 py-0.5 rounded-full">
                                            {liveData.lockDaysRemaining} Days Left
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-amber-800/80 dark:text-amber-200/80 leading-relaxed">
                                        You selected the Lock-in option during registration to target 2.5x ROI. Withdrawals remain locked for 252 days from activation (Unlock: {liveData.unlockDateStr}).
                                    </p>
                                </div>
                            )}

                            {/* i6 Token Holding Valuation Card */}
                            {!liveData.isLockinActive && liveData.totalAvailable > 0 /* && liveData.totalAvailable >= 20 */ && (
                                <div 
                                    className="w-full rounded-2xl p-4 border flex flex-col gap-3 text-xs transition-all"
                                    style={{
                                        background: isDark
                                            ? (liveData.hasEnoughI6Worth ? "rgba(16, 185, 129, 0.06)" : "rgba(239, 68, 68, 0.06)")
                                            : (liveData.hasEnoughI6Worth ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.04)"),
                                        borderColor: liveData.hasEnoughI6Worth
                                            ? (isDark ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.25)")
                                            : (isDark ? "rgba(239, 68, 68, 0.25)" : "rgba(239, 68, 68, 0.2)"),
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Image 
                                                src="/3d-icons/i6-coin-icon.webp" 
                                                alt="i6" 
                                                width={20} 
                                                height={20} 
                                                className="w-5 h-5 rounded-full object-contain" 
                                            />
                                            <span className="font-semibold text-gray-900 dark:text-white text-xs">
                                                i6 Holding Balance Condition
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                            liveData.hasEnoughI6Worth
                                                ? "bg-emerald-500/15 text-emerald-600 dark:text-[#0ecb81]"
                                                : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                        }`}>
                                            {liveData.hasEnoughI6Worth ? "Requirement Met" : "Shortfall in Wallet"}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-0.5 text-[11px]">
                                        <div className="bg-white/60 dark:bg-white/5 p-2.5 rounded-xl flex flex-col">
                                            <span className="text-gray-500 dark:text-[#848e9c]">Your i6 Balance Worth:</span>
                                            <strong className="text-gray-900 dark:text-white font-mono text-xs mt-0.5">
                                                ${liveData.userI6Worth.toFixed(2)} USD
                                            </strong>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                                                ({liveData.effectiveI6Balance.toFixed(2)} i6 @ ${liveData.spotPriceFloat.toFixed(4)})
                                            </span>
                                        </div>

                                        <div className="bg-white/60 dark:bg-white/5 p-2.5 rounded-xl flex flex-col">
                                            <span className="text-gray-500 dark:text-[#848e9c]">Required i6 Worth:</span>
                                            <strong className="text-gray-900 dark:text-white font-mono text-xs mt-0.5">
                                                ${liveData.totalAvailable.toFixed(2)} USD
                                            </strong>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                                                (≈ {(liveData.totalAvailable / (liveData.spotPriceFloat || 1)).toFixed(2)} i6 tokens)
                                            </span>
                                        </div>
                                    </div>

                                    {!liveData.hasEnoughI6Worth && (
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 border-t border-rose-500/15">
                                            <span className="text-[10px] text-rose-600 dark:text-rose-400">
                                                Hold at least ${liveData.totalAvailable.toFixed(2)} worth of i6 in your connected wallet to withdraw.
                                            </span>
                                            <Link
                                                href="/dashboard/swap"
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0072ED] dark:text-[#FCD535] hover:underline shrink-0"
                                            >
                                                <span>Swap i6</span>
                                                <ExportSquare size={12} color="currentColor" />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Bill-Style Breakdown & Payout Card with Dashed Lining and Collapsible Drawer */}
                            <div 
                                className="w-full rounded-[22px] overflow-hidden flex flex-col justify-between transition-all duration-300"
                                style={{
                                    background: isDark
                                        ? "linear-gradient(135deg, #14171d 0%, #0a0c0f 100%)"
                                        : "linear-gradient(135deg, rgba(201, 224, 255, 0.65) 0%, #FFFFFF 85%)",
                                    border: isDark
                                        ? "1px solid rgba(255, 255, 255, 0.12)"
                                        : "1.5px solid #FFFFFF",
                                    boxShadow: isDark
                                        ? "inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 4px 14px rgba(0, 0, 0, 0.35)"
                                        : "0 3px 12px rgba(12, 50, 99, 0.06)",
                                }}
                            >
                                {/* Top Bill Details: Live Rate, Gross, Protocol Fee, Net */}
                                <div className="px-5 pt-4 pb-3.5 flex flex-col gap-2 text-xs text-gray-500 dark:text-[#848e9c]">
                                    <div className="flex justify-between">
                                        <span>Live Rate:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">${formattedTwap} USD</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Gross Output:</span>
                                        <span className="font-medium text-gray-900 dark:text-white font-mono">{liveData.i6Estimate.toFixed(6)} i6</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Protocol Fee (5%):</span>
                                        <span className="font-medium text-amber-600 dark:text-[#FCD535] font-mono">-{(liveData.i6Estimate * 0.05).toFixed(6)} i6</span>
                                    </div>
                                    <div className="border-t border-dashed border-gray-200/90 dark:border-white/10 my-1" />
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-gray-900 dark:text-white">Net to Wallet:</span>
                                        <span className="font-semibold text-emerald-600 dark:text-[#0ecb81] font-mono text-sm">{liveData.netReceive.toFixed(6)} i6</span>
                                    </div>
                                </div>

                                {/* Active Income Streams (Collapsible Drawer with Bigger Text) */}
                                <div className="px-5 py-3.5 bg-black/5 dark:bg-[#07090c]/80 border-t border-dashed border-gray-200/90 dark:border-white/10 flex flex-col">
                                    <button
                                        type="button"
                                        onClick={() => setIsStreamsOpen(prev => !prev)}
                                        className="w-full flex items-center justify-between text-left cursor-pointer select-none group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-gray-800 dark:text-white uppercase tracking-wide">
                                                Active Income Streams
                                            </span>

                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#848e9c]">
                                            <span className="text-[11px] font-medium">
                                                {isStreamsOpen ? "Hide" : "View"}
                                            </span>
                                            <div className={`p-1 rounded-full transition-transform duration-200 ${isStreamsOpen ? "rotate-180" : ""}`}>
                                                <ArrowDown2 size={14} color="currentColor" />
                                            </div>
                                        </div>
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {isStreamsOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                                className="overflow-hidden flex flex-col gap-2.5 pt-3 text-xs"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-[#848e9c]">
                                                        <TrendUp size={14} color={isDark ? "#FCD535" : "#0072ED"} />
                                                        <span>Daily ROI</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${liveData.roiStatusClass}`}>
                                                            {liveData.roiRemainingText}
                                                        </span>
                                                        <strong className="font-mono text-gray-900 dark:text-white font-medium">
                                                            ${liveData.pendingRWP.toFixed(6)}
                                                        </strong>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-[#848e9c]">
                                                        <People size={14} color="#10B981" />
                                                        <span>Direct Referral</span>
                                                    </div>
                                                    <strong className="font-mono text-gray-900 dark:text-white font-medium">
                                                        ${liveData.directBonus.toFixed(6)}
                                                    </strong>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-[#848e9c]">
                                                        <Hierarchy size={14} color={isDark ? "#FCD535" : "#0072ED"} />
                                                        <span>Level Income</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${liveData.levelStatusClass}`}>
                                                            {liveData.levelStatusText}
                                                        </span>
                                                        <strong className="font-mono text-gray-900 dark:text-white font-medium">
                                                            ${liveData.pendingLevel.toFixed(6)}
                                                        </strong>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-[#848e9c]">
                                                        <Cup size={14} color="#F59E0B" />
                                                        <span>Upline Sponsor</span>
                                                    </div>
                                                    <strong className="font-mono text-gray-900 dark:text-white font-medium">
                                                        ${liveData.pendingUpline.toFixed(6)}
                                                    </strong>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-[#848e9c]">
                                                        <Award size={14} color="#9333EA" />
                                                        <span>Salary Income</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${liveData.salaryStatusClass}`}>
                                                            {liveData.salaryStatusText}
                                                        </span>
                                                        <strong className="font-mono text-gray-900 dark:text-white font-medium">
                                                            ${liveData.floatSalary.toFixed(6)}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Status Alert */}
                            {txStatus && (
                                <div className="rounded-xl p-3 bg-blue-50 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] text-xs flex items-center gap-2" style={{ color: txStatusColor }}>
                                    <InfoCircle size={16} color="currentColor" className="shrink-0" />
                                    <span>{txStatus}</span>
                                </div>
                            )}

                            {/* Sticky Action Card with Minting Badge & Swipe CTA */}
                            <StickyActionCard
                                badge={{
                                    icon: "/3d-icons/i6-coin-icon.webp",
                                    label: "Minting through",
                                    title: "Infinity Six",
                                }}
                                mode="swipe"
                                swipeLabel={liveData.totalAvailable > 0 ? `Swipe to Withdraw $${liveData.totalAvailable.toFixed(2)}` : "Swipe to Withdraw"}
                                onSwipe={handleWithdraw}
                                disabled={liveData.btnDisabled || loading}
                                loading={loading}
                                disabledText={liveData.btnText}
                                loadingText={txStatus || "Confirming in Wallet..."}
                                hasErrorBorder={false /* !liveData.isLockinActive && liveData.totalAvailable < 20 */}
                            />
                        </motion.div>
                    ) : (
                        /* ================= WITHDRAWAL HISTORY VIEW ================= */
                        <motion.div 
                            key="history"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                            className="w-full flex flex-col gap-4"
                        >
                            {/* Summary Lifetime Withdrawn Card */}
                            <div className="bg-[#F4F4F7] dark:bg-[#14171d] rounded-[26px] p-5 flex flex-col gap-3">
                                <div className="text-xs text-gray-500 dark:text-[#848e9c] font-medium">Total Lifetime Withdrawn</div>
                                <div className="flex items-baseline justify-between">
                                    <div className="text-3xl font-medium text-gray-900 dark:text-white font-mono tracking-tight">
                                        ${liveData.totalWithdrawn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                    </div>
                                    <span className="text-xs text-emerald-600 dark:text-[#0ecb81] font-medium bg-white dark:bg-[#191d24] px-2.5 py-1 rounded-full shadow-xs">
                                        Confirmed Payouts
                                    </span>
                                </div>
                            </div>

                            {/* Payout Records */}
                            {isHistoryLoading && historyList.length === 0 ? (
                                <div className="p-8 text-center text-xs text-gray-400 dark:text-[#848e9c]">
                                    Fetching on-chain withdrawal logs...
                                </div>
                            ) : historyList.length > 0 ? (
                                <div className="flex flex-col gap-3.5">
                                    {historyList.map((item) => {
                                        const dateStr = item.timestamp > 0
                                            ? new Date(item.timestamp * 1000).toLocaleString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })
                                            : `Block #${item.blockNumber}`;

                                        return (
                                            <WithdrawalTicket
                                                key={item.txHash}
                                                txHash={item.txHash}
                                                usdtAmountFloat={item.usdtAmountFloat}
                                                tokenAmountFloat={item.tokenAmountFloat}
                                                dateStr={dateStr}
                                                liveData={breakdownSnapshots[item.txHash] || null}
                                            />
                                        );
                                    })}
                                </div>
                            ) : liveData.totalWithdrawn > 0 ? (
                                <div className="flex flex-col gap-3">
                                    <div className="bg-white dark:bg-[#14171d] rounded-2xl border border-gray-100/90 dark:border-white/5 p-4.5 flex flex-col gap-3 shadow-xs">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-[#0ecb81] flex items-center justify-center">
                                                    <TickCircle size={18} color="currentColor" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-gray-900 dark:text-white">Total Payouts Realized</span>
                                                    <span className="text-[10px] text-gray-400 dark:text-[#848e9c]">
                                                        {lastWithdrawTime > 0 
                                                            ? `Last Claim: ${new Date(lastWithdrawTime * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}` 
                                                            : "Protocol Verified"}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-semibold text-emerald-600 dark:text-[#0ecb81] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                                                Completed
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-gray-500 dark:text-[#848e9c]">
                                            <div className="bg-[#F4F4F7] dark:bg-[#191d24] p-2.5 rounded-xl flex flex-col">
                                                <span>Total Amount:</span>
                                                <strong className="text-gray-900 dark:text-white font-medium font-mono">${liveData.totalWithdrawn.toFixed(2)}</strong>
                                            </div>
                                            <div className="bg-[#F4F4F7] dark:bg-[#191d24] p-2.5 rounded-xl flex flex-col">
                                                <span>Status:</span>
                                                <strong className="text-emerald-600 dark:text-[#0ecb81] font-medium">Claimed &amp; Settled</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-[#14171d] rounded-3xl border border-gray-100 dark:border-white/5 p-10 text-center flex flex-col items-center justify-center gap-2.5 shadow-xs">
                                    <ReceiptText size={36} color="currentColor" className="text-gray-300 dark:text-[#848e9c]" />
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">No Withdrawals Yet</h3>
                                    <p className="text-xs text-gray-400 dark:text-[#848e9c] max-w-xs">
                                        Your withdrawal payouts and on-chain transaction history will appear here once processed.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            {/* 3D Thermal Receipt Dispenser Modal on Withdrawal Confirmation */}
            <TransactionReceiptModal
                isOpen={Boolean(confirmedTx)}
                txData={confirmedTx}
                onClose={() => setConfirmedTx(null)}
                onViewHistory={() => {
                    setConfirmedTx(null);
                    setActiveTab("history");
                }}
            />

            {/* Withdrawal Impact Warning Modal */}
            <WithdrawImpactModal
                isOpen={showImpactModal}
                depositAmount={user ? parseFloat(ethers.formatUnits(user.totalDeposits, 18)) : 0}
                profitAmount={liveData.pendingRWP}
                streakDays={streakDays}
                onCancel={() => setShowImpactModal(false)}
                onConfirm={() => executeWithdrawal()}
            />
        </div>
    );
}

export default function WithdrawPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--text-muted)]">Loading Withdrawal Portal...</div>}>
            <WithdrawContent />
        </Suspense>
    );
}
