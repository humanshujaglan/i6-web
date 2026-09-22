"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ethers } from "ethers";
import { useTheme } from "@/app/context/ThemeContext";
import IncomeInfoSheet from "../sheets/IncomeInfoSheet";

interface SummaryMetricsCardProps {
    totalLifetimeRoi: number;
    investments: any[];
    totalDeposited?: number;
}

export default function SummaryMetricsCard({
    totalLifetimeRoi,
    investments,
    totalDeposited,
}: SummaryMetricsCardProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [showRoiInfo, setShowRoiInfo] = useState(false);
    const [showPkgInfo, setShowPkgInfo] = useState(false);

    const activeCount = investments.filter((i) => i.isActive).length;
    const computedDeposited = investments.reduce((acc, i) => {
        try {
            return acc + (parseFloat(ethers.formatUnits(i.amount, 18)) || 0);
        } catch {
            const val = parseFloat(i.amount) || 0;
            return acc + (val > 1e12 ? val / 1e18 : val);
        }
    }, 0);
    const totalDepositedAmount = totalDeposited !== undefined ? totalDeposited : computedDeposited;

    return (
        <>
            <div className="grid grid-cols-2 gap-3">
                {/* 1. Total ROI Generated Card */}
                <div 
                    className="relative overflow-hidden p-4 sm:p-5 flex flex-col justify-between select-none rounded-2xl transition-all duration-200"
                    style={{
                        background: isDark
                            ? "linear-gradient(135deg, #14171d 0%, #0a0c0f 100%)"
                            : "linear-gradient(135deg, rgba(201, 224, 255, 0.6) 0%, #FFFFFF 85%)",
                        border: isDark
                            ? "1px solid rgba(255, 255, 255, 0.12)"
                            : "1.5px solid #FFFFFF",
                        boxShadow: isDark
                            ? "inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 4px 14px rgba(0, 0, 0, 0.4)"
                            : "0 3px 12px rgba(12, 50, 99, 0.06)",
                    }}
                >
                    {/* Top-left stuck corner icon (0 margin, 0 padding) */}
                    <div className="absolute top-0 left-0 w-20 h-20 sm:w-24 sm:h-24 pointer-events-none z-0 overflow-hidden rounded-tl-2xl">
                        <Image 
                            src={isDark ? "/3d-icons/total-roi-dark-v4.webp" : "/3d-icons/total-roi-light-v4.webp"}
                            alt="Total ROI Generated"
                            width={96}
                            height={96}
                            className="w-full h-full object-contain object-left-top"
                            priority
                        />
                    </div>

                    {/* Top row spacer for vertical gap below icon */}
                    <div className="relative z-10 w-full flex items-start justify-end shrink-0 h-16 sm:h-20" />

                    {/* Middle: Title with Question Mark & Big Amount */}
                    <div className="relative z-10 flex flex-col justify-end flex-1 pt-2 sm:pt-3 pb-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-100 group-hover:text-[#0072ED] dark:group-hover:text-[#FCD535] transition-colors leading-tight">
                                Total ROI
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowRoiInfo(true);
                                }}
                                aria-label="Total ROI Details"
                                className="text-gray-400 hover:text-gray-800 dark:text-gray-400 dark:hover:text-[#FCD535] transition-all hover:scale-110 active:scale-95 cursor-pointer shrink-0 p-0.5"
                            >
                                <svg width="17" height="17" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8 14.667A6.667 6.667 0 108 1.333a6.667 6.667 0 000 13.334z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M6.15 6.15a2 2 0 013.7.75c0 1.25-1.85 1.75-1.85 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M8 11.667h.007" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                        <div className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-white font-mono tracking-tight truncate mt-0.5">
                            ${totalLifetimeRoi.toFixed(4)}
                        </div>
                    </div>

                    {/* Bottom strip */}
                    <div className="relative z-10 w-full pt-1 flex items-center justify-between text-[11px]">
                        <span className="text-[var(--text-soft)]">Lifetime Yield</span>
                    </div>
                </div>

                {/* 2. Total Packages Card */}
                <div 
                    className="relative overflow-hidden p-4 sm:p-5 flex flex-col justify-between select-none rounded-2xl transition-all duration-200"
                    style={{
                        background: isDark
                            ? "linear-gradient(135deg, #14171d 0%, #0a0c0f 100%)"
                            : "linear-gradient(135deg, rgba(201, 224, 255, 0.6) 0%, #FFFFFF 85%)",
                        border: isDark
                            ? "1px solid rgba(255, 255, 255, 0.12)"
                            : "1.5px solid #FFFFFF",
                        boxShadow: isDark
                            ? "inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 4px 14px rgba(0, 0, 0, 0.4)"
                            : "0 3px 12px rgba(12, 50, 99, 0.06)",
                    }}
                >
                    {/* Top-left stuck corner icon (0 margin, 0 padding) */}
                    <div className="absolute top-0 left-0 w-20 h-20 sm:w-24 sm:h-24 pointer-events-none z-0 overflow-hidden rounded-tl-2xl">
                        <Image 
                            src={isDark ? "/3d-icons/package-dark-v4.webp" : "/3d-icons/package-light-v4.webp"}
                            alt="Total Packages"
                            width={96}
                            height={96}
                            className="w-full h-full object-contain object-left-top"
                            priority
                        />
                    </div>

                    {/* Top row spacer for vertical gap below icon */}
                    <div className="relative z-10 w-full flex items-start justify-end shrink-0 h-16 sm:h-20" />

                    {/* Middle: Title with Question Mark & Big Amount */}
                    <div className="relative z-10 flex flex-col justify-end flex-1 pt-2 sm:pt-3 pb-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-100 group-hover:text-[#0072ED] dark:group-hover:text-[#FCD535] transition-colors leading-tight">
                                Packages
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowPkgInfo(true);
                                }}
                                aria-label="Package Details"
                                className="text-gray-400 hover:text-gray-800 dark:text-gray-400 dark:hover:text-[#FCD535] transition-all hover:scale-110 active:scale-95 cursor-pointer shrink-0 p-0.5"
                            >
                                <svg width="17" height="17" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8 14.667A6.667 6.667 0 108 1.333a6.667 6.667 0 000 13.334z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M6.15 6.15a2 2 0 013.7.75c0 1.25-1.85 1.75-1.85 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M8 11.667h.007" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                        <div className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-white font-mono tracking-tight truncate mt-0.5">
                            {investments.length}
                        </div>
                    </div>

                    {/* Bottom strip */}
                    <div className="relative z-10 w-full pt-1 flex items-center justify-between text-[11px]">
                        <span className="text-[var(--text-soft)]">History</span>
                        <Link 
                            href="/dashboard/investment?tab=history"
                            className="px-4 py-1.5 rounded-xl bg-[#0072ED] hover:bg-[#0062cc] text-white dark:bg-[#FCD535] dark:hover:bg-[#f0b90b] dark:text-[#0b0e14] text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                            View Record
                        </Link>
                    </div>
                </div>
            </div>

            {/* Total ROI Sheet */}
            <IncomeInfoSheet
                open={showRoiInfo}
                onClose={() => setShowRoiInfo(false)}
                title="Total Lifetime ROI"
                typeLabel="Total Profit"
                iconSrc={isDark ? "/3d-icons/total-roi-dark-v4.webp" : "/3d-icons/total-roi-light-v4.webp"}
                description="The total cumulative profit and daily returns generated across all your active and completed deposit packages since joining."
                stats={[
                    { label: "Total Lifetime ROI", value: `$${totalLifetimeRoi.toFixed(4)}`, isGold: true },
                    { label: "Active Packages", value: `${activeCount} Active` },
                ]}
            />

            {/* Packages Sheet */}
            <IncomeInfoSheet
                open={showPkgInfo}
                onClose={() => setShowPkgInfo(false)}
                title="Deposit Packages"
                typeLabel="Packages Portfolio"
                iconSrc={isDark ? "/3d-icons/package-dark-v4.webp" : "/3d-icons/package-light-v4.webp"}
                description="Your portfolio of active and completed deposit packages. Each package earns daily returns until reaching its target return limit."
                stats={[
                    { label: "Total Packages", value: `${investments.length} Packages`, isGold: true },
                    { label: "Active Packages", value: `${activeCount} Active` },
                    { label: "Total Deposited", value: `$${totalDepositedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                ]}
            />
        </>
    );
}
