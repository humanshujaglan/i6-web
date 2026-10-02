"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import confetti from "canvas-confetti";
import { CloseCircle, Flash, TrendUp, ShieldTick, Cpu, ArrowRight } from "iconsax-react";
import { useTheme } from "@/app/context/ThemeContext";
import { useDashboardSafe } from "@/app/dashboard/DashboardContext";

interface QuantXLaunchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExplore?: () => void;
}

// Celebration emojis to burst out radially around the QTX logo
const CELEBRATION_EMOJIS = [
    { emoji: "🎉", angle: 0, dist: 135, size: 28 },
    { emoji: "🚀", angle: 25, dist: 165, size: 30 },
    { emoji: "✨", angle: 55, dist: 125, size: 26 },
    { emoji: "🥳", angle: 80, dist: 155, size: 30 },
    { emoji: "💥", angle: 110, dist: 130, size: 28 },
    { emoji: "💎", angle: 140, dist: 160, size: 26 },
    { emoji: "⭐", angle: 165, dist: 120, size: 24 },
    { emoji: "🔥", angle: 195, dist: 160, size: 28 },
    { emoji: "🍾", angle: 220, dist: 130, size: 28 },
    { emoji: "⚡️", angle: 250, dist: 165, size: 28 },
    { emoji: "🎊", angle: 280, dist: 125, size: 28 },
    { emoji: "🌟", angle: 305, dist: 160, size: 26 },
    { emoji: "🚀", angle: 330, dist: 135, size: 30 },
    { emoji: "✨", angle: 350, dist: 170, size: 24 },
];

