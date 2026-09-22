"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDashboard } from "../DashboardContext";
import { ethers } from "ethers";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import {
    ArrowLeft,
    Setting2,
    Clock,
    ArrowSwapVertical,
    TickCircle,
    CloseCircle,
    InfoCircle,
    ExportSquare,
    ArrowDown2,
} from "iconsax-react";
import SwipeButton from "../components/SwipeButton";
import StickyActionCard from "../components/StickyActionCard";
import BackButton from "../components/BackButton";
import TransactionReceiptModal, { TransactionReceiptData } from "../components/TransactionReceiptModal";
import { useTheme } from "@/app/context/ThemeContext";
import {
    I6_TOKEN_ADDRESS,
    USDT_ADDRESS,
    ROUTER_ADDRESS,
} from "@/lib/contracts/abis";

const ROUTER_ABI = [
    {
        "inputs": [
            {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
            {"internalType": "uint256", "name": "amountOutMin", "type": "uint256"},
            {"internalType": "address[]", "name": "path", "type": "address[]"},
            {"internalType": "address", "name": "to", "type": "address"},
            {"internalType": "uint256", "name": "deadline", "type": "uint256"}
        ],
        "name": "swapExactTokensForTokensSupportingFeeOnTransferTokens",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
            {"internalType": "uint256", "name": "amountOutMin", "type": "uint256"},
            {"internalType": "address[]", "name": "path", "type": "address[]"},
            {"internalType": "address", "name": "to", "type": "address"},
            {"internalType": "uint256", "name": "deadline", "type": "uint256"}
        ],
        "name": "swapExactTokensForTokens",
        "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

const TOKEN_ABI = [
    {
        "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
        "name": "approve",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "address", "name": "spender", "type": "address"}],
        "name": "allowance",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export default function SwapPage() {
    const router = useRouter();
    const { userAddress, i6Price, i6Balance: ctxI6Balance, usdtBalance: ctxUsdtBalance } = useDashboard();
    const { address, isConnected } = useAccount();
    const { open } = useAppKit();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [i6Balance, setI6Balance] = useState<string>(ctxI6Balance || "0.00");
    const [usdtBalance, setUsdtBalance] = useState<string>(ctxUsdtBalance || "0.00");
    const [i6RawBalance, setI6RawBalance] = useState<bigint>(0n);

    useEffect(() => {
        if (ctxI6Balance && ctxI6Balance !== "0.00" && i6Balance === "0.00") {
            setI6Balance(ctxI6Balance);
        }
        if (ctxUsdtBalance && ctxUsdtBalance !== "0.00" && usdtBalance === "0.00") {
            setUsdtBalance(ctxUsdtBalance);
        }
    }, [ctxI6Balance, ctxUsdtBalance, i6Balance, usdtBalance]);

    const [amountIn, setAmountIn] = useState<string>("");
    const [amountOut, setAmountOut] = useState<string>("0.00");
    const [minReceived, setMinReceived] = useState<string>("0.00");
    const [priceImpact, setPriceImpact] = useState<string>("0.00%");
    const [rateText, setRateText] = useState<string>("");

    const [slippage, setSlippage] = useState<number>(0.5);
    const [customSlippage, setCustomSlippage] = useState<string>("");
    const [showSettings, setShowSettings] = useState<boolean>(false);

    const [isApproved, setIsApproved] = useState<boolean>(false);
    const [currentAllowance, setCurrentAllowance] = useState<bigint>(0n);

    const [isQuoting, setIsQuoting] = useState<boolean>(false);
    const [quoteError, setQuoteError] = useState<string>("");

    const [isPendingTx, setIsPendingTx] = useState<boolean>(false);
    const [txStatus, setTxStatus] = useState<string>("");
    const [txHash, setTxHash] = useState<string>("");
    const [txError, setTxError] = useState<string>("");
    const [confirmedTx, setConfirmedTx] = useState<TransactionReceiptData | null>(null);

    // High-performance smooth slider tracking
    const [sliderVal, setSliderVal] = useState<number>(0);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const trackRef = useRef<HTMLDivElement>(null);

    // Fetch Token Balances and Router Allowance
    const fetchWalletState = async () => {
        const activeAddr = (address || userAddress) as `0x${string}`;
        if (!activeAddr) return;
        try {
            let i6Bal: bigint = 0n;
            let i6Allow: bigint = currentAllowance;
            let usdtBal: bigint = 0n;
            let fetchedFromRpc = false;

            if (publicClient) {
                try {
                    const [rawI6Bal, rawI6Allow, rawUsdtBal] = await Promise.all([
                        publicClient.readContract({
                            address: I6_TOKEN_ADDRESS as `0x${string}`,
                            abi: TOKEN_ABI,
                            functionName: "balanceOf",
                            args: [activeAddr],
                        }),
                        publicClient.readContract({
                            address: I6_TOKEN_ADDRESS as `0x${string}`,
                            abi: TOKEN_ABI,
                            functionName: "allowance",
                            args: [activeAddr, ROUTER_ADDRESS as `0x${string}`],
                        }),
                        publicClient.readContract({
                            address: USDT_ADDRESS as `0x${string}`,
                            abi: TOKEN_ABI,
                            functionName: "balanceOf",
                            args: [activeAddr],
                        }),
                    ]);
                    i6Bal = rawI6Bal as bigint;
                    i6Allow = rawI6Allow as bigint;
                    usdtBal = rawUsdtBal as bigint;
                    fetchedFromRpc = true;
                } catch {
                    fetchedFromRpc = false;
                }
            }

            if (!fetchedFromRpc || i6Bal === 0n) {
                const [i6Res, usdtRes] = await Promise.all([
                    fetch(`/api/wallet/${activeAddr}?spender=${ROUTER_ADDRESS}&token=i6&_t=${Date.now()}`, { cache: "no-store" }).catch(() => null),
                    fetch(`/api/wallet/${activeAddr}?spender=${ROUTER_ADDRESS}&token=usdt&_t=${Date.now()}`, { cache: "no-store" }).catch(() => null),
                ]);

                if (i6Res && i6Res.ok) {
                    const data = await i6Res.json();
                    const rawBal = BigInt(data.balance || "0");
                    const rawAllow = BigInt(data.allowance || "0");
                    if (rawBal > 0n || i6Bal === 0n) i6Bal = rawBal;
                    if (rawAllow > 0n) i6Allow = rawAllow;
                }

                if (usdtRes && usdtRes.ok) {
                    const data = await usdtRes.json();
                    const rawBal = BigInt(data.balance || "0");
                    if (rawBal > 0n || usdtBal === 0n) usdtBal = rawBal;
                }
            }

            setI6RawBalance(i6Bal);
            if (i6Allow > 0n || currentAllowance === 0n) {
                setCurrentAllowance(i6Allow);
            }
            if (i6Bal > 0n || i6Balance === "0.00") {
                setI6Balance(parseFloat(ethers.formatUnits(i6Bal, 18)).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                }));
            }
            if (usdtBal > 0n || usdtBalance === "0.00") {
                setUsdtBalance(parseFloat(ethers.formatUnits(usdtBal, 18)).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }));
            }
        } catch (err) {
            console.error("Wallet state sync failed", err);
        }
    };

    useEffect(() => {
        fetchWalletState();
        const interval = setInterval(fetchWalletState, 12000);
        return () => clearInterval(interval);
    }, [userAddress, address]);

    // Check approval
    useEffect(() => {
        if (!amountIn || isNaN(Number(amountIn)) || Number(amountIn) <= 0) {
            setIsApproved(false);
            return;
        }
        try {
            const parsed = ethers.parseUnits(amountIn, 18);
            setIsApproved(currentAllowance >= parsed && currentAllowance > 0n);
        } catch {
            setIsApproved(false);
        }
    }, [amountIn, currentAllowance]);

    // Debounced Quote Fetcher
    useEffect(() => {
        if (!amountIn || isNaN(Number(amountIn)) || Number(amountIn) <= 0) {
            setAmountOut("0.00");
            setMinReceived("0.00");
            setPriceImpact("0.00%");
            setRateText("");
            setQuoteError("");
            return;
        }

        const timer = setTimeout(async () => {
            setIsQuoting(true);
            setQuoteError("");
            try {
                const res = await fetch(`/api/swap/quote?amountIn=${amountIn}`);
                const data = await res.json();
                if (!res.ok || data.error) {
                    setQuoteError(data.error || "Unable to fetch swap quote.");
                    setAmountOut("0.00");
                    setMinReceived("0.00");
                    setPriceImpact("0.00%");
                    setRateText("");
                } else {
                    setAmountOut(data.amountOut);
                    setMinReceived(data.minReceived);
                    setPriceImpact(`${data.priceImpact}%`);
                    setRateText(data.rate);
                }
            } catch (err) {
                setQuoteError("Failed to connect to swap oracle.");
            } finally {
                setIsQuoting(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [amountIn, slippage, customSlippage]);

    const activeSlippage = customSlippage ? parseFloat(customSlippage) || 0.5 : slippage;

    // Apply percentage calculation to amountIn
    const applyPercentage = useCallback((pct: number) => {
        const boundedPct = Math.min(100, Math.max(0, Math.round(pct)));
        setSliderVal(boundedPct);

        if (i6RawBalance === 0n) {
            return;
        }

        const totalFormatted = ethers.formatUnits(i6RawBalance, 18);
        const totalNum = parseFloat(totalFormatted);

        if (boundedPct === 0) {
            setAmountIn("");
        } else if (boundedPct === 100) {
            // Provide full precision string
            setAmountIn(totalFormatted);
        } else {
            const calculated = (totalNum * boundedPct) / 100;
            // Trim precision nicely for clean user input
            const str = calculated >= 1 ? calculated.toFixed(4) : calculated.toFixed(6);
            setAmountIn(parseFloat(str).toString());
        }
    }, [i6RawBalance]);

    // High sensitivity touch & drag pointer handlers
    const updatePercentFromClientX = useCallback((clientX: number) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        if (rect.width <= 0) return;
        const offsetX = clientX - rect.left;
        const pct = Math.min(100, Math.max(0, (offsetX / rect.width) * 100));
        applyPercentage(pct);
    }, [applyPercentage]);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        setIsDragging(true);
        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch (err) {}
        updatePercentFromClientX(e.clientX);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        updatePercentFromClientX(e.clientX);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        setIsDragging(false);
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch (err) {}
    };

    // Step 1: Token Approval
    const handleApprove = async () => {
        if (!address && !isConnected) {
            open();
            return;
        }

        setIsPendingTx(true);
        setTxError("");
        setTxStatus("Requesting token approval in your wallet...");

        try {
            const approvalAmount = ethers.MaxUint256;
            const hash = await writeContractAsync({
                address: I6_TOKEN_ADDRESS as `0x${string}`,
                abi: TOKEN_ABI,
                functionName: "approve",
                args: [ROUTER_ADDRESS as `0x${string}`, approvalAmount],
            });
            
            setTxStatus("Approval transaction submitted. Confirming on-chain...");
            setTxHash(hash);
            if (publicClient) {
                await publicClient.waitForTransactionReceipt({ hash });
            }
            // Permanently set approval state to prevent double approval request
            setCurrentAllowance(approvalAmount);
            setIsApproved(true);
            setTxStatus("Approval confirmed! You can now execute the swap.");
        } catch (err: any) {
            console.error("Approval error", err);
            setTxError(err?.shortMessage || err?.message || "Approval rejected or failed.");
        } finally {
            setIsPendingTx(false);
        }
    };

    // Step 2: Execute Swap
    const handleSwap = async () => {
        if (!amountIn || Number(amountIn) <= 0) return;
        if (!address && !isConnected) {
            open();
            return;
        }

        setIsPendingTx(true);
        setTxError("");
        setTxStatus("Executing swap on PancakeSwap Router...");

        try {
            const activeAddr = (address || userAddress) as `0x${string}`;
            const parsedIn = ethers.parseUnits(amountIn, 18);
            const outNum = parseFloat(amountOut);
            const slipMultiplier = (100 - activeSlippage) / 100;
            const minOutNum = Math.max(0, outNum * slipMultiplier);
            const parsedOutMin = ethers.parseUnits(minOutNum.toFixed(18), 18);
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

            setTxStatus("Please confirm swap in your wallet...");

            const hash = await writeContractAsync({
                address: ROUTER_ADDRESS as `0x${string}`,
                abi: ROUTER_ABI,
                functionName: "swapExactTokensForTokensSupportingFeeOnTransferTokens",
                args: [
                    parsedIn,
                    parsedOutMin,
                    [I6_TOKEN_ADDRESS as `0x${string}`, USDT_ADDRESS as `0x${string}`],
                    activeAddr,
                    deadline,
                ],
            });

            setTxStatus("Transaction submitted to network. Confirming...");
            setTxHash(hash);
            if (publicClient) {
                const receipt = await publicClient.waitForTransactionReceipt({ hash });
                if (receipt.status !== "success") {
                    throw new Error("Swap transaction failed on-chain.");
                }
            }

            // Trigger thermal receipt dispenser modal ONLY after confirmed on-chain
            setConfirmedTx({
                type: "swap",
                hash,
                amount: `${amountIn} i6 → ${amountOut} USDT`,
                tokenSymbol: "USDT",
                investorAddress: activeAddr,
                statusText: "Confirmed on BSC",
            });

            setTxStatus("Swap confirmed! USDT credited to your wallet.");
            setAmountIn("");
            setAmountOut("0.00");
            setSliderVal(0);
            fetchWalletState();
        } catch (err: any) {
            console.error("Swap failed", err);
            setTxError(err?.shortMessage || err?.message || "Swap execution failed on PancakeSwap.");
        } finally {
            setIsPendingTx(false);
        }
    };

    const hasInsufficientBalance = (() => {
        if (!amountIn || isNaN(Number(amountIn))) return false;
        try {
            return ethers.parseUnits(amountIn, 18) > i6RawBalance;
        } catch {
            return false;
        }
    })();

    const isInputValid = Boolean(amountIn && Number(amountIn) > 0 && !hasInsufficientBalance && !quoteError);

    // Fiat value calculation
    const inputFiatValue = amountIn && Number(amountIn) > 0 ? (Number(amountIn) * Number(i6Price.replace("$", "") || "0")).toFixed(2) : "0.00";
    const outputFiatValue = amountOut && Number(amountOut) > 0 ? Number(amountOut).toFixed(2) : "0.00";

    return (
        <main className="dashboard-main relative px-4 py-6 pb-40 max-w-lg mx-auto flex flex-col gap-5 min-h-[calc(100vh-40px)] justify-between">
            <div className="flex flex-col gap-5">
                {/* Top Navigation Bar */}
                <div className="flex items-center justify-between py-2">
                    <BackButton href="/dashboard" />

                    <div className="flex items-center gap-1.5 cursor-pointer">
                        <span className="text-base font-semibold text-[#0f172a] dark:text-white">Swap</span>
                        <ArrowDown2 size={14} color="currentColor" className="text-[#0f172a] dark:text-white" />
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setShowSettings(!showSettings)}
                            className="relative inline-flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 hover:scale-105 active:translate-y-0.5 cursor-pointer shrink-0"
                            title="Swap Settings"
                        >
                            {/* 3D Diminishing Crescent */}
                            <div 
                                className="absolute inset-0 rounded-full pointer-events-none"
                                style={{
                                    transform: "translateY(3.5px)",
                                    background: isDark 
                                        ? "linear-gradient(90deg, #ffe87a 0%, #FCD535 50%, #ffe87a 100%)"
                                        : "linear-gradient(90deg, #7CD4FD 0%, #0072ED 50%, #7CD4FD 100%)",
                                    boxShadow: isDark
                                        ? "0px 6px 18px rgba(252, 213, 53, 0.3)"
                                        : "0px 6px 18px rgba(0, 114, 237, 0.32)",
                                }}
                            />
                            <div className="relative z-10 w-full h-full rounded-full bg-white dark:bg-[#14171d] flex items-center justify-center shadow-xs text-[#0f172a] dark:text-white border border-transparent dark:border-white/5">
                                <Setting2 size={20} color="currentColor" />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Slippage Settings Drawer */}
                {showSettings && (
                    <div className="bg-[#F4F4F7] dark:bg-[#14171d] rounded-2xl p-4 flex flex-col gap-2.5">
                        <span className="text-xs font-medium text-[var(--text-soft)]">Slippage Tolerance</span>
                        <div className="flex items-center gap-2">
                            {[0.5, 1.0, 2.5].map((val) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => {
                                        setSlippage(val);
                                        setCustomSlippage("");
                                    }}
                                    className={`flex-1 py-1.5 text-xs rounded-full font-medium transition-all ${
                                        !customSlippage && slippage === val
                                            ? (isDark ? "bg-[#FCD535] text-[#0b0e14] font-bold" : "bg-[#0072ED] text-white")
                                            : "bg-white dark:bg-[#191d24] text-gray-700 dark:text-gray-200"
                                    }`}
                                >
                                    {val}%
                                </button>
                            ))}
                            <input
                                type="number"
                                placeholder="Custom %"
                                value={customSlippage}
                                onChange={(e) => setCustomSlippage(e.target.value)}
                                className="w-24 bg-white dark:bg-[#191d24] rounded-full px-3 py-1.5 text-xs text-center outline-none font-medium text-gray-900 dark:text-white placeholder:text-gray-400 border-none"
                            />
                        </div>
                    </div>
                )}

                {/* Cards Container with Overlapping Circle Button */}
                <div className="relative flex flex-col">
                    {/* Top Card: You Pay (i6) */}
                    <div className="bg-[#F4F4F7] dark:bg-[#14171d] rounded-[26px] p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#848e9c]">
                            <span>You pay</span>
                            <span>Avl. Bal: <strong className="text-gray-900 dark:text-white font-medium">{i6Balance} i6</strong></span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            {/* Token Selector Pill */}
                            <div className="flex items-center gap-2 bg-white dark:bg-[#191d24] px-3 py-1.5 rounded-full shadow-xs shrink-0 cursor-pointer">
                                <img src="/3d-icons/i6-coin-icon.webp" alt="i6 Coin" className="w-12 h-12 rounded-full object-contain" />
                                <span className="font-semibold text-sm text-gray-900 dark:text-white mr-3">i6</span>
                            </div>

                            {/* Large Input */}
                            <div className="flex flex-col items-end flex-1">
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={amountIn}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setAmountIn(val);
                                        const num = parseFloat(val);
                                        const total = parseFloat(ethers.formatUnits(i6RawBalance, 18));
                                        if (total > 0 && !isNaN(num)) {
                                            setSliderVal(Math.min(100, Math.max(0, Math.round((num / total) * 100))));
                                        } else if (!val || num === 0) {
                                            setSliderVal(0);
                                        }
                                    }}
                                    disabled={isPendingTx}
                                    className="w-full text-right bg-transparent text-2xl sm:text-3xl font-medium text-gray-900 dark:text-white outline-none placeholder:text-gray-400 border-none"
                                />
                                <span className="text-xs text-gray-400 dark:text-[#848e9c] font-normal">
                                    ≈${inputFiatValue}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Center Floating Swap Icon Button */}
                    <div className="flex justify-center -my-3.5 z-20 relative">
                        <button
                            type="button"
                            className="relative inline-flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 hover:scale-105 active:translate-y-0.5 cursor-pointer"
                        >
                            <div 
                                className="absolute inset-0 rounded-full pointer-events-none"
                                style={{
                                    transform: "translateY(3.5px)",
                                    background: isDark 
                                        ? "linear-gradient(90deg, #ffe87a 0%, #FCD535 50%, #ffe87a 100%)"
                                        : "linear-gradient(90deg, #7CD4FD 0%, #0072ED 50%, #7CD4FD 100%)",
                                    boxShadow: isDark
                                        ? "0px 6px 18px rgba(252, 213, 53, 0.3)"
                                        : "0px 6px 18px rgba(0, 114, 237, 0.32)",
                                }}
                            />
                            <div className="relative z-10 w-full h-full rounded-full bg-white dark:bg-[#14171d] flex items-center justify-center shadow-xs text-gray-700 dark:text-white border border-transparent dark:border-white/5">
                                <ArrowSwapVertical size={20} color="currentColor" />
                            </div>
                        </button>
                    </div>

                    {/* Bottom Card: You Get (USDT) */}
                    <div className="bg-[#F4F4F7] dark:bg-[#14171d] rounded-[26px] p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#848e9c]">
                            <span>You get</span>
                            <span>Est. receive amount</span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            {/* Token Selector Pill */}
                            <div className="flex items-center gap-2 bg-white dark:bg-[#191d24] px-3 py-1.5 rounded-full shadow-xs shrink-0 cursor-pointer">
                                <img src="/3d-icons/usdt-bep20-icon.webp" alt="USDT BEP20" className="w-12 h-12 rounded-full object-contain" />
                                <span className="font-semibold text-sm text-gray-900 dark:text-white mr-3">USDT</span>
                            </div>

                            {/* Output Amount */}
                            <div className="flex flex-col items-end flex-1 truncate">
                                <div className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-white truncate">
                                    {isQuoting ? (
                                        <span className="text-gray-400 dark:text-[#848e9c] text-lg">Fetching...</span>
                                    ) : (
                                        amountOut
                                    )}
                                </div>
                                <span className="text-xs text-gray-400 dark:text-[#848e9c] font-normal">
                                    ≈${outputFiatValue}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Custom Percentage Slider UI matching Mockup */}
                <div className="flex flex-col gap-2.5 px-1 pt-1 select-none">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => applyPercentage(0)}
                            className="text-xs font-semibold text-gray-400 dark:text-[#848e9c] hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                        >
                            MIN
                        </button>

                        {/* Interactive Track Container */}
                        <div 
                            ref={trackRef}
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerCancel={handlePointerUp}
                            className="relative flex-1 h-[14px] bg-[#EFEFF3] dark:bg-[#2b313a] rounded-full flex items-center cursor-pointer touch-none select-none"
                        >
                            {/* Squircle Thumb */}
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl pointer-events-none flex items-center justify-center"
                                style={{
                                    left: `calc(${sliderVal}% - ${(sliderVal / 100) * 32}px)`,
                                    background: isDark
                                        ? "linear-gradient(180deg, #FCD535 0%, #D4AF37 100%)"
                                        : "linear-gradient(180deg, #27272A 0%, #09090B 100%)",
                                    border: isDark ? "1px solid rgba(252, 213, 53, 0.4)" : "1px solid rgba(255, 255, 255, 0.18)",
                                    boxShadow: isDark
                                        ? "0 0 10px rgba(252, 213, 53, 0.3)"
                                        : "0 0 6px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.25)",
                                }}
                            >
                                <div className={`w-1 h-3 rounded-full ${isDark ? "bg-[#1e2329]/50" : "bg-white/20"}`} />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => applyPercentage(100)}
                            className="text-xs font-semibold text-gray-400 dark:text-[#848e9c] hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                        >
                            MAX
                        </button>
                    </div>

                    {/* Percentage Markers Positioned Under Track */}
                    <div className="relative h-4 mx-9 text-[11px] text-gray-400 dark:text-[#848e9c] font-medium">
                        <button 
                            type="button" 
                            onClick={() => applyPercentage(25)} 
                            className="absolute -translate-x-1/2 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                            style={{ left: "25%" }}
                        >
                            25%
                        </button>
                        <button 
                            type="button" 
                            onClick={() => applyPercentage(50)} 
                            className="absolute -translate-x-1/2 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                            style={{ left: "50%" }}
                        >
                            50%
                        </button>
                        <button 
                            type="button" 
                            onClick={() => applyPercentage(75)} 
                            className="absolute -translate-x-1/2 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                            style={{ left: "75%" }}
                        >
                            75%
                        </button>
                    </div>
                </div>

                {/* Feedback / Error Alerts */}
                {(quoteError || txError || hasInsufficientBalance) && (
                    <div className="rounded-xl p-3 bg-red-50 text-red-600 text-xs flex items-center gap-2">
                        <CloseCircle size={16} color="#DC2626" className="shrink-0" />
                        <span>
                            {hasInsufficientBalance
                                ? "Insufficient i6 balance in your wallet."
                                : quoteError || txError}
                        </span>
                    </div>
                )}

                {txStatus && (
                    <div className="rounded-xl p-3 bg-blue-50 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] text-xs flex items-center gap-2">
                        <InfoCircle size={16} color="currentColor" className="shrink-0" />
                        <span>{txStatus}</span>
                    </div>
                )}
            </div>

            {/* Sticky Action Card with PancakeSwap Router Badge, Standard Approve CTA or Swipe to Swap CTA */}
            <StickyActionCard
                badge={{
                    icon: "/3d-icons/pancake-icon.webp",
                    label: "Router",
                    title: "Pancake Swap V2",
                }}
                mode={!isApproved && isInputValid ? "approve" : "swipe"}
                approveLabel="Approve i6"
                onApprove={handleApprove}
                swipeLabel={amountIn && Number(amountIn) > 0 ? `Swipe to Swap $${outputFiatValue}` : "Swipe to Swap"}
                onSwipe={handleSwap}
                disabled={!isInputValid || isPendingTx}
                loading={isPendingTx}
                disabledText={
                    hasInsufficientBalance
                        ? "Top up i6 (Insufficient Balance)"
                        : "Enter an amount"
                }
                loadingText={txStatus || "Confirming in Wallet..."}
            />

            {/* Thermal Receipt Dispenser Modal */}
            <TransactionReceiptModal
                isOpen={Boolean(confirmedTx)}
                txData={confirmedTx}
                onClose={() => setConfirmedTx(null)}
            />
        </main>
    );
}
