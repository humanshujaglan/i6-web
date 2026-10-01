"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, ExportCircle, TickCircle, CloseCircle } from "iconsax-react";
import { useTheme } from "@/app/context/ThemeContext";

export interface TransactionReceiptData {
    type?: "deposit" | "withdraw" | "swap" | "register" | "reinvest";
    hash: string;
    amount: string;
    tokenSymbol?: string;
    timestamp?: string;
    investorAddress?: string;
    planName?: string;
    statusText?: string;
}

interface TransactionReceiptModalProps {
    isOpen: boolean;
    txData: TransactionReceiptData | null;
    onClose: () => void;
    onViewHistory?: () => void;
}

export default function TransactionReceiptModal({
    isOpen,
    txData,
    onClose,
    onViewHistory,
}: TransactionReceiptModalProps) {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [state, setState] = useState<"idle" | "printing" | "printed" | "tearing">("idle");
    const [copied, setCopied] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [secondsLeft, setSecondsLeft] = useState(5);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Format Helpers
    const formatAddress = (addr?: string) => {
        if (!addr) return "0x...";
        return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
    };

    const getExplorerUrl = (hash?: string) => {
        if (!hash) return "https://bscscan.com";
        return `https://bscscan.com/tx/${hash}`;
    };

    const getNowFormatted = () => {
        const now = new Date();
        const day = now.getDate();
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[now.getMonth()];
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        return `${day} ${month} ${year} · ${hours}:${minutes}`;
    };

    // Web Audio Synthesizer
    const initAudio = () => {
        if (!audioCtxRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                audioCtxRef.current = new AudioContextClass();
            }
        }
        if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
            audioCtxRef.current.resume();
        }
    };

    const playPrintAudio = (durationMs = 2400) => {
        if (!soundEnabled || !audioCtxRef.current) return;
        try {
            const ctx = audioCtxRef.current;
            const now = ctx.currentTime;
            const durSec = durationMs / 1000;

            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.linearRampToValueAtTime(280, now + durSec);

            const bufferSize = ctx.sampleRate * durSec;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.04;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.value = 2400;
            filter.Q.value = 2.5;

            g.gain.setValueAtTime(0.04, now);
            g.gain.linearRampToValueAtTime(0.06, now + 0.1);
            g.gain.linearRampToValueAtTime(0.03, now + durSec - 0.2);
            g.gain.exponentialRampToValueAtTime(0.0001, now + durSec);

            osc.connect(g);
            noise.connect(filter);
            filter.connect(g);
            g.connect(ctx.destination);

            osc.start(now);
            noise.start(now);
            osc.stop(now + durSec);
            noise.stop(now + durSec);
        } catch (e) {
            console.warn("Print sound error", e);
        }
    };

    const playBladeCutAudio = () => {
        if (!soundEnabled || !audioCtxRef.current) return;
        try {
            const ctx = audioCtxRef.current;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(1400, now);
            osc.frequency.exponentialRampToValueAtTime(450, now + 0.12);

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.13);
        } catch (e) {
            console.warn("Cut sound error", e);
        }
    };

    const playTearAudio = () => {
        if (!soundEnabled || !audioCtxRef.current) return;
        try {
            const ctx = audioCtxRef.current;
            const now = ctx.currentTime;
            const dur = 0.28;

            const bufSize = ctx.sampleRate * dur;
            const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) {
                d[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
            }
            const src = ctx.createBufferSource();
            src.buffer = buf;

            const flt = ctx.createBiquadFilter();
            flt.type = "highpass";
            flt.frequency.value = 1800;

            const gn = ctx.createGain();
            gn.gain.setValueAtTime(0.12, now);
            gn.gain.exponentialRampToValueAtTime(0.001, now + dur);

            src.connect(flt);
            flt.connect(gn);
            gn.connect(ctx.destination);

            src.start(now);
            src.stop(now + dur);
        } catch (e) {
            console.warn("Tear sound error", e);
        }
    };

    // Confetti Cannon
    const launchConfetti = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = isDark 
            ? ["#FCD535", "#ffe87a", "#10B981", "#3B82F6", "#FFFFFF"]
            : ["#0072ED", "#38bdf8", "#10B981", "#F59E0B", "#6366F1"];

        const particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            color: string;
            alpha: number;
            rotation: number;
            vRot: number;
        }> = [];

        const startY = window.innerHeight * 0.35;
        const startX = window.innerWidth / 2;

        for (let i = 0; i < 45; i++) {
            const angle = (Math.PI * 2 * i) / 45 + (Math.random() - 0.5);
            const speed = Math.random() * 7 + 4;
            particles.push({
                x: startX,
                y: startY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3,
                size: Math.random() * 6 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                rotation: Math.random() * 360,
                vRot: (Math.random() - 0.5) * 12,
            });
        }

        let animationFrame: number;
        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = false;

            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.22; // gravity
                p.vx *= 0.98;
                p.alpha -= 0.014;
                p.rotation += p.vRot;

                if (p.alpha > 0) {
                    alive = true;
                    ctx.save();
                    ctx.globalAlpha = Math.max(0, p.alpha);
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    ctx.restore();
                }
            });

            if (alive) {
                animationFrame = requestAnimationFrame(render);
            }
        };

        render();
    };

    // Trigger Print Sequence on Open
    useEffect(() => {
        if (isOpen && txData) {
            initAudio();
            setState("printing");
            setSecondsLeft(5);
            playPrintAudio(2400);

            const timer = setTimeout(() => {
                setState("printed");
                playBladeCutAudio();
                launchConfetti();
            }, 2400);

            return () => clearTimeout(timer);
        } else {
            setState("idle");
        }
    }, [isOpen, txData]);

    const handleAutoTearAndRedirect = () => {
        initAudio();
        setState("tearing");
        playTearAudio();

        setTimeout(() => {
            onClose();
            setState("idle");
            if (onViewHistory) {
                onViewHistory();
            } else if (txData?.type === "withdraw") {
                router.push("/dashboard/withdraw?tab=history");
            } else if (txData?.type === "register") {
                router.push("/login");
            } else if (txData?.type === "reinvest") {
                router.push("/dashboard/reinvest");
            } else {
                router.push("/dashboard/investment?tab=history");
            }
        }, 550);
    };

    // Auto Tear and Redirect after 5 seconds of being printed
    useEffect(() => {
        if (state !== "printed") return;

        setSecondsLeft(5);
        const countdownInterval = setInterval(() => {
            setSecondsLeft((prev) => Math.max(0, prev - 1));
        }, 1000);

        const autoTimer = setTimeout(() => {
            handleAutoTearAndRedirect();
        }, 5000);

        return () => {
            clearInterval(countdownInterval);
            clearTimeout(autoTimer);
        };
    }, [state]);

    const copyTxHash = () => {
        if (!txData?.hash) return;
        navigator.clipboard.writeText(txData.hash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const displayAmount = txData?.amount || "0.00";
    const displayDate = txData?.timestamp || getNowFormatted();
    const isDeposit = txData?.type !== "withdraw" && txData?.type !== "swap";

    return (
        <AnimatePresence>
            {isOpen && txData && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-start pt-20 sm:pt-28 p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto select-none"
                >
                    {/* Confetti Canvas */}
                    <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[110] w-full h-full" />

                    {/* Close Button Top-Right */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-5 right-5 z-[120] w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-lg border border-white/10"
                        title="Close"
                    >
                        <CloseCircle size={22} color="#FFFFFF" variant="Linear" />
                    </button>

                    {/* Stage Container */}
                    <div className="relative w-full max-w-sm flex flex-col items-center min-h-[580px] pb-8">
                        
                        {/* 3D Dark Dispenser Unit (Fixed Top Position) */}
                        <div className="relative w-[330px] sm:w-[350px] flex flex-col items-center shrink-0" style={{ zIndex: 30 }}>
                            
                            {/* Top 3D Dark Metallic Hood */}
                            <div 
                                className="w-full h-11 rounded-t-2xl rounded-b-[4px] relative overflow-hidden shadow-2xl"
                                style={{
                                    zIndex: 25,
                                    background: isDark
                                        ? "linear-gradient(180deg, #1f242d 0%, #14171d 45%, #0a0c0f 100%)"
                                        : "linear-gradient(180deg, #1a1e26 0%, #11141a 45%, #07090c 100%)",
                                    border: "1.5px solid rgba(255, 255, 255, 0.12)",
                                    borderBottom: "none",
                                    boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.8), 0 10px 28px rgba(0, 0, 0, 0.9), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
                                }}
                            >
                                {/* Bevel Highlight */}
                                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                                <div className="absolute top-1 left-[5%] w-[90%] h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full blur-[0.5px]" />
                                
                                {/* LED Indicator */}
                                <div 
                                    className={`absolute right-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                        state === "printing" 
                                            ? "bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-pulse" 
                                            : "bg-emerald-500 shadow-[0_0_10px_#10B981]"
                                    }`} 
                                />
                            </div>

                            {/* Dark Slot Slit */}
                            <div 
                                className="w-[295px] sm:w-[315px] h-3.5 -mt-1 bg-[#050608] rounded-xs relative overflow-hidden shadow-[inset_0_6px_14px_rgba(0,0,0,0.98)]"
                                style={{ zIndex: 15 }}
                            >
                                {/* Slit Glow */}
                                <div 
                                    className={`absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent transition-opacity duration-300 ${
                                        state === "printing" ? "opacity-100 animate-pulse" : "opacity-0"
                                    }`} 
                                />
                            </div>

                            {/* Cutter Blade Laser Flash */}
                            {state === "printed" && (
                                <motion.div 
                                    initial={{ opacity: 0, scaleX: 0.05 }}
                                    animate={{ opacity: [0, 1, 0], scaleX: [0.05, 1.02, 1] }}
                                    transition={{ duration: 0.38, ease: "easeInOut" }}
                                    className="absolute top-10 left-1/2 -translate-x-1/2 w-[295px] sm:w-[315px] h-1 pointer-events-none"
                                    style={{ zIndex: 35 }}
                                >
                                    <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_14px_#ffffff] rounded-xs" />
                                </motion.div>
                            )}

                            {/* Bottom Machine Lip */}
                            <div 
                                className="w-full h-3.5 -mt-1 rounded-b-2xl relative overflow-hidden shadow-md"
                                style={{
                                    zIndex: 20,
                                    background: "linear-gradient(180deg, #07090c 0%, #11141a 50%, #1a1e26 100%)",
                                    border: "1.5px solid rgba(255, 255, 255, 0.12)",
                                    borderTop: "none",
                                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.8)",
                                }}
                            >
                                <div className="absolute bottom-0 left-[10%] w-[80%] h-[1.5px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                            </div>

                            {/* Paper Viewport */}
                            <div 
                                className="absolute top-8 left-1/2 -translate-x-1/2 w-[300px] sm:w-[320px] pointer-events-auto"
                                style={{
                                    zIndex: 10,
                                    perspective: "1200px",
                                    perspectiveOrigin: "50% 0%",
                                    clipPath: "inset(0px -60px -2000px -60px)",
                                }}
                            >
                                {/* Ticket Card */}
                                <motion.article 
                                    onClick={handleAutoTearAndRedirect}
                                    initial={{ y: "-96%", rotateX: -18, opacity: 0.5 }}
                                    animate={
                                        state === "printing"
                                            ? {
                                                  y: ["-96%", "-68%", "-36%", "-10%", "0%"],
                                                  rotateX: [-18, -11, -5, -2, 0],
                                                  opacity: [0.5, 0.9, 1, 1, 1],
                                              }
                                            : state === "tearing"
                                            ? {
                                                  y: 35,
                                                  x: 160,
                                                  rotate: -18,
                                                  scale: 0.9,
                                                  opacity: 0,
                                              }
                                            : { y: "0%", rotateX: 0, opacity: 1 }
                                    }
                                    transition={{
                                        duration: state === "tearing" ? 0.55 : 2.4,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                    className="w-[280px] sm:w-[300px] mx-auto bg-white rounded-b-[24px] relative shadow-[0_24px_65px_rgba(15,23,42,0.22),0_8px_24px_rgba(15,23,42,0.1)] cursor-pointer overflow-hidden transition-shadow hover:shadow-[0_30px_75px_rgba(15,23,42,0.28)]"
                                >
                                    {/* Paper Gloss Sheen */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-transparent pointer-events-none z-5" />

                                    <div className="p-4 sm:p-5 relative z-10 flex flex-col">
                                        
                                        {/* 1. Header with Infinity Six Badge */}
                                        <header className="flex flex-col items-center text-center mb-2.5">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-100 to-amber-50 border-2 border-amber-200 flex items-center justify-center p-1 shadow-[0_4px_16px_rgba(245,158,11,0.25)] mb-1.5">
                                                <Image 
                                                    src="/3d-icons/i6-coin-icon.webp" 
                                                    alt="Infinity Six" 
                                                    width={36} 
                                                    height={36} 
                                                    className="w-8 h-8 object-contain" 
                                                />
                                            </div>

                                            <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight leading-tight">
                                                {txData.type === "register"
                                                    ? "Account Activated!" 
                                                    : txData.type === "swap"
                                                    ? "Swap Confirmed!"
                                                    : txData.type === "withdraw"
                                                    ? "Withdrawal Confirmed!"
                                                    : txData.type === "reinvest"
                                                    ? "Reinvestment Confirmed!"
                                                    : "Deposit Confirmed!"}
                                            </h1>
                                            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                                                {txData.type === "register"
                                                    ? "Registration & deposit successful" 
                                                    : txData.type === "swap"
                                                    ? "PancakeSwap DEX swap successful"
                                                    : txData.type === "withdraw"
                                                    ? "Withdrawal processed to wallet"
                                                    : "Smart contract deposit successful"}
                                            </p>
                                        </header>

                                        {/* 2. Perforation Divider with Notches */}
                                        <div className="flex items-center relative -mx-5 my-1 py-1">
                                            <div className="w-5 h-5 rounded-full bg-slate-950/70 -ml-2.5 shadow-inner" />
                                            <div className="flex-1 border-b-2 border-dashed border-gray-200 mx-2" />
                                            <div className="w-5 h-5 rounded-full bg-slate-950/70 -mr-2.5 shadow-inner" />
                                        </div>

                                        {/* 3. Ticket Details */}
                                        <section className="flex flex-col gap-2 pt-1.5 text-xs">
                                            
                                            {/* Amount & Status */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                                        Amount
                                                    </span>
                                                    <span className="text-sm sm:text-base font-bold text-gray-900 font-mono">
                                                        {displayAmount.includes("→") 
                                                            ? displayAmount 
                                                            : (txData.type === "withdraw"
                                                                ? `${displayAmount} ${txData.tokenSymbol || "i6"}`
                                                                : `$${parseFloat(displayAmount || "0").toFixed(2)} ${txData.tokenSymbol || "USDT"}`)}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                                        Status
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-semibold text-[11px]">
                                                        <TickCircle size={12} color="currentColor" variant="Bold" />
                                                        Confirmed
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Transaction Hash Card with Copy & Direct BSC Link */}
                                            <div className="flex flex-col gap-1.5 p-2.5 bg-gray-50 border border-gray-100 rounded-xl mt-0.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                                        Transaction Hash
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-medium">
                                                        {displayDate}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between gap-1.5">
                                                    <span className="font-mono text-gray-900 font-semibold text-[11px] truncate max-w-[150px]" title={txData.hash}>
                                                        {formatAddress(txData.hash)}
                                                    </span>

                                                    <div className="flex items-center gap-1">
                                                        {/* Copy Hash Button */}
                                                        <button 
                                                            type="button" 
                                                            onClick={(e) => { e.stopPropagation(); copyTxHash(); }}
                                                            className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-gray-900 hover:border-gray-300 text-[10px] font-medium flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                                                            title="Copy Transaction Hash"
                                                        >
                                                            {copied ? (
                                                                <>
                                                                    <TickCircle size={11} color="#10B981" />
                                                                    <span className="text-emerald-600 font-semibold">Copied</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy size={11} color="currentColor" />
                                                                    <span>Copy</span>
                                                                </>
                                                            )}
                                                        </button>
                                                        {/* BscScan Direct Explorer Link */}
                                                        <a 
                                                            href={getExplorerUrl(txData.hash)} 
                                                            target="_blank" 
                                                            rel="noreferrer" 
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="px-2 py-1 bg-[#0072ED] hover:bg-[#0062cc] text-white dark:bg-[#FCD535] dark:hover:bg-[#f0b90b] dark:text-[#1e2329] rounded-lg text-[10px] font-medium flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                                                            title="View on BscScan Explorer"
                                                        >
                                                            <span>BscScan</span>
                                                            <ExportCircle size={11} color={isDark ? "#1e2329" : "#FFFFFF"} />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Network & Investor Details */}
                                            <div className="flex items-center justify-between px-0.5 text-[11px] pt-0.5">
                                                <div className="flex items-center gap-1.5 text-gray-500">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    <span>BNB Smart Chain</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-500">
                                                    <span className="text-gray-400">Investor:</span>
                                                    <span className="font-mono text-gray-700 font-medium text-[10px]">
                                                        {txData.investorAddress ? formatAddress(txData.investorAddress) : "Main Contract"}
                                                    </span>
                                                </div>
                                            </div>

                                        </section>

                                        {/* 4. Bottom QR Code Section (Links to BscScan) */}
                                        <footer className="mt-3 pt-1 flex flex-col items-center gap-1">
                                            <a 
                                                href={getExplorerUrl(txData.hash)} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-12 h-12 p-1 bg-white border border-gray-200 rounded-lg shadow-2xs hover:scale-105 transition-transform cursor-pointer"
                                                title="Scan / Click to verify on BscScan"
                                            >
                                                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
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
                                            </a>
                                            <span className="text-[9.5px] font-mono text-gray-400 tracking-wider">
                                                REDIRECTING TO HISTORY IN {secondsLeft}S...
                                            </span>
                                        </footer>

                                    </div>
                                </motion.article>
                            </div>

                        </div>

                        {/* Bottom Floating Action Button */}
                        {state === "printed" && (
                            <motion.div 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.3 }}
                                className="mt-[420px] flex items-center justify-center z-[40]"
                            >
                                <button
                                    type="button"
                                    onClick={handleAutoTearAndRedirect}
                                    className="px-6 py-2.5 rounded-full bg-[#0072ED] hover:bg-[#0062cc] text-white dark:bg-[#FCD535] dark:hover:bg-[#f0b90b] dark:text-[#1e2329] font-semibold text-xs shadow-xl transition-all active:scale-95 cursor-pointer"
                                >
                                    View in History
                                </button>
                            </motion.div>
                        )}

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
