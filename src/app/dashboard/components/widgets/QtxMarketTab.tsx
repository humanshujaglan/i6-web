"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    TrendUp,
    TrendDown,
    Activity,
    DollarCircle,
    Trade,
    Refresh2,
    ExportSquare,
    Chart,
    Wallet3,
    ShieldTick,
} from "iconsax-react";
import { useTheme } from "@/app/context/ThemeContext";
import { QTX_WBNB_PAIR_ADDRESS, QTX_TOKEN_ADDRESS } from "@/lib/contracts/abis";

interface DexPairData {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    quoteToken: {
        address: string;
        name: string;
        symbol: string;
    };
    priceNative: string;
    priceUsd: string;
    txns: {
        m5?: { buys: number; sells: number };
        h1?: { buys: number; sells: number };
        h6?: { buys: number; sells: number };
        h24?: { buys: number; sells: number };
    };
    volume: {
        m5?: number;
        h1?: number;
        h6?: number;
        h24?: number;
    };
    priceChange: {
        m5?: number;
        h1?: number;
        h6?: number;
        h24?: number;
    };
    liquidity: {
        usd?: number;
        base?: number;
        quote?: number;
    };
    fdv?: number;
    marketCap?: number;
    pairCreatedAt?: number;
}

function formatUSD(val?: number): string {
    if (val === undefined || isNaN(val)) return "$0.00";
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
    return `$${val.toFixed(2)}`;
}

