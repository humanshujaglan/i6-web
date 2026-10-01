"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import SwipeButton from "./SwipeButton";
import { useTheme } from "@/app/context/ThemeContext";

interface StickyActionCardProps {
    badge: {
        icon: string;
        label: string;
        title: string;
    };
    mode?: "approve" | "swipe";
    approveLabel?: string;
    onApprove?: () => void;
    swipeLabel: string;
    onSwipe: () => void;
    disabled?: boolean;
    loading?: boolean;
    disabledText?: string;
    loadingText?: string;
    hasErrorBorder?: boolean;
    bottomOffset?: string;
}

export default function StickyActionCard({
    badge,
    mode = "swipe",
    approveLabel = "Approve",
    onApprove,
    swipeLabel,
    onSwipe,
    disabled = false,
    loading = false,
    disabledText = "Enter an amount",
    loadingText,
    hasErrorBorder = false,
    bottomOffset,
}: StickyActionCardProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const isInactive = Boolean(disabled && !loading);
    const approveDisplayText = loading
        ? (loadingText || "Approving in Wallet...")
        : (isInactive ? disabledText : approveLabel);

    return (
        <div className={`fixed ${bottomOffset || "bottom-0"} left-0 right-0 z-40 flex justify-center pointer-events-none px-0`}>
            <div className="w-full max-w-lg mx-auto bg-white/95 dark:bg-[#14171d]/95 backdrop-blur-md rounded-t-[32px] rounded-b-none border-t border-x border-gray-100/90 dark:border-[#20252d] px-5 pt-4 pb-6 flex flex-col gap-3 shadow-[0_-10px_35px_rgba(12,50,99,0.08)] dark:shadow-[0_-10px_35px_rgba(0,0,0,0.65)] pointer-events-auto transition-colors duration-200">
                {/* Top Badge (Single Line) */}
                <div className="flex items-center gap-2 px-1">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0">
                        <Image 
                            src={badge.icon} 
                            alt={badge.title} 
                            width={32} 
                            height={32} 
                            className="w-full h-full object-contain" 
                        />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-gray-400 dark:text-[#848e9c] font-normal">
                            {badge.label}:
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                            {badge.title}
                        </span>
                    </div>
                </div>

                {/* Bottom CTA Button */}
                {mode === "approve" ? (
                    <div className="relative w-full">
                        <button
                            type="button"
                            onClick={onApprove}
                            disabled={isInactive || loading}
                            className={`relative flex items-center justify-center h-[54px] w-full rounded-full overflow-hidden select-none transition-all duration-300 ${
                                isInactive 
                                    ? (hasErrorBorder ? "cursor-not-allowed text-rose-500 dark:text-rose-400 font-medium" : "cursor-not-allowed text-gray-500 dark:text-[#848e9c] font-medium") 
                                    : isDark
                                        ? "text-[#0b0e14] font-medium cursor-pointer hover:brightness-105 active:scale-[0.99]"
                                        : "text-white font-medium cursor-pointer hover:brightness-105 active:scale-[0.99]"
                            }`}
                            style={
                                isInactive
                                    ? {
                                          background: isDark
                                              ? "linear-gradient(135deg, #1a1e27 0%, #12151b 100%)"
                                              : "linear-gradient(135deg, #E6EAF0 0%, #DBE0E8 100%)",
                                          border: hasErrorBorder
                                              ? "1.5px solid #EF4444"
                                              : (isDark
                                                  ? "1.5px solid rgba(255, 255, 255, 0.12)"
                                                  : "1.5px solid #FFFFFF"),
                                          boxShadow: hasErrorBorder
                                              ? (isDark ? "0 0 14px rgba(239, 68, 68, 0.35)" : "0 0 12px rgba(239, 68, 68, 0.25)")
                                              : (isDark
                                                  ? "inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 2px 8px rgba(0, 0, 0, 0.35)"
                                                  : "0 2px 8px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.6)"),
                                      }
                                    : {
                                          backgroundColor: loading ? (isDark ? "#0ecb81" : "#10B981") : (isDark ? "#FCD535" : "#0072ED"),
                                          border: hasErrorBorder ? "1.5px solid #EF4444" : undefined,
                                          boxShadow: hasErrorBorder
                                              ? (isDark ? "0 0 14px rgba(239, 68, 68, 0.35)" : "0 0 12px rgba(239, 68, 68, 0.25)")
                                              : (!isDark ? "inset 4px 6px 10.8px rgba(255, 255, 255, 0.4)" : "0 4px 14px rgba(252, 213, 53, 0.25)"),
                                      }
                            }
                        >
                            {/* Text with Shimmer / Sweep light effect */}
                            <motion.span 
                                className="text-sm sm:text-base tracking-tight relative z-10 text-center px-4"
                                style={
                                    !isInactive
                                        ? {
                                              backgroundImage: isDark
                                                  ? "linear-gradient(90deg, rgba(11, 14, 20, 0.35) 0%, rgba(11, 14, 20, 0.45) 30%, #000000 50%, rgba(11, 14, 20, 0.45) 70%, rgba(11, 14, 20, 0.35) 100%)"
                                                  : "linear-gradient(90deg, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0.45) 32%, #FFFFFF 50%, rgba(255, 255, 255, 0.45) 68%, rgba(255, 255, 255, 0.38) 100%)",
                                              backgroundSize: "220% 100%",
                                              WebkitBackgroundClip: "text",
                                              WebkitTextFillColor: "transparent",
                                          }
                                        : undefined
                                }
                                animate={
                                    !isInactive
                                        ? {
                                              backgroundPosition: ["100% 0", "-100% 0"],
                                          }
                                        : undefined
                                }
                                transition={
                                    !isInactive
                                        ? {
                                              duration: 2.2,
                                              repeat: Infinity,
                                              ease: "linear",
                                          }
                                        : undefined
                                }
                            >
                                {approveDisplayText}
                            </motion.span>
                        </button>
                    </div>
                ) : (
                    <SwipeButton
                        onSwipe={onSwipe}
                        label={swipeLabel}
                        disabled={disabled}
                        loading={loading}
                        disabledText={disabledText}
                        loadingText={loadingText}
                        hasErrorBorder={hasErrorBorder}
                    />
                )}
            </div>
        </div>
    );
}
