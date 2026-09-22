"use client";

import Image from "next/image";
import { useTheme } from "@/app/context/ThemeContext";

export interface SubTabItem {
    id: string;
    label: string;
    iconSrc: string;
}

interface IncomeSubTabsProps {
    tabs: SubTabItem[];
    activeTab: string;
    onChange: (id: any) => void;
    gradientPrefix?: string;
}

const SUB_TAB_LIGHTING: Record<string, { x1: string; y1: string; x2: string; y2: string; shadowDark: string }> = {
    total: { x1: "0%", y1: "0%", x2: "100%", y2: "100%", shadowDark: "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.4))" },
    rwp: { x1: "100%", y1: "0%", x2: "0%", y2: "100%", shadowDark: "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.4))" },
    booster: { x1: "50%", y1: "0%", x2: "50%", y2: "100%", shadowDark: "drop-shadow(0 5px 16px rgba(0, 0, 0, 0.42))" },
    direct: { x1: "0%", y1: "30%", x2: "100%", y2: "70%", shadowDark: "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.4))" },
    level: { x1: "20%", y1: "0%", x2: "80%", y2: "100%", shadowDark: "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.4))" },
    upline: { x1: "80%", y1: "0%", x2: "20%", y2: "100%", shadowDark: "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.4))" },
    rank: { x1: "0%", y1: "50%", x2: "100%", y2: "50%", shadowDark: "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.4))" },
};

export default function IncomeSubTabs({
    tabs,
    activeTab,
    onChange,
    gradientPrefix = "subtab",
}: IncomeSubTabsProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] overflow-x-auto no-scrollbar scroll-smooth pt-0 pb-1">
            <div className="flex items-center gap-2.5 min-w-max">
                {tabs.map((tab) => {
                    const isSelected = activeTab === tab.id;
                    const lighting = SUB_TAB_LIGHTING[tab.id] || { x1: "0%", y1: "0%", x2: "100%", y2: "100%", shadowDark: "drop-shadow(0 3px 12px rgba(0, 0, 0, 0.3))" };
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onChange(tab.id)}
                            className={`relative w-[84px] sm:w-[88px] h-[68px] p-1.5 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 cursor-pointer select-none shrink-0 ${
                                isSelected ? "scale-[1.02]" : "hover:scale-[1.01]"
                            }`}
                            style={{
                                filter: isSelected 
                                    ? (isDark ? "drop-shadow(0 4px 14px rgba(252, 213, 53, 0.22))" : "drop-shadow(0 4px 14px rgba(0, 114, 237, 0.18))")
                                    : (isDark ? lighting.shadowDark : "drop-shadow(0 3px 12px rgba(12, 50, 99, 0.06))"),
                                transform: "translateZ(0)",
                                WebkitTransform: "translateZ(0)",
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                willChange: "transform",
                            }}
                        >
                            {/* Pure Superellipse / Squircle Vector Background & Continuous Border */}
                            <svg 
                                className="absolute inset-0 w-full h-full pointer-events-none" 
                                viewBox="0 0 88 68" 
                                preserveAspectRatio="none"
                            >
                                <defs>
                                    <linearGradient id={`squircle-grad-${gradientPrefix}-${tab.id}`} x1={lighting.x1} y1={lighting.y1} x2={lighting.x2} y2={lighting.y2}>
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

                                    {/* 3D Reflective Light-Catch Specular Border (Dark Mode) */}
                                    {isDark && (
                                        <linearGradient id={`squircle-border-${gradientPrefix}-${tab.id}`} x1={lighting.x1} y1={lighting.y1} x2={lighting.x2} y2={lighting.y2}>
                                            {isSelected ? (
                                                <>
                                                    <stop offset="0%" stopColor="#FFF280" stopOpacity="1" />
                                                    <stop offset="60%" stopColor="#FCD535" stopOpacity="0.9" />
                                                    <stop offset="100%" stopColor="#D89E00" stopOpacity="0.8" />
                                                </>
                                            ) : (
                                                <>
                                                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
                                                    <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.30" />
                                                    <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.08" />
                                                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
                                                </>
                                            )}
                                        </linearGradient>
                                    )}
                                </defs>
                                <path 
                                    d="M 22, 1.2 L 66, 1.2 C 79, 1.2 86.8, 9 86.8, 22 L 86.8, 46 C 86.8, 59 79, 66.8 66, 66.8 L 22, 66.8 C 9, 66.8 1.2, 59 1.2, 46 L 1.2, 22 C 1.2, 9 9, 1.2 22, 1.2 Z" 
                                    fill={isSelected ? (isDark ? "#242930" : `url(#squircle-grad-${gradientPrefix}-${tab.id})`) : `url(#squircle-grad-${gradientPrefix}-${tab.id})`}
                                    stroke={isDark ? `url(#squircle-border-${gradientPrefix}-${tab.id})` : (isSelected ? "#0072ED" : "#FFFFFF")}
                                    strokeWidth={isSelected ? "2.2" : "1.8"}
                                    strokeLinejoin="round"
                                />
                            </svg>

                            {/* Top-Right Checkmark Badge */}
                            {isSelected && (
                                <div 
                                    className={`absolute top-0 right-0 w-[20px] h-[20px] rounded-tr-[14px] rounded-bl-[10px] flex items-center justify-center pointer-events-none z-10 ${
                                        isDark ? "bg-[#FCD535]" : "bg-[#0072ED]"
                                    }`}
                                >
                                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1.5 4L3.8 6.3L8.5 1.5" stroke={isDark ? "#1e2329" : "#FFFFFF"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            )}

                            <div className="w-9 h-9 flex items-center justify-center shrink-0 relative z-10">
                                <Image 
                                    src={tab.iconSrc} 
                                    alt={tab.label}
                                    width={36}
                                    height={36}
                                    className={`object-contain transition-transform duration-200 ${isSelected ? "scale-105" : "opacity-90"}`}
                                />
                            </div>
                            <span className={`text-xs sm:text-[13px] leading-tight transition-colors relative z-10 font-medium ${
                                isSelected 
                                    ? (isDark ? "text-[#FCD535]" : "text-black")
                                    : (isDark ? "text-gray-300" : "text-gray-700")
                            }`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
