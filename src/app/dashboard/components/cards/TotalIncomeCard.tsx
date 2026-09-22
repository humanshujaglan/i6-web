"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "@/app/context/ThemeContext";
import IncomeInfoSheet from "../sheets/IncomeInfoSheet";

interface TotalIncomeCardProps {
    totalIncome: number;
    totalAvailable: number;
    totalWithdrawn: number;
}

export default function TotalIncomeCard({
    totalIncome,
    totalAvailable,
    totalWithdrawn,
}: TotalIncomeCardProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [showInfo, setShowInfo] = useState(false);

    return (
        <>
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
                {/* Top-left stuck corner icon */}
                <div className="absolute top-0 left-0 w-20 h-20 sm:w-24 sm:h-24 pointer-events-none z-0 overflow-hidden rounded-tl-2xl">
                    <Image 
                        src={isDark ? "/3d-icons/wallet.webp" : "/3d-icons/wallet-light.webp"}
                        alt="Total Income"
                        width={96}
                        height={96}
                        className="w-full h-full object-contain object-left-top"
                        priority
                    />
                </div>

                {/* Top row spacer */}
                <div className="relative z-10 w-full flex items-start justify-end shrink-0 h-14 sm:h-16" />

                {/* Middle: Title with Info Button & Big Amount */}
                <div className="relative z-10 flex flex-col justify-end flex-1 pt-1 pb-1">
                    <div className="flex items-center gap-1.5">
                        <span className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-100 leading-tight">
                            Total Income
                        </span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowInfo(true);
                            }}
                            aria-label="Total Income Details"
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
                        ${totalIncome.toFixed(4)}
                    </div>
                </div>

                {/* Bottom strip */}
                <div className="relative z-10 w-full pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-soft)]">Total Withdrawn</span>
                    <span className="font-mono text-xs font-semibold text-[#FCD535]">
                        ${totalWithdrawn.toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Total Income Sheet */}
            <IncomeInfoSheet
                open={showInfo}
                onClose={() => setShowInfo(false)}
                title="Total Income Till Date"
                typeLabel="Cumulative Earnings"
                iconSrc={isDark ? "/3d-icons/wallet.webp" : "/3d-icons/wallet-light.webp"}
                description="The total cumulative income generated across all your revenue streams till date (Unwithdrawn balance available to withdraw + Total withdrawn to your wallet)."
                stats={[
                    { label: "Total Income Till Date", value: `$${totalIncome.toFixed(4)}`, isGold: true },
                    { label: "Available to Withdraw", value: `$${totalAvailable.toFixed(4)}` },
                    { label: "Total Withdrawn", value: `$${totalWithdrawn.toFixed(2)}` },
                ]}
            />
        </>
    );
}