function formatNum(val?: number, decimals = 2): string {
    if (val === undefined || isNaN(val)) return "0";
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(2)}K`;
    return val.toLocaleString("en-US", { maximumFractionDigits: decimals });
}

export default function QtxMarketTab() {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [pairData, setPairData] = useState<DexPairData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [activeView, setActiveView] = useState<"stats" | "chart">("stats");
    const [selectedTf, setSelectedTf] = useState<"m5" | "h1" | "h6" | "h24">("h24");

    const incomeCardStyle = {
        background: isDark
            ? "linear-gradient(135deg, #14171d 0%, #0a0c0f 100%)"
            : "linear-gradient(135deg, rgba(201, 224, 255, 0.6) 0%, #FFFFFF 85%)",
        border: isDark
            ? "1px solid rgba(255, 255, 255, 0.12)"
            : "1.5px solid #FFFFFF",
        boxShadow: isDark
            ? "inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 4px 14px rgba(0, 0, 0, 0.4)"
            : "0 3px 12px rgba(12, 50, 99, 0.06)",
    };

    const fetchDexData = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const res = await fetch(
                `https://api.dexscreener.com/latest/dex/pairs/bsc/${QTX_WBNB_PAIR_ADDRESS}`,
                { cache: "no-store" }
            );
            if (res.ok) {
                const json = await res.json();
                const pair = json.pair || (json.pairs && json.pairs[0]);
                if (pair) {
                    setPairData(pair);
                }
            }
        } catch (err) {
            console.error("DexScreener fetch error:", err);
        } finally {
            setLoading(false);
            if (isManual) setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDexData();
        const timer = setInterval(() => fetchDexData(false), 10000);
        return () => clearInterval(timer);
    }, []);

    const priceUsdNum = pairData ? parseFloat(pairData.priceUsd) : 29.22;
    const change24h = pairData?.priceChange?.h24 ?? 16.23;
    const is24hPositive = change24h >= 0;

    const buys = pairData?.txns?.[selectedTf]?.buys ?? 0;
    const sells = pairData?.txns?.[selectedTf]?.sells ?? 0;
    const totalTxns = buys + sells;
    const buyPercent = totalTxns > 0 ? Math.round((buys / totalTxns) * 100) : 100;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-4 select-none"
        >
            {/* Top Toolbar: View Switcher (Stats vs Chart) & Refresh Button */}
            <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setActiveView("stats")}
                        className={`px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeView === "stats"
                                ? "bg-[#0072ED] dark:bg-[#FCD535] text-white dark:text-[#0b0e14] shadow-xs"
                                : "text-gray-500 dark:text-[#848e9c] hover:text-gray-900 dark:hover:text-white"
                        }`}
                    >
                        <Activity size={13} color="currentColor" />
                        <span>Live Stats</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveView("chart")}
                        className={`px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                            activeView === "chart"
                                ? "bg-[#0072ED] dark:bg-[#FCD535] text-white dark:text-[#0b0e14] shadow-xs"
                                : "text-gray-500 dark:text-[#848e9c] hover:text-gray-900 dark:hover:text-white"
                        }`}
                    >
                        <Chart size={13} color="currentColor" />
                        <span>DEX Chart</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fetchDexData(true)}
                        disabled={refreshing}
                        className="p-2 rounded-xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/5 text-gray-500 dark:text-[#848e9c] hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer shadow-xs"
                        title="Refresh DexScreener Telemetry"
                    >
                        <Refresh2
                            size={15}
                            color="currentColor"
                            className={refreshing ? "animate-spin text-[#0072ED] dark:text-[#FCD535]" : ""}
                        />
                    </button>

                    <a
                        href={pairData?.url || `https://dexscreener.com/bsc/${QTX_WBNB_PAIR_ADDRESS}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/5 text-gray-500 dark:text-[#848e9c] hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer shadow-xs inline-flex items-center gap-1 text-xs"
                        title="Open on DEX Screener"
                    >
                        <ExportSquare size={15} color="currentColor" />
                    </a>
                </div>
            </div>

            {/* View 1: Stats Dashboard */}
            {activeView === "stats" && (
                <>
                    {/* Hero Price & Pair Card */}
                    <div
                        className="relative w-full overflow-hidden p-4 sm:p-5 rounded-2xl flex flex-col gap-3.5 select-none transition-all duration-200"
                        style={incomeCardStyle}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                                    <Image
                                        src="/3d-icons/qtx-logo.png"
                                        alt="QuantX AI"
                                        width={48}
                                        height={48}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                                            QuantX AI
                                        </span>
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-mono">
                                            QTX/WBNB
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-gray-400 font-medium">
                                        PancakeSwap v2 • BSC
                                    </span>
                                </div>
                            </div>

                            {/* 24h Change Badge */}
                            <div
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${
                                    is24hPositive ? "bg-[#10B981] text-white" : "bg-[#EF4444] text-white"
                                }`}
                                style={{
                                    boxShadow: is24hPositive
                                        ? "0 2px 8px rgba(16, 185, 129, 0.35)"
                                        : "0 2px 8px rgba(239, 68, 68, 0.35)",
                                }}
                            >
                                <span className="text-[10px] font-black">{is24hPositive ? "▲" : "▼"}</span>
                                <span>{is24hPositive ? `+${change24h.toFixed(2)}%` : `${change24h.toFixed(2)}%`}</span>
                            </div>
                        </div>

                        {/* Price Details */}
                        <div className="flex items-baseline justify-between gap-2 pt-1 border-t border-black/5 dark:border-white/5 flex-wrap">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-gray-900 dark:text-white tracking-tight">
                                    ${priceUsdNum.toFixed(2)}
                                </span>
                                <span className="text-xs text-gray-400 font-mono">USD</span>
                            </div>

                            <span className="font-mono text-xs text-gray-500 dark:text-[#848e9c]">
                                ≈ {pairData?.priceNative || "0.0376"} BNB
                            </span>
                        </div>
                    </div>

                    {/* Multi-Timeframe Performance Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                        {(["m5", "h1", "h6", "h24"] as const).map((tf) => {
                            const change = pairData?.priceChange?.[tf];
                            const vol = pairData?.volume?.[tf];
                            const isPos = change !== undefined ? change >= 0 : true;
                            const label = tf === "m5" ? "5 Minutes" : tf === "h1" ? "1 Hour" : tf === "h6" ? "6 Hours" : "24 Hours";

                            return (
                                <div
                                    key={tf}
                                    className="p-3 sm:p-3.5 rounded-2xl flex flex-col gap-1 transition-all"
                                    style={incomeCardStyle}
                                >
                                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                                        <span className="font-medium uppercase tracking-wider text-[10px]">{label}</span>
                                        <span className={`font-mono font-bold text-xs ${isPos ? "text-emerald-500" : "text-rose-500"}`}>
                                            {change !== undefined
                                                ? (isPos ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`)
                                                : "—"}
                                        </span>
                                    </div>
                                    <span className="text-xs sm:text-sm font-bold font-mono text-gray-900 dark:text-white mt-0.5">
                                        {formatUSD(vol)}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium">Volume</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Order Flow & Sentiment (Buy vs Sell Ratio) */}
                    <div
                        className="relative w-full overflow-hidden p-4 sm:p-5 rounded-2xl flex flex-col gap-3.5 select-none transition-all duration-200"
                        style={incomeCardStyle}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Trade size={16} color="currentColor" className="text-[#0072ED] dark:text-[#FCD535]" />
                                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                    Order Flow & Sentiment
                                </span>
                            </div>

                            {/* Timeframe Selector Pill */}
                            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/5 dark:bg-white/5 text-[10px] font-mono font-bold">
                                {(["m5", "h1", "h6", "h24"] as const).map((tf) => (
                                    <button
                                        key={tf}
                                        type="button"
                                        onClick={() => setSelectedTf(tf)}
                                        className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                            selectedTf === tf
                                                ? "bg-white dark:bg-[#1a1e27] text-[#0072ED] dark:text-[#FCD535] shadow-xs"
                                                : "text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                        }`}
                                    >
                                        {tf.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Buys vs Sells Counts */}
                        <div className="flex items-center justify-between text-xs font-mono">
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                                <span>{buys} Buys</span>
                                <span className="text-[10px] font-normal text-gray-400">({buyPercent}%)</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
                                <span className="text-[10px] font-normal text-gray-400">({100 - buyPercent}%)</span>
                                <span>{sells} Sells</span>
                            </div>
                        </div>

                        {/* Sentiment Dual Progress Bar */}
                        <div className="w-full h-2 rounded-full overflow-hidden bg-rose-500/30 flex">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${buyPercent}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-black/5 dark:border-white/5">
                            <span>Total Trades ({selectedTf.toUpperCase()}): <strong className="font-mono text-gray-800 dark:text-gray-200">{totalTxns}</strong></span>
                            <span className="text-emerald-500 font-semibold">{buyPercent >= 50 ? "Buy Pressure" : "Sell Pressure"}</span>
                        </div>
                    </div>

                    {/* Liquidity Depth & Valuation Card */}
                    <div
                        className="relative w-full overflow-hidden p-4 sm:p-5 rounded-2xl flex flex-col gap-3 select-none transition-all duration-200"
                        style={incomeCardStyle}
                    >
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <DollarCircle size={16} color="currentColor" className="text-[#0072ED] dark:text-[#FCD535]" />
                                <span>Pool Liquidity & Market Valuation</span>
                            </span>
                            <span className="text-[11px] font-mono text-gray-400">
                                Total: <strong className="text-gray-900 dark:text-white">{formatUSD(pairData?.liquidity?.usd)}</strong>
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-xs pt-1">
                            <div className="p-3 rounded-xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col gap-1">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Pooled QTX</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                                    {formatNum(pairData?.liquidity?.base, 2)} QTX
                                </span>
                                <span className="text-[10px] text-gray-500 dark:text-[#848e9c]">In PancakeSwap pool</span>
                            </div>

                            <div className="p-3 rounded-xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col gap-1">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Pooled WBNB</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                                    {formatNum(pairData?.liquidity?.quote, 2)} WBNB
                                </span>
                                <span className="text-[10px] text-gray-500 dark:text-[#848e9c]">In PancakeSwap pool</span>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-[#848e9c] text-[11px]">Fully Diluted Valuation (FDV)</span>
                            <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                                {formatUSD(pairData?.fdv)}
                            </span>
                        </div>

                        <div className="p-3 rounded-xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-[#848e9c] text-[11px]">Market Cap</span>
                            <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                                {formatUSD(pairData?.marketCap)}
                            </span>
                        </div>
                    </div>
                </>
            )}

            {/* View 2: Embedded Live DEX Candlestick Chart */}
            {activeView === "chart" && (
                <div
                    className="relative w-full overflow-hidden rounded-2xl flex flex-col select-none transition-all duration-200"
                    style={incomeCardStyle}
                >
                    <div className="p-3.5 border-b border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <Chart size={15} color="currentColor" className="text-[#0072ED] dark:text-[#FCD535]" />
                            <span>Live TradingView Chart • DexScreener</span>
                        </span>

                        <a
                            href={pairData?.url || `https://dexscreener.com/bsc/${QTX_WBNB_PAIR_ADDRESS}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#0072ED] dark:text-[#FCD535] font-semibold hover:underline"
                        >
                            <span>Open Fullscreen</span>
                            <ExportSquare size={12} color="currentColor" />
                        </a>
                    </div>

                    <div className="w-full h-[460px] relative bg-black/5 dark:bg-black/20">
                        <iframe
                            src={`https://dexscreener.com/bsc/${QTX_WBNB_PAIR_ADDRESS}?embed=1&theme=${isDark ? "dark" : "light"}&trades=0&info=0`}
                            className="w-full h-full border-0"
                            title="DexScreener QTX Chart"
                            loading="lazy"
                        />
                    </div>
                </div>
            )}
        </motion.div>
    );
}
