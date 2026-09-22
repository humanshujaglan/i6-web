"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDashboard } from "../DashboardContext";
import UserGate from "../UserGate";
import { ethers } from "ethers";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { MAIN_CONTRACT_ADDRESS as CONTRACT_ADDRESS } from "@/lib/contracts/abis";
import { useTheme } from "@/app/context/ThemeContext";
import {
    Award,
    Medal,
    Crown,
    Cup,
    Flash,
    Diamonds,
    Star1,
    Lock,
    TickCircle,
    ArrowRight2,
    ArrowLeft2,
    Refresh2,
    Warning2,
    CloseCircle,
    Hierarchy,
    Wallet3,
    Clock,
    Send2,
} from "iconsax-react";

interface RankItem {
    id: number;
    name: string;
    income: number;
    req: number;
    color: string;
}

const RANKS: RankItem[] = [
    { id: 1, name: "i1", income: 50, req: 3000, color: "#e67e22" },
    { id: 2, name: "i2", income: 200, req: 10000, color: "#7f8c8d" },
    { id: 3, name: "i3", income: 1000, req: 40000, color: "#f1c40f" },
    { id: 4, name: "i4", income: 3000, req: 120000, color: "#2E7D32" },
    { id: 5, name: "i5", income: 10000, req: 500000, color: "#3498db" },
    { id: 6, name: "i6", income: 40000, req: 2000000, color: "#9b59b6" },
    { id: 7, name: "i7", income: 200000, req: 10000000, color: "#ff3366" },
    { id: 8, name: "i8", income: 1000000, req: 50000000, color: "#d35400" },
    { id: 9, name: "i9", income: 4000000, req: 200000000, color: "#0072ED" },
    { id: 10, name: "i10", income: 20000000, req: 1000000000, color: "#FCD535" },
];

