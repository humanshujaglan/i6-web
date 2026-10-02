"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowSwapHorizontal, ShieldTick, Coin1 } from "iconsax-react";
import { useTheme } from "@/app/context/ThemeContext";
import MetalBorder from "../MetalBorder";
import { fetchUserAllocation, UserAllocationResult, getRelayerStatus } from "@/lib/contracts/qtx";

interface QuantXCardProps {
    userAddress?: string;
    allocatedAmount?: number | string;
    routePercent?: number;
    onRefresh?: () => void;
}

export default function QuantXCard({
    userAddress,
    allocatedAmount,
    routePercent,
    onRefresh,
}: QuantXCardProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [allocation, setAllocation] = useState<UserAllocationResult | null>(null);
    const [yieldPercent, setYieldPercent] = useState<number>(routePercent ?? 75);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (routePercent !== undefined) {
            setYieldPercent(routePercent);
        }
    }, [routePercent]);

    useEffect(() => {
        let isMounted = true;
        if (!userAddress) return;

        const loadAllocation = async () => {
            setLoading(true);
            try {
                const [allocRes, relayerRes] = await Promise.allSettled([
                    fetchUserAllocation(userAddress),
                    getRelayerStatus(userAddress),
                ]);

                if (isMounted) {
                    if (allocRes.status === "fulfilled") {
                        setAllocation(allocRes.value);
                    }
                    if (relayerRes.status === "fulfilled" && relayerRes.value?.preference?.percent) {
                        setYieldPercent(relayerRes.value.preference.percent);
                    }
                }
            } catch (e) {
                console.error("QuantXCard fetch error:", e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadAllocation();
        const timer = setInterval(loadAllocation, 20000); // 20s poll
        return () => {
            isMounted = false;
            clearInterval(timer);
        };
    }, [userAddress]);

    // Format display allocated amount
    const displayAllocated = allocatedAmount !== undefined
        ? (typeof allocatedAmount === "number" ? allocatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : allocatedAmount)
        : (allocation ? allocation.formattedAllocated : "0.00");

    const displayClaimed = allocation ? allocation.formattedClaimed : "0.00";
    const displayPercent = routePercent !== undefined ? routePercent : yieldPercent;

    return (
        <div
            className="relative w-full overflow-hidden p-4 sm:p-5 flex flex-col gap-3.5 select-none rounded-2xl transition-all duration-200"
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
            {/* Top-left stuck corner 3D swap icon */}
            <div className="absolute top-0 left-0 w-20 h-20 sm:w-24 sm:h-24 pointer-events-none z-0 overflow-hidden rounded-tl-2xl">
                <Image
                    src="/3d-icons/swap.webp"
                    alt="QuantX AI Reinvest"
                    width={96}
                    height={96}
                    className="w-full h-full object-contain object-left-top"
                    priority
                />
            </div>

            {/* Header: Title */}
            <div className="flex items-center justify-between gap-2 relative z-10 pl-16 sm:pl-20 min-h-[36px]">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-[18px] sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                        QuantX AI Reinvestment
                    </span>
                </div>
            </div>

            {/* Connected 2-Pill Exchange Layout */}
            <div className="relative z-10 w-full grid grid-cols-2 gap-2 sm:gap-3 items-center">
                {/* Left Pill: Reinvestment Engine Status */}
                <div
                    className="w-full min-w-0 flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-[37px] border transition-all h-[56px]"
                    style={{
                        background: isDark ? "#191d24" : "#F4F4F7",
                        borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
                    }}
                >
                    <div className="text-gray-600 dark:text-[#848e9c] shrink-0">
                        <ShieldTick size={18} color="currentColor" />
                    </div>

                    {/* Vertical Divider */}
                    <div className="h-6 w-[1px] bg-black/10 dark:bg-white/10 shrink-0" />

                    <div className="flex flex-col min-w-0 truncate">
                        <span className="text-[10px] sm:text-[11px] font-medium text-[#2B2B2B] dark:text-[#ffffff] truncate tracking-tight">
                            QTX Allocation
                        </span>
                        <span className="text-xs sm:text-sm font-semibold font-mono text-emerald-600 dark:text-emerald-400 truncate flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{displayPercent}% Yield</span>
                        </span>
                    </div>
                </div>

                {/* Right Pill: Allocated QTX with Metallic Chromatic Border */}
                <MetalBorder
                    preset="chromatic"
                    className="w-full min-w-0 h-[56px]"
                    borderRadius={37}
                >
                    <div className="w-full h-full flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-[37px]">
                        <div className="text-[#0072ED] dark:text-[#FCD535] shrink-0">
                            <Coin1 size={18} color="currentColor" variant="Bold" />
                        </div>

                        {/* Vertical Divider */}
                        <div className="h-6 w-[1px] bg-black/10 dark:bg-white/10 shrink-0" />

                        <div className="flex flex-col min-w-0 truncate">
                            <span className="text-[10px] sm:text-[11px] font-semibold text-[#0072ED] dark:text-[#FCD535] truncate tracking-tight">
                                QTX Allocated
                            </span>
                            <span className="text-xs sm:text-sm md:text-base font-bold font-mono text-[#2B2B2B] dark:text-white truncate">
                                {loading && !allocation ? "Loading..." : `${displayAllocated} QTX`}
                            </span>
                        </div>
                    </div>
                </MetalBorder>

                {/* Center Floating Exchange Badge */}
                <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-md pointer-events-none"
                    style={{
                        background: isDark ? "#232833" : "#DEEFFF",
                        border: isDark ? "3.5px solid #14171d" : "3.5px solid #FFFFFF",
                        color: isDark ? "#FCD535" : "#0072ED",
                    }}
                >
                    <ArrowSwapHorizontal size={14} color="currentColor" />
                </div>
            </div>

            {/* Bottom Footer Info Strip: Relayer status & View Button on Bottom Right */}
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-2 pt-0.5 text-xs">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-[#848e9c]">
                    <span className="hidden sm:inline">Automated BSC Launchpad Relayer</span>
                    <span className="sm:hidden">Launchpad Relayer</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono">
                        Chain 56
                    </span>
                </div>

                <Link
                    href="/dashboard/reinvest"
                    className="px-4 py-1.5 rounded-xl bg-[#0072ED] hover:bg-[#0062cc] text-white dark:bg-[#FCD535] dark:hover:bg-[#f0b90b] dark:text-[#0b0e14] text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 ml-auto"
                >
                    View
                </Link>
            </div>
        </div>
    );
}
