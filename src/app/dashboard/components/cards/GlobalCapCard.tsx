"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "@/app/context/ThemeContext";
import IncomeInfoSheet from "../sheets/IncomeInfoSheet";

interface GlobalCapCardProps {
    isGenesis: boolean;
    capPercentage: number;
    totalDepositsFloat: number;
    maxCap: number;
    capSpace: number;
    capMultiplier?: number;
    earnedAmount?: number;
}

export default function GlobalCapCard({
    isGenesis,
    capPercentage,
    totalDepositsFloat,
    maxCap,
    capSpace,
    capMultiplier,
    earnedAmount,
}: GlobalCapCardProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [showInfo, setShowInfo] = useState(false);

    const effectiveEarned = earnedAmount !== undefined
        ? earnedAmount
        : (isGenesis ? 0 : Math.max(0, maxCap - capSpace));

    return (
        <>
            <div 
                className="w-full p-4 sm:p-5 flex flex-col gap-3.5 select-none rounded-2xl transition-all duration-200"
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
                {/* Top row: 3D Capping Icon beside title & value (not in corner) */}
                <div className="flex items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        {/* 3D Capping Icon */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 relative flex items-center justify-center shrink-0 -my-1 -ml-1">
                            <Image 
                                src={isDark ? "/3d-icons/capping-dark-v4.webp" : "/3d-icons/capping-light-v4.webp"}
                                alt="Earning Cap"
                                width={96}
                                height={96}
                                className="w-full h-full object-contain"
                                priority
                            />
                        </div>

                        {/* Title and Cap Percentage beside icon */}
                        <div className="flex flex-col justify-center min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-100 leading-tight">
                                    Earning Cap
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowInfo(true);
                                    }}
                                    aria-label="Global Cap Details"
                                    className="text-gray-400 hover:text-gray-800 dark:text-gray-400 dark:hover:text-[#FCD535] transition-all hover:scale-110 active:scale-95 cursor-pointer shrink-0 p-0.5"
                                >
                                    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8 14.667A6.667 6.667 0 108 1.333a6.667 6.667 0 000 13.334z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M6.15 6.15a2 2 0 013.7.75c0 1.25-1.85 1.75-1.85 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M8 11.667h.007" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                            <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
                                <span className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-white font-mono tracking-tight truncate">
                                    {isGenesis ? "∞ Unlimited" : `$${effectiveEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                </span>
                                {!isGenesis && (
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] font-mono shrink-0">
                                        {capPercentage.toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                {!isGenesis && (
                    <div className="w-full h-2 bg-gray-200/60 dark:bg-white/5 rounded-full overflow-hidden relative z-10">
                        <div 
                            className="h-full bg-gradient-to-r from-[#0072ED] to-[#10B981] dark:from-[#FCD535] dark:to-[#0ecb81] rounded-full transition-all duration-500"
                            style={{ width: `${capPercentage}%` }}
                        />
                    </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-xs relative z-10">
                    <div className="flex flex-col">
                        <span className="text-[var(--text-soft)]">Total Deposits</span>
                        <span className="font-medium text-[var(--text-main)] font-mono">${totalDepositsFloat.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[var(--text-soft)]">
                            Max Cap {capMultiplier && !isGenesis ? `(${capMultiplier}x)` : "Limit"}
                        </span>
                        <span className="font-medium text-[var(--text-main)] font-mono">
                            {isGenesis ? "∞ Unlimited" : `$${maxCap.toFixed(2)}`}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[var(--text-soft)]">Remaining Cap</span>
                        <span className="font-medium text-emerald-600 dark:text-[#FCD535] font-mono">
                            {isGenesis ? "∞ Unlimited" : `$${capSpace.toFixed(2)}`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Floating Information Sheet */}
            <IncomeInfoSheet
                open={showInfo}
                onClose={() => setShowInfo(false)}
                title="Global Earning Cap"
                typeLabel="Earning Limit"
                iconSrc={isDark ? "/3d-icons/capping-dark-v4.webp" : "/3d-icons/capping-light-v4.webp"}
                iconPosition="center"
                description={
                    capMultiplier === 2.5
                        ? "Non-working accounts (with 0 direct referrals) have a 2.5x maximum earnings cap on deposits. Introduce direct referrals to unlock the full 6.0x capping limit."
                        : "The maximum total income you can earn across lifetime earnings. Top up your deposit at any time to expand your earnings capacity."
                }
                rateOrYield={isGenesis ? "Genesis Account (Unlimited)" : `Earned: $${effectiveEarned.toFixed(2)} (${capPercentage.toFixed(1)}%)`}
                stats={[
                    { label: "Earned Towards Cap", value: isGenesis ? "Unlimited" : `$${effectiveEarned.toFixed(2)}`, isGold: true },
                    { label: "Total Deposited", value: `$${totalDepositsFloat.toFixed(2)}` },
                    { label: "Cap Multiplier", value: isGenesis ? "Unlimited" : `${capMultiplier || 6}x` },
                    { label: "Maximum Cap Limit", value: isGenesis ? "Unlimited" : `$${maxCap.toFixed(2)}` },
                    { label: "Remaining Limit", value: isGenesis ? "Unlimited" : `$${capSpace.toFixed(2)}` },
                ]}
            />
        </>
    );
}
