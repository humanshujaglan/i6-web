"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flash, CloseCircle } from "iconsax-react";
import { useTheme } from "@/app/context/ThemeContext";
import { useDashboardSafe } from "@/app/dashboard/DashboardContext";

interface CompoundingStreakModalProps {
    userAddress?: string;
    actualStreakDays: number;
    newPrincipal: number;
    dailyEarning: number;
    isOpen?: boolean;
    onClose?: () => void;
}

export default function CompoundingStreakModal({
    userAddress,
    actualStreakDays,
    newPrincipal,
    dailyEarning,
    isOpen: controlledIsOpen,
    onClose: controlledOnClose,
}: CompoundingStreakModalProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const dash = useDashboardSafe();

    const [isOpen, setIsOpen] = useState(false);
    const [displayedStreak, setDisplayedStreak] = useState(1);
    const [isAnimating, setIsAnimating] = useState(false);
    const hasInitializedRef = useRef(false);

    useEffect(() => {
        if (dash?.setIsModalOpen) {
            dash.setIsModalOpen(isOpen);
        }
        return () => {
            if (dash?.setIsModalOpen) {
                dash.setIsModalOpen(false);
            }
        };
    }, [isOpen, dash]);

    useEffect(() => {
        if (!userAddress || actualStreakDays <= 0) return;
        if (hasInitializedRef.current && controlledIsOpen === undefined) return;

        const todayStr = new Date().toISOString().slice(0, 10);
        const storageKey = `i6_streak_${userAddress.toLowerCase()}`;

        try {
            const raw = localStorage.getItem(storageKey);
            let prevData: { lastDate?: string; lastStreak?: number } = {};
            if (raw) prevData = JSON.parse(raw);

            const alreadyShownToday = prevData.lastDate === todayStr;

            if (controlledIsOpen !== undefined) {
                setIsOpen(controlledIsOpen);
                if (controlledIsOpen) {
                    const startVal = Math.max(1, (prevData.lastStreak && prevData.lastStreak < actualStreakDays) ? prevData.lastStreak : actualStreakDays - 1);
                    runStreakCounter(startVal, actualStreakDays);
                }
            } else if (!alreadyShownToday) {
                hasInitializedRef.current = true;
                const startVal = Math.max(1, (prevData.lastStreak && prevData.lastStreak < actualStreakDays) ? prevData.lastStreak : Math.max(1, actualStreakDays - 1));
                setIsOpen(true);
                runStreakCounter(startVal, actualStreakDays);

                localStorage.setItem(storageKey, JSON.stringify({
                    lastDate: todayStr,
                    lastStreak: actualStreakDays,
                }));
            }
        } catch {
            // LocalStorage safety fallback
        }
    }, [userAddress, actualStreakDays, controlledIsOpen]);

    const runStreakCounter = (start: number, end: number) => {
        setDisplayedStreak(start);
        setIsAnimating(true);

        if (start >= end) {
            setDisplayedStreak(end);
            setIsAnimating(false);
            return;
        }

        const diff = end - start;
        const totalDuration = Math.min(1800, Math.max(800, diff * 150));
        const stepDelay = totalDuration / diff;

        let current = start;
        const interval = setInterval(() => {
            current += 1;
            setDisplayedStreak(current);
            if (current >= end) {
                clearInterval(interval);
                setIsAnimating(false);
            }
        }, stepDelay);
    };

    const handleClose = () => {
        setIsOpen(false);
        if (controlledOnClose) controlledOnClose();
        if (userAddress) {
            const todayStr = new Date().toISOString().slice(0, 10);
            try {
                localStorage.setItem(`i6_streak_${userAddress.toLowerCase()}`, JSON.stringify({
                    lastDate: todayStr,
                    lastStreak: actualStreakDays,
                }));
            } catch {}
        }
    };

    if (!isOpen) return null;

    // Duolingo 7-day row
    const weekDays = ["M", "T", "W", "T", "F", "S", "S"];
    const currentDayIndex = (new Date().getDay() + 6) % 7; // 0 = Mon, 6 = Sun

    // 180 days daily compounding projection (0.5% daily)
    const projectedPrincipal180 = newPrincipal * Math.pow(1.005, 180);
    const projectedRoiPercent180 = (Math.pow(1.005, 180) - 1) * 100;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 select-none">
                <motion.div
                    initial={{ scale: 0.85, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className="relative w-full max-w-sm p-6 sm:p-7 rounded-[32px] flex flex-col items-center text-center gap-4 overflow-hidden"
                    style={{
                        background: isDark
                            ? "linear-gradient(135deg, #18140f 0%, #0c0d12 100%)"
                            : "linear-gradient(135deg, #FFF9F0 0%, #FFFFFF 90%)",
                        border: isDark
                            ? "1.5px solid rgba(252, 213, 53, 0.25)"
                            : "1.5px solid rgba(255, 149, 0, 0.25)",
                        boxShadow: isDark
                            ? "0 20px 50px rgba(0, 0, 0, 0.85), 0 0 35px rgba(252, 213, 53, 0.15)"
                            : "0 16px 45px rgba(255, 149, 0, 0.18)",
                    }}
                >
                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer p-1 rounded-full z-20"
                        title="Close"
                    >
                        <CloseCircle size={20} color="currentColor" />
                    </button>

                    {/* Animated Duolingo-Style Fire Flame */}
                    <div className="relative flex items-center justify-center mt-1">
                        {/* Radiant pulsing glow aura */}
                        <motion.div 
                            animate={{
                                scale: [1, 1.25, 1],
                                opacity: [0.35, 0.65, 0.35],
                            }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-amber-500/40 to-orange-500/40 blur-2xl pointer-events-none"
                        />

                        {/* Duolingo Flame SVG */}
                        <motion.div
                            animate={isAnimating ? {
                                scale: [1, 1.15, 0.95, 1.08, 1],
                                rotate: [-3, 3, -2, 2, 0],
                            } : {
                                scale: [1, 1.04, 1],
                                y: [0, -3, 0],
                            }}
                            transition={isAnimating ? { duration: 0.3, repeat: Infinity } : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center drop-shadow-[0_10px_20px_rgba(255,107,0,0.5)]"
                        >
                            <svg viewBox="0 0 100 100" className="w-full h-full fill-none">
                                <defs>
                                    <linearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                                        <stop offset="0%" stopColor="#FF3B30" />
                                        <stop offset="45%" stopColor="#FF9500" />
                                        <stop offset="90%" stopColor="#FFCC00" />
                                        <stop offset="100%" stopColor="#FFF275" />
                                    </linearGradient>
                                    <linearGradient id="innerFlame" x1="0%" y1="100%" x2="0%" y2="0%">
                                        <stop offset="0%" stopColor="#FF9500" />
                                        <stop offset="60%" stopColor="#FFD60A" />
                                        <stop offset="100%" stopColor="#FFFFFF" />
                                    </linearGradient>
                                </defs>
                                {/* Outer Flame */}
                                <path 
                                    d="M50 5 C53 25, 78 35, 78 62 C78 78, 65 92, 50 92 C35 92, 22 78, 22 62 C22 45, 34 32, 40 22 C42 32, 48 38, 48 38 C48 38, 46 16, 50 5 Z" 
                                    fill="url(#flameGrad)" 
                                />
                                {/* Inner Flame */}
                                <path 
                                    d="M50 35 C52 48, 66 54, 66 69 C66 79, 58 86, 50 86 C42 86, 34 79, 34 69 C34 58, 42 50, 45 44 C46 50, 49 53, 49 53 C49 53, 48 40, 50 35 Z" 
                                    fill="url(#innerFlame)" 
                                    opacity="0.95"
                                />
                                {/* Sparkle Core */}
                                <ellipse cx="50" cy="74" rx="8" ry="12" fill="#FFFFFF" opacity="0.85" />
                            </svg>
                        </motion.div>
                    </div>

                    {/* Streak Number with Count-Up */}
                    <div className="flex flex-col items-center gap-0.5 relative z-10">
                        <motion.div 
                            key={displayedStreak}
                            initial={{ scale: 0.8, y: -4 }}
                            animate={{ scale: 1, y: 0 }}
                            className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-400 via-orange-500 to-rose-500 drop-shadow-sm"
                        >
                            {displayedStreak}
                        </motion.div>
                        <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                            Day Compounding Streak!
                        </span>
                    </div>

                    {/* 7-Day Duolingo Calendar Row */}
                    <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 w-full">
                        {weekDays.map((day, idx) => {
                            const isStreakActive = idx <= currentDayIndex;
                            const isToday = idx === currentDayIndex;
                            return (
                                <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                                    <span className={`text-[10px] font-semibold ${isToday ? "text-orange-500 dark:text-amber-400" : "text-gray-400 dark:text-[#848e9c]"}`}>
                                        {day}
                                    </span>
                                    <div 
                                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                            isStreakActive
                                                ? "bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-xs scale-105"
                                                : "bg-gray-200/70 dark:bg-white/10 text-gray-400 dark:text-[#848e9c]"
                                        } ${isToday ? "ring-2 ring-orange-500 dark:ring-amber-400 ring-offset-2 ring-offset-transparent animate-pulse" : ""}`}
                                    >
                                        {isStreakActive ? "🔥" : "•"}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Explanatory Message */}
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-[#848e9c] leading-relaxed max-w-xs">
                        Your profits have compounded for <strong className="text-orange-600 dark:text-amber-400">{displayedStreak} consecutive days</strong> untouched.
                    </p>

                    {/* Live Principal & 180D Projection */}
                    <div className="w-full p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex flex-col gap-2.5 text-left">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 dark:text-[#848e9c] font-medium">New Principal</span>
                                <span className="text-xs sm:text-sm font-semibold font-mono text-gray-900 dark:text-white">
                                    ${newPrincipal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Daily ROI Yield</span>
                                <span className="text-xs sm:text-sm font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                                    +${dailyEarning.toFixed(2)}/day
                                </span>
                            </div>
                        </div>

                        {/* 180-Day Compounded Projection */}
                        <div className="pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 dark:text-[#848e9c] font-medium">180D Principal (New)</span>
                                <span className="text-xs sm:text-sm font-bold font-mono text-[#0072ED] dark:text-[#FCD535]">
                                    ${projectedPrincipal180.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-[10px] text-gray-500 dark:text-[#848e9c] font-medium">180D Compounded ROI</span>
                                <span className="text-xs sm:text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                    +{projectedRoiPercent180.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Button: Theme Yellow Button */}
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-full py-3.5 px-5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg mt-1"
                        style={{
                            background: "linear-gradient(135deg, #FCD535 0%, #F0B90B 100%)",
                            color: "#0b0e14",
                            boxShadow: "0 6px 20px rgba(252, 213, 53, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.6)",
                        }}
                    >
                        <Flash size={18} color="#0b0e14" variant="Bold" />
                        <span>Continue Compounding</span>
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
