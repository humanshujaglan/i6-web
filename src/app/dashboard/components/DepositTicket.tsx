"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowDown2, ExportSquare } from "iconsax-react";
import { useTheme } from "@/app/context/ThemeContext";

interface DepositTicketProps {
    index: number;
    amount: number;
    compoundedPrincipal: number;
    rwpWithdrawn: number;
    availableRoi?: number;
    txHash?: string;
    displayRate: string;
    progressText: string;
    progressPerc: number;
    isActive: boolean;
    isCapped?: boolean;
    capMultiplier?: number;
}

export default function DepositTicket({
    index,
    amount,
    compoundedPrincipal,
    rwpWithdrawn,
    availableRoi,
    txHash,
    displayRate,
    progressText,
    progressPerc,
    isActive,
    isCapped,
    capMultiplier,
}: DepositTicketProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [expanded, setExpanded] = useState(false);
    const isCompleted = !isActive || progressPerc >= 100;
    const isPaused = Boolean(isCapped && !isCompleted);

    return (
        <div 
            className="group relative rounded-[20px] overflow-hidden transition-all duration-300 flex flex-col justify-between"
            style={{
                background: isDark
                    ? "linear-gradient(135deg, #14171d 0%, #0a0c0f 100%)"
                    : "linear-gradient(135deg, rgba(201, 224, 255, 0.65) 0%, #FFFFFF 85%)",
                border: isDark
                    ? "1px solid rgba(255, 255, 255, 0.12)"
                    : "1.5px solid #FFFFFF",
                boxShadow: isDark
                    ? "inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 6px 20px rgba(0, 0, 0, 0.45)"
                    : "0 3px 12px rgba(12, 50, 99, 0.06)",
            }}
        >
            {/* 3D Wallet Icon at exact top-left corner (matching DailyRoiCard) */}
            <div className="absolute top-0 left-0 w-24 h-24 pointer-events-none z-0 overflow-hidden">
                <img 
                    src={isDark ? "/3d-icons/wallet.webp" : "/3d-icons/wallet-light.webp"} 
                    alt="Wallet" 
                    className="w-20 h-20 object-contain -ml-2 -mt-2 opacity-95 transition-transform duration-300 group-hover:scale-105" 
                />
            </div>

            {/* Left & Right Semicircle Ticket Cutout Notches */}
            <div 
                className="absolute top-[82px] -left-[18px] w-[36px] h-[36px] rounded-full bg-[#F4F4F7] dark:bg-[#0b0e14] z-20 pointer-events-none transition-colors"
                style={{
                    boxShadow: !isDark ? "inset -2px 0 4px rgba(12, 50, 99, 0.05)" : "inset -2px 0 6px rgba(0, 0, 0, 0.5)",
                }}
            />
            <div 
                className="absolute top-[82px] -right-[18px] w-[36px] h-[36px] rounded-full bg-[#F4F4F7] dark:bg-[#0b0e14] z-20 pointer-events-none transition-colors"
                style={{
                    boxShadow: !isDark ? "inset 2px 0 4px rgba(12, 50, 99, 0.05)" : "inset 2px 0 6px rgba(0, 0, 0, 0.5)",
                }}
            />

            {/* Top Section: Amount + Status Pill (Offset to the right of top-left wallet) */}
            <div className="pt-4.5 px-5 pb-3 flex items-start justify-between relative z-10">
                <div className="flex flex-col pl-16 sm:pl-18">
                    <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight font-mono">
                        ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-[#848e9c] font-normal">
                        Deposit Package #{index + 1}
                    </span>
                </div>

                {/* Status Capsule Badge */}
                <div>
                    {isCompleted ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-200/70 dark:bg-white/10 text-gray-500 dark:text-[#848e9c]">
                            Completed
                        </span>
                    ) : isPaused ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-[#FCD535]">
                            Paused {capMultiplier ? `(${capMultiplier}x)` : "(Capped)"}
                        </span>
                    ) : (
                        <span 
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border"
                            style={{
                                background: isDark ? "rgba(14, 203, 129, 0.15)" : "rgba(16, 185, 129, 0.12)",
                                borderColor: isDark ? "rgba(14, 203, 129, 0.3)" : "rgba(16, 185, 129, 0.25)",
                                color: isDark ? "#0ecb81" : "#10B981",
                            }}
                        >
                            Active
                        </span>
                    )}
                </div>
            </div>

            {/* Middle Section: Daily ROI Yield */}
            <div className="px-5 py-2.5 flex items-center justify-between relative z-10">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        Daily ROI
                    </span>
                    <span className="text-xs text-gray-400 dark:text-[#848e9c] font-normal">
                        Earning Rate
                    </span>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-emerald-600 dark:text-[#FCD535] font-mono">
                        {displayRate}% Daily
                    </span>
                    <span className="text-xs text-gray-400 dark:text-[#848e9c] font-normal">
                        Current Yield
                    </span>
                </div>
            </div>

            {/* Expandable Details Drawer */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 py-3.5 bg-black/5 dark:bg-[#07090c]/80 border-t border-dashed border-gray-200 dark:border-white/10 flex flex-col gap-2.5 text-xs text-gray-600 dark:text-gray-300 relative z-10"
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 dark:text-[#848e9c]">Total ROI Earned:</span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">{progressText}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-gray-200/80 dark:bg-white/10 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                    isCompleted ? "bg-gray-400" : isPaused ? "bg-amber-500" : (isDark ? "bg-[#FCD535]" : "bg-[#0072ED]")
                                }`}
                                style={{ width: `${progressPerc}%` }}
                            />
                        </div>

                        <div className="flex justify-between text-[11px] text-gray-400 dark:text-[#848e9c]">
                            <span>Progress: <strong className="text-gray-700 dark:text-gray-300 font-mono">{progressPerc.toFixed(2)}%</strong></span>
                            <span>Max Yield (2.5x): <strong className="text-gray-700 dark:text-gray-300 font-mono">${(amount * 2.5).toFixed(2)}</strong></span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200/60 dark:border-white/5 text-[11px]">
                            <div>
                                <span className="text-gray-400 dark:text-[#848e9c]">Principal: </span>
                                <strong className="text-gray-800 dark:text-white font-mono">${amount.toFixed(2)}</strong>
                            </div>
                            <div className="text-right">
                                <span className="text-gray-400 dark:text-[#848e9c]">Available ROI: </span>
                                <strong className="text-emerald-600 dark:text-[#FCD535] font-mono">${(availableRoi ?? Math.max(0, compoundedPrincipal - amount)).toFixed(4)}</strong>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                                <span className="text-gray-400 dark:text-[#848e9c]">Withdrawn ROI: </span>
                                <strong className="text-gray-800 dark:text-white font-mono">${rwpWithdrawn.toFixed(2)}</strong>
                            </div>
                            <div className="text-right">
                                <span className="text-gray-400 dark:text-[#848e9c]">Compounded Balance: </span>
                                <strong className="text-gray-800 dark:text-white font-mono">${compoundedPrincipal.toFixed(2)}</strong>
                            </div>
                        </div>

                        {compoundedPrincipal > amount && (
                            <div className="flex items-center justify-between p-2 rounded-xl bg-orange-500/10 border border-orange-500/15 text-[11px]">
                                <span className="text-orange-600 dark:text-amber-400 font-medium">🔥 Compounding Boost</span>
                                <span className="font-mono font-semibold text-orange-600 dark:text-amber-400">
                                    +${((compoundedPrincipal - amount) * 0.005).toFixed(3)}/day extra on profit
                                </span>
                            </div>
                        )}

                        {txHash && (
                            <div className="flex justify-between items-center pt-1 border-t border-gray-200/60 dark:border-white/5 text-[11px]">
                                <span className="text-gray-400 dark:text-[#848e9c]">Transaction:</span>
                                <a 
                                    href={`https://bscscan.com/tx/${txHash}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[#0072ED] dark:text-[#FCD535] hover:underline font-mono inline-flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span>{txHash.slice(0, 6)}...{txHash.slice(-4)}</span>
                                    <ExportSquare size={12} color="currentColor" />
                                </a>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Footer Section with Action Button */}
            <div 
                className="px-5 py-3 flex items-center justify-between cursor-pointer border-t border-gray-100/60 dark:border-white/5 relative z-10"
                style={{
                    background: isDark
                        ? "linear-gradient(180deg, rgba(20, 23, 29, 0) 0%, rgba(10, 12, 15, 0.95) 100%)"
                        : "linear-gradient(180deg, rgba(233, 247, 255, 0) 0%, rgba(201, 224, 255, 0.4) 100%)",
                }}
                onClick={() => setExpanded(!expanded)}
            >
                <button
                    type="button"
                    className={`text-xs font-semibold transition-colors cursor-pointer ${
                        isDark ? "text-[#FCD535] hover:brightness-110" : "text-[#0072ED] hover:text-[#005bb5]"
                    }`}
                >
                    {expanded ? "Hide Details" : "View Details"}
                </button>

                <button
                    type="button"
                    className={`w-7 h-7 rounded-full flex items-center justify-center shadow-xs transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer ${
                        isDark ? "bg-[#FCD535] text-[#1e2329]" : "bg-[#0072ED] text-white"
                    }`}
                    title={expanded ? "Collapse details" : "Expand details"}
                >
                    {expanded ? (
                        <ArrowDown2 size={13} color="currentColor" className="rotate-180 transition-transform" />
                    ) : (
                        <ArrowRight size={13} color="currentColor" />
                    )}
                </button>
            </div>
        </div>
    );
}
