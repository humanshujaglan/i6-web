"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, ScanBarcode, Flash } from "iconsax-react";
import { useTheme } from "@/app/context/ThemeContext";
import { useDashboard } from "../../DashboardContext";
import { GENESIS_ADDRESS } from "@/lib/contracts/abis";
import CopyAlert from "../CopyAlert";

interface SponsorAddressCardProps {
    sponsorAddress?: string;
    userAddress?: string;
}

export default function SponsorAddressCard({ sponsorAddress, userAddress }: SponsorAddressCardProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const { userAddress: contextAddress } = useDashboard();
    
    const [copied, setCopied] = useState(false);
    const [alertMessage, setAlertMessage] = useState("Referral link copied to clipboard!");
    const [showQr, setShowQr] = useState(false);

    const activeAddress = userAddress || contextAddress || "";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://infinitysix.io";
    const referralLink = activeAddress ? `${origin}/register?ref=${activeAddress}` : `${origin}/register`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            setAlertMessage("Referral link copied to clipboard!");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error("Copy failed", e);
        }
    };

    const isGenesisOrNone = !sponsorAddress || 
        sponsorAddress === "0x0000000000000000000000000000000000000000" || 
        sponsorAddress.toLowerCase() === GENESIS_ADDRESS.toLowerCase();

    const formattedSponsor = isGenesisOrNone 
        ? "Genesis Root Sponsor" 
        : `${sponsorAddress.slice(0, 6)}...${sponsorAddress.slice(-4)}`;

    const handleCopySponsor = async () => {
        if (!sponsorAddress || isGenesisOrNone) return;
        try {
            await navigator.clipboard.writeText(sponsorAddress);
            setAlertMessage("Sponsor address copied to clipboard!");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error("Copy failed", e);
        }
    };

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(referralLink)}`;

    return (
        <>
            <CopyAlert show={copied} message={alertMessage} />

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
                {/* Top-left corner icon */}
                <div className="absolute top-0 left-0 w-20 h-20 sm:w-24 sm:h-24 pointer-events-none z-0 overflow-hidden rounded-tl-2xl">
                    <Image 
                        src={isDark ? "/3d-icons/sponsor-dark.png" : "/3d-icons/sponsor-light.png"} 
                        alt="Referral" 
                        width={96} 
                        height={96} 
                        className="w-full h-full object-contain object-left-top" 
                        priority
                    />
                </div>

                {/* Header: Title, Badge, QR Toggle */}
                <div className="flex items-center justify-between gap-2 relative z-10 pl-16 sm:pl-20 min-h-[40px]">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                            Referral Link
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] shrink-0 flex items-center gap-0.5">
                            <Flash size={10} color="currentColor" variant="Bold" />
                            5% Instant Bonus
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowQr(prev => !prev)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 transition-all cursor-pointer shadow-xs shrink-0"
                    >
                        <ScanBarcode size={14} color={isDark ? "#FCD535" : "#0072ED"} />
                        <span>{showQr ? "Hide QR" : "Show QR"}</span>
                    </button>
                </div>

                {/* Referral Link Box with 1-Click Copy */}
                <div className="flex items-center justify-between gap-2 p-1.5 pl-3 rounded-xl bg-white/90 dark:bg-[#0a0c0f]/60 border border-gray-200 dark:border-white/10 shadow-xs relative z-10">
                    <span className="text-xs font-mono text-gray-800 dark:text-gray-100 truncate">
                        {referralLink}
                    </span>
                    <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shrink-0 cursor-pointer shadow-xs"
                        style={isDark ? {
                            background: "#FCD535",
                            color: "#0b0e14",
                        } : {
                            background: "#0072ED",
                            color: "#FFFFFF",
                        }}
                    >
                        <Copy size={13} color="currentColor" />
                        <span>Copy</span>
                    </button>
                </div>

                {/* Collapsible QR Code Box */}
                <AnimatePresence>
                    {showQr && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            className="overflow-hidden flex flex-col items-center justify-center p-4 bg-white/90 dark:bg-[#0a0c0f]/60 rounded-xl border border-gray-200 dark:border-white/10 mt-1 relative z-10"
                        >
                            <div className="bg-white p-2.5 rounded-xl shadow-xs border border-gray-100 dark:border-white/10">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={qrUrl}
                                    alt="Referral QR Code"
                                    width={180}
                                    height={180}
                                    className="w-40 h-40 object-contain rounded-lg"
                                />
                            </div>
                            <span className="text-[11px] text-gray-500 dark:text-[#848e9c] font-mono mt-2.5 text-center">
                                Scan with camera to register under your referral link
                            </span>

                            <div className="flex items-center gap-2 mt-3">
                                <a
                                    href={qrUrl}
                                    download="infinitysix-referral-qr.png"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-white transition-all cursor-pointer"
                                >
                                    Download QR
                                </a>
                                <button
                                    type="button"
                                    onClick={handleCopyLink}
                                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
                                    style={isDark ? {
                                        background: "#FCD535",
                                        color: "#0b0e14",
                                    } : {
                                        background: "#0072ED",
                                        color: "#FFFFFF",
                                    }}
                                >
                                    Copy Link
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Sponsor Address Section with Copy Option */}
                <div className="pt-2.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2 relative z-10">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 shrink-0">
                            Invited by Sponsor:
                        </span>
                        <span className="text-xs sm:text-sm font-mono font-semibold text-gray-900 dark:text-white truncate">
                            {formattedSponsor}
                        </span>
                    </div>

                    {!isGenesisOrNone && (
                        <button
                            type="button"
                            onClick={handleCopySponsor}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-white transition-all active:scale-95 cursor-pointer shrink-0 shadow-2xs"
                            title="Copy Sponsor Address"
                        >
                            <Copy size={13} color="currentColor" />
                            <span>Copy</span>
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
