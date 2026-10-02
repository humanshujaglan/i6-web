"use client";

import { useState, useEffect, useMemo, useRef, memo } from "react";
import Image from "next/image";
import { useTheme } from "@/app/context/ThemeContext";

export interface I6PriceCardProps {
    className?: string;
    customPrice?: string;
    customMarketCap?: string;
    customVolume?: string;
    customChange?: number;
    title?: string;
    symbol?: string;
    onCardClick?: () => void;
}

interface PriceData {
    symbol: string;
    name: string;
    displayName: string;
    price: number;
    priceFormatted: string;
    change24h: number;
    marketCap: string;
    marketCapExact: string;
    volume24h: string;
    volume24hExact: string;
    liquidity: string;
    sparkline: number[];
}

const DEFAULT_SPARKLINE = [24.85, 24.95, 25.10, 25.05, 25.30, 25.20, 25.45, 25.50, 25.65, 25.70, 25.80, 25.84];

export const I6PriceCard = memo(function I6PriceCard({
    className = "",
    customPrice,
    customMarketCap,
    customVolume,
    customChange,
    title = "QuantX AI",
    symbol = "QTX",
    onCardClick,
}: I6PriceCardProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [priceData, setPriceData] = useState<PriceData>({
        symbol: "QTX",
        name: "QuantX AI",
        displayName: "QuantX AI",
        price: 25.84,
        priceFormatted: "$25.84",
        change24h: 2.77,
        marketCap: "$2.58M",
        marketCapExact: "2584431.00",
        volume24h: "$136.28",
        volume24hExact: "136.28",
        liquidity: "$39.60K",
        sparkline: DEFAULT_SPARKLINE,
    });

    // Fetch live market data for QTX from /api/token-price?token=qtx
    const fetchLivePrice = async () => {
        try {
            const res = await fetch("/api/token-price?token=qtx");
            if (res.ok) {
                const data = await res.json();
                setPriceData((prev) => ({
                    ...prev,
                    ...data,
                }));
            }
        } catch (err) {
            console.error("Failed to fetch live QTX price:", err);
        }
    };

    useEffect(() => {
        fetchLivePrice();
        const interval = setInterval(fetchLivePrice, 10000);
        return () => clearInterval(interval);
    }, []);

    const effectiveChange = customChange !== undefined ? customChange : priceData.change24h;
    const isNegative = effectiveChange < 0;
    const chartColor = isNegative ? "#F43F5E" : (isDark ? "#FCD535" : "#0072ED");
    const effectivePrice = customPrice || priceData.priceFormatted || (priceData.price >= 1 ? `$${priceData.price.toFixed(2)}` : `$${priceData.price.toFixed(4)}`);
    const effectiveMarketCap = customMarketCap || priceData.marketCap || "$2.58M";
    const effectiveLiquidity = priceData.liquidity || "$39.60K";
    const effectiveVolume = customVolume || priceData.volume24h || "$136.28";
    const effectiveTitle = title === "Bitcoin" || title === "Infinity Six" ? (priceData.displayName || "QuantX AI") : title;
    const effectiveSymbol = symbol === "BTC" || symbol === "i6" ? (priceData.symbol || "QTX") : symbol;

    // Full-Width Bottom Chart Geometry & Bézier Smoothing
    const { strokePath, fillPath, points, lastPoint, activePoint } = useMemo(() => {
        const raw = priceData.sparkline && priceData.sparkline.length > 1
            ? priceData.sparkline
            : DEFAULT_SPARKLINE;

        const w = 400;
        const h = 75;
        const padTop = 6;
        const padBottom = 8;
        const padX = 0;

        const min = Math.min(...raw);
        const max = Math.max(...raw);
        const range = max - min || 1;

        const pts = raw.map((val, idx) => {
            const x = padX + (idx / (raw.length - 1)) * (w - padX * 2);
            const y = (h - padBottom) - ((val - min) / range) * (h - padTop - padBottom);
            return { x, y, val, index: idx };
        });

        // Cubic Bézier curve construction across full width
        let stroke = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i];
            const p1 = pts[i + 1];
            const cpx1 = p0.x + (p1.x - p0.x) / 2;
            const cpx2 = cpx1;
            stroke += ` C ${cpx1.toFixed(1)} ${p0.y.toFixed(1)}, ${cpx2.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.x.toFixed(1)}`;
        }

        const last = pts[pts.length - 1];
        const fill = `${stroke} L ${last.x.toFixed(1)} ${h} L ${pts[0].x.toFixed(1)} ${h} Z`;
        const active = activeIndex !== null && pts[activeIndex] ? pts[activeIndex] : null;

        return { strokePath: stroke, fillPath: fill, points: pts, lastPoint: last, activePoint: active };
    }, [priceData.sparkline, activeIndex]);

    // Handle interactive click and drag inspection on the graph
    const updateInteractivePoint = (clientX: number) => {
        if (!chartContainerRef.current) return;
        const rect = chartContainerRef.current.getBoundingClientRect();
        const relX = clientX - rect.left;
        const fraction = Math.max(0, Math.min(1, relX / rect.width));
        const idx = Math.min(points.length - 1, Math.max(0, Math.round(fraction * (points.length - 1))));
        setActiveIndex(idx);
    };

    return (
        <div 
            onClick={onCardClick}
            className={`relative w-full overflow-hidden rounded-[22px] sm:rounded-[26px] pt-4 sm:pt-5 px-4 sm:px-5 pb-0 select-none transition-all duration-300 hover:scale-[1.005] active:scale-[0.995] ${className}`}
            style={{
                background: isDark 
                    ? "linear-gradient(135deg, #0f1217 0%, #060709 100%)"
                    : "linear-gradient(135deg, #11141a 0%, #080a0d 100%)",
                boxShadow: isDark
                    ? "inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 8px 24px rgba(0, 0, 0, 0.55)"
                    : "0 8px 24px rgba(10, 15, 25, 0.25)",
                border: "1px solid rgba(255, 255, 255, 0.10)",
            }}
        >
            {/* Top Row: QTX Token Icon, Title (Left) & Liquidity, 24h Vol (Top Right Corner) */}
            <div className="relative z-10 flex items-center justify-between">
                {/* Left: Coin Icon & Token Name */}
                <div className="flex items-center gap-2.5">
                    <div className="relative w-[47px] h-[47px] sm:w-[52px] sm:h-[52px] shrink-0 flex items-center justify-center">
                        <Image
                            src="/3d-icons/qtx-logo.png"
                            alt="QuantX AI (QTX)"
                            width={52}
                            height={52}
                            className="w-full h-full object-contain"
                        />
                    </div>

                    <div className="flex flex-col">
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-none">
                            {effectiveTitle}
                        </h3>
                        <span className="text-[11px] font-semibold text-[#0072ED] dark:text-[#FCD535] mt-0.5">
                            {effectiveSymbol}
                        </span>
                    </div>
                </div>

                {/* Top Right Corner: Liquidity & 24h Volume */}
                <div className="flex items-center gap-5 sm:gap-7 text-right">
                    <div className="flex flex-col">
                        <span className="text-[11px] sm:text-xs font-medium text-gray-400">
                            Liquidity
                        </span>
                        <span className="text-base sm:text-lg font-bold text-white font-mono tracking-tight mt-0.5">
                            {effectiveLiquidity}
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[11px] sm:text-xs font-medium text-gray-400">
                            24h Volume
                        </span>
                        <span className="text-base sm:text-lg font-bold text-white font-mono tracking-tight mt-0.5">
                            {effectiveVolume}
                        </span>
                    </div>
                </div>
            </div>

            {/* Middle Row: Live / Inspected Price & 24h Change Badge */}
            <div className="relative z-10 flex items-baseline justify-between mt-3 mb-1">
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                        {activePoint ? (activePoint.val >= 1 ? `$${activePoint.val.toFixed(2)}` : `$${activePoint.val.toFixed(4)}`) : effectivePrice}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">USD</span>
                </div>

                <div className="flex items-center gap-2">
                    <div 
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm transition-transform duration-200 ${
                            isNegative 
                                ? "text-white bg-[#F43F5E]" 
                                : (isDark ? "text-[#0b0e14] bg-[#FCD535]" : "text-white bg-[#10B981]")
                        }`}
                        style={{
                            boxShadow: isNegative 
                                ? "0 2px 8px rgba(244, 63, 94, 0.45)" 
                                : (isDark ? "0 2px 8px rgba(252, 213, 53, 0.45)" : "0 2px 8px rgba(16, 185, 129, 0.45)"),
                        }}
                    >
                        <span className="text-[10px] font-black">
                            {isNegative ? "▼" : "▲"}
                        </span>
                        <span>
                            {effectiveChange > 0 ? `+${effectiveChange.toFixed(2)}%` : `${effectiveChange.toFixed(2)}%`}
                        </span>
                    </div>
                    {activePoint && (
                        <span className={`text-[10px] font-semibold tracking-wider uppercase ${isNegative ? "text-rose-400" : (isDark ? "text-[#FCD535]" : "text-emerald-400")}`}>
                            Point Value
                        </span>
                    )}
                </div>
            </div>

            {/* Bottom Section: Full-Width Interactive Financial Area Chart */}
            <div 
                ref={chartContainerRef}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    updateInteractivePoint(e.clientX);
                }}
                onPointerMove={(e) => {
                    if (e.buttons === 1 || e.pointerType === "mouse" || e.pointerType === "touch") {
                        updateInteractivePoint(e.clientX);
                    }
                }}
                onPointerLeave={() => setActiveIndex(null)}
                className="relative -mx-4 sm:-mx-5 h-20 sm:h-24 w-[calc(100%+2rem)] sm:w-[calc(100%+2.5rem)] overflow-hidden cursor-crosshair touch-none mt-1"
            >
                <svg 
                    viewBox="0 0 400 75" 
                    className="w-full h-full overflow-hidden block"
                    preserveAspectRatio="none"
                >
                    <defs>
                        {/* Dynamic Area Gradient based on increment/decrement */}
                        <linearGradient id="qtx-fullwidth-area" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chartColor} stopOpacity="0.32" />
                            <stop offset="60%" stopColor={chartColor} stopOpacity="0.08" />
                            <stop offset="100%" stopColor={chartColor} stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* Subtle Horizontal Reference Grid Lines */}
                    <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                    <line x1="0" y1="52" x2="400" y2="52" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

                    {/* Gradient Area Fill */}
                    <path
                        d={fillPath}
                        fill="url(#qtx-fullwidth-area)"
                    />

                    {/* Main Curve Stroke */}
                    <path
                        d={strokePath}
                        fill="none"
                        stroke={chartColor}
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Leading Edge Real-Time Pulse Beacon */}
                    {!activePoint && lastPoint && (
                        <g>
                            <circle 
                                cx={lastPoint.x - 2} 
                                cy={lastPoint.y} 
                                r="5.5" 
                                fill={chartColor} 
                                opacity="0.3" 
                                className="animate-ping"
                            />
                            <circle 
                                cx={lastPoint.x - 2} 
                                cy={lastPoint.y} 
                                r="3" 
                                fill={chartColor} 
                            />
                        </g>
                    )}

                    {/* Interactive Click/Drag Inspection Indicator */}
                    {activePoint && (
                        <g>
                            <line 
                                x1={activePoint.x} 
                                y1={2} 
                                x2={activePoint.x} 
                                y2={75} 
                                stroke={chartColor} 
                                strokeDasharray="2 2" 
                                strokeWidth="1.2"
                                opacity="0.85"
                            />
                            <circle 
                                cx={activePoint.x} 
                                cy={activePoint.y} 
                                r="4.5" 
                                fill={chartColor} 
                                stroke="#0b0e14" 
                                strokeWidth="1.5"
                            />
                        </g>
                    )}
                </svg>
            </div>
        </div>
    );
});

export default I6PriceCard;
