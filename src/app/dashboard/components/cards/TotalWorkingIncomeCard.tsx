"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "@/app/context/ThemeContext";
import IncomeInfoSheet from "../sheets/IncomeInfoSheet";

interface TotalWorkingIncomeCardProps {
    totalWorkingAvailable: number;
    directBonus: number;
    pendingLevel: number;
    floatSalary: number;
    pendingUpline: number;
}

export default function TotalWorkingIncomeCard({
    totalWorkingAvailable,
    directBonus,
    pendingLevel,
    floatSalary,
    pendingUpline,
}: TotalWorkingIncomeCardProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [showInfo, setShowInfo] = useState(false);

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
                {/* Top row: Large 3D icon on the left, Title & Big Number beside it on the right */}
                <div className="flex items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        {/* Top-left Full Size 3D Icon (Matching other cards) */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 relative flex items-center justify-center shrink-0 -my-1 -ml-1">
                            <Image 
                                src={isDark ? "/3d-icons/wallet.webp" : "/3d-icons/wallet-light.webp"}
                                alt="Total Working Income"
                                width={96}
                                height={96}
                                className="w-full h-full object-contain"
                                priority
                            />
                        </div>

                        {/* Title and Amount beside icon */}
                        <div className="flex flex-col justify-center min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-100 leading-tight">
                                    Total Working Income
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowInfo(true);
                                    }}
                                    aria-label="Total Working Income Details"
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
                                ${totalWorkingAvailable.toFixed(6)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-[var(--text-soft)]">
                    <span className="bg-[#F8F9FB] dark:bg-[#191d24] border border-gray-100/80 dark:border-white/5 px-2.5 py-1 rounded-xl">Direct: ${directBonus.toFixed(2)}</span>
                    <span className="bg-[#F8F9FB] dark:bg-[#191d24] border border-gray-100/80 dark:border-white/5 px-2.5 py-1 rounded-xl font-mono">Level: ${pendingLevel.toFixed(4)}</span>
                    <span className="bg-[#F8F9FB] dark:bg-[#191d24] border border-gray-100/80 dark:border-white/5 px-2.5 py-1 rounded-xl font-mono">Rank: ${floatSalary.toFixed(4)}</span>
                    <span className="bg-[#F8F9FB] dark:bg-[#191d24] border border-gray-100/80 dark:border-white/5 px-2.5 py-1 rounded-xl font-mono">Upline: ${pendingUpline.toFixed(4)}</span>
                </div>
            </div>

            {/* Floating Information Sheet */}
            <IncomeInfoSheet
                open={showInfo}
                onClose={() => setShowInfo(false)}
                title="Total Working Income"
                typeLabel="Team Earnings"
                iconSrc={isDark ? "/3d-icons/wallet.webp" : "/3d-icons/wallet-light.webp"}
                description="Your combined earnings from all affiliate and team bonuses: Direct Bonus (5%), 40-Level Matrix, Upline Share, and Monthly Leadership Salary."
                rateOrYield={`Total Available: $${totalWorkingAvailable.toFixed(6)}`}
                stats={[
                    { label: "Direct Bonus", value: `$${directBonus.toFixed(2)}` },
                    { label: "Level Matrix", value: `$${pendingLevel.toFixed(4)}` },
                    { label: "Rank Salary", value: `$${floatSalary.toFixed(4)}` },
                    { label: "Upline Share", value: `$${pendingUpline.toFixed(4)}` },
                ]}
            />
        </>
    );
}
