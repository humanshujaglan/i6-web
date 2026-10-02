"use client";

import { useEffect, useState, useRef, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "./DashboardContext";
import UserGate from "./UserGate";
import { ethers } from "ethers";
import {
    Wallet3,
    CardReceive,
    TrendUp,
    Hierarchy,
    Award,
    Cup,
    People,
    Coin1,
    Flash,
    TickCircle,
    Copy,
    CardAdd,
    ArrowSwapHorizontal,
    MoneySend,
    ReceiptText,
    Eye,
    EyeSlash,
    Refresh2,
    ArrowDown2,
    ArrowUp2,
    ShieldSecurity,
} from "iconsax-react";

import {
    IncomeSubTabs,
    SubTabItem,
    GlobalCapCard,
    DailyRoiCard,
    DirectBonusCard,
    LevelIncomeCard,
    SalaryIncomeCard,
    UplineIncomeCard,
    HyperBoosterCard,
    SummaryMetricsCard,
    TotalWorkingIncomeCard,
    ReferAndEarnCard,
    I6PriceCard,
    TotalIncomeCard,
    DirectBusinessCard,
    SponsorAddressCard,
    CompoundingPrincipalCard,
    QuantXCard,
} from "./components/cards";
import CopyAlert from "./components/CopyAlert";
import CompoundingTimerWidget from "./components/widgets/CompoundingTimerWidget";
import CompoundingStreakModal from "./components/modals/CompoundingStreakModal";
import QuantXLaunchModal from "./components/modals/QuantXLaunchModal";
import { useTheme } from "@/app/context/ThemeContext";
import { GENESIS_ADDRESS } from "@/lib/contracts/abis";

const ACTION_BUTTONS = [
    { id: "deposit", title: "Deposit", icon: "/3d-icons/deposit.webp", href: "/dashboard/investment" },
    { id: "swap", title: "Swap", icon: "/3d-icons/swap.webp", href: "/dashboard/swap" },
    { id: "withdraw", title: "Withdraw", icon: "/3d-icons/withdraw.webp", href: "/dashboard/withdraw" },
    { id: "history", title: "History", icon: "/3d-icons/history.webp", href: "/dashboard/investment?tab=history" },
];

const ALL_SUB_TABS: SubTabItem[] = [
    { id: "total", label: "Total", iconSrc: "/working-income-icons/wallet.png" },
    { id: "rwp", label: "RWP", iconSrc: "/3d-icons/ROi/RWP.webp" },
    { id: "booster", label: "Booster", iconSrc: "/3d-icons/ROi/booster.webp" },
    { id: "direct", label: "Direct", iconSrc: "/working-income-icons/Direct.png" },
    { id: "level", label: "Level", iconSrc: "/working-income-icons/Level.png" },
    { id: "upline", label: "Upline", iconSrc: "/working-income-icons/Upline.png" },
    { id: "rank", label: "Rank", iconSrc: "/working-income-icons/Rank.png" },
];

const ROI_SUB_TABS: SubTabItem[] = [
    { id: "total", label: "Total", iconSrc: "/working-income-icons/wallet.png" },
    { id: "rwp", label: "RWP", iconSrc: "/3d-icons/ROi/RWP.webp" },
    { id: "booster", label: "Booster", iconSrc: "/3d-icons/ROi/booster.webp" },
];

const WORKING_SUB_TABS: SubTabItem[] = [
    { id: "total", label: "Total", iconSrc: "/working-income-icons/wallet.png" },
    { id: "direct", label: "Direct", iconSrc: "/working-income-icons/Direct.png" },
    { id: "level", label: "Level", iconSrc: "/working-income-icons/Level.png" },
    { id: "upline", label: "Upline", iconSrc: "/working-income-icons/Upline.png" },
    { id: "rank", label: "Rank", iconSrc: "/working-income-icons/Rank.png" },
];

function formatCompact(num: number) {
    return Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
}

const ACTION_CARD_LIGHTING = [
    { x1: "0%", y1: "0%", x2: "100%", y2: "100%", shadowDark: "drop-shadow(0 5px 16px rgba(0, 0, 0, 0.45))" },   // Deposit: Top-Left highlight
    { x1: "100%", y1: "0%", x2: "0%", y2: "100%", shadowDark: "drop-shadow(0 5px 16px rgba(0, 0, 0, 0.45))" },   // Swap: Top-Right highlight
    { x1: "50%", y1: "0%", x2: "50%", y2: "100%", shadowDark: "drop-shadow(0 6px 18px rgba(0, 0, 0, 0.48))" },   // Withdraw: Top-Center highlight
    { x1: "0%", y1: "30%", x2: "100%", y2: "70%", shadowDark: "drop-shadow(0 5px 16px rgba(0, 0, 0, 0.45))" },   // History: Angled-Side highlight
];

const ActionButtonsGrid = memo(function ActionButtonsGrid({ isDark }: { isDark: boolean }) {
    return (
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5" style={{ transform: "translateZ(0)", willChange: "transform" }}>
            {ACTION_BUTTONS.map((item, idx) => {
                const lighting = ACTION_CARD_LIGHTING[idx % ACTION_CARD_LIGHTING.length];
                return (
                    <Link
                        key={item.id}
                        href={item.href}
                        className="relative w-full h-[98px] sm:h-[108px] p-2 flex flex-col items-center justify-center gap-1 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] cursor-pointer select-none group"
                        style={{
                            filter: isDark 
                                ? lighting.shadowDark
                                : "drop-shadow(0 4px 18px rgba(12, 50, 99, 0.08))",
                            transform: "translateZ(0)",
                            WebkitTransform: "translateZ(0)",
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            willChange: "transform",
                        }}
                    >
                        {/* Pure Superellipse / Squircle Vector Background & Continuous Border */}
                        <svg 
                            className="absolute inset-0 w-full h-full pointer-events-none" 
                            viewBox="0 0 100 110" 
                            preserveAspectRatio="none"
                        >
                            <defs>
                                <linearGradient id={`action-card-grad-${item.id}`} x1={lighting.x1} y1={lighting.y1} x2={lighting.x2} y2={lighting.y2}>
                                    {isDark ? (
                                        <>
                                            <stop offset="0%" stopColor="#14171d" stopOpacity="1" />
                                            <stop offset="100%" stopColor="#0a0c0f" stopOpacity="1" />
                                        </>
                                    ) : (
                                        <>
                                            <stop offset="7.83%" stopColor="#C9E0FF" stopOpacity="0.65" />
                                            <stop offset="79.83%" stopColor="#FFFFFF" stopOpacity="0.96" />
                                        </>
                                    )}
                                </linearGradient>

                                {/* 3D Border Gradient with Per-Card Positional Variation */}
                                {isDark && (
                                    <linearGradient id={`action-card-border-${item.id}`} x1={lighting.x1} y1={lighting.y1} x2={lighting.x2} y2={lighting.y2}>
                                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
                                        <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.30" />
                                        <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.08" />
                                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
                                    </linearGradient>
                                )}
                            </defs>
                            <path 
                                d="M 28, 1.5 L 72, 1.5 C 88, 1.5 98.5, 12 98.5, 28 L 98.5, 82 C 98.5, 98 88, 108.5 72, 108.5 L 28, 108.5 C 12, 108.5 1.5, 98 1.5, 82 L 1.5, 28 C 1.5, 12 12, 1.5 28, 1.5 Z" 
                                fill={`url(#action-card-grad-${item.id})`}
                                stroke={isDark ? `url(#action-card-border-${item.id})` : "#FFFFFF"}
                                strokeWidth={isDark ? "1.8" : "2"}
                                strokeLinejoin="round"
                            />
                        </svg>

                        <div className="w-11 h-11 sm:w-13 sm:h-13 relative flex items-center justify-center transition-transform duration-200 group-hover:scale-110 z-10 shrink-0">
                            <Image
                                src={item.icon}
                                alt={item.title}
                                width={48}
                                height={48}
                                className="object-contain"
                            />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-[#0072ED] dark:group-hover:text-[#FCD535] transition-colors relative z-10">
                            {item.title}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
});

export default function DashboardPage() {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const {
        userAddress, user, investments, directAvailableNow,
        directPendingLocked, levelPendingDynamic, levelRatePerDay,
        exactLiveUpline, i6Price, pendingSalary, error, refreshData,
        lastWithdrawTime
    } = useDashboard();

    const [incomeTab, setIncomeTab] = useState<"all" | "roi" | "working">("all");
    const [allSubTab, setAllSubTab] = useState<"total" | "rwp" | "booster" | "direct" | "level" | "upline" | "rank">("total");
    const [roiSubTab, setRoiSubTab] = useState<"total" | "rwp" | "booster">("total");
    const [showBalance, setShowBalance] = useState(true);
    const [copiedNotify, setCopiedNotify] = useState(false);
    const [copyMessage, setCopyMessage] = useState("Copied to clipboard!");
    const [showLevelMatrix, setShowLevelMatrix] = useState(false);
    const [workingSubTab, setWorkingSubTab] = useState<"total" | "direct" | "level" | "upline" | "rank">("total");
    const [manualStreakOpen, setManualStreakOpen] = useState(false);
    const [isStreakModalActive, setIsStreakModalActive] = useState(false);
    const [qtxLaunchModalOpen, setQtxLaunchModalOpen] = useState(false);
    const hasCheckedLaunchRef = useRef(false);

    const [liveData, setLiveData] = useState({
        totalAvailable: 0,
        totalIncome: 0,
        directBonus: 0,
        pendingRWP: 0,
        pendingLevel: 0,
        pendingUpline: 0,
        floatSalary: 0,
        boosterIncome: 0,
        countdownText: "--h --m --s",
        secondsRemaining: 86400,
        hasActiveInvestments: false,
        isCapExceeded: false
    });

    const [boosterTimerText, setBoosterTimerText] = useState("Loading...");
    const [boosterTimerColor, setBoosterTimerColor] = useState("var(--brand-blue)");

    const [uplines, setUplines] = useState<{ l1: string; l2: string; l3: string }>({ l1: "", l2: "", l3: "" });
    const [uplineCopied, setUplineCopied] = useState<{ [key: string]: boolean }>({});

    const lastRpcLevelRef = useRef<number>(-1);
    const baseLevelForMathRef = useRef<number>(0);
    const baseLevelTimeRef = useRef<number>(0);

    const lastRpcUplineRef = useRef<number>(-1);
    const baseUplineForMathRef = useRef<number>(0);
    const baseUplineTimeRef = useRef<number>(0);

    const getCompoundMultiplier = (rate: number) => 1 + (rate / 1000);

    // Live Dynamic Ticking Engine (1s Interval)
    useEffect(() => {
        if (!user) return;

        const lastUpdatedTime = Date.now();
        const fetchTimestamp = lastUpdatedTime / 1000;

        if (lastRpcLevelRef.current === -1 || levelPendingDynamic !== lastRpcLevelRef.current) {
            lastRpcLevelRef.current = levelPendingDynamic;
            baseLevelForMathRef.current = levelPendingDynamic;
            baseLevelTimeRef.current = fetchTimestamp;
        }

        if (lastRpcUplineRef.current === -1 || exactLiveUpline !== lastRpcUplineRef.current) {
            lastRpcUplineRef.current = exactLiveUpline;
            baseUplineForMathRef.current = exactLiveUpline;
            baseUplineTimeRef.current = fetchTimestamp;
        }

        const tick = () => {
            const currentTime = Date.now() / 1000;
            const timeSinceFetch = (Date.now() - lastUpdatedTime) / 1000;
            const isGenesis = (userAddress.toLowerCase() === GENESIS_ADDRESS);
            
            // 1. Live Dynamic ROI Stream
            let pendingRWP = 0;
            let nextUnlockSeconds = 86400;
            let hasActiveTicking = false;

            if (!user.isCapped) {
                const userRate = Number(user.currentRwpRate) === 0 ? 5 : Number(user.currentRwpRate);
                
                for (const inv of investments) {
                    if (inv.isActive) {
                        let simulatedPrincipal = parseFloat(ethers.formatUnits(inv.compoundedPrincipal, 18));
                        const invAmount = parseFloat(ethers.formatUnits(inv.amount, 18));
                        const rwpWithdrawn = parseFloat(ethers.formatUnits(inv.rwpWithdrawn, 18));
                        const lastUpdateTime = Number(inv.lastUpdateTime);
                        
                        const timeElapsed = currentTime - lastUpdateTime;
                        const daysElapsed = Math.floor(timeElapsed / 86400);
                        const secondsElapsed = timeElapsed % 86400;
                        const secondsRemaining = 86400 - secondsElapsed;

                        if (daysElapsed > 0) {
                            const multiplier = getCompoundMultiplier(userRate + Number(inv.boostperc));
                            simulatedPrincipal *= Math.pow(multiplier, daysElapsed);
                        }

                        let currentTicking = 0;
                        if (secondsElapsed > 0) {
                            currentTicking = (simulatedPrincipal * (userRate + Number(inv.boostperc)) * secondsElapsed) / (1000 * 86400);
                        }
                        simulatedPrincipal += currentTicking;

                        let available = simulatedPrincipal - invAmount;
                        const generated = available + rwpWithdrawn;

                        if (!isGenesis) {
                            const maxRwpAllowed = invAmount * 2.5;
                            if (generated >= maxRwpAllowed) {
                                const excess = generated - maxRwpAllowed;
                                if (available >= excess) available -= excess;
                                else available = 0;
                                currentTicking = 0;
                            } else if (generated + currentTicking > maxRwpAllowed) {
                                currentTicking = maxRwpAllowed - generated;
                            }
                        }

                        if (available < 0) available = 0;
                        if (currentTicking < 0) currentTicking = 0;

                        pendingRWP += available;

                        if (currentTicking > 0) {
                            hasActiveTicking = true;
                            if (secondsRemaining < nextUnlockSeconds) {
                                nextUnlockSeconds = secondsRemaining;
                            }
                        }
                    }
                }
            }

            let countdownText = "No active investments";
            if (hasActiveTicking && !user.isCapped) {
                const h = Math.floor(nextUnlockSeconds / 3600);
                const m = Math.floor((nextUnlockSeconds % 3600) / 60);
                const s = Math.floor(nextUnlockSeconds % 60);
                countdownText = `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
            }

            // 2. Live Dynamic Level Income
            let pendingLevel = baseLevelForMathRef.current;
            if (levelRatePerDay > 0 && !user.isCapped) {
                const lvlTimeSinceBase = currentTime - baseLevelTimeRef.current;
                pendingLevel += (levelRatePerDay / 86400) * Math.max(0, lvlTimeSinceBase);
            }

            // 3. Live Dynamic Salary / Rank Income
            let floatSalary = parseFloat(ethers.formatUnits(pendingSalary, 18));
            const rank = Number(user.currentRank);
            const salaryEndTime = Number(user.salaryEndTime);
            if (rank > 0 && !user.isCapped && currentTime < salaryEndTime) {
                const rankIncomeMap = [0, 50, 200, 1000, 3000, 10000, 40000, 200000, 1000000, 4000000, 20000000];
                const salaryPerSec = rankIncomeMap[rank] / (30 * 86400);
                floatSalary += salaryPerSec * timeSinceFetch;
            }

            // 4. Live Dynamic Upline Sponsor Rewards
            let pendingUpline = baseUplineForMathRef.current;
            if (user.isUplineEligible && !user.isCapped) {
                const uplineTimeSinceBase = currentTime - baseUplineTimeRef.current;
                const uplineRateEst = 0.0001; 
                pendingUpline += uplineRateEst * Math.max(0, uplineTimeSinceBase);
            }

            // 5. Direct Bonus
            let directBonus = directAvailableNow;

            const totalDepositsFloat = parseFloat(ethers.formatUnits(user.totalDeposits, 18));
            const totalWithdrawnFloat = parseFloat(ethers.formatUnits(user.totalWithdrawn, 18));
            const directCount = Number(user.directCount || 0);
            const capMultiplier = directCount > 0 ? 6 : 2.5;
            
            const maxCap = isGenesis ? Infinity : totalDepositsFloat * capMultiplier;
            let withdrawableRoom = isGenesis ? Infinity : maxCap - totalWithdrawnFloat;
            if (withdrawableRoom < 0) withdrawableRoom = 0;

            const rawAvailable = directBonus + pendingRWP + pendingLevel + pendingUpline + floatSalary;
            let totalAvailable = rawAvailable;
            let isCapExceeded = false;

            if (!isGenesis && maxCap > 0 && rawAvailable > withdrawableRoom) {
                totalAvailable = withdrawableRoom;
                isCapExceeded = true;
                const scaleRatio = withdrawableRoom / rawAvailable;
                pendingRWP *= scaleRatio;
                pendingLevel *= scaleRatio;
                floatSalary *= scaleRatio;
                directBonus *= scaleRatio;
                pendingUpline *= scaleRatio;
            }
            if (user.isCapped) {
                isCapExceeded = true;
            }

            // 6. Booster Extra Yield Earned
            let boosterIncome = 0;
            if (investments && investments.length > 0) {
                investments.forEach((inv) => {
                    if (inv.isActive && Number(inv.boostperc) > 0) {
                        const invAmount = parseFloat(ethers.formatUnits(inv.amount, 18));
                        const timeElapsed = currentTime - Number(inv.lastUpdateTime);
                        const daysElapsed = Math.floor(timeElapsed / 86400);
                        const boostRate = Number(inv.boostperc) / 1000;
                        boosterIncome += invAmount * boostRate * Math.max(1, daysElapsed);
                    }
                });
            }

            const totalIncomeDisplay = totalWithdrawnFloat + totalAvailable;

            setLiveData({
                totalAvailable,
                totalIncome: totalIncomeDisplay,
                directBonus,
                pendingRWP,
                pendingLevel,
                pendingUpline,
                floatSalary,
                boosterIncome,
                countdownText,
                secondsRemaining: nextUnlockSeconds,
                hasActiveInvestments: hasActiveTicking,
                isCapExceeded
            });
        };

        // Fire immediately so values appear right away (no 1-second blank delay)
        tick();
        const interval = setInterval(tick, 1000);

        return () => clearInterval(interval);
    }, [user, investments, directAvailableNow, levelPendingDynamic, levelRatePerDay, exactLiveUpline, userAddress, pendingSalary]);

    // Booster Timer Control
    useEffect(() => {
        if (!user) return;
        const isBoosted = user.isBoosted;
        const activeOnSeconds = Number(user.activeon);

        if (isBoosted) {
            setBoosterTimerText("ACHIEVED");
            setBoosterTimerColor("var(--brand-green)");
            return;
        }

        if (activeOnSeconds <= 0) {
            setBoosterTimerText("PENDING DEPOSIT");
            setBoosterTimerColor("var(--text-muted)");
            return;
        }

        const expirationTime = activeOnSeconds + 604800; // 7 days

        const updateTimer = () => {
            const now = Math.floor(Date.now() / 1000);
            if (now >= expirationTime) {
                setBoosterTimerText("EXPIRED");
                setBoosterTimerColor("var(--text-muted)");
            } else {
                const diff = expirationTime - now;
                const d = Math.floor(diff / 86400);
                const h = Math.floor((diff % 86400) / 3600);
                const m = Math.floor((diff % 3600) / 60);
                const s = diff % 60;

                if (d > 0) {
                    setBoosterTimerText(`${d}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`);
                } else {
                    setBoosterTimerText(`${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
                }
                setBoosterTimerColor("var(--brand-blue)");
            }
        };

        updateTimer();
        const tInterval = setInterval(updateTimer, 1000);
        return () => clearInterval(tInterval);
    }, [user?.isBoosted, user?.activeon]);

    // Recursive Upline Tree fetching
    useEffect(() => {
        if (!user || !user.isUplineEligible || !user.referrer || user.referrer === "0x0000000000000000000000000000000000000000") {
            setUplines({ l1: "", l2: "", l3: "" });
            return;
        }

        let active = true;

        async function fetchUplines() {
            try {
                if (!active) return;
                const res = await fetch(`/api/upline-chain/${userAddress}`);
                if (!res.ok) throw new Error("Failed to fetch upline chain");
                const data = await res.json();
                if (!active) return;
                setUplines({ l1: data.l1, l2: data.l2, l3: data.l3 });
            } catch (err) {
                console.error("Error fetching uplines:", err);
            }
        }

        fetchUplines();

        return () => {
            active = false;
        };
    }, [user?.referrer, user?.isUplineEligible, userAddress]);

    const handleCopyAddress = async () => {
        if (!userAddress) return;
        await navigator.clipboard.writeText(userAddress);
        setCopyMessage("Wallet address copied to clipboard!");
        setCopiedNotify(true);
        setTimeout(() => setCopiedNotify(false), 2000);
    };

    const handleCopyReferralLink = async () => {
        if (!userAddress) return;
        const origin = typeof window !== "undefined" ? window.location.origin : "https://infinitesix.io";
        const refLink = `${origin}/register?ref=${userAddress}`;
        await navigator.clipboard.writeText(refLink);
        setCopyMessage("Referral link copied to clipboard!");
        setCopiedNotify(true);
        setTimeout(() => setCopiedNotify(false), 2000);
    };

    const handleCopyUplineAddress = async (key: string, address: string) => {
        if (!address || address === "None" || address.includes("...")) return;
        await navigator.clipboard.writeText(address);
        setCopyMessage("Upline address copied to clipboard!");
        setCopiedNotify(true);
        setTimeout(() => setCopiedNotify(false), 2000);
    };

    if (!user) {
        return <UserGate error={error} onRetry={refreshData} />;
    }

    const isGenesis = (userAddress.toLowerCase() === GENESIS_ADDRESS);
    const totalDepositsFloat = parseFloat(ethers.formatUnits(user.totalDeposits, 18));
    const totalWithdrawnFloat = parseFloat(ethers.formatUnits(user.totalWithdrawn, 18));
    const directCount = Number(user.directCount);
    const directVolumeFloat = parseFloat(ethers.formatUnits(user.directVolume, 18));
    const teamVolumeFloat = parseFloat(ethers.formatUnits(user.totalDownlineBusiness, 18));
    const directBoosterCount = Number(user.directBoosterCount || 0);

    const capMultiplier = directCount > 0 ? 6 : 2.5;
    const maxCap = isGenesis ? Infinity : totalDepositsFloat * capMultiplier;
    const totalEarned = totalWithdrawnFloat + (liveData.totalAvailable || 0);
    const capSpace = isGenesis ? Infinity : (user.isCapped ? 0 : Math.max(0, maxCap - totalEarned));
    const capPercentage = isGenesis ? 0 : (user.isCapped ? 100 : (maxCap > 0 ? Math.min(100, (totalEarned / maxCap) * 100) : 0));

    const lastWithdrawTimestamp = (lastWithdrawTime && Number(lastWithdrawTime) > 0)
        ? Number(lastWithdrawTime)
        : null;
    const streakDays = lastWithdrawTimestamp
        ? Math.max(1, Math.floor((Math.floor(Date.now() / 1000) - lastWithdrawTimestamp) / 86400))
        : 0;
    const newPrincipal = Math.max(0, totalDepositsFloat + liveData.pendingRWP);
    const dailyEarning = newPrincipal * 0.005;

    let totalLifetimeRoi = 0;
    investments.forEach((inv) => {
        const rwpWithdrawn = parseFloat(ethers.formatUnits(inv.rwpWithdrawn, 18));
        totalLifetimeRoi += rwpWithdrawn;
    });
    totalLifetimeRoi += liveData.pendingRWP;

    const totalWorkingAvailable = liveData.directBonus + liveData.pendingLevel + liveData.pendingUpline + liveData.floatSalary;

    const UPLINE_DEPOSIT_REQ = 1500;
    const UPLINE_DIRECTS_REQ = 5;
    const uplineDepProgressText = formatCompact(totalDepositsFloat > UPLINE_DEPOSIT_REQ ? UPLINE_DEPOSIT_REQ : totalDepositsFloat);
    const uplineDirProgressText = directCount > UPLINE_DIRECTS_REQ ? UPLINE_DIRECTS_REQ : directCount;

    const levelRows = [];
    for (let i = 1; i <= 40; i++) {
        const directReq = Math.ceil(i / 2);
        const isUnlocked = directCount >= directReq;
        
        let volPerc = 30;
        if (i === 1) volPerc = 100;
        else if (i === 2) volPerc = 50;
        else if (i === 3) volPerc = 40;
        
        levelRows.push({
            level: i,
            req: directReq,
            isUnlocked,
            yieldText: `${volPerc / 10}% of RWP`
        });
    }

    // Portal entry launch celebration detection (everytime user logs into the portal)
    useEffect(() => {
        if (typeof window !== "undefined") {
            if (!sessionStorage.getItem("qtx_portal_session_seen")) {
                sessionStorage.setItem("qtx_portal_session_seen", "true");
                sessionStorage.setItem("qtx_launch_pending", "true");
            }
        }
    }, []);

    // Dismiss handler for compounding streak modal (called when user crosses 'X' or clicks 'Continue Compounding')
    const handleStreakDismiss = () => {
        setIsStreakModalActive(false);
        setManualStreakOpen(false);
        if (typeof window !== "undefined" && sessionStorage.getItem("qtx_launch_pending") === "true") {
            sessionStorage.removeItem("qtx_launch_pending");
            hasCheckedLaunchRef.current = true;
            setTimeout(() => {
                setQtxLaunchModalOpen(true);
            }, 280);
        }
    };

    // Fallback: If compounding streak modal does NOT have to be shown on entry, show QTX launch modal immediately
    useEffect(() => {
        if (!userAddress || hasCheckedLaunchRef.current) return;

        const timer = setTimeout(() => {
            if (typeof window === "undefined") return;
            const isPending = sessionStorage.getItem("qtx_launch_pending") === "true";
            if (!isPending) return;

            const todayStr = new Date().toISOString().slice(0, 10);
            const storageKey = `i6_streak_${userAddress.toLowerCase()}`;
            let alreadyShownStreakToday = false;
            try {
                const raw = localStorage.getItem(storageKey);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed.lastDate === todayStr) {
                        alreadyShownStreakToday = true;
                    }
                }
            } catch {}

            const willStreakModalShow = !alreadyShownStreakToday && totalDepositsFloat > 0 && streakDays > 0;

            if (!willStreakModalShow && !isStreakModalActive && !manualStreakOpen) {
                hasCheckedLaunchRef.current = true;
                sessionStorage.removeItem("qtx_launch_pending");
                setQtxLaunchModalOpen(true);
            }
        }, 450);

        return () => clearTimeout(timer);
    }, [userAddress, totalDepositsFloat, streakDays, isStreakModalActive, manualStreakOpen]);

    return (
        <div className="dashboard-container">
            <div className="dashboard-content-wrapper max-w-xl mx-auto flex flex-col gap-6">

                {/* Modern Floating Copy Alert Component */}
                <CopyAlert show={copiedNotify} message={copyMessage} />

                {/* Top User Balance Card with Live Dynamic Ticker */}
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#F4F4F7] dark:bg-[#14171d] flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                            <Image
                                src="/3d-icons/boy.webp"
                                alt="Profile Avatar"
                                width={44}
                                height={44}
                                className="object-contain"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-[var(--text-soft)] font-medium">
                                Total Available to Withdraw
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-2xl font-medium text-[var(--text-main)] font-mono">
                                    {showBalance ? `$${liveData.totalAvailable.toFixed(6)}` : "••••••••••"}
                                </span>
                                <span className="text-xs text-[var(--text-soft)]">USD</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowBalance(!showBalance)}
                            className="relative w-9 h-9 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shrink-0 bg-[#242230] dark:bg-[#191d24] border border-white/15 dark:border-[#2b313a]"
                            style={{
                                boxShadow: "inset 1.5px 1.5px 2px rgba(255, 255, 255, 0.35), inset -1px -1px 2px rgba(0, 0, 0, 0.7), 0 4px 10px rgba(0, 0, 0, 0.2)",
                            }}
                            title={showBalance ? "Hide Balance" : "Show Balance"}
                        >
                            {showBalance ? <Eye size={16} color="#FFFFFF" /> : <EyeSlash size={16} color="#FFFFFF" />}
                        </button>
                        <button
                            type="button"
                            onClick={handleCopyAddress}
                            className="relative w-9 h-9 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shrink-0 bg-[#242230] dark:bg-[#191d24] border border-white/15 dark:border-[#2b313a]"
                            style={{
                                boxShadow: "inset 1.5px 1.5px 2px rgba(255, 255, 255, 0.35), inset -1px -1px 2px rgba(0, 0, 0, 0.7), 0 4px 10px rgba(0, 0, 0, 0.2)",
                            }}
                            title="Copy Wallet Address"
                        >
                            <Copy size={16} color="#FFFFFF" />
                        </button>
                        <button
                            type="button"
                            onClick={refreshData}
                            className="relative w-9 h-9 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shrink-0 bg-[#242230] dark:bg-[#191d24] border border-white/15 dark:border-[#2b313a]"
                            style={{
                                boxShadow: "inset 1.5px 1.5px 2px rgba(255, 255, 255, 0.35), inset -1px -1px 2px rgba(0, 0, 0, 0.7), 0 4px 10px rgba(0, 0, 0, 0.2)",
                            }}
                            title="Refresh Data"
                        >
                            <Refresh2 size={16} color="#FFFFFF" />
                        </button>
                    </div>
                </div>

                {/* 4 Action Buttons Grid */}
                <ActionButtonsGrid isDark={isDark} />

                {/* Live i6 Token Market Price Card (commented out) */}
                <I6PriceCard />

                {/* Total Income Till Date & Direct Business Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <TotalIncomeCard
                        totalIncome={liveData.totalIncome}
                        totalAvailable={liveData.totalAvailable}
                        totalWithdrawn={totalWithdrawnFloat}
                    />
                    <DirectBusinessCard
                        directVolumeFloat={directVolumeFloat}
                        directCount={directCount}
                    />
                </div>

                {/* Referral Link Card */}
                <SponsorAddressCard
                    sponsorAddress={user.referrer}
                    userAddress={userAddress}
                />

                {/* Sticky Segmented Tab Switcher: All Income | ROI Income | Working Income */}
                <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-2 pb-0.5 bg-white/90 dark:bg-[#0b0e14]/90 backdrop-blur-md transition-all flex items-center">
                    <div className="flex items-center gap-6">
                        {[
                            { id: "all", label: "All Income" },
                            { id: "roi", label: "ROI Income" },
                            { id: "working", label: "Working Income" },
                        ].map((tab) => {
                            const isTabActive = incomeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setIncomeTab(tab.id as any)}
                                    className={`pb-2 text-sm font-medium transition-all relative cursor-pointer ${
                                        isTabActive
                                            ? "text-[#0072ED] dark:text-[#FCD535] font-semibold"
                                            : "text-gray-400 dark:text-[#848e9c] hover:text-gray-600 dark:hover:text-white"
                                    }`}
                                >
                                    {tab.label}
                                    {isTabActive && (
                                        <motion.div 
                                            layoutId="incomeTabUnderline"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0072ED] dark:bg-[#FCD535] rounded-full"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content Display */}
                <AnimatePresence mode="wait">
                    {incomeTab === "all" && (
                        /* ================= ALL INCOME TAB (DEFAULT) ================= */
                        <motion.div 
                            key="all"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                            className="flex flex-col gap-3 -mt-3.5"
                        >
                            <IncomeSubTabs
                                tabs={ALL_SUB_TABS}
                                activeTab={allSubTab}
                                onChange={setAllSubTab}
                                gradientPrefix="all"
                            />

                            {/* New Principal (Deposit + Profit) Compounding Card */}
                            {(allSubTab === "total" || allSubTab === "rwp") && (
                                <>
                                    <CompoundingPrincipalCard
                                        depositAmount={totalDepositsFloat}
                                        profitAmount={liveData.pendingRWP}
                                        dailyRate={Number(user.currentRwpRate || 5)}
                                        streakDays={totalDepositsFloat > 0 ? streakDays : 0}
                                        onViewStreak={() => setManualStreakOpen(true)}
                                    />
                                    <QuantXCard userAddress={userAddress} />
                                </>
                            )}

                            {/* DailyROI + Salary — 2-per-row */}
                            {(allSubTab === "total" || allSubTab === "rwp" || allSubTab === "rank") && (
                                <div className="grid grid-cols-2 gap-3">
                                    {(allSubTab === "total" || allSubTab === "rwp") && (
                                        <DailyRoiCard
                                            userRate={Number(user.currentRwpRate || 5)}
                                            pendingRWP={liveData.pendingRWP}
                                            depositAmount={totalDepositsFloat}
                                        />
                                    )}
                                    {(allSubTab === "total" || allSubTab === "rank") && (
                                        <SalaryIncomeCard
                                            currentRank={user.currentRank}
                                            floatSalary={liveData.floatSalary}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Direct + HyperBooster — 2-per-row */}
                            {(allSubTab === "total" || allSubTab === "direct" || allSubTab === "booster") && (
                                <div className="grid grid-cols-2 gap-3">
                                    {(allSubTab === "total" || allSubTab === "direct") && (
                                        <DirectBonusCard
                                            directCount={directCount}
                                            directBonus={liveData.directBonus}
                                            directPendingLocked={directPendingLocked}
                                            directVolumeFloat={directVolumeFloat}
                                        />
                                    )}
                                    {(allSubTab === "total" || allSubTab === "booster") && (
                                        <HyperBoosterCard
                                            boosterTimerColor={boosterTimerColor}
                                            boosterTimerText={boosterTimerText}
                                            directBoosterCount={directBoosterCount}
                                            isBoosted={user.isBoosted || directBoosterCount >= 3}
                                            boosterIncome={liveData.boosterIncome}
                                            onReferClick={handleCopyReferralLink}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Dedicated Animated Next Compounding Timer Widget (Below the 4 Income Cards) */}
                            {(allSubTab === "total" || allSubTab === "rwp") && (
                                <CompoundingTimerWidget
                                    secondsRemaining={liveData.secondsRemaining}
                                    hasActiveInvestments={liveData.hasActiveInvestments}
                                    countdownText={liveData.countdownText}
                                    depositAmount={totalDepositsFloat}
                                    pendingRWP={liveData.pendingRWP}
                                />
                            )}

                            {(allSubTab === "total" || allSubTab === "level") && (
                                <LevelIncomeCard
                                    levelRatePerDay={levelRatePerDay}
                                    pendingLevel={liveData.pendingLevel}
                                    directCount={directCount}
                                    teamVolumeFloat={teamVolumeFloat}
                                    levelRows={levelRows}
                                    showLevelMatrix={showLevelMatrix}
                                    setShowLevelMatrix={setShowLevelMatrix}
                                />
                            )}
                            {(allSubTab === "total" || allSubTab === "upline") && (
                                <UplineIncomeCard
                                    isUplineEligible={user.isUplineEligible}
                                    pendingUpline={liveData.pendingUpline}
                                    uplineDepProgressText={uplineDepProgressText}
                                    uplineDirProgressText={uplineDirProgressText}
                                    uplines={uplines}
                                    uplineCopied={uplineCopied}
                                    onCopyUpline={handleCopyUplineAddress}
                                />
                            )}
                            {(allSubTab === "total" || allSubTab === "direct") && (
                                <ReferAndEarnCard />
                            )}
                            {(allSubTab === "total" || allSubTab === "rwp") && (
                                <SummaryMetricsCard
                                    totalLifetimeRoi={totalLifetimeRoi}
                                    investments={investments}
                                    totalDeposited={totalDepositsFloat}
                                />
                            )}

                            {/* Global Earning Cap Box at the End */}
                            {(allSubTab === "total" || allSubTab === "rwp") && (
                                <GlobalCapCard
                                    isGenesis={isGenesis}
                                    capPercentage={capPercentage}
                                    totalDepositsFloat={totalDepositsFloat}
                                    maxCap={maxCap}
                                    capSpace={capSpace}
                                    capMultiplier={capMultiplier}
                                    earnedAmount={totalEarned}
                                />
                            )}
                        </motion.div>
                    )}

                    {incomeTab === "roi" && (
                        /* ================= ROI INCOME TAB ================= */
                        <motion.div 
                            key="roi"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                            className="flex flex-col gap-3 -mt-3.5"
                        >
                            <IncomeSubTabs
                                tabs={ROI_SUB_TABS}
                                activeTab={roiSubTab}
                                onChange={setRoiSubTab}
                                gradientPrefix="roi"
                            />

                            {/* New Principal (Deposit + Profit) Compounding Card */}
                            {(roiSubTab === "total" || roiSubTab === "rwp") && (
                                <>
                                    <CompoundingPrincipalCard
                                        depositAmount={totalDepositsFloat}
                                        profitAmount={liveData.pendingRWP}
                                        dailyRate={Number(user.currentRwpRate || 5)}
                                        streakDays={totalDepositsFloat > 0 ? streakDays : 0}
                                        onViewStreak={() => setManualStreakOpen(true)}
                                    />
                                    <QuantXCard userAddress={userAddress} />
                                </>
                            )}

                            {/* DailyROI + HyperBooster — 2-per-row */}
                            {(roiSubTab === "total" || roiSubTab === "rwp" || roiSubTab === "booster") && (
                                <div className="grid grid-cols-2 gap-3">
                                    {(roiSubTab === "total" || roiSubTab === "rwp") && (
                                        <DailyRoiCard
                                            userRate={Number(user.currentRwpRate || 5)}
                                            pendingRWP={liveData.pendingRWP}
                                            depositAmount={totalDepositsFloat}
                                        />
                                    )}
                                    {(roiSubTab === "total" || roiSubTab === "booster") && (
                                        <HyperBoosterCard
                                            boosterTimerColor={boosterTimerColor}
                                            boosterTimerText={boosterTimerText}
                                            directBoosterCount={directBoosterCount}
                                            isBoosted={user.isBoosted || directBoosterCount >= 3}
                                            boosterIncome={liveData.boosterIncome}
                                            onReferClick={handleCopyReferralLink}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Dedicated Animated Next Compounding Timer Widget */}
                            {(roiSubTab === "total" || roiSubTab === "rwp") && (
                                <CompoundingTimerWidget
                                    secondsRemaining={liveData.secondsRemaining}
                                    hasActiveInvestments={liveData.hasActiveInvestments}
                                    countdownText={liveData.countdownText}
                                    depositAmount={totalDepositsFloat}
                                    pendingRWP={liveData.pendingRWP}
                                />
                            )}

                            {(roiSubTab === "total" || roiSubTab === "rwp") && (
                                <SummaryMetricsCard
                                    totalLifetimeRoi={totalLifetimeRoi}
                                    investments={investments}
                                    totalDeposited={totalDepositsFloat}
                                />
                            )}

                            {/* Global Earning Cap Box at the End */}
                            {(roiSubTab === "total" || roiSubTab === "rwp") && (
                                <GlobalCapCard
                                    isGenesis={isGenesis}
                                    capPercentage={capPercentage}
                                    totalDepositsFloat={totalDepositsFloat}
                                    maxCap={maxCap}
                                    capSpace={capSpace}
                                    capMultiplier={capMultiplier}
                                    earnedAmount={totalEarned}
                                />
                            )}
                        </motion.div>
                    )}

                    {incomeTab === "working" && (
                        /* ================= WORKING INCOME TAB ================= */
                        <motion.div 
                            key="working"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                            className="flex flex-col gap-3 -mt-3.5"
                        >
                            <IncomeSubTabs
                                tabs={WORKING_SUB_TABS}
                                activeTab={workingSubTab}
                                onChange={setWorkingSubTab}
                                gradientPrefix="working"
                            />

                            {workingSubTab === "total" && (
                                <TotalWorkingIncomeCard
                                    totalWorkingAvailable={totalWorkingAvailable}
                                    directBonus={liveData.directBonus}
                                    pendingLevel={liveData.pendingLevel}
                                    floatSalary={liveData.floatSalary}
                                    pendingUpline={liveData.pendingUpline}
                                />
                            )}

                            {/* Direct + Salary — 2-per-row */}
                            {(workingSubTab === "total" || workingSubTab === "direct" || workingSubTab === "rank") && (
                                <div className="grid grid-cols-2 gap-3">
                                    {(workingSubTab === "total" || workingSubTab === "direct") && (
                                        <DirectBonusCard
                                            directCount={directCount}
                                            directBonus={liveData.directBonus}
                                            directPendingLocked={directPendingLocked}
                                            directVolumeFloat={directVolumeFloat}
                                        />
                                    )}
                                    {(workingSubTab === "total" || workingSubTab === "rank") && (
                                        <SalaryIncomeCard
                                            currentRank={user.currentRank}
                                            floatSalary={liveData.floatSalary}
                                        />
                                    )}
                                </div>
                            )}

                            {(workingSubTab === "total" || workingSubTab === "level") && (
                                <LevelIncomeCard
                                    levelRatePerDay={levelRatePerDay}
                                    pendingLevel={liveData.pendingLevel}
                                    directCount={directCount}
                                    teamVolumeFloat={teamVolumeFloat}
                                    levelRows={levelRows}
                                    showLevelMatrix={showLevelMatrix}
                                    setShowLevelMatrix={setShowLevelMatrix}
                                />
                            )}

                            {(workingSubTab === "total" || workingSubTab === "upline") && (
                                <UplineIncomeCard
                                    isUplineEligible={user.isUplineEligible}
                                    pendingUpline={liveData.pendingUpline}
                                    uplineDepProgressText={uplineDepProgressText}
                                    uplineDirProgressText={uplineDirProgressText}
                                    uplines={uplines}
                                    uplineCopied={uplineCopied}
                                    onCopyUpline={handleCopyUplineAddress}
                                />
                            )}

                            {(workingSubTab === "total" || workingSubTab === "direct") && (
                                <ReferAndEarnCard />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Duolingo-Style Daily Compounding Streak Celebration Modal */}
                <CompoundingStreakModal
                    userAddress={userAddress}
                    actualStreakDays={totalDepositsFloat > 0 ? streakDays : 0}
                    newPrincipal={newPrincipal}
                    dailyEarning={dailyEarning}
                    isOpen={manualStreakOpen ? true : undefined}
                    onClose={() => setManualStreakOpen(false)}
                    onAutoOpen={() => setIsStreakModalActive(true)}
                    onDismiss={handleStreakDismiss}
                />

                {/* QuantX AI New Launch Celebration Modal */}
                <QuantXLaunchModal
                    isOpen={qtxLaunchModalOpen}
                    onClose={() => setQtxLaunchModalOpen(false)}
                />

            </div>
        </div>
    );
}