const CONTRACT_ABI = [
    {
        "inputs": [],
        "name": "claimRank",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

export default function SalaryStatusPage() {
    const { userAddress, user, refreshData, error } = useDashboard();
    const { address, isConnected } = useAccount();
    const { open } = useAppKit();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [loading, setLoading] = useState(true);
    const [liveSalary, setLiveSalary] = useState(0);
    const [claiming, setClaiming] = useState(false);
    const [globalActionType, setGlobalActionType] = useState("none");
    const [highestActionRank, setHighestActionRank] = useState(0);
    const [rankFilter, setRankFilter] = useState<"all" | "active" | "locked">("all");

    const [salaryState, setSalaryState] = useState({
        basePending: 0,
        rank: 0,
        endTime: 0,
        isCapped: false,
        fetchTime: 0
    });

    const [vols, setVols] = useState({
        powerVol: 0,
        weakerVol: 0,
        powerFresh: 0,
        weakerFresh: 0
    });

    const loadSalaryData = async () => {
        const activeAddr = address || userAddress;
        if (!activeAddr) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`/api/salary-status/${activeAddr}`);
            if (!res.ok) throw new Error("Failed to fetch salary status");
            const data = await res.json();

            const currentUser = data.user || user;
            const myRank = currentUser ? Number(currentUser.currentRank) : 0;
            const salaryEndTime = currentUser ? Number(currentUser.salaryEndTime) : 0;
            const isCapped = currentUser ? Boolean(currentUser.isCapped) : false;

            setSalaryState({
                basePending: data.pendingSalary ? parseFloat(ethers.formatUnits(data.pendingSalary, 18)) : 0,
                rank: myRank,
                endTime: salaryEndTime,
                isCapped: isCapped,
                fetchTime: Date.now() / 1000
            });

            let powerVol = 0;
            let weakerVol = 0;
            let powerFresh = 0;
            let weakerFresh = 0;

            const directItems = data.directDetails || data.directs || [];
            if (directItems.length > 0) {
                const directVolumes = directItems.map((d: any) => {
                    const u = d.user || d;
                    if (d.totalBusiness) return parseFloat(ethers.formatUnits(d.totalBusiness, 18));
                    const downline = u.totalDownlineBusiness ? parseFloat(ethers.formatUnits(u.totalDownlineBusiness, 18)) : 0;
                    const selfDep = u.totalDeposits ? parseFloat(ethers.formatUnits(u.totalDeposits, 18)) : 0;
                    return downline + selfDep;
                });

                const directFresh = directItems.map((d: any) => {
                    const u = d.user || d;
                    return u.freshBusiness ? parseFloat(ethers.formatUnits(u.freshBusiness, 18)) : 0;
                });

                powerVol = directVolumes.length > 0 ? Math.max(...directVolumes) : 0;
                powerFresh = directFresh.length > 0 ? Math.max(...directFresh) : 0;

                const totalAllVol = directVolumes.reduce((a: number, b: number) => a + b, 0);
                const totalAllFresh = directFresh.reduce((a: number, b: number) => a + b, 0);

                weakerVol = Math.max(0, totalAllVol - powerVol);
                weakerFresh = Math.max(0, totalAllFresh - powerFresh);
            }

            setVols({ powerVol, weakerVol, powerFresh, weakerFresh });

            const now = Math.floor(Date.now() / 1000);
            const inGracePeriod = now >= (salaryEndTime - (7 * 86400));

            let actType = "none";
            let bestRank = 0;

            if (!isCapped) {
                for (let r = 10; r > myRank; r--) {
                    const rInfo = RANKS.find(x => x.id === r);
                    if (!rInfo) continue;
                    const req = rInfo.req;
                    const eligibleVol = Math.min(powerVol, req * 0.4) + Math.min(weakerVol, req * 0.6);
                    if (eligibleVol >= req) {
                        actType = "upgrade";
                        bestRank = r;
                        break;
                    }
                }

                if (actType === "none" && myRank > 0 && inGracePeriod) {
                    const currentRankInfo = RANKS.find(x => x.id === myRank);
                    if (currentRankInfo) {
                        const maintReq = currentRankInfo.req * 0.25;
                        const eligibleMaint = Math.min(powerFresh, maintReq * 0.4) + Math.min(weakerFresh, maintReq * 0.6);
                        if (eligibleMaint >= maintReq) {
                            actType = "renew";
                        }
                    }
                }
            }

            setGlobalActionType(actType);
            setHighestActionRank(bestRank);

            try {
                localStorage.setItem(`i6_salary_cache_${activeAddr}`, JSON.stringify({
                    salaryState: {
                        basePending: data.pendingSalary ? parseFloat(ethers.formatUnits(data.pendingSalary, 18)) : 0,
                        rank: myRank,
                        endTime: salaryEndTime,
                        isCapped: isCapped,
                        fetchTime: Date.now() / 1000
                    },
                    vols: { powerVol, weakerVol, powerFresh, weakerFresh },
                    globalActionType: actType,
                    highestActionRank: bestRank
                }));
            } catch {}

        } catch (err) {
            console.error("Salary sync failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const activeAddr = address || userAddress;
        if (!activeAddr) return;
        try {
            const cached = localStorage.getItem(`i6_salary_cache_${activeAddr}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed?.salaryState && parsed?.vols) {
                    setSalaryState(parsed.salaryState);
                    setVols(parsed.vols);
                    if (parsed.globalActionType) setGlobalActionType(parsed.globalActionType);
                    if (parsed.highestActionRank) setHighestActionRank(parsed.highestActionRank);
                    setLoading(false);
                }
            }
        } catch {}
    }, [userAddress, address]);

    useEffect(() => {
        loadSalaryData();
    }, [userAddress, address, user]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now() / 1000;
            let currentSal = salaryState.basePending;

            if (salaryState.rank > 0 && !salaryState.isCapped && now < salaryState.endTime) {
                const rankIncomeMap = [0, 50, 200, 1000, 3000, 10000, 40000, 200000, 1000000, 4000000, 20000000];
                const salaryPerSec = rankIncomeMap[salaryState.rank] / (30 * 86400);

                const effectiveNow = now > salaryState.endTime ? salaryState.endTime : now;
                const effectiveTimePassed = effectiveNow - salaryState.fetchTime;

                if (effectiveTimePassed > 0) {
                    currentSal += (effectiveTimePassed * salaryPerSec);
                }
            }

            setLiveSalary(currentSal);
        }, 50);

        return () => clearInterval(interval);
    }, [salaryState]);

    const handleClaimRank = async () => {
        if (claiming) return;

        if (!address && !isConnected) {
            open();
            return;
        }

        setClaiming(true);

        try {
            const hash = await writeContractAsync({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: CONTRACT_ABI,
                functionName: "claimRank",
            });

            if (publicClient) {
                await publicClient.waitForTransactionReceipt({ hash });
            }

            refreshData();
            loadSalaryData();
        } catch (e: any) {
            console.error("Claim Error:", e);
        } finally {
            setClaiming(false);
        }
    };

    if (!user) return <UserGate error={error} onRetry={refreshData} />;

    const formatNum = (n: number) => {
        return parseFloat(n.toString()).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

    const myRank = salaryState.rank > 0 ? salaryState.rank : Number(user.currentRank);
    const salaryEndTime = salaryState.endTime > 0 ? salaryState.endTime : Number(user.salaryEndTime);
    const now = Math.floor(Date.now() / 1000);
    const inGracePeriod = now >= (salaryEndTime - (7 * 86400));
    const daysLeftInCycle = Math.max(0, Math.ceil((salaryEndTime - now) / 86400));

    const totalTeamVolume = vols.powerVol + vols.weakerVol;
    const totalFreshVolume = vols.powerFresh + vols.weakerFresh;

    return (
        <div className="dashboard-container">
            <div className="dashboard-content-wrapper max-w-xl mx-auto flex flex-col gap-6">

                {/* Top Back Navigation & Header */}
                <div className="flex items-center justify-between pt-2">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-[#848e9c] hover:text-[#0072ED] dark:hover:text-[#FCD535] transition-colors"
                    >
                        <ArrowLeft2 size={16} color="currentColor" />
                        <span>Back to Dashboard</span>
                    </Link>
                    <button
                        type="button"
                        onClick={loadSalaryData}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F4F4F7] dark:bg-[#191d24] text-gray-600 dark:text-gray-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        title="Refresh Rank Data"
                    >
                        <Refresh2 size={15} color="currentColor" />
                    </button>
                </div>

                {/* Main Hero Card: Live Earnings & Active Rank Status */}
                <div className="income-card w-full p-5 sm:p-6 flex flex-col gap-4 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] flex items-center justify-center shrink-0">
                                <Award size={22} color="currentColor" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-base sm:text-lg font-medium text-[var(--text-main)]">Leadership Salary</span>
                                <span className="text-[11px] text-[var(--text-soft)]">Real-time streaming yield</span>
                            </div>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            myRank > 0
                                ? "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-[#FCD535]"
                                : "bg-[#F4F4F7] dark:bg-[#191d24] text-gray-500 dark:text-[#848e9c]"
                        }`}>
                            {myRank > 0 ? `Rank ${myRank} Active` : "Unranked"}
                        </span>
                    </div>

                    {/* Big Live Streaming Number */}
                    <div className="flex items-baseline gap-2 pt-1 pb-1">
                        <span className="text-3xl sm:text-4xl font-medium text-[var(--text-main)] font-mono tracking-tight">
                            ${liveSalary.toFixed(6)}
                        </span>
                        <span className="text-xs text-[var(--text-soft)]">USD</span>
                    </div>

                    {/* Cycle Timeline & Active Action Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2 text-xs text-[var(--text-soft)]">
                            <Clock size={16} color="currentColor" className="shrink-0 text-amber-500 dark:text-[#FCD535]" />
                            {myRank > 0 ? (
                                <span>30-Day Cycle: <strong className="font-medium text-[var(--text-main)]">{daysLeftInCycle} days remaining</strong></span>
                            ) : (
                                <span>Qualify team volume to unlock Rank 1 ($50/mo)</span>
                            )}
                        </div>

                        {user.isCapped ? (
                            <button className="px-4 py-2.5 rounded-full bg-gray-200 dark:bg-[#1e2329] text-gray-500 text-xs font-medium cursor-not-allowed flex items-center justify-center gap-1.5" disabled>
                                <CloseCircle size={15} color="currentColor" />
                                <span>Account Capped</span>
                            </button>
                        ) : globalActionType === "upgrade" ? (
                            <button
                                onClick={handleClaimRank}
                                disabled={claiming}
                                className="px-5 py-2.5 rounded-full bg-[#0072ED] hover:bg-[#0062cc] text-white dark:bg-[#FCD535] dark:hover:bg-[#f0b90b] dark:text-[#0b0e14] text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                            >
                                <Flash size={15} color="currentColor" />
                                <span>{claiming ? "Activating..." : `Activate Rank ${highestActionRank}`}</span>
                            </button>
                        ) : globalActionType === "renew" ? (
                            <button
                                onClick={handleClaimRank}
                                disabled={claiming}
                                className="px-5 py-2.5 rounded-full bg-[#0072ED] hover:bg-[#0062cc] text-white dark:bg-[#FCD535] dark:hover:bg-[#f0b90b] dark:text-[#0b0e14] text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                            >
                                <Refresh2 size={15} color="currentColor" />
                                <span>{claiming ? "Renewing..." : "Renew Maintenance"}</span>
                            </button>
                        ) : (
                            <div className="px-3.5 py-1.5 rounded-full bg-[#F8F9FB] dark:bg-[#191d24] text-[11px] text-[var(--text-soft)] font-medium self-start sm:self-auto">
                                Requirements in progress
                            </div>
                        )}
                    </div>
                </div>

                {/* Team Volume Distribution (40% Power / 60% Weaker) */}
                <div className="income-card w-full p-5 sm:p-6 flex flex-col gap-3.5 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Hierarchy size={18} color="currentColor" className="text-[#0072ED] dark:text-[#FCD535]" />
                            <span className="text-base sm:text-lg font-medium text-[var(--text-main)]">Volume Distribution</span>
                        </div>
                        <span className="text-xs text-[var(--text-soft)]">
                            Total: <strong className="font-medium text-[var(--text-main)]">${formatNum(totalTeamVolume)}</strong>
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="bg-[#F8F9FB] dark:bg-[#191d24] p-3.5 rounded-xl flex flex-col gap-1 border border-gray-100/80 dark:border-white/5">
                            <span className="text-[11px] text-[var(--text-soft)]">Power Leg (Max 40%)</span>
                            <span className="text-base font-medium text-[var(--text-main)] font-mono">
                                ${formatNum(vols.powerVol)}
                            </span>
                            <span className="text-[10px] text-[var(--text-soft)]">Fresh: ${formatNum(vols.powerFresh)}</span>
                        </div>

                        <div className="bg-[#F8F9FB] dark:bg-[#191d24] p-3.5 rounded-xl flex flex-col gap-1 border border-gray-100/80 dark:border-white/5">
                            <span className="text-[11px] text-[var(--text-soft)]">Weaker Legs (Max 60%)</span>
                            <span className="text-base font-medium text-[var(--text-main)] font-mono">
                                ${formatNum(vols.weakerVol)}
                            </span>
                            <span className="text-[10px] text-[var(--text-soft)]">Fresh: ${formatNum(vols.weakerFresh)}</span>
                        </div>
                    </div>
                </div>

                {/* Filter Switcher: All Ranks | Active & Next */}
                <div className="flex items-center justify-between">
                    <span className="text-base sm:text-lg font-medium text-[var(--text-main)]">Rank Qualifications</span>
                    <div className="flex items-center gap-1 bg-[#F4F4F7] dark:bg-[#14171d] p-1 rounded-full text-xs">
                        <button
                            type="button"
                            onClick={() => setRankFilter("all")}
                            className={`px-3 py-1 rounded-full font-medium transition-all ${
                                rankFilter === "all"
                                    ? "bg-white dark:bg-[#202630] text-[var(--text-main)] shadow-xs"
                                    : "text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            }`}
                        >
                            All Ranks
                        </button>
                        <button
                            type="button"
                            onClick={() => setRankFilter("active")}
                            className={`px-3 py-1 rounded-full font-medium transition-all ${
                                rankFilter === "active"
                                    ? "bg-white dark:bg-[#202630] text-[var(--text-main)] shadow-xs"
                                    : "text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            }`}
                        >
                            Active & Next
                        </button>
                    </div>
                </div>

                {/* 10 Executive Ranks List */}
                <div className="flex flex-col gap-3.5">
                    {RANKS
                        .filter((rank) => {
                            if (rankFilter === "active") {
                                return rank.id === myRank || rank.id === myRank + 1;
                            }
                            return true;
                        })
                        .map((rank) => {
                            const isActive = myRank === rank.id;
                            const isPassed = myRank > rank.id;
                            const targetVol = rank.req;
                            const targetMaint = targetVol * 0.25;

                            const eligibleRankVol = Math.min(vols.powerVol, targetVol * 0.4) + Math.min(vols.weakerVol, targetVol * 0.6);
                            const eligibleMaintVol = Math.min(vols.powerFresh, targetMaint * 0.4) + Math.min(vols.weakerFresh, targetMaint * 0.6);

                            const isRankQualified = eligibleRankVol >= targetVol;
                            const isMaintQualified = eligibleMaintVol >= targetMaint;

                            const displayEligible = isActive ? eligibleMaintVol : isPassed ? targetVol : eligibleRankVol;
                            const displayTarget = isActive ? targetMaint : targetVol;
                            const progressPerc = displayTarget > 0 ? Math.min(100, (displayEligible / displayTarget) * 100) : 0;

                            const powerReq = displayTarget * 0.4;
                            const weakerReq = displayTarget * 0.6;
                            const myPower = isActive ? vols.powerFresh : vols.powerVol;
                            const myWeaker = isActive ? vols.weakerFresh : vols.weakerVol;
                            const remaining = Math.max(0, displayTarget - displayEligible);

                            return (
                                <div
                                    key={rank.id}
                                    className={`income-card w-full p-5 flex flex-col gap-3.5 transition-all duration-200 ${
                                        isActive ? "!border-2 !border-[#0072ED] dark:!border-[#FCD535]" : ""
                                    }`}
                                >
                                    {/* Card Header: Name + Monthly Salary + Status */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div
                                                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                                style={{ backgroundColor: `${rank.color}18`, color: rank.color }}
                                            >
                                                {rank.id >= 8 ? <Crown size={18} color="currentColor" /> :
                                                 rank.id >= 5 ? <Diamonds size={18} color="currentColor" /> :
                                                 rank.id >= 3 ? <Award size={18} color="currentColor" /> :
                                                 <Medal size={18} color="currentColor" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-base font-medium text-[var(--text-main)]">{rank.name}</span>
                                                <span className="text-xs font-medium text-[#0072ED] dark:text-[#FCD535]">
                                                    ${formatNum(rank.income)} / month
                                                </span>
                                            </div>
                                        </div>

                                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                                            isPassed
                                                ? "bg-[#0072ED]/10 dark:bg-white/10 text-[#0072ED] dark:text-white"
                                                : isActive
                                                ? "bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535]"
                                                : "bg-[#F4F4F7] dark:bg-[#191d24] text-gray-400 dark:text-gray-500"
                                        }`}>
                                            {isPassed ? "Promoted" : isActive ? "Active" : "Locked"}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between text-xs text-[var(--text-soft)]">
                                            <span>{isActive ? "30-Day Maintenance Volume" : "Qualification Volume"}</span>
                                            <span className="font-medium text-[var(--text-main)] font-mono">
                                                ${formatNum(displayEligible)} / ${formatNum(displayTarget)}
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-200/60 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    isPassed || progressPerc >= 100
                                                        ? "bg-[#0072ED] dark:bg-[#FCD535]"
                                                        : "bg-gradient-to-r from-[#0072ED] to-[#10B981] dark:from-[#FCD535] dark:to-[#0ecb81]"
                                                }`}
                                                style={{ width: `${isPassed ? 100 : progressPerc}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Leg Breakdown Metrics */}
                                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-[var(--text-soft)]">
                                        <div className="bg-[#F8F9FB] dark:bg-[#191d24] p-2.5 rounded-xl flex justify-between items-center border border-gray-100/80 dark:border-white/5">
                                            <span>Power:</span>
                                            <span className="font-medium text-[var(--text-main)] font-mono">
                                                ${formatNum(Math.min(myPower, powerReq))} / ${formatNum(powerReq)}
                                            </span>
                                        </div>
                                        <div className="bg-[#F8F9FB] dark:bg-[#191d24] p-2.5 rounded-xl flex justify-between items-center border border-gray-100/80 dark:border-white/5">
                                            <span>Weaker:</span>
                                            <span className="font-medium text-[var(--text-main)] font-mono">
                                                ${formatNum(Math.min(myWeaker, weakerReq))} / ${formatNum(weakerReq)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Active Action / Remaining Status */}
                                    {isActive && inGracePeriod && isMaintQualified && (
                                        <button
                                            type="button"
                                            onClick={handleClaimRank}
                                            disabled={claiming}
                                            className="w-full py-2.5 rounded-full bg-[#0072ED] hover:bg-[#0062cc] text-white dark:bg-[#FCD535] dark:hover:bg-[#f0b90b] dark:text-[#0b0e14] text-xs font-semibold hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                                        >
                                            <Refresh2 size={15} color="currentColor" />
                                            <span>{claiming ? "Processing..." : "Renew 30-Day Cycle"}</span>
                                        </button>
                                    )}

                                    {!isPassed && !isActive && isRankQualified && (
                                        <button
                                            type="button"
                                            onClick={handleClaimRank}
                                            disabled={claiming}
                                            className="w-full py-2.5 rounded-full bg-[#0072ED] hover:bg-[#0062cc] text-white dark:bg-[#FCD535] dark:hover:bg-[#f0b90b] dark:text-[#0b0e14] text-xs font-semibold hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                                        >
                                            <Flash size={15} color="currentColor" />
                                            <span>{claiming ? "Activating..." : `Activate ${rank.name}`}</span>
                                        </button>
                                    )}

                                    {!isPassed && !isActive && !isRankQualified && remaining > 0 && (
                                        <div className="text-[11px] text-[#0072ED] dark:text-[#FCD535] font-medium text-center">
                                            ${formatNum(remaining)} eligible volume needed to unlock
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>

            </div>
        </div>
    );
}