export default function QuantXLaunchModal({
    isOpen,
    onClose,
    onExplore,
}: QuantXLaunchModalProps) {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const dash = useDashboardSafe();

    const titleRef = useRef<HTMLDivElement>(null);
    const subtitleRef = useRef<HTMLDivElement>(null);
    const [emojiStage, setEmojiStage] = useState<"burst" | "retract" | "gone">("burst");

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

    // Retract emojis inward back to the center and vanish after a few seconds
    useEffect(() => {
        if (!isOpen) {
            setEmojiStage("burst");
            return;
        }

        setEmojiStage("burst");

        const retractTimer = setTimeout(() => {
            setEmojiStage("retract");
        }, 2400);

        const goneTimer = setTimeout(() => {
            setEmojiStage("gone");
        }, 3200);

        return () => {
            clearTimeout(retractTimer);
            clearTimeout(goneTimer);
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        // 1. Confetti burst on modal opening
        try {
            confetti({
                particleCount: 75,
                spread: 100,
                origin: { y: 0.45 },
                colors: isDark
                    ? ["#FCD535", "#00D4FF", "#10B981", "#FFFFFF", "#FFB703"]
                    : ["#0072ED", "#FCD535", "#10B981", "#6366F1", "#3B82F6"],
                disableForReducedMotion: true,
            });
        } catch (e) {
            console.warn("Confetti launch warning:", e);
        }

        // 2. GSAP Blur Reveal Animation for "QuantX AI"
        const ctx = gsap.context(() => {
            if (titleRef.current) {
                gsap.fromTo(
                    titleRef.current,
                    {
                        filter: "blur(26px)",
                        opacity: 0,
                        scale: 0.82,
                        y: 28,
                        letterSpacing: "0.22em",
                    },
                    {
                        filter: "blur(0px)",
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        letterSpacing: "normal",
                        duration: 1.15,
                        delay: 0.32,
                        ease: "power3.out",
                    }
                );
            }

            if (subtitleRef.current) {
                gsap.fromTo(
                    subtitleRef.current,
                    {
                        filter: "blur(14px)",
                        opacity: 0,
                        y: 18,
                    },
                    {
                        filter: "blur(0px)",
                        opacity: 1,
                        y: 0,
                        duration: 0.95,
                        delay: 0.65,
                        ease: "power2.out",
                    }
                );
            }
        });

        return () => ctx.revert();
    }, [isOpen, isDark]);

    if (!isOpen) return null;

    const handleExplore = () => {
        onClose();
        if (onExplore) {
            onExplore();
        } else {
            router.push("/dashboard/reinvest");
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-in fade-in duration-200 select-none overflow-hidden">
                {/* Background Ambient Glow */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                    <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#0072ED]/20 via-[#FCD535]/25 to-[#10B981]/20 blur-3xl animate-pulse" />
                </div>

                <motion.div
                    initial={{ scale: 0.82, opacity: 0, y: 25 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.88, opacity: 0, y: 25 }}
                    transition={{ type: "spring", stiffness: 340, damping: 26 }}
                    className="relative w-full max-w-sm sm:max-w-md p-6 sm:p-8 rounded-[36px] flex flex-col items-center text-center gap-5 overflow-visible"
                    style={{
                        background: isDark
                            ? "linear-gradient(150deg, rgba(20, 23, 30, 0.97) 0%, rgba(10, 12, 16, 0.98) 100%)"
                            : "linear-gradient(150deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 246, 255, 0.95) 100%)",
                        border: isDark
                            ? "1px solid rgba(255, 255, 255, 0.15)"
                            : "1.5px solid rgba(255, 255, 255, 0.9)",
                        boxShadow: isDark
                            ? "0 28px 80px rgba(0, 0, 0, 0.75), inset 0 1px 2px rgba(255, 255, 255, 0.22)"
                            : "0 28px 70px rgba(12, 50, 99, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.9)",
                    }}
                >
                    {/* Close Cross Button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 z-30 p-2 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title="Close Modal"
                    >
                        <CloseCircle size={22} color="currentColor" />
                    </button>

                    {/* Top Announcement Badge: New Launch */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider shadow-sm"
                        style={{
                            background: isDark
                                ? "linear-gradient(135deg, rgba(252, 213, 53, 0.15) 0%, rgba(0, 212, 255, 0.15) 100%)"
                                : "linear-gradient(135deg, rgba(0, 114, 237, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)",
                            border: isDark
                                ? "1px solid rgba(252, 213, 53, 0.35)"
                                : "1px solid rgba(0, 114, 237, 0.3)",
                            color: isDark ? "#FCD535" : "#0072ED",
                        }}
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>🚀 Official New Launch</span>
                    </motion.div>

                    {/* Center Stage: QTX 3D Logo with Bursting Celebration Emojis */}
                    <div className="relative w-44 h-44 flex items-center justify-center my-1">
                        {/* Radial Celebration Emojis that burst outward and then suck inward & vanish */}
                        {emojiStage !== "gone" &&
                            CELEBRATION_EMOJIS.map((item, idx) => {
                                const rad = (item.angle * Math.PI) / 180;
                                const targetX = Math.round(Math.cos(rad) * item.dist);
                                const targetY = Math.round(Math.sin(rad) * item.dist);
                                const targetRot = (idx % 2 === 0 ? 1 : -1) * (15 + (idx * 12) % 30);
                                const isRetracting = emojiStage === "retract";

                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ scale: 0, x: 0, y: 0, opacity: 0, rotate: 0 }}
                                        animate={
                                            isRetracting
                                                ? {
                                                      scale: 0,
                                                      x: 0,
                                                      y: 0,
                                                      opacity: 0,
                                                      rotate: 0,
                                                  }
                                                : {
                                                      scale: [0, 1.45, 1],
                                                      x: [0, targetX * 1.15, targetX],
                                                      y: [0, targetY * 1.15, targetY],
                                                      opacity: [0, 1, 1],
                                                      rotate: [0, targetRot * 1.2, targetRot],
                                                  }
                                        }
                                        transition={
                                            isRetracting
                                                ? {
                                                      duration: 0.65,
                                                      delay: idx * 0.015,
                                                      ease: [0.55, 0.055, 0.675, 0.19], // Smooth inward suction curve
                                                  }
                                                : {
                                                      duration: 0.85,
                                                      delay: 0.18 + idx * 0.025,
                                                      ease: [0.34, 1.56, 0.64, 1],
                                                  }
                                        }
                                        className="absolute pointer-events-none select-none z-10"
                                        style={{
                                            fontSize: `${item.size}px`,
                                            filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))",
                                        }}
                                    >
                                        <motion.span
                                            animate={
                                                !isRetracting
                                                    ? {
                                                          y: [-3, 3, -3],
                                                          rotate: [-4, 4, -4],
                                                      }
                                                    : {}
                                            }
                                            transition={{
                                                duration: 2.2 + (idx % 3) * 0.4,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                            }}
                                            className="inline-block"
                                        >
                                            {item.emoji}
                                        </motion.span>
                                    </motion.div>
                                );
                            })}

                        {/* Outer Glow Halo behind Logo */}
                        <div
                            className="absolute w-36 h-36 rounded-full blur-2xl opacity-75"
                            style={{
                                background: isDark
                                    ? "radial-gradient(circle, rgba(252, 213, 53, 0.5) 0%, rgba(0, 212, 255, 0.3) 60%, transparent 100%)"
                                    : "radial-gradient(circle, rgba(0, 114, 237, 0.45) 0%, rgba(252, 213, 53, 0.3) 60%, transparent 100%)",
                            }}
                        />

                        {/* Orbiting Ring Border */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                            className="absolute w-32 h-32 rounded-full border border-dashed border-[#FCD535]/40 dark:border-[#FCD535]/50 pointer-events-none"
                        />

                        {/* Center QTX 3D Logo Pop-in & Levitation */}
                        <motion.div
                            initial={{ scale: 0.2, opacity: 0, rotate: -25 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 320,
                                damping: 20,
                                delay: 0.12,
                            }}
                            className="relative z-20 w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center cursor-pointer"
                        >
                            <motion.div
                                animate={{
                                    y: [-5, 5, -5],
                                    rotateZ: [-2, 2, -2],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                                className="w-full h-full flex items-center justify-center filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]"
                            >
                                <Image
                                    src="/3d-icons/qtx-logo.png"
                                    alt="QuantX AI Logo"
                                    width={128}
                                    height={128}
                                    priority
                                    className="w-full h-full object-contain"
                                />
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* GSAP Blur Reveal Text: "QuantX AI" */}
                    <div className="flex flex-col items-center gap-1.5 w-full">
                        <div
                            ref={titleRef}
                            className={`font-black text-3xl sm:text-4xl tracking-tight ${
                                isDark
                                    ? "text-transparent bg-clip-text bg-gradient-to-r from-[#FCD535] via-[#FFF6BD] to-[#00D4FF] drop-shadow-[0_4px_22px_rgba(252,213,53,0.45)]"
                                    : "text-transparent bg-clip-text bg-gradient-to-r from-[#0072ED] via-[#38BDF8] to-[#10B981] drop-shadow-[0_4px_22px_rgba(0,114,237,0.35)]"
                            }`}
                        >
                            QuantX AI
                        </div>

                        {/* Subtitle with GSAP Blur Reveal */}
                        <p
                            ref={subtitleRef}
                            className="text-xs sm:text-sm text-gray-500 dark:text-[#848e9c] max-w-xs font-medium leading-relaxed"
                        >
                            Autonomous AI Yield Reinvestment, PancakeSwap v2 Pool & Compounding Launchpad
                        </p>
                    </div>

                    {/* Feature Highlights Badges */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="grid grid-cols-3 gap-2 w-full pt-1"
                    >
                        <div className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col items-center gap-1">
                            <Cpu size={16} color="currentColor" className="text-[#0072ED] dark:text-[#FCD535]" />
                            <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">AI Reinvest</span>
                            <span className="text-[9px] text-gray-400">75% Default</span>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col items-center gap-1">
                            <TrendUp size={16} color="currentColor" className="text-emerald-500" />
                            <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">Live Pool</span>
                            <span className="text-[9px] text-gray-400">QTX/WBNB</span>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col items-center gap-1">
                            <ShieldTick size={16} color="currentColor" className="text-amber-500" />
                            <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">Timelock</span>
                            <span className="text-[9px] text-gray-400">3-Year Vault</span>
                        </div>
                    </motion.div>

                    {/* Actions: Primary Explore CTA + Dismiss */}
                    <div className="flex flex-col gap-2 w-full pt-1">
                        <button
                            type="button"
                            onClick={handleExplore}
                            className="w-full py-3.5 px-5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg"
                            style={
                                isDark
                                    ? {
                                          background: "linear-gradient(135deg, #FCD535 0%, #F0B90B 100%)",
                                          color: "#0b0e14",
                                          boxShadow: "0 6px 24px rgba(252, 213, 53, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.6)",
                                      }
                                    : {
                                          background: "linear-gradient(135deg, #0072ED 0%, #0056B3 100%)",
                                          color: "#FFFFFF",
                                          boxShadow: "0 6px 24px rgba(0, 114, 237, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.4)",
                                      }
                            }
                        >
                            <Flash size={18} color="currentColor" variant="Bold" />
                            <span>Explore QuantX AI Launchpad</span>
                            <ArrowRight size={16} color="currentColor" />
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-2.5 px-4 text-xs font-semibold text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
                        >
                            Continue to Dashboard
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
