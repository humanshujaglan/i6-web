"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useDashboard } from "../DashboardContext";
import { useSearchParams } from "next/navigation";
import UserGate from "../UserGate";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
    People,
    Profile2User,
    Hierarchy,
    Copy,
    TickCircle,
    CloseCircle,
    SearchNormal1,
    Briefcase,
    Crown,
    ExportSquare,
    ArrowRight2,
    ArrowLeft2,
    Verify,
    DocumentText,
    Building,
    Wallet3,
    MoneySend,
    Clock,
    Global,
    Bookmark,
} from "iconsax-react";
import { useTheme } from "@/app/context/ThemeContext";

interface DirectPartner {
    index: number;
    address: string;
    deposit: number;
    teamVolume: number;
    partnersCount: number;
    status: {
        text: string;
        badgeClass: string;
        iconClass: string;
    };
}

interface DownlineMember {
    level: number;
    address: string;
    deposit: number;
    teamVolume: number;
    dailyIncome: number;
    isQualified: boolean;
    reqDirects: number;
    roiPercent: number;
    status: { text: string; badgeClass: string; iconClass: string };
    referrer: string;
}

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
                        {/* 3. Horizontal Summary Pill Bar (First Investment | Activated On | Team Volume) */}
                        <div 
                            className="bg-[#F8F9FB] dark:bg-[#191d24] rounded-2xl p-3.5 flex items-center justify-between text-xs border border-gray-100/80 dark:border-transparent mt-1"
                        >
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

                        {/* 4. 2x2 Inset Metric Cards Grid */}
                        <div className="grid grid-cols-2 gap-3 mt-1">
                            {/* Inset Card 1: Experience / Total Deposited */}
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

                            {/* Inset Card 2: Location / Total Withdrawn */}
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

                            {/* Inset Card 3: Tools / Last Withdrawal */}
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

                            {/* Inset Card 4: Skills / Sponsor */}
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
                        {/* Company / Contract Details View */}
                        <div 
                            className="bg-[#F8F9FB] dark:bg-[#191d24] rounded-2xl p-3.5 flex items-center justify-between text-xs border border-gray-100/80 dark:border-transparent mt-1"
                        >
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
                            {/* Inset Card 1: Direct Referrals */}
                            <div className="bg-[#F8F9FB] dark:bg-[#191d24] p-4 rounded-2xl flex flex-col justify-between border border-gray-100/80 dark:border-transparent min-h-[96px]">
                                <div className="text-gray-600 dark:text-[#848e9c]">
                                    <People size={20} color="currentColor" />
                                </div>
                                <div className="flex flex-col mt-2">
                                    <span className="text-[10px] text-[var(--text-soft)]">Direct Referrals</span>
                                    <span className="text-xs font-medium text-gray-900 dark:text-white font-mono mt-0.5">
                                        {Number(detail?.directCount || 0)} Members
                                    </span>
                                </div>
                            </div>

                            {/* Inset Card 2: Direct Volume */}
                            <div className="bg-[#F8F9FB] dark:bg-[#191d24] p-4 rounded-2xl flex flex-col justify-between border border-gray-100/80 dark:border-transparent min-h-[96px]">
                                <div className="text-gray-600 dark:text-[#848e9c]">
                                    <Briefcase size={20} color="currentColor" />
                                </div>
                                <div className="flex flex-col mt-2">
                                    <span className="text-[10px] text-[var(--text-soft)]">Direct Volume</span>
                                    <span className="text-xs font-medium text-gray-900 dark:text-white font-mono mt-0.5">
                                        {detail?.directVolume ? fmtUsd(detail.directVolume) : "$0.00"}
                                    </span>
                                </div>
                            </div>

                            {/* Inset Card 3: Rank */}
                            <div className="bg-[#F8F9FB] dark:bg-[#191d24] p-4 rounded-2xl flex flex-col justify-between border border-gray-100/80 dark:border-transparent min-h-[96px]">
                                <div className="text-gray-600 dark:text-[#848e9c]">
                                    <Crown size={20} color="currentColor" />
                                </div>
                                <div className="flex flex-col mt-2">
                                    <span className="text-[10px] text-[var(--text-soft)]">Leadership Rank</span>
                                    <span className="text-xs font-medium text-gray-900 dark:text-white font-mono mt-0.5">
                                        {detail?.currentRank ? `Rank ${detail.currentRank}` : "No Rank"}
                                    </span>
                                </div>
                            </div>

                            {/* Inset Card 4: Daily Yield Rate */}
                            <div className="bg-[#F8F9FB] dark:bg-[#191d24] p-4 rounded-2xl flex flex-col justify-between border border-gray-100/80 dark:border-transparent min-h-[96px]">
                                <div className="text-gray-600 dark:text-[#848e9c]">
                                    <TickCircle size={20} color="currentColor" />
                                </div>
                                <div className="flex flex-col mt-2">
                                    <span className="text-[10px] text-[var(--text-soft)]">Daily Yield</span>
                                    <span className="text-xs font-medium text-gray-900 dark:text-white font-mono mt-0.5">
                                        {detail?.currentRwpRate ? `${Number(detail.currentRwpRate)/10}%` : "0.5%"} Daily
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* 5. Bottom Action Button */}
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

