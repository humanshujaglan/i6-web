"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "../DashboardContext";
import UserGate from "../UserGate";
import BackButton from "../components/BackButton";
import CopyAlert from "../components/CopyAlert";
import { useTheme } from "@/app/context/ThemeContext";
import {
    Copy,
    TickCircle,
    Share,
    People,
    Wallet3,
    Flash,
    ShieldTick,
    ExportSquare,
    DirectboxNotif,
    TrendUp,
    ScanBarcode,
} from "iconsax-react";

export default function ReferAndEarnPage() {
    const { userAddress, user, error, refreshData } = useDashboard();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [copiedAlert, setCopiedAlert] = useState(false);
    const [alertMsg, setAlertMsg] = useState("Copied to clipboard!");
    const [showQr, setShowQr] = useState(false);

    const origin = typeof window !== "undefined" ? window.location.origin : "https://infinitysix.io";
    const referralLink = userAddress ? `${origin}/register?ref=${userAddress}` : `${origin}/register`;
    const shortAddress = userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : "0x...";

    const copyLink = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        setAlertMsg("Referral link copied to clipboard!");
        setCopiedAlert(true);
        setTimeout(() => setCopiedAlert(false), 2000);
    };

    const copyCode = () => {
        if (!userAddress) return;
        navigator.clipboard.writeText(userAddress);
        setAlertMsg("Sponsor address copied to clipboard!");
        setCopiedAlert(true);
        setTimeout(() => setCopiedAlert(false), 2000);
    };

    const handleShare = async () => {
        const shareData = {
            title: "Join Infinity Six",
            text: "Join Infinity Six and earn up to 250% compounding ROI. Use my referral link to get started:",
            url: referralLink,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                copyLink();
            }
        } else {
            copyLink();
        }
    };

    if (!user) return <UserGate error={error} onRetry={refreshData} />;

    return (
        <div className="dashboard-container relative min-h-screen pb-28 select-none">
            <CopyAlert show={copiedAlert} message={alertMsg} />

            {/* Top Background Radiance Dome */}
            <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 pointer-events-none z-0"
                style={{
                    background: isDark
                        ? "radial-gradient(circle at 50% 0%, rgba(252, 213, 53, 0.15) 0%, rgba(20, 23, 29, 0) 70%)"
                        : "radial-gradient(circle at 50% 0%, rgba(0, 114, 237, 0.14) 0%, rgba(255, 255, 255, 0) 70%)",
                }}
            />

            <div className="dashboard-content-wrapper max-w-lg mx-auto flex flex-col gap-5 pt-2 relative z-10 px-4">
                
                {/* Top Navigation Bar */}
                <div className="flex items-center justify-between py-1">
                    <BackButton href="/dashboard" />

                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs font-semibold tracking-wide text-gray-700 dark:text-gray-300">
                        <Flash size={14} color={isDark ? "#FCD535" : "#0072ED"} variant="Bold" />
                        <span>INSTANT 5% DIRECT BONUS</span>
                    </div>

                    <button
                        type="button"
                        onClick={handleShare}
                        className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 text-gray-800 dark:text-white"
                        style={{
                            background: isDark
                                ? "linear-gradient(135deg, #14171d 0%, #0a0c0f 100%)"
                                : "linear-gradient(135deg, rgba(201, 224, 255, 0.7) 0%, #FFFFFF 85%)",
                            border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1.5px solid #FFFFFF",
                            boxShadow: isDark
                                ? "inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 4px 12px rgba(0, 0, 0, 0.35)"
                                : "0 3px 12px rgba(12, 50, 99, 0.08)",
                        }}
                        title="Share link"
                    >
                        <Share size={18} color="currentColor" />
                    </button>
                </div>

                {/* Hero Voucher Ticket Card (Inspired by StableMoney reference) */}
                <div 
                    className="relative w-full rounded-[24px] overflow-hidden p-6 sm:p-7 flex flex-col justify-between"
                    style={{
                        background: isDark
                            ? "linear-gradient(135deg, #14171d 0%, #0a0c0f 100%)"
                            : "linear-gradient(135deg, rgba(201, 224, 255, 0.65) 0%, #FFFFFF 85%)",
                        border: isDark
                            ? "1px solid rgba(255, 255, 255, 0.12)"
                            : "1.5px solid #FFFFFF",
                        boxShadow: isDark
                            ? "inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 10px 30px rgba(0, 0, 0, 0.55)"
                            : "0 8px 30px rgba(12, 50, 99, 0.08)",
                    }}
                >
                    {/* Left & Right Semicircle Ticket Cutout Notches */}
                    <div 
                        className="absolute top-1/2 -translate-y-1/2 -left-[16px] w-[32px] h-[32px] rounded-full bg-[#F4F4F7] dark:bg-[#0b0e14] z-20 pointer-events-none"
                        style={{
                            boxShadow: !isDark ? "inset -2px 0 4px rgba(12, 50, 99, 0.05)" : "inset -2px 0 6px rgba(0, 0, 0, 0.5)",
                        }}
                    />
                    <div 
                        className="absolute top-1/2 -translate-y-1/2 -right-[16px] w-[32px] h-[32px] rounded-full bg-[#F4F4F7] dark:bg-[#0b0e14] z-20 pointer-events-none"
                        style={{
                            boxShadow: !isDark ? "inset 2px 0 4px rgba(12, 50, 99, 0.05)" : "inset 2px 0 6px rgba(0, 0, 0, 0.5)",
                        }}
                    />

                    {/* 3D Direct Bonus Icon Floating on Top-Left */}
                    <div className="absolute top-0 left-0 w-32 h-32 sm:w-40 sm:h-40 pointer-events-none z-0 opacity-95 overflow-hidden rounded-tl-[24px]">
                        <Image 
                            src={isDark ? "/3d-icons/direct.webp" : "/3d-icons/direct-light.webp"}
                            alt="Direct Bonus"
                            width={160}
                            height={160}
                            className="w-full h-full object-contain object-left-top"
                            priority
                        />
                    </div>

                    {/* Brand Pill */}
                    <div className="flex items-center gap-2 mb-3 relative z-10 pl-20 sm:pl-28">
                        <div className="w-7 h-7 rounded-full bg-white/80 dark:bg-white/10 p-1 flex items-center justify-center shadow-xs">
                            <Image 
                                src="/3d-icons/i6-coin-icon.webp" 
                                alt="i6" 
                                width={24} 
                                height={24} 
                                className="w-full h-full object-contain" 
                            />
                        </div>
                        <span className="text-xs font-semibold tracking-wide text-gray-800 dark:text-white">
                            Infinity Six Affiliate
                        </span>
                    </div>

                    {/* Headline */}
                    <div className="flex flex-col gap-1 relative z-10 pl-20 sm:pl-28">
                        <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-[#848e9c] font-medium">
                            Friends You Refer
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
                            EARN 5.00% <span className="text-[#0072ED] dark:text-[#FCD535]">INSTANT</span>
                        </h2>
                    </div>

                    {/* Divider & Subtitle */}
                    <div className="mt-5 pt-3 border-t border-dashed border-gray-200/90 dark:border-white/10 relative z-10 flex items-center justify-between text-xs text-gray-500 dark:text-[#848e9c]">
                        <span>Credited on every direct deposit</span>
                        <span className="font-semibold text-emerald-600 dark:text-[#0ecb81]">100% On-Chain</span>
                    </div>
                </div>

                {/* Subtitle Message */}
                <div className="text-center flex flex-col items-center gap-1 mt-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        Invite friends using your unique referral link
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-[#848e9c] max-w-sm">
                        Build your team and earn direct bonuses plus 10-level matrix income with automated smart contract payouts.
                    </p>
                </div>

                {/* Dual Reward Split Blocks (with '+' Connector) */}
                <div className="grid grid-cols-2 gap-3 relative items-center">
                    {/* Left Block: THEY GET */}
                    <div 
                        className="rounded-2xl p-4 flex flex-col items-center text-center justify-center gap-1 relative overflow-hidden"
                        style={{
                            background: isDark
                                ? "linear-gradient(135deg, #14171d 0%, #0a0c0f 100%)"
                                : "linear-gradient(135deg, rgba(201, 224, 255, 0.65) 0%, #FFFFFF 85%)",
                            border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1.5px solid #FFFFFF",
                            boxShadow: isDark
                                ? "inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 4px 14px rgba(0, 0, 0, 0.35)"
                                : "0 3px 12px rgba(12, 50, 99, 0.06)",
                        }}
                    >
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#848e9c]">
                            They Get
                        </span>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-gray-900 dark:text-white tracking-tight">
                            250%
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-[#0ecb81] font-medium">
                            Max Compounding ROI
                        </span>
                    </div>

                    {/* Center '+' Connector Badge */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-[#1f242e] border-2 border-[#F4F4F7] dark:border-[#0b0e14] flex items-center justify-center shadow-md z-20 text-gray-800 dark:text-white font-bold text-sm">
                        +
                    </div>

                    {/* Right Block: YOU GET */}
                    <div 
                        className="rounded-2xl p-4 flex flex-col items-center text-center justify-center gap-1 relative overflow-hidden"
                        style={{
                            background: isDark
                                ? "linear-gradient(135deg, #14171d 0%, #0a0c0f 100%)"
                                : "linear-gradient(135deg, rgba(201, 224, 255, 0.65) 0%, #FFFFFF 85%)",
                            border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1.5px solid #FFFFFF",
                            boxShadow: isDark
                                ? "inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 4px 14px rgba(0, 0, 0, 0.35)"
                                : "0 3px 12px rgba(12, 50, 99, 0.06)",
                        }}
                    >
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#848e9c]">
                            You Get
                        </span>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-[#0072ED] dark:text-[#FCD535] tracking-tight">
                            5.00%
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-[#0ecb81] font-medium">
                            Instant Direct Bonus
                        </span>
                    </div>
                </div>

                {/* Referral Link & Code Box */}
                <div 
                    className="rounded-[22px] p-4 sm:p-5 flex flex-col gap-3"
                    style={{
                        background: isDark
                            ? "linear-gradient(135deg, #14171d 0%, #0a0c0f 100%)"
                            : "linear-gradient(135deg, rgba(201, 224, 255, 0.65) 0%, #FFFFFF 85%)",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1.5px solid #FFFFFF",
                        boxShadow: isDark
                            ? "inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 4px 14px rgba(0, 0, 0, 0.35)"
                            : "0 3px 12px rgba(12, 50, 99, 0.06)",
                    }}
                >
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-900 dark:text-white">
                            Your Unique Referral Link
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowQr(!showQr)}
                            className="text-[11px] text-[#0072ED] dark:text-[#FCD535] font-medium hover:underline flex items-center gap-1 cursor-pointer"
                        >
                            <ScanBarcode size={14} color="currentColor" />
                            <span>{showQr ? "Hide QR" : "Show QR"}</span>
                        </button>
                    </div>

                    {/* Link Bar with 1-Click Copy */}
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/5 dark:bg-black/40 border border-black/5 dark:border-white/5">
                        <span className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate pl-1">
                            {referralLink}
                        </span>
                        <button
                            type="button"
                            onClick={copyLink}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shrink-0 cursor-pointer shadow-xs"
                            style={isDark ? {
                                background: "#FCD535",
                                color: "#0b0e14",
                            } : {
                                background: "#0072ED",
                                color: "#FFFFFF",
                            }}
                        >
                            <Copy size={14} color="currentColor" />
                            <span>Copy</span>
                        </button>
                    </div>

                    {/* Sponsor Code Bar */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#848e9c] pt-1">
                        <span>Sponsor Address: <strong className="font-mono text-gray-900 dark:text-white">{shortAddress}</strong></span>
                        <button
                            type="button"
                            onClick={copyCode}
                            className="text-xs text-[#0072ED] dark:text-[#FCD535] hover:underline font-medium cursor-pointer flex items-center gap-1"
                        >
                            <Copy size={12} color="currentColor" />
                            <span>Copy Code</span>
                        </button>
                    </div>

                    {/* Optional QR Code Drawer */}
                    <AnimatePresence>
                        {showQr && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col items-center justify-center p-4 bg-white dark:bg-[#191d24] rounded-xl mt-1 border border-gray-100 dark:border-white/5"
                            >
                                <svg viewBox="0 0 100 100" className="w-32 h-32 text-slate-900 dark:text-white">
                                    <rect x="0" y="0" width="100" height="100" fill="transparent"/>
                                    <rect x="6" y="6" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="5"/>
                                    <rect x="13" y="13" width="12" height="12" rx="2" fill="currentColor"/>
                                    <rect x="68" y="6" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="5"/>
                                    <rect x="75" y="13" width="12" height="12" rx="2" fill="currentColor"/>
                                    <rect x="6" y="68" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="5"/>
                                    <rect x="13" y="75" width="12" height="12" rx="2" fill="currentColor"/>
                                    <rect x="42" y="8" width="6" height="16" rx="1" fill="currentColor"/>
                                    <rect x="52" y="12" width="8" height="6" rx="1" fill="currentColor"/>
                                    <rect x="40" y="38" width="18" height="6" rx="1" fill="currentColor"/>
                                    <rect x="66" y="42" width="12" height="6" rx="1" fill="currentColor"/>
                                    <rect x="8" y="42" width="14" height="6" rx="1" fill="currentColor"/>
                                    <rect x="42" y="52" width="6" height="20" rx="1" fill="currentColor"/>
                                    <rect x="56" y="64" width="18" height="6" rx="1" fill="currentColor"/>
                                    <rect x="66" y="76" width="10" height="16" rx="1" fill="currentColor"/>
                                    <rect x="80" y="62" width="12" height="6" rx="1" fill="currentColor"/>
                                    <rect x="44" y="80" width="14" height="12" rx="1" fill="currentColor"/>
                                </svg>
                                <span className="text-[10px] text-gray-400 font-mono mt-1">Scan to register directly</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 3 Step Guide (How It Works) */}
                <div 
                    className="rounded-[22px] p-5 flex flex-col gap-3"
                    style={{
                        background: isDark
                            ? "linear-gradient(135deg, #14171d 0%, #0a0c0f 100%)"
                            : "linear-gradient(135deg, rgba(201, 224, 255, 0.65) 0%, #FFFFFF 85%)",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1.5px solid #FFFFFF",
                        boxShadow: isDark
                            ? "inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 4px 14px rgba(0, 0, 0, 0.35)"
                            : "0 3px 12px rgba(12, 50, 99, 0.06)",
                    }}
                >
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        How Referral Rewards Work
                    </span>

                    <div className="flex flex-col gap-3 text-xs">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                1
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-900 dark:text-white">Share your link</span>
                                <span className="text-gray-500 dark:text-[#848e9c]">Send your unique affiliate invite link or QR code to your network.</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                2
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-900 dark:text-white">Friend stakes USDT</span>
                                <span className="text-gray-500 dark:text-[#848e9c]">They activate any deposit contract starting from 10 USDT.</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                3
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-900 dark:text-white">Instant 5% payout</span>
                                <span className="text-gray-500 dark:text-[#848e9c]">5% USDT commission is immediately credited on-chain to your available balance.</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Sticky Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none px-0">
                <div className="w-full max-w-lg mx-auto bg-white/95 dark:bg-[#14171d]/95 backdrop-blur-md rounded-t-[32px] rounded-b-none border-t border-x border-gray-100/90 dark:border-[#20252d] px-5 pt-4 pb-6 flex flex-col gap-3 shadow-[0_-10px_35px_rgba(12,50,99,0.08)] dark:shadow-[0_-10px_35px_rgba(0,0,0,0.65)] pointer-events-auto transition-colors duration-200">
                    <button
                        type="button"
                        onClick={handleShare}
                        className="relative flex items-center justify-center gap-2 h-[54px] w-full rounded-full overflow-hidden select-none transition-all duration-300 font-medium text-sm sm:text-base cursor-pointer hover:brightness-105 active:scale-[0.99] shadow-md"
                        style={isDark ? {
                            background: "#FCD535",
                            color: "#0b0e14",
                            boxShadow: "0 4px 14px rgba(252, 213, 53, 0.25)",
                        } : {
                            background: "#0072ED",
                            color: "#FFFFFF",
                            boxShadow: "inset 4px 6px 10.8px rgba(255, 255, 255, 0.4), 0 4px 14px rgba(0, 114, 237, 0.25)",
                        }}
                    >
                        <Share size={18} color="currentColor" />
                        <span>Invite Friends &amp; Earn 5%</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
