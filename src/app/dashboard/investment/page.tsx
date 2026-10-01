"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDashboard } from "../DashboardContext";
import { useSearchParams } from "next/navigation";
import { ethers } from "ethers";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CardAdd,
    ReceiptText,
    Wallet3,
    TickCircle,
    CloseCircle,
    InfoCircle,
    Flash,
    ShieldSecurity,
    ArrowRight2,
    ArrowLeft,
    ArrowDown2,
    ArrowSwapVertical,
    Clock,
} from "iconsax-react";
import SwipeButton from "../components/SwipeButton";
import StickyActionCard from "../components/StickyActionCard";
import BackButton from "../components/BackButton";
import DepositTicket from "../components/DepositTicket";
import TransactionReceiptModal, { TransactionReceiptData } from "../components/TransactionReceiptModal";
import { useTheme } from "@/app/context/ThemeContext";
import {
    MAIN_CONTRACT_ADDRESS as MLM_CONTRACT_ADDR,
    I6_TOKEN_ADDRESS as I6_TOKEN_ADDR,
    USDT_ADDRESS as USDT_ADDR,
    ROUTER_ADDRESS as ROUTER_ADDR,
} from "@/lib/contracts/abis";

const MINIMUM_DEPOSIT_USDT = 10;
const CURRENT_SLIPPAGE = 1.5;