function BusinessContent() {
    const { userAddress, user, error, refreshData } = useDashboard();
    const searchParams = useSearchParams();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [activeTab, setActiveTab] = useState<"directs" | "downlines" | "tree">("directs");
    const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

    // Directs state
    const [directs, setDirects] = useState<DirectPartner[]>([]);
    const [loadingDirects, setLoadingDirects] = useState(true);
    const [directsSearch, setDirectsSearch] = useState("");

    // Downlines state
    const [depth, setDepth] = useState<string>("1");
    const [isScanning, setIsScanning] = useState(false);
    const [isSyncingLive, setIsSyncingLive] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);
    const [foundCount, setFoundCount] = useState(0);
    const [downlineResults, setDownlineResults] = useState<DownlineMember[]>([]);
    const [hasScanned, setHasScanned] = useState(false);
    const [searchAddress, setSearchAddress] = useState("");
    const [searchLevel, setSearchLevel] = useState("");

    // Tree state
    const [nodeInfo, setNodeInfo] = useState<Map<string, NodeInfo>>(new Map());
    const [childrenOf, setChildrenOf] = useState<Map<string, NodeInfo[]>>(new Map());
    const [focusPath, setFocusPath] = useState<string[]>([]);
    const [loadingAddr, setLoadingAddr] = useState<string | null>(null);
    const [syncingAddr, setSyncingAddr] = useState<string | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const rootInitRef = useRef(false);
    const scanReqIdRef = useRef(0);

    useEffect(() => {
        const tabParam = searchParams.get("tab");
        if (tabParam === "downlines" || tabParam === "team") {
            setActiveTab("downlines");
        } else if (tabParam === "tree") {
            setActiveTab("tree");
        }
    }, [searchParams]);

    // Load Directs
    useEffect(() => {
        if (!userAddress || !user) return;

        const loadDirects = async () => {
            try {
                const count = Number(user.directCount);
                if (count === 0) {
                    setDirects([]);
                    setLoadingDirects(false);
                    return;
                }

                const res = await fetch(`/api/directs/${userAddress}`);
                if (!res.ok) throw new Error("Failed to fetch directs");
                const data: { address: string; user: any }[] = await res.json();

                const mapped = data.map((entry, idx) => {
                    const d = entry.user;
                    const deposit = parseFloat(ethers.formatUnits(d.totalDeposits, 18));
                    const teamVolume = parseFloat(ethers.formatUnits(d.totalDownlineBusiness, 18));
                    const partnersCount = Number(d.directCount);
                    const isCapped = d.isCapped;
                    const isActive = deposit > 0 && !isCapped;

                    let statusText = "Inactive";
                    let badgeClass = "badge-inactive";
                    let iconClass = "";

                    if (isCapped) {
                        statusText = "Capped";
                        badgeClass = "badge-capped";
                        iconClass = "fas fa-ban";
                    } else if (isActive) {
                        statusText = "Active";
                        badgeClass = "badge-active";
                        iconClass = "fas fa-check-circle";
                    }

                    return {
                        index: idx + 1,
                        address: entry.address,
                        deposit,
                        teamVolume,
                        partnersCount,
                        status: { text: statusText, badgeClass, iconClass }
                    };
                });

                setDirects(mapped);
            } catch (err) {
                console.error("Directs load error", err);
            } finally {
                setLoadingDirects(false);
            }
        };

        loadDirects();
    }, [userAddress, user]);

    // Tree children loader
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
            // ignore cache failure
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

    // Seed root for tree
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

    // Scan Downlines
    const startDownlineScan = useCallback(async (targetDepth?: string | number) => {
        if (!userAddress || !user) return;
        const currentReqId = ++scanReqIdRef.current;
        const effectiveDepth = targetDepth !== undefined ? targetDepth : depth;
        const depthNum = Math.min(Math.max(parseInt(String(effectiveDepth), 10) || 1, 1), 40);

        setSyncMessage(null);
        let hasCachedHit = false;

        try {
            const cachedRes = await fetch(`/api/downlines/${userAddress}?depth=${depthNum}&mode=cached`);
            if (cachedRes.ok && scanReqIdRef.current === currentReqId) {
                const cachedJson = await cachedRes.json();
                if (cachedJson.found && Array.isArray(cachedJson.data)) {
                    hasCachedHit = true;
                    setDownlineResults(cachedJson.data);
                    setFoundCount(cachedJson.data.length);
                    setHasScanned(true);
                    setIsSyncingLive(true);
                    setSyncMessage("Instant cache loaded • Checking live on-chain updates...");
                }
            }
        } catch {
            // Ignore cache check errors
        }

        if (scanReqIdRef.current !== currentReqId) return;

        if (!hasCachedHit) {
            setIsScanning(true);
            setDownlineResults([]);
            setFoundCount(0);
            setHasScanned(true);
        }

        try {
            const liveRes = await fetch(`/api/downlines/${userAddress}?depth=${depthNum}&mode=live`);
            if (scanReqIdRef.current !== currentReqId) return;
            if (!liveRes.ok) throw new Error("Scan failed");
            const liveJson = await liveRes.json();
            const liveData: DownlineMember[] = Array.isArray(liveJson) ? liveJson : (liveJson.data || []);

            setDownlineResults(liveData);
            setFoundCount(liveData.length);

            if (hasCachedHit) {
                setSyncMessage(liveJson.updated ? "Live sync complete: updated records saved." : "Live sync complete: all records up to date.");
                setTimeout(() => {
                    if (scanReqIdRef.current === currentReqId) setSyncMessage(null);
                }, 4000);
            }
        } catch (err) {
            console.error(err);
        } finally {
            if (scanReqIdRef.current === currentReqId) {
                setIsScanning(false);
                setIsSyncingLive(false);
            }
        }
    }, [userAddress, user, depth]);

    // Auto-scan on opening Global Team tab
    useEffect(() => {
        if (activeTab === "downlines" && userAddress && user && !hasScanned) {
            startDownlineScan(depth);
        }
    }, [activeTab, userAddress, user, hasScanned, depth, startDownlineScan]);

    const copyAddress = async (addr: string) => {
        await navigator.clipboard.writeText(addr);
        setCopiedAddr(addr);
        setTimeout(() => setCopiedAddr(null), 1800);
    };

    if (!user) return <UserGate error={error} onRetry={refreshData} />;

    const directVolumeFloat = parseFloat(ethers.formatUnits(user.directVolume, 18));
    const teamVolumeFloat = parseFloat(ethers.formatUnits(user.totalDownlineBusiness, 18));

    const filteredDirects = directs.filter((d) =>
        directsSearch ? d.address.toLowerCase().includes(directsSearch.toLowerCase()) : true
    );

    const filteredDownlines = downlineResults.filter((m) => {
        let matchesAddress = true;
        let matchesLevelFromAddr = true;

        if (searchAddress.trim()) {
            const q = searchAddress.trim().toLowerCase();
            const levelMatch = q.match(/^(?:level|lvl|l)\s*([0-9]{1,2})$/i);
            if (levelMatch) {
                matchesLevelFromAddr = m.level === parseInt(levelMatch[1], 10);
            } else {
                matchesAddress = m.address.toLowerCase().includes(q);
            }
        }

        const trimmedLevel = searchLevel.trim();
        const levelNum = trimmedLevel !== "" ? parseInt(trimmedLevel, 10) : null;
        const matchesLevel = levelNum !== null ? m.level === levelNum : true;

        return matchesAddress && matchesLevel && matchesLevelFromAddr;
    });

    const focusedAddress = focusPath[focusPath.length - 1];
    const focusedKey = focusedAddress?.toLowerCase();
    const focusedNode = focusedKey ? nodeInfo.get(focusedKey) : undefined;
    const children = focusedKey ? childrenOf.get(focusedKey) : undefined;
    const isLoadingChildren = !!focusedKey && loadingAddr === focusedKey && children === undefined;

    return (
        <div className="dashboard-container">
            <div className="dashboard-content-wrapper max-w-4xl mx-auto flex flex-col gap-6">

                {/* Segmented 3-Tab Switcher: Directs | Global Team | Tree */}
                <div className="flex items-center p-1 bg-[#F4F4F7] dark:bg-[#14171d] rounded-full max-w-md mx-auto w-full relative">
                    <button
                        type="button"
                        onClick={() => setActiveTab("directs")}
                        className={`flex-1 py-2.5 px-3 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer relative z-10 ${
                            activeTab === "directs"
                                ? (isDark ? "text-[#0b0e14] font-bold" : "text-white font-semibold")
                                : "text-gray-500 dark:text-[#848e9c] hover:text-[#0f172a] dark:hover:text-white"
                        }`}
                    >
                        {activeTab === "directs" && (
                            <motion.div
                                layoutId="activeBusinessTab"
                                className="absolute inset-0 rounded-full"
                                style={isDark ? {
                                    background: "#FCD535",
                                    boxShadow: "0 2px 10px rgba(252, 213, 53, 0.35)",
                                } : {
                                    background: "#0072ED",
                                    boxShadow: "inset 4px 6px 10.8px rgba(255, 255, 255, 0.4)",
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <People size={16} color="currentColor" className="relative z-10" />
                        <span className="relative z-10 truncate">Directs ({Number(user.directCount)})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("downlines");
                            if (!hasScanned) startDownlineScan();
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer relative z-10 ${
                            activeTab === "downlines"
                                ? (isDark ? "text-[#0b0e14] font-bold" : "text-white font-semibold")
                                : "text-gray-500 dark:text-[#848e9c] hover:text-[#0f172a] dark:hover:text-white"
                        }`}
                    >
                        {activeTab === "downlines" && (
                            <motion.div
                                layoutId="activeBusinessTab"
                                className="absolute inset-0 rounded-full"
                                style={isDark ? {
                                    background: "#FCD535",
                                    boxShadow: "0 2px 10px rgba(252, 213, 53, 0.35)",
                                } : {
                                    background: "#0072ED",
                                    boxShadow: "inset 4px 6px 10.8px rgba(255, 255, 255, 0.4)",
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <Profile2User size={16} color="currentColor" className="relative z-10" />
                        <span className="relative z-10 truncate">Global Team</span>
                    </button>

                    {/* Tree tab navigation commented out
                    <button
                        type="button"
                        onClick={() => setActiveTab("tree")}
                        className={`flex-1 py-2.5 px-3 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer relative z-10 ${
                            activeTab === "tree"
                                ? (isDark ? "text-[#0b0e14] font-bold" : "text-white font-semibold")
                                : "text-gray-500 dark:text-[#848e9c] hover:text-[#0f172a] dark:hover:text-white"
                        }`}
                    >
                        {activeTab === "tree" && (
                            <motion.div
                                layoutId="activeBusinessTab"
                                className="absolute inset-0 rounded-full"
                                style={isDark ? {
                                    background: "#FCD535",
                                    boxShadow: "0 2px 10px rgba(252, 213, 53, 0.35)",
                                } : {
                                    background: "#0072ED",
                                    boxShadow: "inset 4px 6px 10.8px rgba(255, 255, 255, 0.4)",
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <Hierarchy size={16} color="currentColor" className="relative z-10" />
                        <span className="relative z-10 truncate">Tree</span>
                    </button>
                    */}
                </div>

                <AnimatePresence mode="wait">
                {activeTab === "directs" ? (
                    /* Direct Partners Tab Content */
                    <motion.div 
                        key="directs"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="w-full flex flex-col gap-6"
                    >
                        {/* Side-by-side Cards */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {/* Card 1: Active Directs */}
                            <div className="income-card p-5 sm:p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 rounded-2xl bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] flex items-center justify-center shrink-0 shadow-xs">
                                        <People size={20} color="currentColor" />
                                    </div>
                                    <span className="text-[11px] text-emerald-600 dark:text-[#0ecb81] font-medium bg-emerald-50 dark:bg-[#0ecb81]/15 px-2.5 py-1 rounded-full">
                                        Frontline
                                    </span>
                                </div>
                                <div className="text-xs text-[var(--text-soft)] font-medium">Active Directs</div>
                                <div className="text-2xl sm:text-3xl font-medium text-[var(--text-main)] font-mono mt-1">
                                    {Number(user.directCount)}
                                </div>
                                <div className="text-[11px] text-[var(--text-muted)] mt-1">Direct Referrals</div>
                            </div>

                            {/* Card 2: Direct Volume */}
                            <div className="income-card p-5 sm:p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 rounded-2xl bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] flex items-center justify-center shrink-0 shadow-xs">
                                        <Briefcase size={20} color="currentColor" />
                                    </div>
                                    <span className="text-[11px] text-[#0072ED] dark:text-[#FCD535] font-medium bg-blue-50 dark:bg-[#FCD535]/15 px-2.5 py-1 rounded-full">
                                        USDT
                                    </span>
                                </div>
                                <div className="text-xs text-[var(--text-soft)] font-medium">Direct Volume</div>
                                <div className="text-2xl sm:text-3xl font-medium text-[var(--text-main)] font-mono mt-1">
                                    ${directVolumeFloat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="text-[11px] text-[var(--text-muted)] mt-1">Frontline Deposit Volume</div>
                            </div>
                        </div>

                        {/* Direct Partners Table Container */}
                        <div className="income-card overflow-hidden p-0">
                            {/* Table Header Controls */}
                            <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#191d24] text-[var(--text-main)] flex items-center justify-center">
                                        <People size={18} color="currentColor" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-[var(--text-main)]">Direct Partners</h3>
                                        <p className="text-xs text-[var(--text-muted)]">Frontline members invited directly by your referral</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <div className="flex items-center gap-2 bg-[#F8F9FB] dark:bg-[#191d24] px-3 py-1.5 rounded-xl w-full sm:w-56">
                                        <SearchNormal1 size={14} color={isDark ? "#848e9c" : "gray"} />
                                        <input
                                            type="text"
                                            placeholder="Search 0x address..."
                                            value={directsSearch}
                                            onChange={(e) => setDirectsSearch(e.target.value)}
                                            className="bg-transparent text-xs text-[var(--text-main)] outline-none w-full placeholder:text-gray-400 font-medium"
                                        />
                                    </div>
                                    <span className="text-xs text-[var(--text-muted)] bg-gray-100 dark:bg-[#191d24] px-3 py-1.5 rounded-xl font-medium shrink-0">
                                        {filteredDirects.length} {filteredDirects.length === 1 ? "Partner" : "Partners"}
                                    </span>
                                </div>
                            </div>

                            {/* Responsive Formatted Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] text-[var(--text-muted)] font-medium">
                                            <th className="py-3 px-4 sm:px-6 w-12 text-center">#</th>
                                            <th className="py-3 px-4 sm:px-6">Partner Address</th>
                                            <th className="py-3 px-4 sm:px-6">Deposit</th>
                                            <th className="py-3 px-4 sm:px-6">Team Volume</th>
                                            <th className="py-3 px-4 sm:px-6 text-center">Directs</th>
                                            <th className="py-3 px-4 sm:px-6">Status</th>
                                            <th className="py-3 px-4 sm:px-6 text-right">Explorer</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {loadingDirects ? (
                                            <tr>
                                                <td colSpan={7} className="py-12 text-center">
                                                    <div className="inline-block w-6 h-6 border-2 border-[var(--brand-blue)] border-t-transparent rounded-full animate-spin"></div>
                                                    <div className="text-xs text-[var(--text-muted)] mt-2">Loading partner records...</div>
                                                </td>
                                            </tr>
                                        ) : filteredDirects.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                                                    <People size={36} color="currentColor" className="opacity-30 mx-auto mb-2" />
                                                    {directsSearch ? "No partners match your search query." : "No direct partners found yet."}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredDirects.map((partner) => (
                                                <tr key={partner.address} className="hover:bg-gray-50/75 dark:hover:bg-white/[0.02] transition-colors">
                                                    <td className="py-3.5 px-4 sm:px-6 text-center">
                                                        <span className="bg-gray-100 dark:bg-[#191d24] text-[var(--text-main)] px-2 py-0.5 rounded-md text-[11px] font-mono">
                                                            {partner.index}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 sm:px-6">
                                                        <div className="flex items-center gap-2 font-mono font-medium text-[var(--text-main)]">
                                                            <span>{partner.address.slice(0, 6)}...{partner.address.slice(-4)}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyAddress(partner.address)}
                                                                className="text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                                                                title="Copy address"
                                                            >
                                                                {copiedAddr === partner.address ? <TickCircle size={14} color="#10B981" /> : <Copy size={14} color="currentColor" />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 sm:px-6 font-mono font-medium text-[var(--text-main)]">
                                                        ${partner.deposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-3.5 px-4 sm:px-6 font-mono text-[var(--text-soft)]">
                                                        ${partner.teamVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-3.5 px-4 sm:px-6 text-center font-mono font-medium text-[var(--text-main)]">
                                                        {partner.partnersCount}
                                                    </td>
                                                    <td className="py-3.5 px-4 sm:px-6">
                                                        {partner.status.text === "Active" ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-[#848e9c]">
                                                                {partner.status.text}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 sm:px-6 text-right">
                                                        <a
                                                            href={`https://bscscan.com/address/${partner.address}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-[11px] text-[#0072ED] dark:text-[#FCD535] hover:underline"
                                                        >
                                                            <span>BscScan</span>
                                                            <ExportSquare size={12} color="currentColor" />
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                ) : activeTab === "downlines" ? (
                    /* Global Team (Downlines) Tab Content */
                    <motion.div 
                        key="downlines"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="w-full flex flex-col gap-6"
                    >
                        {/* Side-by-side Cards */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {/* Card 1: Total Team Volume */}
                            <div className="income-card p-5 sm:p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 rounded-2xl bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] flex items-center justify-center shrink-0 shadow-xs">
                                        <Profile2User size={20} color="currentColor" />
                                    </div>
                                    <span className="text-[11px] text-[#0072ED] dark:text-[#FCD535] font-medium bg-blue-50 dark:bg-[#FCD535]/15 px-2.5 py-1 rounded-full">
                                        40 Levels
                                    </span>
                                </div>
                                <div className="text-xs text-[var(--text-soft)] font-medium">Total Team Volume</div>
                                <div className="text-2xl sm:text-3xl font-medium text-[var(--text-main)] font-mono mt-1">
                                    ${teamVolumeFloat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="text-[11px] text-[var(--text-muted)] mt-1">Downline Volume Across All Levels</div>
                            </div>

                            {/* Card 2: Network Depth */}
                            <div className="income-card p-5 sm:p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 rounded-2xl bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] flex items-center justify-center shrink-0 shadow-xs">
                                        <Crown size={20} color="currentColor" />
                                    </div>
                                    <span className="text-[11px] text-purple-600 dark:text-[#FCD535] font-medium bg-purple-50 dark:bg-[#FCD535]/15 px-2.5 py-1 rounded-full">
                                        Max 40
                                    </span>
                                </div>
                                <div className="text-xs text-[var(--text-soft)] font-medium">Network Depth</div>
                                <div className="text-2xl sm:text-3xl font-medium text-[var(--text-main)] font-mono mt-1">
                                    40 Levels
                                </div>
                                <div className="text-[11px] text-[var(--text-muted)] mt-1">2 Directs per 1 Level Unlocked</div>
                            </div>
                        </div>

                        {/* Scanner & Filter Controls Bar */}
                        <div className="income-card p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-[var(--text-soft)] font-medium shrink-0">Depth:</span>
                                    <select
                                        value={depth}
                                        onChange={(e) => {
                                            const newDepth = e.target.value;
                                            setDepth(newDepth);
                                            startDownlineScan(newDepth);
                                        }}
                                        className="bg-[#F8F9FB] dark:bg-[#191d24] rounded-xl px-3 py-1.5 text-xs text-[var(--text-main)] outline-none font-medium border-none cursor-pointer"
                                    >
                                        {[1, 2, 3, 5, 10, 20, 30, 40].map((d) => (
                                            <option key={d} value={d}>
                                                L1 to {d}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => startDownlineScan()}
                                    disabled={isScanning}
                                    className="px-4 py-1.5 rounded-xl bg-[#0072ED] hover:bg-[#0062cc] text-white dark:bg-[#FCD535] dark:hover:bg-[#f0b90b] dark:text-[#0b0e14] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shrink-0"
                                >
                                    {isScanning ? "Scanning..." : isSyncingLive ? "Syncing..." : "Scan Tree"}
                                </button>
                            </div>

                            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                                {/* Search by Inputting Level */}
                                <div className="flex items-center gap-1.5 bg-[#F8F9FB] dark:bg-[#191d24] px-3 py-1.5 rounded-xl w-full sm:w-36 border border-transparent focus-within:border-[#0072ED]/30 dark:focus-within:border-[#FCD535]/30 transition-all">
                                    <span className="text-[11px] font-semibold text-[#0072ED] dark:text-[#FCD535] shrink-0 font-mono">
                                        Level:
                                    </span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="40"
                                        placeholder="1-40"
                                        value={searchLevel}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "") {
                                                setSearchLevel("");
                                                return;
                                            }
                                            const num = parseInt(val, 10);
                                            if (!isNaN(num)) {
                                                const clamped = Math.min(Math.max(num, 1), 40);
                                                const clampedStr = String(clamped);
                                                setSearchLevel(clampedStr);
                                                if (clamped > parseInt(depth, 10)) {
                                                    setDepth(clampedStr);
                                                    startDownlineScan(clampedStr);
                                                }
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && searchLevel) {
                                                const num = parseInt(searchLevel, 10);
                                                if (!isNaN(num) && num > parseInt(depth, 10)) {
                                                    setDepth(String(num));
                                                    startDownlineScan(String(num));
                                                }
                                            }
                                        }}
                                        className="bg-transparent text-xs text-[var(--text-main)] outline-none w-full placeholder:text-gray-400 font-mono font-medium"
                                    />
                                    {searchLevel && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchLevel("")}
                                            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer shrink-0"
                                            title="Clear level filter"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {/* Filter by 0x address */}
                                <div className="flex items-center gap-2 bg-[#F8F9FB] dark:bg-[#191d24] px-3 py-1.5 rounded-xl w-full sm:w-56 border border-transparent focus-within:border-[#0072ED]/30 dark:focus-within:border-[#FCD535]/30 transition-all">
                                    <SearchNormal1 size={14} color={isDark ? "#848e9c" : "gray"} />
                                    <input
                                        type="text"
                                        placeholder="Filter by 0x address..."
                                        value={searchAddress}
                                        onChange={(e) => setSearchAddress(e.target.value)}
                                        className="bg-transparent text-xs text-[var(--text-main)] outline-none w-full placeholder:text-gray-400 font-medium"
                                    />
                                    {searchAddress && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchAddress("")}
                                            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer shrink-0"
                                            title="Clear address filter"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {syncMessage && (
                            <div className="text-xs text-[#0072ED] dark:text-[#FCD535] text-center font-medium -mt-2">
                                {syncMessage}
                            </div>
                        )}

                        {/* Downline Table Container */}
                        <div className="income-card overflow-hidden p-0">
                            <div className="p-5 sm:p-6 flex items-center justify-between border-b border-gray-100 dark:border-white/5 flex-wrap gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Profile2User size={20} color="currentColor" />
                                    <span className="text-sm font-semibold text-[var(--text-main)]">Global Downlines</span>
                                    {searchLevel && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] px-2.5 py-0.5 rounded-full font-mono">
                                            Level {searchLevel}
                                            <button
                                                type="button"
                                                onClick={() => setSearchLevel("")}
                                                className="hover:opacity-75 cursor-pointer ml-0.5"
                                                title="Clear level filter"
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-[var(--text-muted)] bg-gray-100 dark:bg-[#191d24] px-3 py-1 rounded-full font-medium font-mono">
                                    {searchLevel || searchAddress 
                                        ? `${filteredDownlines.length} of ${foundCount} Members` 
                                        : `${foundCount} Members Discovered`}
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] text-[var(--text-muted)] font-medium">
                                            <th className="py-3 px-4 sm:px-6">Level</th>
                                            <th className="py-3 px-4 sm:px-6">Member Address</th>
                                            <th className="py-3 px-4 sm:px-6">Deposit</th>
                                            <th className="py-3 px-4 sm:px-6">Team Volume</th>
                                            <th className="py-3 px-4 sm:px-6">Sponsor</th>
                                            <th className="py-3 px-4 sm:px-6">Status</th>
                                            <th className="py-3 px-4 sm:px-6 text-right">Explorer</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {isScanning ? (
                                            <tr>
                                                <td colSpan={7} className="py-12 text-center">
                                                    <div className="inline-block w-6 h-6 border-2 border-[var(--brand-blue)] border-t-transparent rounded-full animate-spin mb-2"></div>
                                                    <div className="text-xs text-[var(--text-muted)]">Traversing blockchain tree...</div>
                                                </td>
                                            </tr>
                                        ) : filteredDownlines.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                                                    <Profile2User size={36} color="currentColor" className="opacity-30 mx-auto mb-2" />
                                                    {searchLevel && parseInt(searchLevel, 10) > parseInt(depth, 10) ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <p className="text-xs">
                                                                Level {searchLevel} has not been scanned yet (current scan depth: Level {depth}).
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setDepth(searchLevel);
                                                                    startDownlineScan(searchLevel);
                                                                }}
                                                                className="px-4 py-1.5 rounded-xl bg-[#0072ED] hover:bg-[#0062cc] text-white dark:bg-[#FCD535] dark:hover:bg-[#f0b90b] dark:text-[#0b0e14] text-xs font-semibold transition-all cursor-pointer"
                                                            >
                                                                Scan up to Level {searchLevel}
                                                            </button>
                                                        </div>
                                                    ) : searchLevel ? (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <p className="text-xs">No downlines found on Level {searchLevel}.</p>
                                                            <button
                                                                type="button"
                                                                onClick={() => setSearchLevel("")}
                                                                className="text-xs text-[#0072ED] dark:text-[#FCD535] hover:underline cursor-pointer"
                                                            >
                                                                Clear level filter
                                                            </button>
                                                        </div>
                                                    ) : hasScanned ? (
                                                        "No downlines found matching your search."
                                                    ) : (
                                                        "Select scan depth and click Scan Tree."
                                                    )}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredDownlines.map((member, i) => (
                                                <tr key={`${member.address}-${i}`} className="hover:bg-gray-50/75 dark:hover:bg-white/[0.02] transition-colors">
                                                    <td className="py-3.5 px-4 sm:px-6">
                                                        <span className="bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium">
                                                            L{member.level}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 sm:px-6">
                                                        <div className="flex items-center gap-2 font-mono font-medium text-[var(--text-main)]">
                                                            <span>{member.address.slice(0, 6)}...{member.address.slice(-4)}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyAddress(member.address)}
                                                                className="text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                                                            >
                                                                {copiedAddr === member.address ? <TickCircle size={14} color="#10B981" /> : <Copy size={14} color="currentColor" />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 sm:px-6 font-mono font-medium text-[var(--text-main)]">
                                                        ${member.deposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-3.5 px-4 sm:px-6 font-mono text-[var(--text-soft)]">
                                                        ${member.teamVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-3.5 px-4 sm:px-6 font-mono text-[var(--text-soft)]">
                                                        {member.referrer && member.referrer !== "0x0000000000000000000000000000000000000000"
                                                            ? `${member.referrer.slice(0, 6)}...${member.referrer.slice(-4)}`
                                                            : "Genesis"}
                                                    </td>
                                                    <td className="py-3.5 px-4 sm:px-6">
                                                        {member.deposit > 0 ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-[#848e9c]">
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 sm:px-6 text-right">
                                                        <a
                                                            href={`https://bscscan.com/address/${member.address}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-[11px] text-[#0072ED] dark:text-[#FCD535] hover:underline"
                                                        >
                                                            <span>BscScan</span>
                                                            <ExportSquare size={12} color="currentColor" />
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* Interactive Tree Visualizer Tab Content */
                    <motion.div 
                        key="tree"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="w-full flex flex-col gap-6"
                    >
                        <div className="income-card overflow-hidden p-0">
                            {/* Tree Header */}
                            <div className="p-5 sm:p-6 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#191d24] text-[var(--text-main)] flex items-center justify-center">
                                        <Hierarchy size={18} color="currentColor" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-[var(--text-main)]">Team Organization Tree</h3>
                                        <p className="text-xs text-[var(--text-muted)]">Tap any card for on-chain profile details • Click Expand to drill in</p>
                                    </div>
                                </div>
                            </div>

                            {/* Breadcrumbs for deep navigation */}
                            {focusPath.length > 1 && (
                                <div className="px-5 py-2.5 bg-gray-50/50 dark:bg-[#191d24]/50 border-b border-gray-100 dark:border-white/5 flex items-center gap-1.5 text-xs overflow-x-auto">
                                    {focusPath.map((addr, i) => {
                                        const isLast = i === focusPath.length - 1;
                                        const label = i === 0 ? "You (Root)" : `${addr.slice(0, 6)}...${addr.slice(-4)}`;
                                        return (
                                            <div key={addr} className="flex items-center gap-1.5 shrink-0">
                                                {i > 0 && <span className="text-gray-400">/</span>}
                                                <button
                                                    type="button"
                                                    onClick={() => setFocusPath((prev) => prev.slice(0, i + 1))}
                                                    disabled={isLast}
                                                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors cursor-pointer ${
                                                        isLast 
                                                            ? "bg-[#0072ED] dark:bg-[#FCD535] text-white dark:text-[#0b0e14] font-semibold"
                                                            : "text-gray-600 dark:text-[#848e9c] hover:bg-gray-200 dark:hover:bg-white/10"
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Visual Tree Display */}
                            <div className="p-6 sm:p-8 overflow-x-auto min-h-[380px] flex flex-col items-center justify-start">
                                {!focusedNode ? (
                                    <div className="py-16 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-[var(--brand-blue)] border-t-transparent rounded-full animate-spin" />
                                        <span>Loading organization tree...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center w-full">
                                        {/* Root Node Card */}
                                        <div 
                                            onClick={() => setSelectedAddress(focusedNode.address)}
                                            className="w-64 p-4 rounded-2xl income-card !border-2 !border-[#0072ED] dark:!border-[#FCD535] flex flex-col gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                                                    focusedNode.isCapped ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600" : focusedNode.isActive ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" : "bg-gray-100 dark:bg-white/5 text-gray-400"
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${focusedNode.isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                                                    {focusedNode.isCapped ? "Capped" : focusedNode.isActive ? "Active Root" : "Inactive"}
                                                </span>
                                                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                                                    {focusedNode.directCount} {focusedNode.directCount === 1 ? "Direct" : "Directs"}
                                                </span>
                                            </div>

                                            <div className="font-mono text-xs font-bold text-[var(--text-main)] truncate">
                                                {focusedNode.address.slice(0, 8)}...{focusedNode.address.slice(-6)}
                                            </div>

                                            <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 dark:border-white/5">
                                                <span className="text-[var(--text-soft)]">Deposit:</span>
                                                <span className="font-mono font-semibold text-[var(--text-main)]">
                                                    ${focusedNode.deposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Connector Line */}
                                        {children && children.length > 0 && (
                                            <div className="w-0.5 h-8 bg-gray-200 dark:bg-white/10" />
                                        )}

                                        {/* Children Branch Container */}
                                        {isLoadingChildren ? (
                                            <div className="py-8 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                                <div className="w-4 h-4 border-2 border-[var(--brand-blue)] border-t-transparent rounded-full animate-spin" />
                                                <span>Loading team branches...</span>
                                            </div>
                                        ) : children && children.length > 0 ? (
                                            <div className="flex items-start justify-center gap-4 flex-wrap pt-2">
                                                {children.map((child) => (
                                                    <div 
                                                        key={child.address}
                                                        onClick={() => setSelectedAddress(child.address)}
                                                        className="w-56 p-3.5 rounded-2xl income-card flex flex-col gap-2 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                                                child.isCapped ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600" : child.isActive ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" : "bg-gray-100 dark:bg-white/5 text-gray-400"
                                                            }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${child.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                                                                {child.isCapped ? "Capped" : child.isActive ? "Active" : "Inactive"}
                                                            </span>
                                                            <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                                                {child.directCount} Dir
                                                            </span>
                                                        </div>

                                                        <div className="font-mono text-xs font-medium text-[var(--text-main)] truncate">
                                                            {child.address.slice(0, 6)}...{child.address.slice(-4)}
                                                        </div>

                                                        <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 dark:border-white/5">
                                                            <span className="text-[11px] text-[var(--text-soft)] font-mono">
                                                                ${child.deposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>

                                                            {child.directCount > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setFocusPath((prev) => [...prev, child.address]);
                                                                        if (!childrenOf.has(child.address.toLowerCase())) {
                                                                            fetchChildren(child.address);
                                                                        }
                                                                    }}
                                                                    className="px-2.5 py-0.5 rounded-lg bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] text-[10px] font-semibold flex items-center gap-1 transition-all hover:opacity-80 cursor-pointer"
                                                                >
                                                                    <span>Expand</span>
                                                                    <ArrowRight2 size={10} color="currentColor" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : focusedNode.directCount === 0 ? (
                                            <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                                                This account has no frontline direct partners.
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                {/* User Detail Slide-over Sheet Modal */}
                <AnimatePresence>
                    {selectedAddress && (
                        <UserDetailSheet address={selectedAddress} onClose={() => setSelectedAddress(null)} />
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}

export default function BusinessPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--text-muted)]">Loading Business Portal...</div>}>
            <BusinessContent />
        </Suspense>
    );
}
