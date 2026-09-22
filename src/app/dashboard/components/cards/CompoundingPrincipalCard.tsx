"use client";

import Image from "next/image";
import { TrendUp, Flash, ArrowSwapHorizontal, Wallet3 } from "iconsax-react";
import { useTheme } from "@/app/context/ThemeContext";
import MetalBorder from "../MetalBorder";

interface CompoundingPrincipalCardProps {
    depositAmount: number;
    profitAmount: number;
    dailyRate?: number; // e.g. 5 for 0.5%
    streakDays?: number;
    onViewStreak?: () => void;
    onLearnMore?: () => void;
}

export default function CompoundingPrincipalCard({
    depositAmount,
    profitAmount,
    dailyRate = 5,
    streakDays,
    onViewStreak,
    onLearnMore,
}: CompoundingPrincipalCardProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const newPrincipal = Math.max(0, depositAmount + profitAmount);
    const ratePercentage = dailyRate / 10; // 5 -> 0.5%
    const dailyEarningOnPrincipal = (newPrincipal * ratePercentage) / 100;
    const baseDailyEarning = (depositAmount * ratePercentage) / 100;
    const extraDailyGain = Math.max(0, dailyEarningOnPrincipal - baseDailyEarning);

    return (
        <div
            className="relative w-full overflow-hidden p-4 sm:p-5 flex flex-col gap-3.5 select-none rounded-2xl transition-all duration-200"
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
            {/* Top-left stuck corner 3D icon */}
            <div className="absolute top-0 left-0 w-20 h-20 sm:w-24 sm:h-24 pointer-events-none z-0 overflow-hidden rounded-tl-2xl">
                <Image
                    src={isDark ? "/3d-icons/package-dark-v4.webp" : "/3d-icons/package-light-v4.webp"}
                    alt="New Principal"
                    width={96}
                    height={96}
                    className="w-full h-full object-contain object-left-top"
                    priority
                />
            </div>

            {/* Header: Title, Badge, Info */}
            <div className="flex items-center justify-between gap-2 relative z-10 pl-16 sm:pl-20 min-h-[40px]">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-[14px] sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                        New Principal
                    </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {streakDays !== undefined && streakDays > 0 && (
                        <button
                            type="button"
                            onClick={onViewStreak}
                            className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-amber-400 text-xs font-semibold cursor-pointer border border-orange-500/20 transition-all hover:scale-105 active:scale-95"
                            title="View Compounding Streak"
                        >
                            <span>🔥</span>
                            <span>{streakDays} day Compounded</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Figma UI: Connected 2-Pill Exchange Layout */}
            <div className="relative z-10 w-full grid grid-cols-2 gap-2 sm:gap-3 items-center">
                {/* Left Pill: Initial Deposit */}
                <div
                    className="w-full min-w-0 flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-[37px] border transition-all h-[56px]"
                    style={{
                        background: isDark ? "#191d24" : "#F4F4F7",
                        borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
                    }}
                >
                    <div className="text-gray-600 dark:text-[#848e9c] shrink-0">
                        <Wallet3 size={18} color="currentColor" />
                    </div>

                    {/* Vertical Divider Line */}
                    <div className="h-6 w-[1px] bg-black/10 dark:bg-white/10 shrink-0" />

                    <div className="flex flex-col min-w-0 truncate">
                        <span className="text-[10px] sm:text-[11px] font-medium text-[#2B2B2B] dark:text-[#ffffff] truncate tracking-tight">
                            Initial Deposit
                        </span>
                        <span className="text-xs sm:text-sm md:text-base font-semibold font-mono text-[#2B2B2B] dark:text-white truncate">
                            ${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* Right Pill: New Principal with Animated Metallic Border */}
                <MetalBorder
                    preset="chromatic"
                    className="w-full min-w-0 h-[56px]"
                    borderRadius={37}
                >
                    <div className="w-full h-full flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-[37px]">
                        <div className="text-[#0072ED] dark:text-[#FCD535] shrink-0">
                            <TrendUp size={18} color="currentColor" variant="Bold" />
                        </div>

                        {/* Vertical Divider Line */}
                        <div className="h-6 w-[1px] bg-black/10 dark:bg-white/10 shrink-0" />

                        <div className="flex flex-col min-w-0 truncate">
                            <span className="text-[10px] sm:text-[11px] font-semibold text-[#0072ED] dark:text-[#FCD535] truncate tracking-tight">
                                New Principal
                            </span>
                            <span className="text-xs sm:text-sm md:text-base font-bold font-mono text-[#2B2B2B] dark:text-white truncate">
                                ${newPrincipal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </MetalBorder>

                {/* Center Floating Circular Exchange Badge */}
                <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-md pointer-events-none"
                    style={{
                        background: isDark ? "#232833" : "#DEEFFF",
                        border: isDark ? "3.5px solid #14171d" : "3.5px solid #FFFFFF",
                        color: isDark ? "#FCD535" : "#0072ED",
                    }}
                >
                    <ArrowSwapHorizontal size={14} color="currentColor" />
                </div>
            </div>

            {/* Bottom Yield & Compound Stats Strip */}
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-1.5 pt-0.5 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-[#FCD535] font-medium">
                    <span>ROI with compounding: +${dailyEarningOnPrincipal.toFixed(2)}/day</span>
                    {extraDailyGain > 0.01 && (
                        <span className="text-[11px] text-gray-500 dark:text-[#848e9c]">
                            (+${extraDailyGain.toFixed(2)}/day from compound)
                        </span>
                    )}
                </div>

                {profitAmount > 0.01 && (
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                        +${profitAmount.toFixed(2)} profit added
                    </span>
                )}
            </div>
        </div>
    );
}
