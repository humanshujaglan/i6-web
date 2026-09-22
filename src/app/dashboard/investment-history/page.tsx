"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "../DashboardContext";
import UserGate from "../UserGate";
import { ethers } from "ethers";
import BackButton from "../components/BackButton";
import DepositTicket from "../components/DepositTicket";
import { ArrowDown2, ReceiptText, TickCircle, CloseCircle, Flash, EmptyWallet } from "iconsax-react";

interface LivePackageData {
    displayEarned: string;
    progressPerc: number;
    availableRoi: number;
}

export default function InvestmentHistoryPage() {
    const { userAddress, user, investments, error, refreshData } = useDashboard();
    const [livePackages, setLivePackages] = useState<LivePackageData[]>([]);
    const [depositEvents, setDepositEvents] = useState<{ timestamp: number; txHash: string; packageIndex: number }[]>([]);

    useEffect(() => {
        if (!userAddress) return;
        try {
            const cached = localStorage.getItem(`i6_deposits_cache_${userAddress}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setDepositEvents(parsed);
                }
            }
        } catch {}

        fetch(`/api/deposits/${userAddress}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.deposits && Array.isArray(data.deposits)) {
                    setDepositEvents(data.deposits);
                    try {
                        localStorage.setItem(`i6_deposits_cache_${userAddress}`, JSON.stringify(data.deposits));
                    } catch {}
                }
            })
            .catch(() => {});
    }, [userAddress]);

    useEffect(() => {
        if (!user || investments.length === 0) return;

        const interval = setInterval(() => {
            const now = Date.now() / 1000;
            const isGloballyCapped = user.isCapped;
            const userRate = Number(user.currentRwpRate) === 0 ? 5 : Number(user.currentRwpRate);

            const updated = investments.map((item) => {
                const amount = parseFloat(ethers.formatUnits(item.amount, 18));
                let compoundedPrincipal = parseFloat(ethers.formatUnits(item.compoundedPrincipal, 18));
                const rwpWithdrawn = parseFloat(ethers.formatUnits(item.rwpWithdrawn, 18));
                const lastUpdateTime = Number(item.lastUpdateTime);
                const isActive = item.isActive;

                const packageRate = userRate + Number(item.boostperc);
                const maxEarn = amount * 2.5;
                let totalCurrentEarned = 0;

                if (!isActive) {
                    totalCurrentEarned = maxEarn;
                } else {
                    const timeElapsed = now - lastUpdateTime;
                    if (timeElapsed > 0 && !isGloballyCapped) {
                        const extra = (compoundedPrincipal * packageRate * timeElapsed) / (1000 * 86400);
                        compoundedPrincipal += extra;
                    }

                    const available = Math.max(0, compoundedPrincipal - amount);
                    totalCurrentEarned = available + rwpWithdrawn;

                    if (totalCurrentEarned > maxEarn) totalCurrentEarned = maxEarn;
                    if (totalCurrentEarned < 0) totalCurrentEarned = 0;
                }

                let progressPerc = (totalCurrentEarned / maxEarn) * 100;
                if (progressPerc > 100) progressPerc = 100;

                let displayEarned = `$${totalCurrentEarned.toFixed(6)}`;

                if (!isActive || totalCurrentEarned >= maxEarn) {
                    displayEarned = `$${maxEarn.toFixed(2)}`;
                    progressPerc = 100;
                } else if (isGloballyCapped) {
                    displayEarned = `$${totalCurrentEarned.toFixed(4)}`;
                }

                return {
                    displayEarned,
                    progressPerc,
                    availableRoi: Math.max(0, compoundedPrincipal - amount),
                };
            });

            setLivePackages(updated);
        }, 50);

        return () => clearInterval(interval);
    }, [user, investments]);

    if (!user) return <UserGate error={error} onRetry={refreshData} />;

    return (
        <div className="dashboard-container relative">
            <div className="dashboard-content-wrapper max-w-4xl mx-auto flex flex-col gap-6 py-2">
                
                {/* Top Navigation Bar with Back Button */}
                <div className="flex items-center justify-between py-2">
                    <BackButton href="/dashboard" />

                    <div className="flex items-center gap-1.5 cursor-pointer">
                        <span className="text-base font-semibold text-[#0f172a] dark:text-white">Investment History</span>
                        <ArrowDown2 size={14} color="currentColor" className="text-[#0f172a] dark:text-white" />
                    </div>

                    <div className="w-11 h-11" /> {/* Spacer */}
                </div>

                {/* Header Summary */}
                <div className="flex items-center justify-between flex-wrap gap-3 bg-[#F4F4F7] dark:bg-[#14171d] rounded-[24px] p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#191d24] flex items-center justify-center text-[#0072ED] dark:text-[#FCD535] shadow-xs">
                            <ReceiptText size={20} color="currentColor" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Portfolio Packages</h2>
                            <p className="text-xs text-gray-500 dark:text-[#848e9c]">Live on-chain deposit contracts</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-[#848e9c] font-medium">Total:</span>
                        <span className="px-3 py-1 rounded-full bg-white dark:bg-[#191d24] text-xs font-bold text-[#0072ED] dark:text-[#FCD535] shadow-xs">
                            {investments.length} {investments.length === 1 ? "Package" : "Packages"}
                        </span>
                    </div>
                </div>

                {/* Ticket Cards Grid */}
                {investments.length === 0 ? (
                    <div className="bg-white dark:bg-[#14171d] rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
                        <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-[#191d24] flex items-center justify-center text-gray-300 dark:text-[#848e9c]">
                            <EmptyWallet size={32} color="currentColor" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">No Active Packages</h3>
                        <p className="text-xs text-gray-400 dark:text-[#848e9c] max-w-xs">
                            You have not made any deposits yet. Start earning up to 250% yield with your first package.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                        {investments.map((item, index) => {
                            const amount = parseFloat(ethers.formatUnits(item.amount || 0, 18));
                            const compoundedPrincipal = parseFloat(ethers.formatUnits(item.compoundedPrincipal || 0, 18));
                            const rwpWithdrawn = parseFloat(ethers.formatUnits(item.rwpWithdrawn || 0, 18));
                            // Resolve true on-chain deposit date (fallback to user.activeon for pkg 0, never mutated compounding time)
                            const ev = depositEvents.find((e) => e.packageIndex === index) || depositEvents[index];
                            const rawDep = Number(ev?.timestamp || item.depositTime || 0);
                            const rawActiveon = Number(user.activeon || 0);

                            let depTimestamp = 0;
                            if (rawDep > 0) {
                                depTimestamp = rawDep;
                            } else if (index === 0 && rawActiveon > 0) {
                                depTimestamp = rawActiveon;
                            }
                            
                            const userRate = Number(user.currentRwpRate) === 0 ? 5 : Number(user.currentRwpRate);
                            const packageRate = userRate + Number(item.boostperc || 0);
                            const displayRate = (packageRate / 10).toFixed(1);
                            
                            const liveData = livePackages[index];
                            const progressText = liveData ? liveData.displayEarned : "$0.00";
                            const progressPerc = liveData ? liveData.progressPerc : 0;
                            const availableRoi = liveData ? liveData.availableRoi : Math.max(0, compoundedPrincipal - amount);

                            const directCount = Number(user.directCount || 0);
                            const capMultiplier = directCount > 0 ? 6 : 2.5;

                            return (
                                <DepositTicket
                                    key={index}
                                    index={index}
                                    amount={amount}
                                    compoundedPrincipal={compoundedPrincipal}
                                    rwpWithdrawn={rwpWithdrawn}
                                    availableRoi={availableRoi}
                                    txHash={item.txHash || ev?.txHash}
                                    displayRate={displayRate}
                                    progressText={progressText}
                                    progressPerc={progressPerc}
                                    isActive={item.isActive}
                                    isCapped={user.isCapped}
                                    capMultiplier={capMultiplier}
                                />
                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
}
