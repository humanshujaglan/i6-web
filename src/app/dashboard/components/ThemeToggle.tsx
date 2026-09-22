"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sun1, Moon } from "iconsax-react";
import { useTheme } from "@/app/context/ThemeContext";

interface ThemeToggleProps {
    className?: string;
    variant?: "pill" | "icon" | "row";
}

export default function ThemeToggle({ className = "", variant = "icon" }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    if (variant === "row") {
        return (
            <button
                type="button"
                onClick={toggleTheme}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                    isDark
                        ? "bg-[#2b313a] text-white hover:bg-[#333a45]"
                        : "bg-[#F4F4F7] text-gray-800 hover:bg-gray-200"
                } ${className}`}
            >
                <div className="flex items-center gap-2.5">
                    {isDark ? (
                        <Sun1 size={18} color="#FCD535" variant="Bold" />
                    ) : (
                        <Moon size={18} color="#475569" variant="Bold" />
                    )}
                    <span className="text-xs font-semibold">
                        {isDark ? "Dark Theme" : "Light Theme"}
                    </span>
                </div>

                <div 
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                        isDark ? "bg-[#FCD535] justify-end" : "bg-gray-300 justify-start"
                    }`}
                >
                    <motion.div 
                        layout
                        className="w-4 h-4 rounded-full bg-white shadow-xs"
                    />
                </div>
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`relative inline-flex items-center justify-center w-[44px] h-[44px] rounded-full bg-black dark:bg-[#14171d] text-white transition-all duration-200 hover:bg-black/90 dark:hover:bg-[#191d24] cursor-pointer shrink-0 border border-transparent dark:border-[#20252d] ${className}`}
            style={{
                boxShadow: isDark 
                    ? "inset 4px 6px 10.8px rgba(255, 255, 255, 0.14), 0 4px 12px rgba(0, 0, 0, 0.3)" 
                    : "inset 4px 6px 10.8px rgba(255, 255, 255, 0.4)",
            }}
            title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
            aria-label="Toggle theme"
        >
            <motion.div
                key={theme}
                initial={{ rotate: -45, scale: 0.6, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 45, scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex items-center justify-center"
            >
                {isDark ? (
                    <Sun1 size={18} color="#FCD535" variant="Bold" />
                ) : (
                    <Moon size={18} color="#FFFFFF" variant="Bold" />
                )}
            </motion.div>
        </button>
    );
}
