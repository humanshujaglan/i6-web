"use client";

import { useState } from "react";
import { useTheme } from "@/app/context/ThemeContext";
import { TrendUp, Flash, ArrowDown2, ArrowUp2, ArrowSwapHorizontal, Wallet3 } from "iconsax-react";
import MetalBorder from "../MetalBorder";

interface CompoundingTimerWidgetProps {
    secondsRemaining: number;
    hasActiveInvestments: boolean;
    countdownText: string;
    depositAmount?: number;
    pendingRWP?: number;
}

export default function CompoundingTimerWidget({
    secondsRemaining,
    hasActiveInvestments,
    countdownText,
    depositAmount = 0,
    pendingRWP = 0,
}: CompoundingTimerWidgetProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const totalSecs = Math.max(0, Math.floor(Number(secondsRemaining) || 0));
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const [showProjection, setShowProjection] = useState(true);
    const [projectionDays, setProjectionDays] = useState<120 | 180 | 240 | 360>(180);

    const basePrincipal = depositAmount > 0 ? depositAmount : 1000;
    const currentCompoundedPrincipal = depositAmount > 0 ? (depositAmount + Math.max(0, pendingRWP)) : 1000;

    const projectedCompoundedTotal = currentCompoundedPrincipal * Math.pow(1.005, projectionDays);
    const compoundGain = projectedCompoundedTotal - currentCompoundedPrincipal;
    const flatGain = basePrincipal * 0.005 * projectionDays;
    const extraCompoundedProfit = Math.max(0, compoundGain - flatGain);

    return (
        <div className="w-full flex flex-col items-center justify-center gap-2 py-2 select-none">
            {/* Title */}
            <span className="text-[16px] sm:text-sm font-medium text-[var(--text)]">
                Next Compounding
            </span>

            {/* Individual Countdown Boxes */}
            {hasActiveInvestments ? (
                <div className="flex items-center gap-2.5 sm:gap-3">
                    {/* Hours Box */}
                    <div className="flex flex-col items-center">
                        <div 
                            className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center"
                            style={{
                                filter: isDark 
                                    ? "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.4))" 
                                    : "drop-shadow(0 3px 12px rgba(12, 50, 99, 0.06))",
                            }}
                        >
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 56 56" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="timer-box-grad-h" x1="0%" y1="0%" x2="100%" y2="100%">
                                        {isDark ? (
                                            <>
                                                <stop offset="0%" stopColor="#14171d" stopOpacity="1" />
                                                <stop offset="100%" stopColor="#0a0c0f" stopOpacity="1" />
                                            </>
                                        ) : (
                                            <>
                                                <stop offset="7.83%" stopColor="#C9E0FF" stopOpacity="0.6" />
                                                <stop offset="79.83%" stopColor="#FFFFFF" stopOpacity="0.95" />
                                            </>
                                        )}
                                    </linearGradient>
                                    {isDark ? (
                                        <linearGradient id="timer-box-border-h" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
                                            <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.30" />
                                            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.08" />
                                            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
                                        </linearGradient>
                                    ) : (
                                        <linearGradient id="timer-box-border-h-light" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                                            <stop offset="100%" stopColor="#E2EDFC" stopOpacity="0.8" />
                                        </linearGradient>
                                    )}
                                </defs>
                                <rect 
                                    x="1" 
                                    y="1" 
                                    width="54" 
                                    height="54" 
                                    rx="12" 
                                    ry="12" 
                                    fill="url(#timer-box-grad-h)"
                                    stroke={isDark ? "url(#timer-box-border-h)" : "url(#timer-box-border-h-light)"}
                                    strokeWidth="1.5"
                                />
                            </svg>
                            <span className="relative z-10 text-base sm:text-lg font-bold font-mono text-gray-900 dark:text-white">
                                {hours.toString().padStart(2, "0")}
                            </span>
                        </div>
                        <span className="text-[10px] font-medium text-[var(--text-soft)] uppercase tracking-wider mt-1">HRS</span>
                    </div>

                    <span className="text-xl font-bold text-gray-400 dark:text-[#848e9c] -mt-5">:</span>

                    {/* Minutes Box */}
                    <div className="flex flex-col items-center">
                        <div 
                            className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center"
                            style={{
                                filter: isDark 
                                    ? "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.4))" 
                                    : "drop-shadow(0 3px 12px rgba(12, 50, 99, 0.06))",
                            }}
                        >
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 56 56" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="timer-box-grad-m" x1="0%" y1="0%" x2="100%" y2="100%">
                                        {isDark ? (
                                            <>
                                                <stop offset="0%" stopColor="#14171d" stopOpacity="1" />
                                                <stop offset="100%" stopColor="#0a0c0f" stopOpacity="1" />
                                            </>
                                        ) : (
                                            <>
                                                <stop offset="7.83%" stopColor="#C9E0FF" stopOpacity="0.6" />
                                                <stop offset="79.83%" stopColor="#FFFFFF" stopOpacity="0.95" />
                                            </>
                                        )}
                                    </linearGradient>
                                    {isDark ? (
                                        <linearGradient id="timer-box-border-m" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
                                            <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.30" />
                                            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.08" />
                                            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
                                        </linearGradient>
                                    ) : (
                                        <linearGradient id="timer-box-border-m-light" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                                            <stop offset="100%" stopColor="#E2EDFC" stopOpacity="0.8" />
                                        </linearGradient>
                                    )}
                                </defs>
                                <rect 
                                    x="1" 
                                    y="1" 
                                    width="54" 
                                    height="54" 
                                    rx="12" 
                                    ry="12" 
                                    fill="url(#timer-box-grad-m)"
                                    stroke={isDark ? "url(#timer-box-border-m)" : "url(#timer-box-border-m-light)"}
                                    strokeWidth="1.5"
                                />
                            </svg>
                            <span className="relative z-10 text-base sm:text-lg font-bold font-mono text-gray-900 dark:text-white">
                                {minutes.toString().padStart(2, "0")}
                            </span>
                        </div>
                        <span className="text-[10px] font-medium text-[var(--text-soft)] uppercase tracking-wider mt-1">MIN</span>
                    </div>

                    <span className="text-xl font-bold text-gray-400 dark:text-[#848e9c] -mt-5">:</span>

                    {/* Seconds Box */}
                    <div className="flex flex-col items-center">
                        <div 
                            className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center"
                            style={{
                                filter: isDark 
                                    ? "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.4))" 
                                    : "drop-shadow(0 3px 12px rgba(12, 50, 99, 0.06))",
                            }}
                        >
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 56 56" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="timer-box-grad-s" x1="0%" y1="0%" x2="100%" y2="100%">
                                        {isDark ? (
                                            <>
                                                <stop offset="0%" stopColor="#14171d" stopOpacity="1" />
                                                <stop offset="100%" stopColor="#0a0c0f" stopOpacity="1" />
                                            </>
                                        ) : (
                                            <>
                                                <stop offset="7.83%" stopColor="#C9E0FF" stopOpacity="0.6" />
                                                <stop offset="79.83%" stopColor="#FFFFFF" stopOpacity="0.95" />
                                            </>
                                        )}
                                    </linearGradient>
                                    {isDark ? (
                                        <linearGradient id="timer-box-border-s" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
                                            <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.30" />
                                            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.08" />
                                            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
                                        </linearGradient>
                                    ) : (
                                        <linearGradient id="timer-box-border-s-light" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                                            <stop offset="100%" stopColor="#E2EDFC" stopOpacity="0.8" />
                                        </linearGradient>
                                    )}
                                </defs>
                                <rect 
                                    x="1" 
                                    y="1" 
                                    width="54" 
                                    height="54" 
                                    rx="12" 
                                    ry="12" 
                                    fill="url(#timer-box-grad-s)"
                                    stroke={isDark ? "url(#timer-box-border-s)" : "url(#timer-box-border-s-light)"}
                                    strokeWidth="1.5"
                                />
                            </svg>
                            <span className="relative z-10 text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-[#FCD535]">
                                {seconds.toString().padStart(2, "0")}
                            </span>
                        </div>
                        <span className="text-[10px] font-medium text-[var(--text-soft)] uppercase tracking-wider mt-1">SEC</span>
                    </div>
                </div>
            ) : (
                <div className="text-xs text-[var(--text-soft)] font-medium bg-gray-100 dark:bg-[#14171d] px-4 py-2 rounded-xl">
                    {countdownText}
                </div>
            )}

            {/* Expandable Compounding Growth vs Flat ROI Projection */}
            <div className="w-full mt-1.5 flex flex-col items-center">
                <button
                    type="button"
                    onClick={() => setShowProjection(!showProjection)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#0072ED] dark:text-[#FCD535] bg-[#0072ED]/5 hover:bg-[#0072ED]/10 dark:bg-[#FCD535]/10 dark:hover:bg-[#FCD535]/15 transition-all cursor-pointer border border-[#0072ED]/20 dark:border-[#FCD535]/25"
                >
                    <TrendUp size={13} color="currentColor" variant="Bold" />
                    <span>Compounding Growth vs Flat ROI</span>
                    {showProjection ? <ArrowUp2 size={11} color="currentColor" /> : <ArrowDown2 size={11} color="currentColor" />}
                </button>

                {showProjection && (
                    <div 
                        className="w-full mt-2.5 p-3.5 sm:p-4 rounded-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
                        style={{
                            background: isDark
                                ? "linear-gradient(135deg, #14171d 0%, #0c0d12 100%)"
                                : "linear-gradient(135deg, rgba(201, 224, 255, 0.4) 0%, #FFFFFF 90%)",
                            border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1.5px solid #FFFFFF",
                            boxShadow: isDark
                                ? "0 4px 20px rgba(0, 0, 0, 0.4)"
                                : "0 3px 12px rgba(12, 50, 99, 0.06)",
                        }}
                    >
                        {/* Projection Timeframe Tabs */}
                        <div className="flex items-center justify-center gap-2 pb-1">
                            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-0.5 rounded-xl">
                                {([120, 180, 240, 360] as const).map((days) => (
                                    <button
                                        key={days}
                                        type="button"
                                        onClick={() => setProjectionDays(days)}
                                        className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                                            projectionDays === days
                                                ? "bg-white dark:bg-[#FCD535] text-gray-900 dark:text-[#0b0e14] shadow-xs"
                                                : "text-gray-500 dark:text-[#848e9c] hover:text-gray-900 dark:hover:text-white"
                                        }`}
                                    >
                                        {days}D
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Connected 2-Pill Exchange UI */}
                        <div className="relative z-10 w-full grid grid-cols-2 gap-2 sm:gap-3 items-center my-1">
                            {/* Left Pill: If Withdrawn Daily */}
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
                                        If Withdrawn Daily
                                    </span>
                                    <span className="text-xs sm:text-sm md:text-base font-semibold font-mono text-[#2B2B2B] dark:text-white truncate">
                                        +${flatGain.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Right Pill: If Compounded with Animated Metallic Border */}
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
                                            If Compounded
                                        </span>
                                        <span className="text-xs sm:text-sm md:text-base font-bold font-mono text-[#2B2B2B] dark:text-white truncate">
                                            +${compoundGain.toFixed(2)}
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

                        {/* Extra Benefit Callout */}
                        {extraCompoundedProfit > 0.01 && (
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between text-left">
                                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                    Extra Profit by Keeping Untouched:
                                </span>
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    +${extraCompoundedProfit.toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
