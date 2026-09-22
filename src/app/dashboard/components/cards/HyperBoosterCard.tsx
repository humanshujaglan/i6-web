"use client";

import { useState } from "react";
import { useTheme } from "@/app/context/ThemeContext";
import IncomeInfoSheet from "../sheets/IncomeInfoSheet";

interface HyperBoosterCardProps {
    boosterTimerText: string;
    boosterTimerColor?: string;
    directBoosterCount: number;
    isBoosted: boolean;
    boosterIncome: number;
    onReferClick: () => void;
}

export default function HyperBoosterCard({
    boosterTimerText,
    boosterTimerColor: propTimerColor,
    directBoosterCount,
    isBoosted,
    boosterIncome,
    onReferClick,
}: HyperBoosterCardProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [showInfo, setShowInfo] = useState(false);

    const isQualified = isBoosted || directBoosterCount >= 3;
    const isExpired = boosterTimerText.toLowerCase().includes("expired") || boosterTimerText.toLowerCase().includes("ended");
    
    // Dynamic timer color
    const boosterTimerColor = propTimerColor || (isQualified
        ? (isDark ? "#FCD535" : "#0072ED")
        : isExpired
        ? "#EF4444"
        : "#F59E0B");

    return (
        <>
            <div 
                className="relative w-full aspect-square flex flex-col justify-between select-none overflow-hidden rounded-[12px] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group cursor-pointer"
                style={{
                    filter: isDark 
                        ? "drop-shadow(0 5px 16px rgba(0, 0, 0, 0.42))" 
                        : "drop-shadow(0 3px 12px rgba(12, 50, 99, 0.06))",
                    transform: "translateZ(0)",
                    WebkitTransform: "translateZ(0)",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                }}
            >
                {/* SVG Background, Clipped Image & 3D Lighting Border */}
                <svg 
                    className="absolute inset-0 w-full h-full pointer-events-none z-0" 
                    viewBox="0 0 100 100" 
                    preserveAspectRatio="none"
                >
                    <defs>
                        <clipPath id="booster-card-clip">
                            <rect x="1" y="1" width="98" height="98" rx="12" ry="12" />
                        </clipPath>

                        {/* Lighting Direction: Booster (Top-to-Bottom 50%, 0% -> 50%, 100%) */}
                        <linearGradient id="booster-card-grad" x1="50%" y1="0%" x2="50%" y2="100%">
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

                        {isDark ? (
                            <linearGradient id="booster-card-border" x1="50%" y1="0%" x2="50%" y2="100%">
                                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
                                <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.18" />
                                <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.06" />
                                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
                            </linearGradient>
                        ) : (
                            <linearGradient id="booster-card-border-light" x1="50%" y1="0%" x2="50%" y2="100%">
                                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#E2EDFC" stopOpacity="0.4" />
                            </linearGradient>
                        )}
                    </defs>

                    {/* 1. Background Fill */}
                    <rect 
                        x="1" 
                        y="1" 
                        width="98" 
                        height="98" 
                        rx="12" 
                        ry="12" 
                        fill="url(#booster-card-grad)" 
                    />

                    {/* 2. 3D Image strictly clipped inside border curve */}
                    <g clipPath="url(#booster-card-clip)">
                        <image 
                            href={isDark ? "/3d-icons/booster.webp" : "/3d-icons/booster-light.webp"} 
                            x="54" 
                            y="0" 
                            width="46" 
                            height="46" 
                            preserveAspectRatio="xMaxYMin meet"
                        />
                    </g>

                    {/* 3. Softened Light-Catching Border Overlay on top */}
                    <rect 
                        x="1" 
                        y="1" 
                        width="98" 
                        height="98" 
                        rx="12" 
                        ry="12" 
                        fill="none"
                        stroke={isDark ? "url(#booster-card-border)" : "url(#booster-card-border-light)"}
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                    />
                </svg>

                {/* Top row: Timer badge top-left */}
                <div className="relative z-10 w-full p-2.5 sm:p-3 flex items-start justify-between shrink-0 h-12 sm:h-14">
                    <div className="flex items-center">
                        <span 
                            className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full bg-[#F4F4F7] dark:bg-[#191d24] shadow-xs whitespace-nowrap"
                            style={{ color: boosterTimerColor }}
                        >
                            {boosterTimerText}
                        </span>
                    </div>
                </div>

                {/* Middle: Title with Question Mark & Status / Booster Income Amount */}
                <div className="relative z-10 px-4 sm:px-5 flex flex-col justify-end flex-1 pb-2 sm:pb-3">
                    <div className="flex items-center gap-1.5">
                        <span className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-100 group-hover:text-[#0072ED] dark:group-hover:text-[#FCD535] transition-colors leading-tight">
                            Booster Income
                        </span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowInfo(true);
                            }}
                            aria-label="Hyper Booster Details"
                            className="text-gray-400 hover:text-gray-800 dark:text-gray-400 dark:hover:text-[#FCD535] transition-all hover:scale-110 active:scale-95 cursor-pointer shrink-0 p-0.5"
                        >
                            <svg width="17" height="17" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 14.667A6.667 6.667 0 108 1.333a6.667 6.667 0 000 13.334z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M6.15 6.15a2 2 0 013.7.75c0 1.25-1.85 1.75-1.85 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8 11.667h.007" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>
                    <div className={`text-2xl sm:text-3xl font-medium font-mono tracking-tight truncate mt-0.5 ${isQualified ? "text-gray-900 dark:text-white" : "text-amber-500 dark:text-[#FCD535]"}`}>
                        {isQualified ? `$${boosterIncome.toFixed(4)}` : `${directBoosterCount} / 3 Directs`}
                    </div>
                </div>

                {/* Bottom info strip: Refer Button with Fixed matching height */}
                <div className="relative z-10 w-full px-4 sm:px-5 pb-3.5 pt-1 h-11 sm:h-12 flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-soft)] truncate max-w-[55%]">
                        {isQualified ? "2X Boost Active" : `${Math.max(0, 3 - directBoosterCount)} Directs needed`}
                    </span>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onReferClick();
                        }}
                        className="px-4 py-1.5 rounded-xl bg-[#0072ED] hover:bg-[#0062cc] text-white dark:bg-[#FCD535] dark:hover:bg-[#f0b90b] dark:text-[#0b0e14] text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                        Refer
                    </button>
                </div>
            </div>

            {/* Floating Information Sheet */}
            <IncomeInfoSheet
                open={showInfo}
                onClose={() => setShowInfo(false)}
                title="Booster Income"
                typeLabel="Rate Multiplier"
                iconSrc={isDark ? "/3d-icons/booster.webp" : "/3d-icons/booster-light.webp"}
                iconPosition="top-right"
                description="Accelerate your daily earnings by introducing 3 direct partners within your first 21 days. Qualifying doubles your daily rate across all active deposit packages."
                rateOrYield={isQualified ? "Booster Status: Active (2X Boost)" : "Booster Status: In Progress"}
                stats={[
                    { label: "Booster Status", value: isQualified ? "Qualified (2X)" : "In Progress", isGold: true },
                    { label: "Direct Partners", value: `${directBoosterCount} / 3 Directs` },
                    { label: "Time Remaining", value: boosterTimerText },
                    { label: "Total Booster Earned", value: `$${boosterIncome.toFixed(4)}` },
                ]}
            />
        </>
    );
}