const USDT_ABI = [
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

const MLM_ABI = [
    {
        "inputs": [
            {"internalType": "uint256", "name": "usdtAmount", "type": "uint256"},
            {"internalType": "address", "name": "referrer", "type": "address"},
            {"internalType": "uint256", "name": "minTokensOut", "type": "uint256"}
        ],
        "name": "invest",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

interface LivePackageData {
    displayEarned: string;
    progressPerc: number;
    availableRoi: number;
}

function InvestmentContent() {
    const { userAddress, user, investments, refreshData, launchTime, spotPrice, i6Price, usdtBalance: ctxUsdtBalance } = useDashboard();
    const { address, isConnected } = useAccount();
    const { open } = useAppKit();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { theme } = useTheme();
    const isDark = theme === "dark";
    
    const [activeTab, setActiveTab] = useState<"deposit" | "history">("deposit");
    
    // Deposit state
    const [usdtBalance, setUsdtBalance] = useState(ctxUsdtBalance || "0.00");
    const [investAmount, setInvestAmount] = useState("");
    const [sponsorAddress, setSponsorAddress] = useState("");
    const [swapPhaseLabel, setSwapPhaseLabel] = useState("Protocol Swap Est:");
    const [totalI6Tokens, setTotalI6Tokens] = useState("0.00 i6");
    const [expectedI6, setExpectedI6] = useState("0.00 i6");
    const [minReceived, setMinReceived] = useState("0.00 i6");
    
    const [isApproveMode, setIsApproveMode] = useState(true);
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const [insufficientBalance, setInsufficientBalance] = useState(false);
    const [busyText, setBusyText] = useState("");
    const [txStatus, setTxStatus] = useState("");
    const [txStatusColor, setTxStatusColor] = useState("var(--text-main)");
    const [confirmedTx, setConfirmedTx] = useState<TransactionReceiptData | null>(null);

    const [isFirstTime, setIsFirstTime] = useState(false);
    const [cachedMinTokensOut, setCachedMinTokensOut] = useState(0n);
    const [livePackages, setLivePackages] = useState<LivePackageData[]>([]);
    const [depositEvents, setDepositEvents] = useState<{ timestamp: number; txHash: string; packageIndex: number }[]>([]);

    useEffect(() => {
        if (ctxUsdtBalance && ctxUsdtBalance !== "0.00") {
            setUsdtBalance(ctxUsdtBalance);
        }
    }, [ctxUsdtBalance]);

    useEffect(() => {
        const activeAddr = address || userAddress;
        if (!activeAddr) return;
        try {
            const cached = localStorage.getItem(`i6_deposits_cache_${activeAddr}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setDepositEvents(parsed);
                }
            }
        } catch {}

        fetch(`/api/deposits/${activeAddr}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.deposits && Array.isArray(data.deposits)) {
                    setDepositEvents(data.deposits);
                    try {
                        localStorage.setItem(`i6_deposits_cache_${activeAddr}`, JSON.stringify(data.deposits));
                    } catch {}
                }
            })
            .catch(() => {});
    }, [userAddress, address]);

    useEffect(() => {
        const tabParam = searchParams.get("tab");
        if (tabParam === "history") {
            setActiveTab("history");
        }
    }, [searchParams]);

    // Check first-time user and ref URL
    useEffect(() => {
        if (!userAddress || !user) return;
        setIsFirstTime(Number(user.totalDeposits) === 0);

        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            const ref = urlParams.get("ref");
            if (ref && ethers.isAddress(ref)) {
                setSponsorAddress(ref);
            }
        }
    }, [userAddress, user]);

    // Fetch USDT Balance
    const fetchBalance = async () => {
        const activeAddr = address || userAddress;
        if (!activeAddr) return;
        try {
            const res = await fetch(`/api/wallet/${activeAddr}?spender=${MLM_CONTRACT_ADDR}`);
            if (!res.ok) throw new Error("Failed to fetch wallet state");
            const data = await res.json();
            const fmt = ethers.formatUnits(data.balance, 18);
            setUsdtBalance(parseFloat(fmt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        } catch (e) {
            console.error("USDT balance sync failed", e);
        }
    };

    useEffect(() => {
        fetchBalance();
        const interval = setInterval(fetchBalance, 10000);
        return () => clearInterval(interval);
    }, [userAddress, address]);

    // History live ticker
    useEffect(() => {
        if (!user || investments.length === 0) return;

        const interval = setInterval(() => {
            const now = Date.now() / 1000;
            const isGloballyCapped = user.isCapped;
            const userRate = Number(user.currentRwpRate) === 0 ? 5 : Number(user.currentRwpRate);

            const updated = investments.map((item) => {
                const amount = parseFloat(ethers.formatUnits(item.amount, 18));
                let compoundedPrincipal = parseFloat(ethers.formatUnits(item.compoundedPrincipal, 18));
                const rwpWithdrawn = parseFloat(ethers.formatUnits(item.rwpWithdrawn, 18));
                const lastUpdateTime = Number(item.lastUpdateTime);
                const isActive = item.isActive;

                const packageRate = userRate + Number(item.boostperc);
                const maxEarn = amount * 2.5;
                let totalCurrentEarned = 0;

                if (!isActive) {
                    totalCurrentEarned = maxEarn;
                } else {
                    const timeElapsed = now - lastUpdateTime;
                    if (timeElapsed > 0 && !isGloballyCapped) {
                        const extra = (compoundedPrincipal * packageRate * timeElapsed) / (1000 * 86400);
                        compoundedPrincipal += extra;
                    }

                    const available = Math.max(0, compoundedPrincipal - amount);
                    totalCurrentEarned = available + rwpWithdrawn;

                    if (totalCurrentEarned > maxEarn) totalCurrentEarned = maxEarn;
                    if (totalCurrentEarned < 0) totalCurrentEarned = 0;
                }

                let progressPerc = (totalCurrentEarned / maxEarn) * 100;
                if (progressPerc > 100) progressPerc = 100;

                let displayEarned = `$${totalCurrentEarned.toFixed(6)}`;

                if (!isActive || totalCurrentEarned >= maxEarn) {
                    displayEarned = `$${maxEarn.toFixed(2)}`;
                    progressPerc = 100;
                } else if (isGloballyCapped) {
                    displayEarned = `$${totalCurrentEarned.toFixed(4)}`;
                }

                return {
                    displayEarned,
                    progressPerc,
                    availableRoi: Math.max(0, compoundedPrincipal - amount),
                };
            });

            setLivePackages(updated);
        }, 100);

        return () => clearInterval(interval);
    }, [user, investments]);

    // Recalculate previews and allowances on input change
    useEffect(() => {
        const calculatePreview = async () => {
            const amountVal = parseFloat(investAmount);
            if (isNaN(amountVal) || amountVal < MINIMUM_DEPOSIT_USDT) {
                setTotalI6Tokens("0.00 i6");
                setExpectedI6("0.00 i6");
                setMinReceived("0.00 i6");
                setCachedMinTokensOut(0n);
                setButtonDisabled(true);
                setInsufficientBalance(false);
                return;
            }

            if (isFirstTime && (!sponsorAddress || !ethers.isAddress(sponsorAddress))) {
                setButtonDisabled(true);
                setInsufficientBalance(false);
                return;
            }

            const activeAddr = address || userAddress;
            if (!activeAddr) {
                setButtonDisabled(true);
                return;
            }

            try {
                const amountWei = ethers.parseUnits(amountVal.toString(), 18);
                const priceNum = spotPrice > 0n
                    ? parseFloat(ethers.formatUnits(spotPrice, 18))
                    : (parseFloat(i6Price?.replace(/[^0-9.]/g, "") || "0.1048") || 0.1048);
                if (priceNum > 0) {
                    setTotalI6Tokens((amountVal / priceNum).toFixed(4) + " i6");
                }

                let swapPercent = 60n;
                let phaseText = "Protocol 60% Liquidity (Phase 1)";
                if (launchTime > 0) {
                    const currentTime = BigInt(Math.floor(Date.now() / 1000));
                    const oneYear = 365n * 24n * 60n * 60n;
                    if (currentTime > BigInt(launchTime) + oneYear) {
                        swapPercent = 100n;
                        phaseText = "Protocol 100% Liquidity (Phase 2)";
                    }
                }
                setSwapPhaseLabel(phaseText);

                const swapAmountWei = (amountWei * swapPercent) / 100n;
                const path = [USDT_ADDR, I6_TOKEN_ADDR];

                let minOutWei = 0n;
                try {
                    const quoteRes = await fetch(`/api/swap-quote?amount=${swapAmountWei.toString()}&path=${path.join(",")}`);
                    if (quoteRes.ok) {
                        const amounts: string[] = await quoteRes.json();
                        const outExpectedWei = BigInt(amounts[1]);
                        const factor = 1000n - BigInt(Math.round(CURRENT_SLIPPAGE * 10));
                        minOutWei = (outExpectedWei * factor) / 1000n;
                        setExpectedI6(parseFloat(ethers.formatUnits(outExpectedWei, 18)).toFixed(4) + " i6");
                        setMinReceived(parseFloat(ethers.formatUnits(minOutWei, 18)).toFixed(4) + " i6");
                    } else if (spotPrice > 0n) {
                        const outExpectedWei = (swapAmountWei * ethers.WeiPerEther) / spotPrice;
                        const factor = 1000n - BigInt(Math.round(CURRENT_SLIPPAGE * 10));
                        minOutWei = (outExpectedWei * factor) / 1000n;
                        setExpectedI6(parseFloat(ethers.formatUnits(outExpectedWei, 18)).toFixed(4) + " i6");
                        setMinReceived(parseFloat(ethers.formatUnits(minOutWei, 18)).toFixed(4) + " i6");
                    }
                } catch {
                    if (spotPrice > 0n) {
                        const outExpectedWei = (swapAmountWei * ethers.WeiPerEther) / spotPrice;
                        const factor = 1000n - BigInt(Math.round(CURRENT_SLIPPAGE * 10));
                        minOutWei = (outExpectedWei * factor) / 1000n;
                        setExpectedI6(parseFloat(ethers.formatUnits(outExpectedWei, 18)).toFixed(4) + " i6");
                        setMinReceived(parseFloat(ethers.formatUnits(minOutWei, 18)).toFixed(4) + " i6");
                    }
                }
                setCachedMinTokensOut(minOutWei);

                const walletRes = await fetch(`/api/wallet/${activeAddr}?spender=${MLM_CONTRACT_ADDR}`);
                if (!walletRes.ok) throw new Error("Failed to fetch wallet state");
                const wallet = await walletRes.json();
                const rawBal = BigInt(wallet.balance);
                if (rawBal < amountWei) {
                    setInsufficientBalance(true);
                    setButtonDisabled(true);
                    return;
                }
                setInsufficientBalance(false);

                const allowed = BigInt(wallet.allowance);
                setIsApproveMode(allowed < amountWei);
                setButtonDisabled(false);
            } catch (err) {
                console.error("Preview calculation failed", err);
                setButtonDisabled(false);
            }
        };

        const timer = setTimeout(calculatePreview, 300);
        return () => clearTimeout(timer);
    }, [investAmount, sponsorAddress, userAddress, address, isFirstTime, launchTime, spotPrice]);

    // Handle Approve
    const handleApprove = async () => {
        if (!address && !isConnected) {
            open();
            return;
        }

        setBusyText("btnApprove");
        setTxStatus("Approving USDT...");
        setTxStatusColor("var(--brand-gold)");

        try {
            const approvalAmount = ethers.parseUnits("100000", 18);
            const hash = await writeContractAsync({
                address: USDT_ADDR as `0x${string}`,
                abi: USDT_ABI,
                functionName: "approve",
                args: [MLM_CONTRACT_ADDR as `0x${string}`, approvalAmount],
            });

            if (publicClient) {
                await publicClient.waitForTransactionReceipt({ hash });
            }

            setTxStatus("Approval Success! You can now invest.");
            setTxStatusColor("var(--brand-green)");
            setIsApproveMode(false);
        } catch (err: any) {
            console.error("Approval error", err);
            setTxStatus(err?.shortMessage || err?.message || "Approval Failed.");
            setTxStatusColor("var(--brand-blue)");
        } finally {
            setBusyText("");
        }
    };

    // Handle Deposit
    const handleDeposit = async () => {
        if (!address && !isConnected) {
            open();
            return;
        }

        setBusyText("btnDeposit");
        setTxStatus("Initiating investment...");
        setTxStatusColor("var(--brand-gold)");

        const depositAmt = investAmount;
        const activeAddr = address || userAddress;

        try {
            const amountWei = ethers.parseUnits(investAmount, 18);
            const referrer = isFirstTime ? sponsorAddress : (user?.referrer || sponsorAddress);

            if (referrer.toLowerCase() === activeAddr.toLowerCase()) {
                throw new Error("You cannot refer yourself.");
            }

            const hash = await writeContractAsync({
                address: MLM_CONTRACT_ADDR as `0x${string}`,
                abi: MLM_ABI,
                functionName: "invest",
                args: [amountWei, referrer as `0x${string}`, cachedMinTokensOut],
            });

            setTxStatus("Confirming on blockchain...");
            setTxStatusColor("var(--brand-gold)");

            if (publicClient) {
                const receipt = await publicClient.waitForTransactionReceipt({ hash });
                if (receipt.status !== "success") {
                    throw new Error("Deposit transaction failed on-chain.");
                }
            }

            // Trigger thermal receipt dispenser modal ONLY after confirmed on chain
            setConfirmedTx({
                type: "deposit",
                hash,
                amount: depositAmt,
                tokenSymbol: "USDT",
                investorAddress: activeAddr,
                statusText: "Confirmed on BSC",
            });

            setTxStatus("Investment Success! Transaction Confirmed.");
            setTxStatusColor("var(--brand-green)");
            setInvestAmount("");
            refreshData();
            fetchBalance();
        } catch (err: any) {
            console.error("Deposit error", err);
            setTxStatus(err?.shortMessage || err?.message || "Investment Failed.");
            setTxStatusColor("var(--brand-blue)");
        } finally {
            setBusyText("");
        }
    };

    return (
        <div className="dashboard-container relative">
            <div className="dashboard-content-wrapper max-w-lg mx-auto flex flex-col gap-5 py-4 pb-40">

                {/* Top Navigation Bar with Back Button */}
                <div className="flex items-center justify-between py-1">
                    <BackButton href="/dashboard" />

                    <div className="flex items-center gap-1.5 cursor-pointer">
                        <span className="text-base font-semibold text-[#0f172a] dark:text-white">Deposit</span>
                        <ArrowDown2 size={14} color="currentColor" className="text-[#0f172a] dark:text-white" />
                    </div>

                    <button
                        type="button"
                        onClick={() => setActiveTab(activeTab === "deposit" ? "history" : "deposit")}
                        className="relative inline-flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 hover:scale-105 active:translate-y-0.5 cursor-pointer shrink-0"
                        title={activeTab === "deposit" ? "View Deposit History" : "New Deposit"}
                    >
                        {/* 3D Diminishing Bottom Crescent */}
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
                            {activeTab === "deposit" ? <Clock size={20} color="currentColor" /> : <CardAdd size={20} color="currentColor" />}
                        </div>
                    </button>
                </div>

                {/* Capsule Segmented Tab Switcher */}
                <div className="flex items-center p-1 bg-[#F4F4F7] dark:bg-[#14171d] rounded-full max-w-sm mx-auto w-full relative">
                    <button
                        type="button"
                        onClick={() => setActiveTab("deposit")}
                        className={`flex-1 py-2.5 px-4 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer relative z-10 ${
                            activeTab === "deposit"
                                ? (isDark ? "text-[#0b0e14] font-bold" : "text-white font-semibold")
                                : "text-gray-500 dark:text-[#848e9c] hover:text-[#0f172a] dark:hover:text-white"
                        }`}
                    >
                        {activeTab === "deposit" && (
                            <motion.div
                                layoutId="activeInvestmentTab"
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
                        <CardAdd size={16} color="currentColor" className="relative z-10" />
                        <span className="relative z-10">Deposit</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("history")}
                        className={`flex-1 py-2.5 px-4 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer relative z-10 ${
                            activeTab === "history"
                                ? (isDark ? "text-[#0b0e14] font-bold" : "text-white font-semibold")
                                : "text-gray-500 dark:text-[#848e9c] hover:text-[#0f172a] dark:hover:text-white"
                        }`}
                    >
                        {activeTab === "history" && (
                            <motion.div
                                layoutId="activeInvestmentTab"
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
                        <ReceiptText size={16} color="currentColor" className="relative z-10" />
                        <span className="relative z-10">Deposit History ({investments.length})</span>
                    </button>
                </div>

                <AnimatePresence mode="wait">
                {activeTab === "deposit" ? (
                    /* Deposit View matching Swap/Deposit Mockup */
                    <motion.div 
                        key="deposit"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="w-full flex flex-col gap-5"
                    >
                        {/* Sponsor Input Card if First Time */}
                        {isFirstTime && (
                            <div className="bg-[#F4F4F7] dark:bg-[#14171d] rounded-[24px] p-4 flex flex-col gap-1.5">
                                <label className="text-xs text-[var(--text-muted)] font-medium">
                                    Sponsor Address (Required for Activation)
                                </label>
                                <input
                                    type="text"
                                    placeholder="0x..."
                                    value={sponsorAddress}
                                    onChange={(e) => setSponsorAddress(e.target.value)}
                                    className="w-full bg-white dark:bg-[#191d24] rounded-xl px-3 py-2 text-xs font-mono font-medium text-[var(--text-main)] outline-none placeholder:text-gray-400 border-none"
                                />
                            </div>
                        )}

                        {/* Stacked Cards Container with Center Circle Button */}
                        <div className="relative flex flex-col">
                            {/* Top Card: You Pay (USDT) */}
                            <div className="bg-[#F4F4F7] dark:bg-[#14171d] rounded-[26px] p-5 flex flex-col gap-3">
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#848e9c]">
                                    <span>You pay</span>
                                    <span>Avl. Bal: <strong className="text-gray-900 dark:text-white font-medium">{usdtBalance} USDT</strong></span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    {/* Token Display (No Pill) */}
                                    <div className="flex items-center gap-2.5 shrink-0">
                                        <img src="/3d-icons/usdt-bep20-icon.webp" alt="USDT BEP20" className="w-11 h-11 rounded-full object-contain" />
                                        <span className="font-semibold text-base text-gray-900 dark:text-white">USDT</span>
                                    </div>

                                    {/* Large Input */}
                                    <div className="flex flex-col items-end flex-1">
                                        <input
                                             type="number"
                                             placeholder="0"
                                             min="10"
                                             value={investAmount}
                                             onChange={(e) => setInvestAmount(e.target.value)}
                                             className="w-full text-right bg-transparent text-2xl sm:text-3xl font-medium text-gray-900 dark:text-white outline-none placeholder:text-gray-400 border-none"
                                         />
                                        <span className="text-xs text-gray-400 dark:text-[#848e9c] font-normal">
                                            ≈${parseFloat(investAmount || "0").toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Center Floating Swap Icon Button */}
                            <div className="flex justify-center -my-3.5 z-20 relative">
                                <div className="relative inline-flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 hover:scale-105">
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
                                    <div className="relative z-10 w-full h-full rounded-full bg-white dark:bg-[#14171d] text-[#0f172a] dark:text-white flex items-center justify-center shadow-xs border border-transparent dark:border-white/5">
                                        <ArrowSwapVertical size={20} color="currentColor" />
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Card: Staking Package Overview & i6 Conversion */}
                            <div className="bg-[#F4F4F7] dark:bg-[#14171d] rounded-[26px] p-5 flex flex-col gap-3">
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#848e9c]">
                                    <span><strong className="text-gray-900 dark:text-white font-medium">{i6Price && i6Price !== "..." ? `i6 = ${i6Price}` : "$0.1048 USD"}</strong></span>
                                    <span>Package Amount</span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    {/* Token Display (No Pill) */}
                                    <div className="flex items-center gap-2.5 shrink-0">
                                        <img src="/3d-icons/i6-coin-icon.webp" alt="i6 Coin" className="w-11 h-11 rounded-full object-contain" />
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-base text-gray-900 dark:text-white">Infinity Six</span>
                                            <span className="text-[10px] text-gray-400 dark:text-[#848e9c]">i6 Token</span>
                                        </div>
                                    </div>

                                    {/* Output Details */}
                                    <div className="flex flex-col items-end flex-1 truncate">
                                        <div className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-white truncate font-mono">
                                            {totalI6Tokens !== "0.00 i6" ? totalI6Tokens : "0.00 i6"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Percentage Presets */}
                        <div className="flex items-center justify-between gap-2 px-1">
                            {[100, 500, 1000, 2500].map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setInvestAmount(preset.toString())}
                                    className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                                        investAmount === preset.toString()
                                            ? (isDark ? "bg-[#FCD535] text-[#0b0e14] font-bold" : "bg-black text-white")
                                            : "bg-[#F4F4F7] dark:bg-[#191d24] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#20252d]"
                                    }`}
                                >
                                    ${preset}
                                </button>
                            ))}
                        </div>

                        {/* Insufficient Balance Alert */}
                        {insufficientBalance && (
                            <div className="rounded-xl p-3 bg-red-50 text-red-600 text-xs flex items-center gap-2">
                                <CloseCircle size={16} color="#DC2626" className="shrink-0" />
                                <span>Insufficient USDT balance in your wallet.</span>
                            </div>
                        )}

                        {/* Status Alert */}
                        {txStatus && (
                            <div className="rounded-xl p-3 bg-blue-50 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] text-xs flex items-center gap-2" style={{ color: txStatusColor }}>
                                <InfoCircle size={16} color="currentColor" className="shrink-0" />
                                <span>{txStatus}</span>
                            </div>
                        )}

                        {/* Sticky Action Card with Deposit Badge, Standard Approve CTA or Swipe to Deposit CTA */}
                        <StickyActionCard
                            badge={{
                                icon: "/3d-icons/i6-coin-icon.webp",
                                label: "Deposit through",
                                title: "Infinity Six",
                            }}
                            mode={isApproveMode ? "approve" : "swipe"}
                            approveLabel="Approve USDT"
                            onApprove={handleApprove}
                            swipeLabel={investAmount && Number(investAmount) >= 10 ? `Swipe to Deposit $${parseFloat(investAmount).toFixed(2)}` : "Swipe to Deposit"}
                            onSwipe={handleDeposit}
                            disabled={buttonDisabled || busyText !== "" || !investAmount || Number(investAmount) < 10 || insufficientBalance}
                            loading={busyText === "btnApprove" || busyText === "btnDeposit"}
                            disabledText={
                                insufficientBalance
                                    ? "Top up USDT (Insufficient Balance)"
                                    : !investAmount || Number(investAmount) < 10
                                        ? "Min. Deposit 10 USDT"
                                        : "Enter an amount"
                            }
                            loadingText={txStatus || (busyText === "btnApprove" ? "Approving USDT in Wallet..." : "Confirming Deposit...")}
                        />
                    </motion.div>
                ) : (
                    /* Deposit History View - Ticket Cards */
                    <motion.div 
                        key="history"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="w-full flex flex-col gap-4"
                    >
                        {investments.length === 0 ? (
                            <div className="bg-white dark:bg-[#14171d] rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-2.5 shadow-xs border border-gray-100 dark:border-white/5">
                                <ReceiptText size={36} color="currentColor" className="text-gray-300 dark:text-[#848e9c]" />
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">No Active Packages</h3>
                                <p className="text-xs text-gray-400 dark:text-[#848e9c] max-w-xs">
                                    You have not made any deposits yet. Start earning up to 250% yield with your first package.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3.5">
                                {investments.map((item, index) => {
                                    const amount = parseFloat(ethers.formatUnits(item.amount || 0, 18));
                                    const compoundedPrincipal = parseFloat(ethers.formatUnits(item.compoundedPrincipal || 0, 18));
                                    const rwpWithdrawn = parseFloat(ethers.formatUnits(item.rwpWithdrawn || 0, 18));
                                    // Resolve true on-chain deposit date (fallback to user.activeon for pkg 0, never mutated compounding time)
                                    const ev = depositEvents.find((e) => e.packageIndex === index) || depositEvents[index];
                                    const rawDep = Number(ev?.timestamp || item.depositTime || 0);
                                    const rawActiveon = Number(user?.activeon || 0);

                                    let depTimestamp = 0;
                                    if (rawDep > 0) {
                                        depTimestamp = rawDep;
                                    } else if (index === 0 && rawActiveon > 0) {
                                        depTimestamp = rawActiveon;
                                    }
                                    
                                    const userRate = Number(user?.currentRwpRate) === 0 ? 5 : Number(user?.currentRwpRate);
                                    const packageRate = userRate + Number(item.boostperc || 0);
                                    const displayRate = (packageRate / 10).toFixed(1);
                                    
                                    const liveData = livePackages[index];
                                    const progressText = liveData ? liveData.displayEarned : "$0.00";
                                    const progressPerc = liveData ? liveData.progressPerc : 0;
                                    const availableRoi = liveData ? liveData.availableRoi : Math.max(0, compoundedPrincipal - amount);
                                    const directCount = Number(user?.directCount || 0);
                                    const capMultiplier = directCount > 0 ? 6 : 2.5;

                                    return (
                                        <DepositTicket
                                            key={index}
                                            index={index}
                                            amount={amount}
                                            compoundedPrincipal={compoundedPrincipal}
                                            rwpWithdrawn={rwpWithdrawn}
                                            availableRoi={availableRoi}
                                            txHash={item.txHash || ev?.txHash}
                                            displayRate={displayRate}
                                            progressText={progressText}
                                            progressPerc={progressPerc}
                                            isActive={item.isActive}
                                            isCapped={user?.isCapped}
                                            capMultiplier={capMultiplier}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
                </AnimatePresence>

            </div>

            {/* 3D Thermal Receipt Dispenser Modal on Deposit Confirmation */}
            <TransactionReceiptModal
                isOpen={Boolean(confirmedTx)}
                txData={confirmedTx}
                onClose={() => setConfirmedTx(null)}
                onViewHistory={() => {
                    setConfirmedTx(null);
                    setActiveTab("history");
                }}
            />
        </div>
    );
}

export default function InvestmentPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--text-muted)]">Loading Deposit Portal...</div>}>
            <InvestmentContent />
        </Suspense>
    );
}
