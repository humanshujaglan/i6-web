"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/app/context/ThemeContext";
import { useDashboard } from "@/app/dashboard/DashboardContext";
import { CloseCircle } from "iconsax-react";

export interface IncomeInfoSheetProps {
    open: boolean;
    onClose: () => void;
    title: string;
    typeLabel?: string;
    iconSrc: string;
    description: string;
    rateOrYield?: string;
    stats?: { label: string; value: string | number; isGold?: boolean }[];
    qualifications?: { text: string; completed?: boolean }[];
    notes?: string;
    iconPosition?: "top-left" | "top-right" | "center" | "corner";
}

export default function IncomeInfoSheet({
    open,
    onClose,
    title,
    iconSrc,
    description,
    rateOrYield,
    stats,
    iconPosition = "top-left",
}: IncomeInfoSheetProps) {
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

    const isTopRight = iconPosition === "top-right";
    const isCenter = iconPosition === "center";
    const isTopLeft = !isTopRight && !isCenter; // "top-left" or "corner"

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:p-4">
                    {/* Backdrop with Fade */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/65 backdrop-blur-xs" 
                        onClick={onClose} 
                    />

                    {/* Bottom Sheet with Spring Slide-up Animation */}
                    <motion.div 
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        className="relative z-10 w-full max-w-lg p-5 pb-7 sm:p-6 rounded-t-[28px] sm:rounded-[28px] sm:mb-4 flex flex-col gap-4 select-none overflow-hidden shadow-2xl"
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
                        {/* Drag handle pill on mobile */}
                        <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20 mx-auto -mt-1 mb-0.5 sm:hidden relative z-20" />

                        {/* Top-Right Corner Layout (Salary & Booster) */}
                        {isTopRight && (
                            <>
                                <div className="absolute top-0 right-0 w-36 h-36 sm:w-44 sm:h-44 pointer-events-none z-0 overflow-hidden rounded-tr-[28px]">
                                    <Image 
                                        src={iconSrc} 
                                        alt={title}
                                        width={176}
                                        height={176}
                                        className="w-full h-full object-contain object-right-top"
                                        priority
                                    />
                                </div>

                                <div className="flex items-start justify-between gap-3 relative z-10 min-h-[80px] sm:min-h-[96px]">
                                    <div className="flex flex-col justify-center min-w-0 pr-34 sm:pr-42 pt-1">
                                        <h3 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white leading-tight">
                                            {title}
                                        </h3>
                                        {rateOrYield && (
                                            <span className="text-sm sm:text-base font-mono font-medium text-emerald-600 dark:text-[#FCD535] mt-1">
                                                {rateOrYield}
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5 relative z-20"
                                        title="Close"
                                    >
                                        <CloseCircle size={20} color="currentColor" />
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Top-Left Corner Layout (Default) */}
                        {isTopLeft && (
                            <>
                                <div className="absolute top-0 left-0 w-36 h-36 sm:w-44 sm:h-44 pointer-events-none z-0 overflow-hidden rounded-tl-[28px]">
                                    <Image 
                                        src={iconSrc} 
                                        alt={title}
                                        width={176}
                                        height={176}
                                        className="w-full h-full object-contain object-left-top"
                                        priority
                                    />
                                </div>

                                <div className="flex items-start justify-between gap-3 relative z-10 min-h-[80px] sm:min-h-[96px]">
                                    <div className="flex flex-col justify-center min-w-0 pl-34 sm:pl-42 pt-1">
                                        <h3 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white leading-tight">
                                            {title}
                                        </h3>
                                        {rateOrYield && (
                                            <span className="text-sm sm:text-base font-mono font-medium text-emerald-600 dark:text-[#FCD535] mt-1">
                                                {rateOrYield}
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5 relative z-20"
                                        title="Close"
                                    >
                                        <CloseCircle size={20} color="currentColor" />
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Centered Layout (Level, Upline, and Global Cap) */}
                        {isCenter && (
                            <>
                                <div className="flex items-start justify-between gap-3 relative z-10">
                                    <div className="w-8 h-8 invisible" />
                                    <div className="w-36 h-36 sm:w-44 sm:h-44 relative flex items-center justify-center shrink-0 -mt-1 -mb-1">
                                        <Image 
                                            src={iconSrc} 
                                            alt={title}
                                            width={176}
                                            height={176}
                                            className="w-full h-full object-contain drop-shadow-xl"
                                            priority
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5"
                                        title="Close"
                                    >
                                        <CloseCircle size={20} color="currentColor" />
                                    </button>
                                </div>

                                <div className="flex flex-col items-center text-center -mt-1 relative z-10">
                                    <h3 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white leading-tight">
                                        {title}
                                    </h3>
                                    {rateOrYield && (
                                        <span className="text-sm sm:text-base font-mono font-medium text-emerald-600 dark:text-[#FCD535] mt-1">
                                            {rateOrYield}
                                        </span>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Concise Description */}
                        <p className={`text-sm sm:text-[14.5px] text-gray-600 dark:text-[#848e9c] leading-relaxed relative z-10 ${isCenter ? "text-center" : ""}`}>
                            {description}
                        </p>

                        {/* Key Stats Grid */}
                        {stats && stats.length > 0 && (
                            <div className="grid grid-cols-2 gap-2.5 bg-[#F8F9FB] dark:bg-[#191d24] border border-gray-100/80 dark:border-white/5 p-3 rounded-xl text-xs relative z-10">
                                {stats.map((stat, idx) => (
                                    <div key={idx} className="flex flex-col">
                                        <span className="text-xs text-[var(--text-soft)] font-normal">{stat.label}</span>
                                        <span className={`font-mono font-semibold text-sm sm:text-base mt-0.5 ${
                                            stat.isGold 
                                                ? "text-[#0072ED] dark:text-[#FCD535]" 
                                                : "text-gray-900 dark:text-white"
                                        }`}>
                                            {stat.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
