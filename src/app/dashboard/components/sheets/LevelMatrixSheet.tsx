"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/app/context/ThemeContext";
import { useDashboard } from "@/app/dashboard/DashboardContext";
import { CloseCircle, TickCircle, Lock } from "iconsax-react";
import { LevelRowItem } from "../cards/LevelIncomeCard";

interface LevelMatrixSheetProps {
    open: boolean;
    onClose: () => void;
    levelRows: LevelRowItem[];
    directCount: number;
}

export default function LevelMatrixSheet({
    open,
    onClose,
    levelRows,
    directCount,
}: LevelMatrixSheetProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const { setIsModalOpen } = useDashboard();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!open) return;
        setIsModalOpen?.(true);
        document.body.style.overflow = "hidden";
        return () => {
            setIsModalOpen?.(false);
            document.body.style.overflow = "";
        };
    }, [open, setIsModalOpen]);

    const unlockedCount = Math.min(directCount * 2, 40);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/65 backdrop-blur-xs" 
                        onClick={onClose} 
                    />

                    {/* Bottom Sheet Modal (Taller Full Height Container) */}
                    <motion.div 
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        className="relative z-10 w-full max-w-lg p-5 pb-7 sm:p-6 rounded-t-[28px] sm:rounded-[28px] sm:mb-4 flex flex-col gap-4 select-none overflow-hidden shadow-2xl h-[88vh] sm:h-[85vh] max-h-[92vh]"
                        style={{
                            background: isDark
                                ? "linear-gradient(135deg, #14171d 0%, #0a0c0f 100%)"
                                : "linear-gradient(135deg, rgba(201, 224, 255, 0.7) 0%, #FFFFFF 85%)",
                            border: isDark
                                ? "1px solid rgba(255, 255, 255, 0.12)"
                                : "1.5px solid #FFFFFF",
                            boxShadow: isDark
                                ? "inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 -8px 32px rgba(0, 0, 0, 0.75)"
                                : "0 -8px 32px rgba(12, 50, 99, 0.12)",
                        }}
                    >
                        {/* Mobile drag handle */}
                        <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20 mx-auto -mt-1 mb-0.5 sm:hidden relative z-20" />

                        {/* Header */}
                        <div className="flex items-center justify-between gap-3 relative z-10 shrink-0">
                            <div className="flex flex-col min-w-0">
                                <h3 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white leading-tight">
                                    40-Level Matrix Table
                                </h3>
                                <span className="text-xs sm:text-sm text-[var(--text-soft)] mt-1">
                                    {unlockedCount} / 40 Levels Unlocked ({directCount} Directs)
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                                title="Close"
                            >
                                <CloseCircle size={20} color="currentColor" />
                            </button>
                        </div>

                        {/* 40-Level Table Container (Taller, Expands to fill available space) */}
                        <div className="relative z-10 flex-1 overflow-y-auto min-h-0 rounded-2xl bg-[#F8F9FB] dark:bg-[#191d24] border border-gray-100/80 dark:border-white/5 p-4 flex flex-col gap-1 text-sm">
                            {/* Table Header (Non-sticky, Full Visibility) */}
                            <div className="grid grid-cols-[1.3fr_1fr_1.1fr_0.8fr] items-center font-semibold text-[var(--text-soft)] pb-3 border-b border-gray-200/60 dark:border-white/10 text-xs sm:text-sm shrink-0">
                                <span>Level</span>
                                <span className="text-center">Directs</span>
                                <span className="text-center">(% of RWP)</span>
                                <span className="text-center">Status</span>
                            </div>

                            {/* Table Rows */}
                            <div className="divide-y divide-gray-100/60 dark:divide-white/5">
                                {levelRows.map((row) => {
                                    const cleanYield = row.yieldText.replace(/of\s*rwp/gi, "").trim();
                                    return (
                                        <div key={row.level} className="grid grid-cols-[1.3fr_1fr_1.1fr_0.8fr] items-center py-3.5 sm:py-4">
                                            <span className="font-medium text-[var(--text-main)] font-mono text-sm sm:text-base">
                                                Level {row.level}
                                            </span>
                                            <span className="font-medium text-[var(--text-main)] font-mono text-base sm:text-lg text-center">
                                                {row.req}
                                            </span>
                                            <span className="font-mono text-[#0072ED] dark:text-[#FCD535] font-semibold text-base sm:text-lg text-center">
                                                {cleanYield}
                                            </span>
                                            <div className="flex items-center justify-center">
                                                {row.isUnlocked ? (
                                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-[#0ecb81]" title="Active">
                                                        <TickCircle size={18} variant="Bold" color="currentColor" />
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-200/70 dark:bg-white/10 text-gray-400 dark:text-gray-400" title="Locked">
                                                        <Lock size={16} variant="Bold" color="currentColor" />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
