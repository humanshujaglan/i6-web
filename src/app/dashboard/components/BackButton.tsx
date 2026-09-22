"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/context/ThemeContext";

interface BackButtonProps {
    href?: string;
    className?: string;
}

export default function BackButton({ href = "/dashboard", className = "" }: BackButtonProps) {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const handleClick = () => {
        if (href) {
            router.push(href);
        } else {
            router.back();
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`relative inline-flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 hover:scale-105 active:translate-y-0.5 cursor-pointer shrink-0 ${className}`}
            title="Go Back"
        >
            {/* 3D Diminishing Crescent */}
            <div 
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                    transform: "translateY(3.5px)",
                    background: isDark
                        ? "linear-gradient(90deg, #ffe87a 0%, #FCD535 50%, #ffe87a 100%)"
                        : "linear-gradient(90deg, #7CD4FD 0%, #0072ED 50%, #7CD4FD 100%)",
                    boxShadow: isDark
                        ? "0px 6px 18px rgba(252, 213, 53, 0.3)"
                        : "0px 6px 18px rgba(0, 114, 237, 0.32)",
                }}
            />

            {/* Face Body */}
            <div className="relative z-10 w-full h-full rounded-full bg-white dark:bg-[#14171d] text-black dark:text-white flex items-center justify-center shadow-xs border border-transparent dark:border-white/5">
                <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path 
                        d="M15 19L8 12L15 5" 
                        stroke="currentColor" 
                        strokeWidth="2.6" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </button>
    );
}
