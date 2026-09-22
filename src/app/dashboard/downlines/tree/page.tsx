"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import { useDashboard } from "../../DashboardContext";
import UserGate from "../../UserGate";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
    ArrowLeft2,
    Verify,
    Bookmark,
    TickCircle,
    DocumentText,
    Building,
    Wallet3,
    MoneySend,
    Clock,
    Global,
    ExportSquare,
    People,
    Briefcase,
    Crown,
} from "iconsax-react";

interface NodeInfo {
    address: string;
    deposit: number;
    directCount: number;
    isCapped: boolean;
    isActive: boolean;
}

interface UserDetail {
    totalDeposits: string;
    firstInvestment: string;
    activeon: string;
    referrer: string;
    isCapped: boolean;
    totalWithdrawn: string;
    lastWithdrawTime: string;
    directCount?: string;
    directVolume?: string;
    teamVolume?: string;
    totalDownlineBusiness?: string;
    currentRank?: number;
    currentRwpRate?: string;
    isBoosted?: boolean;
}

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

function fmtUsd(wei: string) {
    if (!wei || wei === "0") return "$0.00";
    try {
        return `$${parseFloat(ethers.formatUnits(wei, 18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } catch {
        return "$0.00";
    }
}

function fmtDate(ts: string) {
    const n = Number(ts);
    if (!n) return "—";
    return new Date(n * 1000).toLocaleString(undefined, { dateStyle: "medium" });
}

function UserDetailSheet({ address, onClose }: { address: string; onClose: () => void }) {
    const { setIsModalOpen } = useDashboard();
    const [detail, setDetail] = useState<UserDetail | null>(null);
    const [error, setError] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "contract">("overview");

    useEffect(() => {
        setIsModalOpen(true);
        if (typeof document !== "undefined") {
            document.body.classList.add("modal-sheet-open");
        }
        return () => {
            setIsModalOpen(false);
            if (typeof document !== "undefined") {
                document.body.classList.remove("modal-sheet-open");
            }
        };
    }, [setIsModalOpen]);

    useEffect(() => {
        let cancelled = false;
        fetch(`/api/downlines/${address}?type=detail`)
            .then((r) => {
                if (!r.ok) throw new Error("failed");
                return r.json();
            })
            .then((json) => {
                if (!cancelled) setDetail(json.data);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            });
        return () => { cancelled = true; };
    }, [address]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;

    return (
        <div 
            className="fixed inset-0 z-[9999] bg-black/45 dark:bg-black/70 backdrop-blur-2xl flex flex-col justify-end items-center sm:p-4 overflow-hidden" 
            onClick={onClose}
        >
            <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className="w-full max-w-md bg-[#F4F6F8] dark:bg-[#0b0e14] rounded-t-[44px] sm:rounded-[44px] px-5 pt-4 pb-7 flex flex-col gap-3 max-h-[90vh] overflow-y-auto shadow-[0_-12px_45px_rgba(0,0,0,0.3)] transition-all relative border border-transparent dark:border-white/5 no-scrollbar"
                onClick={(e) => e.stopPropagation()}
                style={{
                    borderRadius: "44px",
                    // @ts-ignore
                    "--corner-shape": "squircle",
                    cornerShape: "squircle",
                    WebkitCornerSmoothing: 1,
                    cornerSmoothing: "100%",
                } as any}
            >
                {/* Grabber Handle */}
                <div className="w-12 h-1.5 bg-gray-300/80 dark:bg-white/20 rounded-full mx-auto -mt-1 mb-1" />

                {/* 1. Top Header Bar (Back circle, Title + Verified Check, Bookmark circle) */}
                <div className="flex items-center justify-between">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white dark:bg-[#14171d] flex items-center justify-center text-gray-700 dark:text-white hover:scale-105 transition-all cursor-pointer border border-gray-100 dark:border-white/5 shadow-xs"
                    >
                        <ArrowLeft2 size={18} color="currentColor" />
                    </button>

                    <div className="flex items-center gap-1.5 font-medium text-sm text-gray-900 dark:text-white">
                        <span>Partner Profile</span>
                        <Verify size={16} color="#0072ED" variant="Bold" />
                    </div>

                    <button 
                        type="button" 
                        onClick={handleCopy}
                        title="Copy Address"
                        className="w-10 h-10 rounded-full bg-white dark:bg-[#14171d] flex items-center justify-center text-rose-500 hover:scale-105 transition-all cursor-pointer border border-gray-100 dark:border-white/5 shadow-xs"
                    >
                        {copied ? <TickCircle size={18} color="#10B981" /> : <Bookmark size={18} color="#FE7331" variant="Bold" />}
                    </button>
                </div>

                {/* 2. Main Profile Card with Continuous Dome SVG Shape */}
                <div className="relative mt-3 w-full flex flex-col items-center">
                    {/* Top Continuous Curved Dome SVG */}
                    <div className="w-full text-white dark:text-[#14171d] fill-current relative">
                        <svg 
                            viewBox="0 0 400 80" 
                            className="w-full h-[76px] fill-current drop-shadow-[0_-6px_14px_rgba(0,0,0,0.03)]"
                            preserveAspectRatio="none"
                        >
                            <path d="M 0,80 L 0,60 Q 0,28 32,28 L 138,28 C 156,28 164,24 172,16 C 182,6 189,0 200,0 C 211,0 218,6 228,16 C 236,24 244,28 262,28 L 368,28 Q 400,28 400,60 L 400,80 Z" />
                        </svg>

                        {/* Center Circular Profile Avatar inside the dome */}
                        <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-[60px] h-[60px] rounded-full bg-[#EAEBED] dark:bg-[#191d24] flex items-center justify-center p-1 border-2 border-white dark:border-[#14171d] shadow-sm">
                            <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden">
                                <Image 
                                    src="/3d-icons/boy.webp" 
                                    alt="User Avatar" 
                                    width={44} 
                                    height={44} 
                                    className="object-contain" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Profile Card Body seamlessly attached below */}
                    <div 
                        className="w-full bg-white dark:bg-[#14171d] rounded-b-[40px] px-6 pb-6 pt-1 flex flex-col items-center text-center gap-3 -mt-[1px] shadow-xs"
                        style={{
                            borderBottomLeftRadius: "40px",
                            borderBottomRightRadius: "40px",
                            // @ts-ignore
                            "--corner-shape": "squircle",
                            cornerShape: "squircle",
                            WebkitCornerSmoothing: 1,
                            cornerSmoothing: "100%",
                        } as any}
                    >
                        {/* Main Title & Subtitle */}
                        <div className="flex flex-col items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white font-mono tracking-tight flex items-center gap-1.5">
                                <span>{shortAddr}</span>
                            </h2>
                            <span className="text-sm font-medium text-gray-500 dark:text-[#848e9c] font-mono mt-0.5">
                                {detail ? fmtUsd(detail.totalDeposits) : "$0.00"}
                            </span>
                        </div>

                        {/* 3 Capsule Tags / Status Pills */}
                        <div className="flex items-center justify-center gap-2 flex-wrap pt-0.5">
                            <span className={`text-xs px-3.5 py-1 rounded-full font-medium flex items-center gap-1 ${
                                detail?.isCapped 
                                    ? "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                    : "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${detail?.isCapped ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
                                {detail?.isCapped ? (Number(detail?.directCount || 0) > 0 ? "Capped (6x)" : "Capped (2.5x)") : "Active & Uncapped"}
                            </span>
                            <span className="text-xs px-3.5 py-1 rounded-full bg-[#F4F6F8] dark:bg-[#191d24] text-gray-600 dark:text-[#848e9c] font-medium">
                                {Number(detail?.directCount || 0)} Directs
                            </span>
                            <span className="text-xs px-3.5 py-1 rounded-full bg-[#F4F6F8] dark:bg-[#191d24] text-gray-600 dark:text-[#848e9c] font-medium">
                                {detail?.currentRank ? `Rank ${detail.currentRank}` : "Frontline"}
                            </span>
                        </div>

                        {/* 2 Large Rounded Capsule Switcher Tabs (Description | Company) */}
                        <div className="flex items-center gap-3 w-full pt-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab("overview")}
                                className={`flex-1 py-3 px-4 rounded-full text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                                    activeTab === "overview"
                                        ? "bg-[#F8F9FB] dark:bg-[#191d24] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-semibold shadow-xs"
                                        : "bg-transparent border-gray-200/60 dark:border-white/5 text-gray-500 dark:text-[#848e9c]"
                                }`}
                            >
                                <DocumentText size={16} color="currentColor" />
                                <span>Description</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("contract")}
                                className={`flex-1 py-3 px-4 rounded-full text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                                    activeTab === "contract"
                                        ? "bg-[#F8F9FB] dark:bg-[#191d24] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-semibold shadow-xs"
                                        : "bg-transparent border-gray-200/60 dark:border-white/5 text-gray-500 dark:text-[#848e9c]"
                                }`}
                            >
                                <Building size={16} color="currentColor" />
                                <span>Company</span>
                            </button>
                        </div>
                    </div>
                </div>

                {activeTab === "overview" ? (
                    <>
                        <div className="bg-[#F8F9FB] dark:bg-[#191d24] rounded-2xl p-3.5 flex items-center justify-between text-xs border border-gray-100/80 dark:border-transparent mt-1">
                            <div className="flex flex-col items-center flex-1 text-center border-r border-gray-200/80 dark:border-white/5">
                                <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1 text-xs font-mono">
                                    {detail ? fmtUsd(detail.firstInvestment) : "—"}
                                </span>
                                <span className="text-[10px] text-[var(--text-soft)] mt-0.5">First Investment</span>
                            </div>

                            <div className="flex flex-col items-center flex-1 text-center border-r border-gray-200/80 dark:border-white/5">
                                <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1 text-xs">
                                    {detail ? fmtDate(detail.activeon) : "—"}
                                </span>
                                <span className="text-[10px] text-[var(--text-soft)] mt-0.5">Activated On</span>
                            </div>

                            <div className="flex flex-col items-center flex-1 text-center">
                                <span className="font-semibold text-emerald-600 dark:text-[#0ecb81] flex items-center gap-1 text-xs font-mono">
                                    {detail ? fmtUsd(detail.totalDownlineBusiness || detail.teamVolume || "0") : "$0.00"}
                                </span>
                                <span className="text-[10px] text-[var(--text-soft)] mt-0.5">Team Volume</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-1">
                            <div 
                                className="bg-[#F8F9FB] dark:bg-[#191d24] p-4 rounded-3xl flex flex-col justify-between border border-gray-100/80 dark:border-transparent min-h-[96px]"
                                style={{
                                    borderRadius: "24px",
                                    // @ts-ignore
                                    "--corner-shape": "squircle",
                                    cornerShape: "squircle",
                                    WebkitCornerSmoothing: 1,
                                    cornerSmoothing: "100%",
                                } as any}
                            >
                                <div className="text-gray-600 dark:text-[#848e9c]">
                                    <Wallet3 size={20} color="currentColor" />
                                </div>
                                <div className="flex flex-col mt-2">
                                    <span className="text-[10px] text-[var(--text-soft)]">Total Deposited</span>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white font-mono mt-0.5">
                                        {detail ? fmtUsd(detail.totalDeposits) : "$0.00"}
                                    </span>
                                </div>
                            </div>

                            <div 
                                className="bg-[#F8F9FB] dark:bg-[#191d24] p-4 rounded-3xl flex flex-col justify-between border border-gray-100/80 dark:border-transparent min-h-[96px]"
                                style={{
                                    borderRadius: "24px",
                                    // @ts-ignore
                                    "--corner-shape": "squircle",
                                    cornerShape: "squircle",
                                    WebkitCornerSmoothing: 1,
                                    cornerSmoothing: "100%",
                                } as any}
                            >
                                <div className="text-gray-600 dark:text-[#848e9c]">
                                    <MoneySend size={20} color="currentColor" />
                                </div>
                                <div className="flex flex-col mt-2">
                                    <span className="text-[10px] text-[var(--text-soft)]">Total Withdrawn</span>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white font-mono mt-0.5">
                                        {detail ? fmtUsd(detail.totalWithdrawn) : "$0.00"}
                                    </span>
                                </div>
                            </div>

                            <div 
                                className="bg-[#F8F9FB] dark:bg-[#191d24] p-4 rounded-3xl flex flex-col justify-between border border-gray-100/80 dark:border-transparent min-h-[96px]"
                                style={{
                                    borderRadius: "24px",
                                    // @ts-ignore
                                    "--corner-shape": "squircle",
                                    cornerShape: "squircle",
                                    WebkitCornerSmoothing: 1,
                                    cornerSmoothing: "100%",
                                } as any}
                            >
                                <div className="text-gray-600 dark:text-[#848e9c]">
                                    <Clock size={20} color="currentColor" />
                                </div>
                                <div className="flex flex-col mt-2">
                                    <span className="text-[10px] text-[var(--text-soft)]">Last Withdrawal</span>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white font-mono mt-0.5">
                                        {detail ? fmtDate(detail.lastWithdrawTime) : "—"}
                                    </span>
                                </div>
                            </div>

                            <div 
                                className="bg-[#F8F9FB] dark:bg-[#191d24] p-4 rounded-3xl flex flex-col justify-between border border-gray-100/80 dark:border-transparent min-h-[96px]"
                                style={{
                                    borderRadius: "24px",
                                    // @ts-ignore
                                    "--corner-shape": "squircle",
                                    cornerShape: "squircle",
                                    WebkitCornerSmoothing: 1,
                                    cornerSmoothing: "100%",
                                } as any}
                            >
                                <div className="text-gray-600 dark:text-[#848e9c]">
                                    <Global size={20} color="currentColor" />
                                </div>
                                <div className="flex flex-col mt-2">
                                    <span className="text-[10px] text-[var(--text-soft)]">Sponsor Referrer</span>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white font-mono mt-0.5 truncate">
                                        {detail?.referrer && detail.referrer !== ZERO_ADDR
                                            ? `${detail.referrer.slice(0, 6)}...${detail.referrer.slice(-4)}`
                                            : "Genesis"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-[#F8F9FB] dark:bg-[#191d24] rounded-2xl p-3.5 flex items-center justify-between text-xs border border-gray-100/80 dark:border-transparent mt-1">
                            <div className="flex flex-col items-center flex-1 text-center border-r border-gray-200/80 dark:border-white/5">
                                <span className="font-semibold text-gray-900 dark:text-white text-xs">BNB Smart Chain</span>
                                <span className="text-[10px] text-[var(--text-soft)] mt-0.5">Network</span>
                            </div>

                            <div className="flex flex-col items-center flex-1 text-center border-r border-gray-200/80 dark:border-white/5">
                                <span className="font-semibold text-gray-900 dark:text-white text-xs">USDT (BEP-20)</span>
                                <span className="text-[10px] text-[var(--text-soft)] mt-0.5">Asset</span>
                            </div>

                            <div className="flex flex-col items-center flex-1 text-center">
                                <span className="font-semibold text-emerald-600 dark:text-[#0ecb81] text-xs">300% Cap</span>
                                <span className="text-[10px] text-[var(--text-soft)] mt-0.5">Yield Limit</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-1">
                            <div 
                                className="bg-[#F8F9FB] dark:bg-[#191d24] p-4 rounded-3xl flex flex-col justify-between border border-gray-100/80 dark:border-transparent min-h-[96px]"
                                style={{
                                    borderRadius: "24px",
                                    // @ts-ignore
                                    "--corner-shape": "squircle",
                                    cornerShape: "squircle",
                                    WebkitCornerSmoothing: 1,
                                    cornerSmoothing: "100%",
                                } as any}
                            >
                                <div className="text-gray-600 dark:text-[#848e9c]">
                                    <People size={20} color="currentColor" />
                                </div>
                                <div className="flex flex-col mt-2">
                                    <span className="text-[10px] text-[var(--text-soft)]">Direct Referrals</span>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white font-mono mt-0.5">
                                        {Number(detail?.directCount || 0)} Members
                                    </span>
                                </div>
                            </div>

                            <div 
                                className="bg-[#F8F9FB] dark:bg-[#191d24] p-4 rounded-3xl flex flex-col justify-between border border-gray-100/80 dark:border-transparent min-h-[96px]"
                                style={{
                                    borderRadius: "24px",
                                    // @ts-ignore
                                    "--corner-shape": "squircle",
                                    cornerShape: "squircle",
                                    WebkitCornerSmoothing: 1,
                                    cornerSmoothing: "100%",
                                } as any}
                            >
                                <div className="text-gray-600 dark:text-[#848e9c]">
                                    <Briefcase size={20} color="currentColor" />
                                </div>
                                <div className="flex flex-col mt-2">
                                    <span className="text-[10px] text-[var(--text-soft)]">Direct Volume</span>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white font-mono mt-0.5">
                                        {detail?.directVolume ? fmtUsd(detail.directVolume) : "$0.00"}
                                    </span>
                                </div>
                            </div>

                            <div 
                                className="bg-[#F8F9FB] dark:bg-[#191d24] p-4 rounded-3xl flex flex-col justify-between border border-gray-100/80 dark:border-transparent min-h-[96px]"
                                style={{
                                    borderRadius: "24px",
                                    // @ts-ignore
                                    "--corner-shape": "squircle",
                                    cornerShape: "squircle",
                                    WebkitCornerSmoothing: 1,
                                    cornerSmoothing: "100%",
                                } as any}
                            >
                                <div className="text-gray-600 dark:text-[#848e9c]">
                                    <Crown size={20} color="currentColor" />
                                </div>
                                <div className="flex flex-col mt-2">
                                    <span className="text-[10px] text-[var(--text-soft)]">Leadership Rank</span>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white font-mono mt-0.5">
                                        {detail?.currentRank ? `Rank ${detail.currentRank}` : "No Rank"}
                                    </span>
                                </div>
                            </div>

                            <div 
                                className="bg-[#F8F9FB] dark:bg-[#191d24] p-4 rounded-3xl flex flex-col justify-between border border-gray-100/80 dark:border-transparent min-h-[96px]"
                                style={{
                                    borderRadius: "24px",
                                    // @ts-ignore
                                    "--corner-shape": "squircle",
                                    cornerShape: "squircle",
                                    WebkitCornerSmoothing: 1,
                                    cornerSmoothing: "100%",
                                } as any}
                            >
                                <div className="text-gray-600 dark:text-[#848e9c]">
                                    <TickCircle size={20} color="currentColor" />
                                </div>
                                <div className="flex flex-col mt-2">
                                    <span className="text-[10px] text-[var(--text-soft)]">Daily Yield</span>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white font-mono mt-0.5">
                                        {detail?.currentRwpRate ? `${Number(detail.currentRwpRate)/10}%` : "0.5%"} Daily
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <a
                    href={`https://bscscan.com/address/${address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3.5 rounded-full bg-[#0072ED] dark:bg-[#FCD535] text-white dark:text-[#0b0e14] text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] shadow-md cursor-pointer mt-2"
                >
                    <ExportSquare size={16} color="currentColor" />
                    <span>View On BscScan</span>
                </a>
            </motion.div>
        </div>
    );
}

function TreeNodeCard({
    node,
    focused,
    syncing,
    onSelect,
    onDrill,
}: {
    node: NodeInfo;
    focused: boolean;
    syncing?: boolean;
    onSelect: () => void;
    onDrill?: () => void;
}) {
    const [copied, setCopied] = useState(false);
    const short = `${node.address.slice(0, 6)}...${node.address.slice(-4)}`;

    const statusClass = node.isCapped ? "status-capped" : node.isActive ? "status-active" : "status-inactive";
    const statusLabel = node.isCapped ? "Capped" : node.isActive ? "Active" : "Inactive";
    const hasChildren = node.directCount > 0;

    const copyAddr = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(node.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // clipboard unavailable, ignore
        }
    };

    return (
        <div
            className={[
                "tree-node-card",
                focused ? "tree-node-root" : "",
                syncing ? "tree-node-syncing" : "",
            ].filter(Boolean).join(" ")}
            onClick={onSelect}
            style={{ cursor: "pointer" }}
        >
            <div className="tree-node-top">
                <span className={`tree-node-status-dot ${statusClass}`} title={statusLabel} />
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {statusLabel}
                </span>
            </div>

            <div className="tree-node-addr">
                <span>{short}</span>
                <i className="fas fa-copy copy-icon-small" onClick={copyAddr} title="Copy address"></i>
                {copied && <span className="tree-node-copied">Copied</span>}
            </div>

            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "monospace", marginTop: "4px" }}>
                ${node.deposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <div className="tree-node-bottom">
                <span className="tree-child-count-badge">
                    <i className="fas fa-users" style={{ fontSize: "0.7rem" }}></i> {node.directCount}
                </span>
                {!focused && hasChildren && (
                    <button className="tree-expand-btn" onClick={(e) => { e.stopPropagation(); onDrill?.(); }}>
                        <i className="fas fa-chevron-right"></i> Expand
                    </button>
                )}
            </div>
        </div>
    );
}

function Breadcrumb({
    path,
    nodeInfo,
    onJump,
}: {
    path: string[];
    nodeInfo: Map<string, NodeInfo>;
    onJump: (index: number) => void;
}) {
    return (
        <div className="tree-breadcrumb">
            {path.map((addr, i) => {
                const isLast = i === path.length - 1;
                const label = i === 0 ? "You" : `${addr.slice(0, 6)}...${addr.slice(-4)}`;
                return (
                    <span key={addr} className="tree-breadcrumb-item">
                        {i > 0 && <i className="fas fa-chevron-right tree-breadcrumb-sep"></i>}
                        <button
                            className={`tree-breadcrumb-btn ${isLast ? "active" : ""}`}
                            onClick={() => onJump(i)}
                            disabled={isLast}
                        >
                            {label}
                        </button>
                    </span>
                );
            })}
        </div>
    );
}

export default function TreeVisualizerPage() {
    const { userAddress, user, error, refreshData } = useDashboard();
    const [nodeInfo, setNodeInfo] = useState<Map<string, NodeInfo>>(new Map());
    const [childrenOf, setChildrenOf] = useState<Map<string, NodeInfo[]>>(new Map());
    const [focusPath, setFocusPath] = useState<string[]>([]);
    const [loadingAddr, setLoadingAddr] = useState<string | null>(null);
    const [syncingAddr, setSyncingAddr] = useState<string | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const rootInitRef = useRef(false);

    // Redis is the priority source for children lookups (see reader-downlines.ts) — this only
    // hits the RPC when a node's children were never warmed/cached yet.
    const fetchChildren = useCallback(async (address: string) => {
        const key = address.toLowerCase();
        setLoadingAddr(key);

        let hadCache = false;
        try {
            const cachedRes = await fetch(`/api/downlines/${address}?type=children&mode=cached`);
            if (cachedRes.ok) {
                const cachedJson = await cachedRes.json();
                if (cachedJson.found && Array.isArray(cachedJson.data)) {
                    hadCache = true;
                    const data: NodeInfo[] = cachedJson.data;
                    setChildrenOf((prev) => new Map(prev).set(key, data));
                    setNodeInfo((prev) => {
                        const next = new Map(prev);
                        data.forEach((d) => next.set(d.address.toLowerCase(), d));
                        return next;
                    });
                }
            }
        } catch {
            // Redis/cache path unavailable — fall straight through to the live RPC check below
        }

        try {
            const liveRes = await fetch(`/api/downlines/${address}?type=children&mode=live`);
            if (!liveRes.ok) throw new Error("live fetch failed");
            const liveJson = await liveRes.json();
            const liveData: NodeInfo[] = liveJson.data || [];

            setChildrenOf((prev) => new Map(prev).set(key, liveData));
            setNodeInfo((prev) => {
                const next = new Map(prev);
                liveData.forEach((d) => next.set(d.address.toLowerCase(), d));
                return next;
            });
            setLoadingAddr((cur) => (cur === key ? null : cur));

            if (hadCache && liveJson.updated) {
                setSyncingAddr(key);
                setTimeout(() => setSyncingAddr((cur) => (cur === key ? null : cur)), 1100);
            }
        } catch {
            setLoadingAddr((cur) => (cur === key ? null : cur));
        }
    }, []);

    // Seed the root from the already-loaded dashboard context, kick off a background
    // whole-subtree cache warm, and fetch the root's first level of children.
    useEffect(() => {
        if (!rootInitRef.current && userAddress && user) {
            rootInitRef.current = true;
            const deposit = parseFloat(ethers.formatUnits(user.totalDeposits, 18));
            const rootInfo: NodeInfo = {
                address: userAddress,
                deposit,
                directCount: Number(user.directCount),
                isCapped: user.isCapped,
                isActive: deposit > 0 && !user.isCapped,
            };
            setNodeInfo(new Map([[userAddress.toLowerCase(), rootInfo]]));
            setFocusPath([userAddress]);

            fetch(`/api/downlines/${userAddress}?type=warmtree`).catch(() => {});

            if (rootInfo.directCount > 0) fetchChildren(userAddress);
        }
    }, [userAddress, user, fetchChildren]);

    const drillInto = (address: string) => {
        setFocusPath((prev) => [...prev, address]);
        if (!childrenOf.has(address.toLowerCase())) fetchChildren(address);
    };

    const jumpTo = (index: number) => {
        setFocusPath((prev) => prev.slice(0, index + 1));
    };

    if (!user) {
        return <UserGate error={error} onRetry={refreshData} />;
    }

    const focusedAddress = focusPath[focusPath.length - 1];
    const focusedKey = focusedAddress?.toLowerCase();
    const focusedNode = focusedKey ? nodeInfo.get(focusedKey) : undefined;
    const children = focusedKey ? childrenOf.get(focusedKey) : undefined;
    const isLoadingChildren = !!focusedKey && loadingAddr === focusedKey && children === undefined;

    return (
        <div className="dashboard-container">
            <div className="dashboard-content-wrapper">

                <div className="user-header-section">
                    <div className="user-greeting">
                        <h1>Network Tree</h1>
                        <span>Live Organization Chart</span>
                    </div>

                    <div className="wallet-control-bar">
                        <div className="wallet-indicator">
                            <div className="status-beacon"></div>
                            <span>BSC NETWORK</span>
                        </div>
                        <button className="wallet-action-btn" style={{ cursor: "default" }}>
                            <i className="fas fa-wallet" style={{ color: "var(--brand-blue)" }}></i>
                            <span>{userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : "Connecting..."}</span>
                        </button>
                    </div>
                </div>

                <div className="level-card" style={{ padding: 0, overflow: "hidden" }}>
                    <div className="level-header" style={{ padding: "2.5rem 2.5rem 1rem 2.5rem", marginBottom: 0, borderBottom: "none", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
                        <div><i className="fas fa-sitemap"></i> Team Organization Chart</div>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                            Tap a card for details &middot; Expand to drill in
                        </span>
                    </div>

                    {focusPath.length > 1 && (
                        <Breadcrumb path={focusPath} nodeInfo={nodeInfo} onJump={jumpTo} />
                    )}

                    <div style={{ padding: "2.5rem", overflowX: "auto" }}>
                        {!focusedNode ? (
                            <div className="w-full flex items-center justify-center" style={{ padding: "3rem 0" }}>
                                <i className="fas fa-circle-notch fa-spin" style={{ fontSize: "2rem", color: "var(--brand-blue)" }}></i>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <TreeNodeCard
                                    node={focusedNode}
                                    focused
                                    syncing={syncingAddr === focusedKey}
                                    onSelect={() => setSelectedAddress(focusedNode.address)}
                                />

                                {isLoadingChildren && (
                                    <div className="tree-node-children" style={{ justifyContent: "center" }}>
                                        <i className="fas fa-circle-notch fa-spin" style={{ color: "var(--brand-blue)" }}></i>
                                    </div>
                                )}

                                {children && children.length > 0 && (
                                    <div className="tree-node-children">
                                        {children.map((child) => (
                                            <div className="tree-branch" key={child.address}>
                                                <TreeNodeCard
                                                    node={child}
                                                    focused={false}
                                                    onSelect={() => setSelectedAddress(child.address)}
                                                    onDrill={() => drillInto(child.address)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <AnimatePresence>
                {selectedAddress && (
                    <UserDetailSheet address={selectedAddress} onClose={() => setSelectedAddress(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}
