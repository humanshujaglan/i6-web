"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "@/app/context/ThemeContext";
import IncomeInfoSheet from "../sheets/IncomeInfoSheet";
import LevelMatrixSheet from "../sheets/LevelMatrixSheet";

export interface LevelRowItem {
    level: number;
    req: number;
    isUnlocked: boolean;
    yieldText: string;
}

interface LevelIncomeCardProps {
    levelRatePerDay: number;
    pendingLevel: number;
    directCount: number;
    teamVolumeFloat: number;
    levelRows: LevelRowItem[];
    showLevelMatrix?: boolean;
    setShowLevelMatrix?: (show: boolean | ((prev: boolean) => boolean)) => void;
}

export default function LevelIncomeCard({
    levelRatePerDay,
    pendingLevel,
    directCount,
    teamVolumeFloat,
    levelRows,
}: LevelIncomeCardProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [showInfo, setShowInfo] = useState(false);
    const [showTableSheet, setShowTableSheet] = useState(false);

    return (
        <>
            <div 
                className="relative w-full p-4 sm:p-5 flex flex-col gap-3.5 select-none rounded-2xl overflow-hidden transition-all duration-200"
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
                {/* Top row: Large 3D icon on the left, Title & Big Number beside it on the right, and Rate Pill + Question Mark on Far Right */}
                <div className="flex items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        {/* Top-left Full Size 3D Icon (Matching DailyRoiCard scale) */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 relative flex items-center justify-center shrink-0 -my-1 -ml-1">
                            <Image 
                                src={isDark ? "/3d-icons/level-dark-v3.webp" : "/3d-icons/level-light-v2.webp"}
                                alt="Level Income"
                                width={96}
                                height={96}
                                className="w-full h-full object-contain"
                                priority
                            />
                        </div>

                        {/* Title and Number on right side beside icon */}
                        <div className="flex flex-col justify-center min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-100 leading-tight">
                                    Level Income
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowInfo(true);
                                    }}
                                    aria-label="Level Income Details"
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
                                ${pendingLevel.toFixed(6)}
                            </div>
                        </div>
                    </div>

                    {/* Right side rate pill & unlocked levels */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-xs text-[#0072ED] dark:text-[#FCD535] bg-[#F4F4F7] dark:bg-[#191d24] px-2.5 py-1 rounded-full font-medium shadow-xs">
                            +{levelRatePerDay.toFixed(2)} / day
                        </span>
                        <span className="text-xs text-[var(--text-soft)]">
                            {Math.min(directCount * 2, 40)} / 40 Unlocked
                        </span>
                    </div>
                </div>

                {/* Inner team business box */}
                <div className="relative z-10 text-xs text-[var(--text-soft)] flex justify-between bg-[#F8F9FB] dark:bg-[#191d24] border border-gray-100/80 dark:border-white/5 p-3 rounded-xl">
                    <span>Total Downline Team Business:</span>
                    <span className="font-medium text-[var(--text-main)]">${teamVolumeFloat.toFixed(2)}</span>
                </div>

                {/* View Level Matrix Button (Opens Level Matrix Sheet) */}
                <button
                    type="button"
                    onClick={() => setShowTableSheet(true)}
                    className="relative z-10 text-xs font-semibold flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#0072ED] hover:bg-[#0062cc] text-white dark:bg-[#FCD535] dark:hover:bg-[#f0b90b] dark:text-[#0b0e14] transition-all shadow-xs cursor-pointer"
                >
                    <span>View Level</span>
                </button>
            </div>

            {/* Level Matrix Table Floating Sheet */}
            <LevelMatrixSheet
                open={showTableSheet}
                onClose={() => setShowTableSheet(false)}
                levelRows={levelRows}
                directCount={directCount}
            />

            {/* Floating Information Sheet */}
            <IncomeInfoSheet
                open={showInfo}
                onClose={() => setShowInfo(false)}
                title="40-Level Matrix Income"
                typeLabel="Residual Income"
                iconSrc={isDark ? "/3d-icons/level-dark-v3.webp" : "/3d-icons/level-light-v2.webp"}
                iconPosition="center"
                description="Earn residual commissions from the daily returns generated across 40 downline team levels. Each direct partner you personally sponsor unlocks 2 deeper matrix levels."
                rateOrYield={`Daily Accrual: +$${levelRatePerDay.toFixed(2)} / day`}
                stats={[
                    { label: "Pending Matrix Earnings", value: `$${pendingLevel.toFixed(6)}`, isGold: true },
                    { label: "Unlocked Levels", value: `${Math.min(directCount * 2, 40)} / 40 Levels` },
                    { label: "Direct Partners", value: `${directCount} Directs` },
                    { label: "Total Team Volume", value: `$${teamVolumeFloat.toFixed(2)}` },
                ]}
            />
        </>
    );
}
