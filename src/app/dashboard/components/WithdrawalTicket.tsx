"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowDown2, TickCircle, Copy, ExportSquare, TrendUp, People, Hierarchy, Cup, Award } from "iconsax-react";
import { useTheme } from "@/app/context/ThemeContext";

export interface WithdrawalTicketLiveData {
    pendingRWP: number;
    roiStatusClass: string;
    roiRemainingText: string;
    directBonus: number;
    pendingLevel: number;
    levelStatusClass: string;
    levelStatusText: string;
    pendingUpline: number;
    floatSalary: number;
    salaryStatusClass: string;
    salaryStatusText: string;
}

interface WithdrawalTicketProps {
    txHash: string;
    usdtAmountFloat: number;
    tokenAmountFloat: number;
    dateStr: string;
    liveData: WithdrawalTicketLiveData | null;
}

export default function WithdrawalTicket({
    txHash,
    usdtAmountFloat,
    tokenAmountFloat,
    dateStr,
    liveData,
}: WithdrawalTicketProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(txHash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className="relative rounded-[20px] overflow-hidden transition-all duration-300 flex flex-col justify-between"
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
            {/* Left & Right Semicircle Ticket Cutout Notches */}
            <div
                className="absolute top-[82px] -left-[18px] w-[36px] h-[36px] rounded-full bg-[#F4F4F7] dark:bg-[#0b0e14] z-20 pointer-events-none transition-colors"
                style={{ boxShadow: !isDark ? "inset -2px 0 4px rgba(12, 50, 99, 0.05)" : "inset -2px 0 6px rgba(0, 0, 0, 0.5)" }}
            />
            <div
                className="absolute top-[82px] -right-[18px] w-[36px] h-[36px] rounded-full bg-[#F4F4F7] dark:bg-[#0b0e14] z-20 pointer-events-none transition-colors"
                style={{ boxShadow: !isDark ? "inset 2px 0 4px rgba(12, 50, 99, 0.05)" : "inset 2px 0 6px rgba(0, 0, 0, 0.5)" }}
            />

            {/* Top Section: Icon + Amount + Status Pill */}
            <div className="pt-4 px-5 pb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-[#0ecb81] flex items-center justify-center shrink-0">
                        <TickCircle size={22} color="currentColor" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight font-mono">
                            ${usdtAmountFloat.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-[#848e9c] font-normal">
                            Withdrawal
                        </span>
                    </div>
                </div>

                <span 
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border"
                    style={{
                        background: isDark ? "rgba(14, 203, 129, 0.15)" : "rgba(16, 185, 129, 0.12)",
                        borderColor: isDark ? "rgba(14, 203, 129, 0.3)" : "rgba(16, 185, 129, 0.25)",
                        color: isDark ? "#0ecb81" : "#10B981",
                    }}
                >
                    Completed
                </span>
            </div>

            {/* Middle Section: Date & i6 Delivered */}
            <div className="px-5 py-2.5 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {dateStr}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-[#848e9c] font-normal">
                        Payout Date
                    </span>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-emerald-600 dark:text-[#FCD535] font-mono">
                        {tokenAmountFloat.toFixed(4)} i6
                    </span>
                    <span className="text-xs text-gray-400 dark:text-[#848e9c] font-normal">
                        Delivered
                    </span>
                </div>
            </div>

            {/* Expandable Income Breakdown Drawer */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 py-3.5 bg-black/5 dark:bg-[#07090c]/80 border-t border-dashed border-gray-200/90 dark:border-white/10 flex flex-col gap-2.5 text-xs text-gray-600 dark:text-gray-300"
                    >
                        <div className="flex flex-col gap-0.5 pb-1">
                            <span className="text-[11px] font-semibold text-gray-500 dark:text-[#848e9c] uppercase tracking-wide">
                                Income Breakdown
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                {liveData
                                    ? "Snapshot captured at the moment of this withdrawal."
                                    : "No breakdown snapshot recorded for this payout."}
                            </span>
                        </div>

                        {liveData && (
                        <>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-gray-500 dark:text-[#848e9c]">
                                <TrendUp size={14} color={isDark ? "#FCD535" : "#0072ED"} />
                                <span>Daily ROI</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${liveData.roiStatusClass}`}>
                                    {liveData.roiRemainingText}
                                </span>
                                <strong className="font-mono text-gray-900 dark:text-white font-medium">
                                    ${liveData.pendingRWP.toFixed(6)}
                                </strong>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-gray-500 dark:text-[#848e9c]">
                                <People size={14} color="#10B981" />
                                <span>Direct Referral</span>
                            </div>
                            <strong className="font-mono text-gray-900 dark:text-white font-medium">
                                ${liveData.directBonus.toFixed(6)}
                            </strong>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-gray-500 dark:text-[#848e9c]">
                                <Hierarchy size={14} color={isDark ? "#FCD535" : "#0072ED"} />
                                <span>Level Income</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${liveData.levelStatusClass}`}>
                                    {liveData.levelStatusText}
                                </span>
                                <strong className="font-mono text-gray-900 dark:text-white font-medium">
                                    ${liveData.pendingLevel.toFixed(6)}
                                </strong>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-gray-500 dark:text-[#848e9c]">
                                <Cup size={14} color="#F59E0B" />
                                <span>Upline Sponsor</span>
                            </div>
                            <strong className="font-mono text-gray-900 dark:text-white font-medium">
                                ${liveData.pendingUpline.toFixed(6)}
                            </strong>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-gray-500 dark:text-[#848e9c]">
                                <Award size={14} color="#9333EA" />
                                <span>Salary Income</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${liveData.salaryStatusClass}`}>
                                    {liveData.salaryStatusText}
                                </span>
                                <strong className="font-mono text-gray-900 dark:text-white font-medium">
                                    ${liveData.floatSalary.toFixed(6)}
                                </strong>
                            </div>
                        </div>
                        </>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-[#848e9c] pt-1.5 border-t border-gray-200/60 dark:border-white/5 font-mono">
                            <div className="flex items-center gap-1">
                                <span>Tx: {txHash.slice(0, 8)}...{txHash.slice(-6)}</span>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="text-gray-400 dark:text-[#848e9c] hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                                    title="Copy transaction hash"
                                >
                                    {copied ? <TickCircle size={12} color="#10B981" /> : <Copy size={12} color="currentColor" />}
                                </button>
                            </div>
                            <a
                                href={`https://bscscan.com/tx/${txHash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#0072ED] dark:text-[#FCD535] hover:underline flex items-center gap-1 font-medium"
                            >
                                <span>Explorer</span>
                                <ExportSquare size={12} color="currentColor" />
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Footer Section with Action Button */}
            <div
                className="px-5 py-3 flex items-center justify-between cursor-pointer border-t border-gray-100/60 dark:border-white/5"
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
                    {expanded ? "Hide Details" : "View Income Breakdown"}
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
