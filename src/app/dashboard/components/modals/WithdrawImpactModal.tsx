"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Warning2, Flash, CloseCircle, ArrowRight } from "iconsax-react";
import { useTheme } from "@/app/context/ThemeContext";

interface WithdrawImpactModalProps {
    isOpen: boolean;
    depositAmount: number;
    profitAmount: number;
    streakDays: number;
    onCancel: () => void; // Keep compounding
    onConfirm: () => void; // Proceed to withdraw
}

export default function WithdrawImpactModal({
    isOpen,
    depositAmount,
    profitAmount,
    streakDays,
    onCancel,
    onConfirm,
}: WithdrawImpactModalProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    if (!isOpen) return null;

    const currentPrincipal = depositAmount + profitAmount;
    const resetPrincipal = depositAmount;

    // Estimated 30-day compound growth if left untouched vs withdrawn
    // Compound: P * (1.005^30 - 1)
    // Flat: D * 0.005 * 30
    const compound30Days = currentPrincipal * (Math.pow(1.005, 30) - 1);
    const flat30Days = resetPrincipal * 0.005 * 30;
    const missedGains30d = Math.max(0, compound30Days - flat30Days);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 select-none">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 15 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className="relative w-full max-w-sm p-6 sm:p-7 rounded-[32px] flex flex-col items-center text-center gap-3.5 overflow-hidden"
                    style={{
                        background: isDark
                            ? "linear-gradient(135deg, #181512 0%, #0c0d12 100%)"
                            : "linear-gradient(135deg, #FFFDF9 0%, #FFFFFF 90%)",
                        border: isDark
                            ? "1.5px solid rgba(245, 158, 11, 0.3)"
                            : "1.5px solid rgba(245, 158, 11, 0.35)",
                        boxShadow: isDark
                            ? "0 20px 50px rgba(0, 0, 0, 0.85), 0 0 35px rgba(245, 158, 11, 0.12)"
                            : "0 16px 45px rgba(245, 158, 11, 0.15)",
                    }}
                >
                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={onCancel}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer p-1 rounded-full z-20"
                        title="Close"
                    >
                        <CloseCircle size={20} color="currentColor" />
                    </button>

                    {/* Warning Icon Badge */}
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-500 shadow-sm mt-1">
                        <Warning2 size={28} color="currentColor" variant="Bold" />
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                            Compound Reset Warning
                        </h3>
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                            Withdrawing resets your compounding base
                        </span>
                    </div>

                    {/* Impact Comparison Box */}
                    <div className="w-full p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col gap-2 text-left">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-[#848e9c]">Current Principal (Deposit + Profit):</span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">
                                ${currentPrincipal.toFixed(2)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-black/5 dark:border-white/5">
                            <span className="text-gray-500 dark:text-[#848e9c]">Reset Principal after Withdraw:</span>
                            <span className="font-mono font-bold text-rose-500 dark:text-rose-400 flex items-center gap-1">
                                <span>${resetPrincipal.toFixed(2)}</span>
                                <ArrowRight size={12} color="currentColor" />
                            </span>
                        </div>

                        {streakDays > 1 && (
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-black/5 dark:border-white/5">
                                <span className="text-gray-500 dark:text-[#848e9c]">Active Compounding Streak:</span>
                                <span className="font-mono font-bold text-orange-500">
                                    🔥 {streakDays} Days (will reset)
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Forfeited Gains Highlight */}
                    {missedGains30d > 0.5 && (
                        <div className="w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between text-left">
                            <div className="flex flex-col">
                                <span className="font-semibold">Estimated 30-Day Compound Loss:</span>
                                <span className="text-[11px] opacity-80">Gains forfeited by withdrawing today</span>
                            </div>
                            <span className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                                -${missedGains30d.toFixed(2)}
                            </span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="w-full flex flex-col gap-2 mt-2">
                        {/* Primary: Keep Compounding */}
                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-full py-3.5 px-5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md"
                        style={{
                            background: "linear-gradient(135deg, #FCD535 0%, #F0B90B 100%)",
                            color: "#0b0e14",
                            boxShadow: "0 6px 20px rgba(252, 213, 53, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.6)",
                        }}
                    >
                        <Flash size={18} color="#0b0e14" variant="Bold" />
                        <span>Keep Compounding (Recommended)</span>
                    </button>

                        {/* Secondary: Confirm Withdrawal */}
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-all cursor-pointer"
                        >
                            I Understand, Proceed with Withdrawal
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
