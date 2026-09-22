"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/app/context/ThemeContext";
import { ArrowRight, Flash, People } from "iconsax-react";

export default function ReferAndEarnCard() {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <div
            className="w-full p-4 sm:p-5 flex flex-col gap-3.5 select-none rounded-2xl transition-all duration-200 relative overflow-hidden"
            style={{
                background: isDark
                    ? "linear-gradient(135deg, #14171d 0%, #0a0c0f 100%)"
                    : "linear-gradient(135deg, rgba(201, 224, 255, 0.6) 0%, #FFFFFF 85%)",
                border: isDark
                    ? "1px solid rgba(255, 255, 255, 0.12)"
                    : "1.5px solid #FFFFFF",
                boxShadow: isDark
                    ? "inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 4px 14px rgba(0, 0, 0, 0.4)"
                    : "0 3px 12px rgba(12, 50, 99, 0.06)",
            }}
        >
            {/* Top-left stuck corner 3D icon */}
            <div className="absolute top-0 left-0 w-20 h-20 sm:w-24 sm:h-24 pointer-events-none z-0 overflow-hidden rounded-tl-2xl">
                <Image
                    src={isDark ? "/3d-icons/direct.webp" : "/3d-icons/direct-light.webp"}
                    alt="Refer & Earn"
                    width={96}
                    height={96}
                    className="w-full h-full object-contain object-left-top"
                    priority
                />
            </div>

            <div className="flex items-center justify-between gap-3 relative z-10 pl-16 sm:pl-20 min-h-[44px]">
                {/* Title & Description */}
                <div className="flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                            Refer &amp; Earn
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] shrink-0 flex items-center gap-0.5">
                            <Flash size={10} color="currentColor" variant="Bold" />
                            5% Instant
                        </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-[#848e9c] mt-0.5 line-clamp-1">
                        Earn 5% direct commission on every deposit
                    </span>
                </div>

                {/* Action Link Button */}
                <Link
                    href="/dashboard/refer"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
                    style={
                        isDark
                            ? {
                                  background: "#FCD535",
                                  color: "#0b0e14",
                              }
                            : {
                                  background: "#0072ED",
                                  color: "#FFFFFF",
                              }
                    }
                >
                    <span>Invite</span>
                    <ArrowRight size={14} color="currentColor" />
                </Link>
            </div>
        </div>
    );
}
