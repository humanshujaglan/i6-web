"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useAnimation } from "framer-motion";
import { useTheme } from "@/app/context/ThemeContext";

interface SwipeButtonProps {
    onSwipe: () => void;
    label?: string;
    disabled?: boolean;
    loading?: boolean;
    disabledText?: string;
    loadingText?: string;
    className?: string;
    hasErrorBorder?: boolean;
}

export default function SwipeButton({
    onSwipe,
    label = "Swipe to Confirm",
    disabled = false,
    loading = false,
    disabledText = "Action Unavailable",
    loadingText = "Submitting...",
    className = "",
    hasErrorBorder = false,
}: SwipeButtonProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const containerRef = useRef<HTMLDivElement>(null);
    const [maxDrag, setMaxDrag] = useState(0);
    const [isTriggered, setIsTriggered] = useState(false);
    const dragX = useMotionValue(0);
    const controls = useAnimation();

    useEffect(() => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            const knobWidth = 44; // 44px knob width
            const padding = 8; // 4px padding each side
            setMaxDrag(Math.max(0, containerWidth - knobWidth - padding));
        }
    }, []);

    const isActionActive = loading || isTriggered;
    const isInactive = Boolean(disabled && !isActionActive);

    // Round arrow knob nudge/slide animation when swipe CTA is activated
    useEffect(() => {
        if (!isInactive && !isActionActive && maxDrag > 0) {
            controls.start({
                x: [0, 24, 0],
                transition: {
                    duration: 0.9,
                    ease: [0.25, 1, 0.5, 1],
                    delay: 0.25,
                },
            });
        }
    }, [isInactive, isActionActive, maxDrag, controls]);

    const handleDragEnd = async () => {
        if (isInactive || isActionActive) return;

        const currentX = dragX.get();
        const threshold = maxDrag * 0.70; // 70% swipe to trigger

        if (currentX >= threshold) {
            setIsTriggered(true);
            controls.start({ x: maxDrag, transition: { type: "spring", stiffness: 400, damping: 30 } });
            onSwipe();
            setTimeout(() => {
                setIsTriggered(false);
                controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } });
            }, 600);
        } else {
            controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 30 } });
        }
    };

    const handleClick = () => {
        if (isInactive || isActionActive) return;
        setIsTriggered(true);
        onSwipe();
        setTimeout(() => setIsTriggered(false), 600);
    };

    const displayText = isInactive ? disabledText : (isActionActive ? loadingText : label);

    return (
        <div className={`relative w-full ${className}`}>
            {/* Track */}
            <div
                ref={containerRef}
                onClick={handleClick}
                className={`relative flex items-center p-1 rounded-full h-[54px] w-full overflow-hidden select-none transition-all duration-300 ${
                    isInactive 
                        ? "cursor-not-allowed" 
                        : "cursor-pointer"
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
                              backgroundColor: isActionActive 
                                  ? (isDark ? "#0ecb81" : "#10B981") 
                                  : (isDark ? "#FCD535" : "#0072ED"),
                              border: hasErrorBorder ? "1.5px solid #EF4444" : undefined,
                              boxShadow: hasErrorBorder
                                  ? (isDark ? "0 0 14px rgba(239, 68, 68, 0.35)" : "0 0 12px rgba(239, 68, 68, 0.25)")
                                  : (!isDark 
                                      ? "inset 4px 6px 10.8px rgba(255, 255, 255, 0.4)" 
                                      : (isActionActive ? "0 4px 14px rgba(14, 203, 129, 0.25)" : "0 4px 14px rgba(252, 213, 53, 0.25)")),
                          }
                }
            >
                {/* Draggable Circular Knob */}
                {!isInactive ? (
                    <motion.div
                        drag={!isActionActive ? "x" : false}
                        dragConstraints={{ left: 0, right: maxDrag }}
                        dragElastic={0.08}
                        animate={controls}
                        style={{ x: dragX }}
                        onDragEnd={handleDragEnd}
                        className={`h-[44px] w-[44px] rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing z-20 shrink-0 shadow-sm ${
                            isDark && !isActionActive ? "bg-[#0b0e14] text-[#FCD535]" : "bg-white text-[#0072ED]"
                        }`}
                    >
                        {isActionActive ? (
                            <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${
                                isDark ? "border-[#0ecb81]" : "border-[#10B981]"
                            }`} />
                        ) : (
                            /* Continuous Sweeping & Sliding Double Chevrons >> */
                            <motion.div
                                className="flex items-center"
                                animate={{ x: [0, 5, 0] }}
                                transition={{
                                    duration: 1.4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <motion.path
                                        d="M8.5 5L15.5 12L8.5 19"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        animate={{ opacity: [0.45, 1, 0.45] }}
                                        transition={{
                                            duration: 1.4,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: 0,
                                        }}
                                    />
                                    <motion.path
                                        d="M14.5 5L21.5 12L14.5 19"
                                        stroke={isDark ? "#ffe87a" : "#7CD4FD"}
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        animate={{ opacity: [0.45, 1, 0.45] }}
                                        transition={{
                                            duration: 1.4,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: 0.25,
                                        }}
                                    />
                                </svg>
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    <div 
                        className={`h-[44px] w-[44px] rounded-full flex items-center justify-center z-20 shrink-0 shadow-xs ${
                            isDark ? "bg-[#252b36] border border-white/10 text-[#848e9c]" : "bg-white border border-gray-200 text-gray-400"
                        }`}
                    >
                        <div className="flex items-center">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.5 5L15.5 12L8.5 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M14.5 5L21.5 12L14.5 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* Centered Track Label with Text-Only Shimmer/Sweep Animation */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-12">
                    <motion.span 
                        className={`text-sm sm:text-base tracking-tight select-none text-center ${
                            isInactive 
                                ? (hasErrorBorder
                                    ? "text-rose-500 dark:text-rose-400 font-medium"
                                    : (isDark ? "text-[#848e9c] font-medium" : "text-gray-500 font-medium"))
                                : isActionActive
                                    ? "text-white font-medium"
                                    : isDark
                                        ? "text-[#0b0e14] font-medium"
                                        : "text-white font-medium"
                        }`}
                        style={
                            !isInactive && !isActionActive
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
                            !isInactive && !isActionActive
                                ? {
                                      backgroundPosition: ["100% 0", "-100% 0"],
                                  }
                                : undefined
                        }
                        transition={
                            !isInactive && !isActionActive
                                ? {
                                      duration: 2.2,
                                      repeat: Infinity,
                                      ease: "linear",
                                  }
                                : undefined
                        }
                    >
                        {displayText}
                    </motion.span>
                </div>

                {/* Right side sweeping sliding arrows indicator */}
                {!isInactive && !isActionActive && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center -space-x-1.5 pointer-events-none z-10">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    opacity: [0.2, 0.9, 0.2],
                                    x: [0, 4, 0],
                                }}
                                transition={{
                                    duration: 1.2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: i * 0.18,
                                }}
                                className={isDark ? "text-[#0b0e14]" : "text-white"}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M9 5L16 12L9 19"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
