"use client";

import { useState } from "react";
import Image from "next/image";
import { TickCircle, Copy } from "iconsax-react";
import { useTheme } from "@/app/context/ThemeContext";
import IncomeInfoSheet from "../sheets/IncomeInfoSheet";

interface UplineIncomeCardProps {
    isUplineEligible: boolean;
    pendingUpline: number;
    uplineDepProgressText: string;
    uplineDirProgressText: string | number;
    uplines: { l1: string; l2: string; l3: string };
    uplineCopied: { [key: string]: boolean };
    onCopyUpline: (key: string, address: string) => void;
}

export default function UplineIncomeCard({
    isUplineEligible,
    pendingUpline,
    uplineDepProgressText,
    uplineDirProgressText,
    uplines,
    uplineCopied,
    onCopyUpline,
}: UplineIncomeCardProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [showInfo, setShowInfo] = useState(false);

    return (
        <>
            <div 
                className="relative w-full p-4 sm:p-5 flex flex-col gap-3.5 select-none rounded-2xl overflow-hidden transition-all duration-200"
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
                {/* Top row: Large 3D icon on the left, Title & Big Number beside it on the right, Status Pill + Question Mark on Far Right */}
                <div className="flex items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        {/* Top-left Full Size 3D Icon (Matching DailyRoiCard scale) */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 relative flex items-center justify-center shrink-0 -my-1 -ml-1">
                            <Image 
                                src={isDark ? "/3d-icons/upline-dark-v3.webp" : "/3d-icons/upline-light-v2.webp"}
                                alt="Upline Income"
                                width={96}
                                height={96}
                                className="w-full h-full object-contain"
                                priority
                            />
                        </div>

                        {/* Title and Number on right side beside icon */}
                        <div className="flex flex-col justify-center min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-100 leading-tight">
                                    Upline Income
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowInfo(true);
                                    }}
                                    aria-label="Upline Income Details"
                                    className="text-gray-400 hover:text-gray-800 dark:text-gray-400 dark:hover:text-[#FCD535] transition-all hover:scale-110 active:scale-95 cursor-pointer shrink-0 p-0.5"
                                >
                                    <svg width="17" height="17" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8 14.667A6.667 6.667 0 108 1.333a6.667 6.667 0 000 13.334z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M6.15 6.15a2 2 0 013.7.75c0 1.25-1.85 1.75-1.85 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M8 11.667h.007" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                            <div className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-white font-mono tracking-tight truncate mt-0.5">
                                ${pendingUpline.toFixed(6)}
                            </div>
                        </div>
                    </div>

                    {/* Right side status pill */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium shadow-xs ${
                            isUplineEligible 
                                ? "bg-[#0072ED]/10 text-[#0072ED] dark:bg-[#FCD535]/15 dark:text-[#FCD535]" 
                                : "bg-[#F4F4F7] dark:bg-[#191d24] text-gray-500 dark:text-[#848e9c]"
                        }`}>
                            {isUplineEligible ? "Qualified" : "Not Qualified"}
                        </span>
                    </div>
                </div>

                {/* Inner progress boxes */}
                <div className="relative z-10 grid grid-cols-2 gap-2 text-xs text-[var(--text-soft)]">
                    <div className="flex justify-between p-3 rounded-xl bg-[#F8F9FB] dark:bg-[#191d24] border border-gray-100/80 dark:border-white/5">
                        <span>Deposit:</span>
                        <span className="font-medium text-[var(--text-main)]">{uplineDepProgressText} / $1,500</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-[#F8F9FB] dark:bg-[#191d24] border border-gray-100/80 dark:border-white/5">
                        <span>Direct Partners:</span>
                        <span className="font-medium text-[var(--text-main)]">{uplineDirProgressText} / 5</span>
                    </div>
                </div>

                {isUplineEligible && (
                    <div className="relative z-10 flex flex-col gap-2 pt-1 text-xs">
                        <span className="text-[var(--text-soft)] font-medium">Your 3-Level Sponsor Beneficiaries:</span>
                        {[
                            { level: "L1 Sponsor (5%)", addr: uplines.l1, key: "l1" },
                            { level: "L2 Sponsor (3%)", addr: uplines.l2, key: "l2" },
                            { level: "L3 Sponsor (2%)", addr: uplines.l3, key: "l3" },
                        ].map((u) => (
                            <div key={u.key} className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F9FB] dark:bg-[#191d24] border border-gray-100/80 dark:border-white/5">
                                <span className="text-gray-500 dark:text-[#848e9c]">{u.level}</span>
                                <div className="flex items-center gap-1.5 font-mono text-[var(--text-main)]">
                                    <span>{u.addr && u.addr !== "None" ? `${u.addr.slice(0, 6)}...${u.addr.slice(-4)}` : "Genesis"}</span>
                                    {u.addr && u.addr !== "None" && (
                                        <button
                                            type="button"
                                            onClick={() => onCopyUpline(u.key, u.addr)}
                                            className="text-gray-400 dark:text-[#848e9c] hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                                        >
                                            {uplineCopied[u.key] ? <TickCircle size={12} color="#10B981" /> : <Copy size={12} color="currentColor" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Information Sheet */}
            <IncomeInfoSheet
                open={showInfo}
                onClose={() => setShowInfo(false)}
                title="3-Level Upline Income"
                typeLabel="Upline Share"
                iconSrc={isDark ? "/3d-icons/upline-dark-v3.webp" : "/3d-icons/upline-light-v2.webp"}
                iconPosition="center"
                description="Earn a percentage share from the daily earnings of your 3 sponsor uplines above you (Level 1: 5%, Level 2: 3%, Level 3: 2%) once qualified with $1,500 deposit and 5 direct partners."
                rateOrYield={isUplineEligible ? "Status: Qualified & Active" : "Status: In Progress"}
                stats={[
                    { label: "Pending Upline Share", value: `$${pendingUpline.toFixed(6)}`, isGold: true },
                    { label: "Personal Deposit Progress", value: `${uplineDepProgressText} / $1,500` },
                    { label: "Direct Partners Progress", value: `${uplineDirProgressText} / 5 Directs` },
                ]}
            />
        </>
    );
}
