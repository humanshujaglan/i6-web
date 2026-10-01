"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ethers } from "ethers";
import { useAccount, useWriteContract, usePublicClient, useSwitchChain } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { bsc } from "@reown/appkit/networks";
import { useTheme } from "@/app/context/ThemeContext";
import { MAIN_CONTRACT_ADDRESS as CONTRACT_ADDRESS, USDT_ADDRESS, GENESIS_ADDRESS } from "@/lib/contracts/abis";
import {
    Sun1,
    Moon,
    Wallet3,
    Link2,
    TickCircle,
    CloseCircle,
    InfoCircle,
    Warning2,
    Copy,
    Flash,
    Key,
    DollarCircle,
    UserAdd,
    LoginCurve,
    Lock1,
    Clock,
} from "iconsax-react";
import TransactionReceiptModal, { TransactionReceiptData } from "@/app/dashboard/components/TransactionReceiptModal";
import StickyActionCard from "@/app/dashboard/components/StickyActionCard";

const CONTRACT_ABI = [
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
    },
    {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "users",
        "outputs": [
            {"internalType": "uint256", "name": "totalDeposits", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

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

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { address, isConnected, chainId } = useAccount();
    const { open } = useAppKit();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient();
    const { switchChainAsync } = useSwitchChain();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    const [usdtBalance, setUsdtBalance] = useState<string>("0.00");
    const [sponsorAddress, setSponsorAddress] = useState<string>("");
    const [investAmount, setInvestAmount] = useState<string>("");
    const [selectedPlan, setSelectedPlan] = useState<"flexible" | "lockin">("flexible");
    const [reinvestPercent, setReinvestPercent] = useState<number>(75);
    const [copied, setCopied] = useState(false);
    const [confirmedTx, setConfirmedTx] = useState<TransactionReceiptData | null>(null);
    const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
    const [modal, setModal] = useState<{
        open: boolean;
        type: "success" | "error" | "warning" | "info";
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({ open: false, type: "info", title: "", message: "" });

    const [statusText, setStatusText] = useState("Connect Wallet First");
    const [actionButtonDisabled, setActionButtonDisabled] = useState(true);
    const [busyText, setBusyText] = useState("");
    const [currentStep, setCurrentStep] = useState<"CHECK_ALLOWANCE" | "APPROVE" | "INVEST">("CHECK_ALLOWANCE");
    const [knownAllowance, setKnownAllowance] = useState<bigint>(0n);

    useEffect(() => {
        const ref = searchParams.get("ref") || "";
        if (ref) setSponsorAddress(ref);
    }, [searchParams]);

    const showModal = (type: typeof modal.type, title: string, message: string, onConfirm?: () => void) => {
        setModal({ open: true, type, title, message, onConfirm });
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, open: false }));
        if (modal.onConfirm) modal.onConfirm();
    };

    const handleCopy = async () => {
        if (!address) return;
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const fetchBalances = async (userAddr: string) => {
        try {
            const walletRes = await fetch(`/api/wallet/${userAddr}?spender=${CONTRACT_ADDRESS}`);
            if (walletRes.ok) {
                const wallet = await walletRes.json();
                const formatted = ethers.formatUnits(wallet.balance, 18);
                setUsdtBalance(parseFloat(formatted).toFixed(2));
            }

            const userRes = await fetch(`/api/user/${userAddr}`);
            if (userRes.ok) {
                const userStatus = await userRes.json();
                const totalDeposits = BigInt(userStatus.totalDeposits || "0");
                if (totalDeposits > 0n) {
                    setIsAlreadyRegistered(true);
                } else {
                    setIsAlreadyRegistered(false);
                }
            }
        } catch (error) {
            console.error("Fetch balance error:", error);
        }
    };

    useEffect(() => {
        if (isConnected && address) {
            fetchBalances(address);
        } else {
            setUsdtBalance("0.00");
            setIsAlreadyRegistered(false);
            setStatusText("Connect Wallet First");
            setActionButtonDisabled(true);
        }
    }, [isConnected, address]);

    const checkFormValidity = async () => {
        if (!isConnected || !address) {
            setActionButtonDisabled(false);
            setStatusText("Connect Wallet");
            return;
        }

        const amountNum = parseFloat(investAmount);
        const isSponsorValid = ethers.isAddress(sponsorAddress);

        if (isNaN(amountNum) || amountNum < 100 || !isSponsorValid) {
            setActionButtonDisabled(true);
            setStatusText("Fill Form Correctly");
            return;
        }

        try {
            const amountWei = ethers.parseUnits(investAmount, 18);

            const walletRes = await fetch(`/api/wallet/${address}?spender=${CONTRACT_ADDRESS}`);
            if (!walletRes.ok) throw new Error("Failed to fetch wallet state");
            const wallet = await walletRes.json();

            const bal = BigInt(wallet.balance);
            if (bal < amountWei) {
                setActionButtonDisabled(true);
                setStatusText("Insufficient USDT Balance");
                return;
            }

            const routeAllowance = BigInt(wallet.allowance);
            const allowance = routeAllowance > knownAllowance ? routeAllowance : knownAllowance;
            if (allowance < amountWei) {
                setCurrentStep("APPROVE");
                setStatusText("Approve USDT");
                setActionButtonDisabled(false);
            } else {
                setCurrentStep("INVEST");
                setStatusText("Activate & Invest");
                setActionButtonDisabled(false);
            }
        } catch (err) {
            console.error(err);
            setStatusText("Error checking state");
            setActionButtonDisabled(true);
        }
    };

    useEffect(() => {
        checkFormValidity();
    }, [investAmount, sponsorAddress, address, isConnected, knownAllowance]);

    const handleAction = async () => {
        if (!isConnected || !address) {
            open();
            return;
        }

        if (chainId !== bsc.id) {
            if (switchChainAsync) {
                await switchChainAsync({ chainId: bsc.id });
            }
        }

        if (currentStep === "APPROVE") {
            await executeApprove();
        } else if (currentStep === "INVEST") {
            await executeInvest();
        }
    };

    const executeApprove = async () => {
        if (!address) return;
        const originalText = statusText;
        try {
            setBusyText("btnApprove");
            setActionButtonDisabled(true);
            setStatusText("Approving in Wallet...");

            const amountWei = ethers.parseUnits(investAmount, 18);
            const hash = await writeContractAsync({
                address: USDT_ADDRESS as `0x${string}`,
                abi: USDT_ABI,
                functionName: "approve",
                args: [CONTRACT_ADDRESS as `0x${string}`, amountWei],
            });

            setStatusText("Confirming on Blockchain...");
            if (publicClient) {
                await publicClient.waitForTransactionReceipt({ hash });
            }

            setKnownAllowance(amountWei);
            setStatusText("Approved! Ready to activate.");
            await fetchBalances(address);
        } catch (error: any) {
            console.error("Approve error", error);
            showModal("error", "Approval Failed", error?.shortMessage || error?.message || "The USDT approval was rejected or failed. Please try again.");
            setActionButtonDisabled(false);
            setStatusText(originalText);
        } finally {
            setBusyText("");
        }
    };

    const executeInvest = async () => {
        if (!address) return;
        const originalText = statusText;

        if (sponsorAddress.toLowerCase() === address.toLowerCase()) {
            showModal("warning", "Invalid Sponsor", "You cannot refer yourself. Please enter a different sponsor address.");
            return;
        }

        try {
            setBusyText("btnInvest");
            setActionButtonDisabled(true);
            setStatusText("Checking Sponsor...");

            const sponsorRes = await fetch(`/api/user/${sponsorAddress}`);
            if (!sponsorRes.ok) throw new Error("Failed to fetch sponsor info");
            const sponsorData = await sponsorRes.json();
            const sponsorDeposits = BigInt(sponsorData.totalDeposits || "0");

            if (sponsorDeposits === 0n && sponsorAddress.toLowerCase() !== GENESIS_ADDRESS) {
                showModal("warning", "Invalid Sponsor", "This sponsor address is not active. Please use a valid sponsor.");
                setActionButtonDisabled(false);
                setStatusText(originalText);
                return;
            }

            setStatusText("Confirm in Wallet...");
            const amountWei = ethers.parseUnits(investAmount, 18);
            const regAmount = investAmount;

            const hash = await writeContractAsync({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: CONTRACT_ABI,
                functionName: "invest",
                args: [amountWei, sponsorAddress as `0x${string}`, 0n],
            });

            setStatusText("Confirming on Blockchain...");

            if (publicClient) {
                const receipt = await publicClient.waitForTransactionReceipt({ hash });
                if (receipt.status !== "success") {
                    throw new Error("Account activation transaction failed on-chain.");
                }
            }

            // Save chosen plan in localStorage and backend
            try {
                const planPayload = {
                    address: address.toLowerCase(),
                    plan: selectedPlan,
                    lockinDays: 252,
                    reinvestPercent,
                    timestamp: Date.now(),
                };
                localStorage.setItem(`i6_user_plan_${address.toLowerCase()}`, JSON.stringify(planPayload));
                fetch("/api/user/plan", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(planPayload),
                }).catch((e) => console.error("Plan sync error:", e));

                // Submit chosen QuantX reinvestment preference to backend API
                const reinvestPayload = {
                    userAddress: address.toLowerCase(),
                    percent: reinvestPercent,
                    nonce: 0,
                    deadline: Math.floor(Date.now() / 1000) + 86400 * 365,
                };
                localStorage.setItem(`i6_reinvest_pref_${address.toLowerCase()}`, reinvestPercent.toString());
                fetch("/api/reinvest/preference", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(reinvestPayload),
                }).catch((e) => console.error("Reinvest preference sync error:", e));
            } catch (e) {
                console.error("Local plan and reinvest pref save error:", e);
            }

            // Trigger thermal receipt dispenser modal ONLY after on-chain confirmation
            setConfirmedTx({
                type: "register",
                hash,
                amount: regAmount,
                tokenSymbol: "USDT",
                investorAddress: address,
                statusText: "Confirmed on BSC",
            });

            setStatusText("Success!");
            setInvestAmount("");
        } catch (error: any) {
            console.error("Investment Error:", error);
            let msg = error?.shortMessage || error?.message || "Transaction Failed.";
            if (error.code === 4001 || error.message?.includes("rejected") || error.message?.includes("User rejected")) {
                msg = "Transaction rejected by user.";
            }
            showModal("error", "Transaction Failed", msg);
            setActionButtonDisabled(false);
            setStatusText(originalText);
        } finally {
            setBusyText("");
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 pb-36 relative overflow-hidden bg-[#F4F6F8] dark:bg-[#0b0e14] transition-colors duration-300">
            {/* Background Ambient Glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#0072ED]/5 dark:bg-[#FCD535]/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#0072ED]/5 dark:bg-[#FCD535]/5 rounded-full blur-3xl" />
            </div>

            {/* Top Right Theme Toggle */}
            <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="fixed top-5 right-5 z-50 w-10 h-10 rounded-full bg-white/80 dark:bg-[#14171d]/80 backdrop-blur-md border border-gray-200/80 dark:border-white/10 shadow-sm flex items-center justify-center text-gray-700 dark:text-[#FCD535] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
                {isDark ? <Sun1 size={18} color="currentColor" /> : <Moon size={18} color="currentColor" />}
            </button>

            {/* Modal Dialog */}
            {modal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div 
                        className="w-full max-w-sm p-6 rounded-3xl flex flex-col items-center text-center gap-3 transition-all select-none"
                        style={{
                            background: isDark
                                ? "linear-gradient(135deg, #14171d 0%, #0a0c0f 100%)"
                                : "linear-gradient(135deg, rgba(201, 224, 255, 0.65) 0%, #FFFFFF 85%)",
                            border: isDark
                                ? "1px solid rgba(255, 255, 255, 0.12)"
                                : "1.5px solid #FFFFFF",
                            boxShadow: isDark
                                ? "inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 12px 40px rgba(0, 0, 0, 0.6)"
                                : "0 8px 32px rgba(12, 50, 99, 0.08)",
                        }}
                    >
                        <div className="w-12 h-12 rounded-2xl bg-[#F8F9FB] dark:bg-[#191d24] flex items-center justify-center text-2xl shadow-xs">
                            {modal.type === "success" && <TickCircle size={26} color="#10B981" />}
                            {modal.type === "error" && <CloseCircle size={26} color="#EF4444" />}
                            {modal.type === "warning" && <Warning2 size={26} color="#F59E0B" />}
                            {modal.type === "info" && <InfoCircle size={26} color={isDark ? "#FCD535" : "#0072ED"} />}
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mt-1">
                            {modal.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-[#848e9c] leading-relaxed">
                            {modal.message}
                        </p>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="w-full mt-2 py-2.5 rounded-xl bg-[#0072ED] hover:bg-[#0062cc] text-white dark:bg-[#FCD535] dark:hover:bg-[#f0b90b] dark:text-[#0b0e14] text-xs font-semibold transition-all cursor-pointer shadow-sm"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Main Register Card */}
            <div 
                className="relative z-10 w-full max-w-md p-6 sm:p-8 rounded-[32px] flex flex-col items-center gap-5 transition-all select-none"
                style={{
                    background: isDark
                        ? "linear-gradient(135deg, #14171d 0%, #0a0c0f 100%)"
                        : "linear-gradient(135deg, rgba(201, 224, 255, 0.65) 0%, #FFFFFF 85%)",
                    border: isDark
                        ? "1px solid rgba(255, 255, 255, 0.12)"
                        : "1.5px solid #FFFFFF",
                    boxShadow: isDark
                        ? "inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 12px 40px rgba(0, 0, 0, 0.6)"
                        : "0 8px 32px rgba(12, 50, 99, 0.08)",
                }}
            >
                {/* Logo */}
                <div className="w-16 h-16 relative flex items-center justify-center">
                    <Link href="/">
                        <Image
                            src="/3d-icons/i6-logo.webp"
                            alt="Infinity Six Logo"
                            width={64}
                            height={64}
                            priority
                            className="object-contain hover:scale-105 transition-transform duration-300 drop-shadow-md cursor-pointer"
                        />
                    </Link>
                </div>

                {/* Header Title & Subtitle */}
                <div className="text-center flex flex-col items-center">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-[#FCD535]">
                        Activate Account
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-[#848e9c] mt-1 font-medium">
                        Make your first deposit to join the ecosystem
                    </p>
                </div>

                {/* Wallet Info Strip */}
                <div className="w-full flex flex-col gap-3">
                    {!address || !isConnected ? (
                        <button
                            type="button"
                            onClick={() => open()}
                            className="w-full py-3 px-4 rounded-2xl bg-[#0072ED] hover:bg-[#0062cc] text-white dark:bg-[#FCD535] dark:hover:bg-[#f0b90b] dark:text-[#0b0e14] text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                        >
                            <Wallet3 size={18} color="currentColor" />
                            <span>Connect Wallet First</span>
                        </button>
                    ) : (
                        <div className="w-full p-3.5 rounded-2xl bg-[#F8F9FB] dark:bg-[#191d24] border border-gray-100/80 dark:border-white/5 flex flex-col gap-2 text-xs">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-gray-500 dark:text-[#848e9c]">
                                    <Link2 size={14} color="currentColor" className="text-[#0072ED] dark:text-[#FCD535]" />
                                    <span>Address:</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-semibold text-gray-900 dark:text-[#FCD535]">
                                        {address.slice(0, 6)}...{address.slice(-4)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
                                        title="Copy Address"
                                    >
                                        {copied ? <TickCircle size={12} color="#10B981" /> : <Copy size={12} color="currentColor" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-1.5 text-gray-500 dark:text-[#848e9c]">
                                    <DollarCircle size={14} color="currentColor" className="text-emerald-500" />
                                    <span>USDT Balance:</span>
                                </div>
                                <span className="font-mono font-semibold text-gray-900 dark:text-white">
                                    ${usdtBalance}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Inputs */}
                    <div className="w-full flex flex-col gap-3 mt-1">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                Sponsor / Referral Address <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Paste Sponsor Address (0x...)"
                                value={sponsorAddress}
                                onChange={(e) => setSponsorAddress(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FB] dark:bg-[#191d24] border border-gray-200/80 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 font-mono outline-none focus:border-[#0072ED] dark:focus:border-[#FCD535] transition-all"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                Initial Deposit (Min $100 USDT) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                placeholder="100"
                                min="100"
                                value={investAmount}
                                onChange={(e) => setInvestAmount(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FB] dark:bg-[#191d24] border border-gray-200/80 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 font-mono outline-none focus:border-[#0072ED] dark:focus:border-[#FCD535] transition-all"
                            />
                        </div>

                        {/* Plan Selection (Flexible vs Lock-in) */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                                <span>Plan Option</span>
                                <span className="text-[10px] text-gray-400 font-normal">ROI &amp; Withdrawal Mode</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedPlan("flexible")}
                                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                        selectedPlan === "flexible"
                                            ? "border-[#0072ED] dark:border-[#FCD535] bg-[#0072ED]/5 dark:bg-[#FCD535]/10"
                                            : "border-gray-200/80 dark:border-white/10 bg-[#F8F9FB] dark:bg-[#191d24]"
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-xs font-semibold text-gray-900 dark:text-white">Flexible</span>
                                        {selectedPlan === "flexible" ? (
                                            <TickCircle size={14} className="text-[#0072ED] dark:text-[#FCD535]" variant="Bold" />
                                        ) : (
                                            <span className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-600" />
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-500 dark:text-[#848e9c] leading-tight">
                                        Standard daily ROI. Withdrawals allowed anytime.
                                    </span>
                                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md w-fit mt-0.5">
                                        Default
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedPlan("lockin")}
                                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                        selectedPlan === "lockin"
                                            ? "border-[#0072ED] dark:border-[#FCD535] bg-[#0072ED]/5 dark:bg-[#FCD535]/10"
                                            : "border-gray-200/80 dark:border-white/10 bg-[#F8F9FB] dark:bg-[#191d24]"
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-xs font-semibold text-gray-900 dark:text-white">Lock-in 252d</span>
                                        {selectedPlan === "lockin" ? (
                                            <TickCircle size={14} className="text-[#0072ED] dark:text-[#FCD535]" variant="Bold" />
                                        ) : (
                                            <span className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-600" />
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-500 dark:text-[#848e9c] leading-tight">
                                        2.5x ROI target. Withdrawals locked for 252 days.
                                    </span>
                                    <span className="text-[9px] font-semibold text-[#0072ED] dark:text-[#FCD535] bg-[#0072ED]/10 dark:bg-[#FCD535]/15 px-1.5 py-0.5 rounded-md w-fit mt-0.5">
                                        2.5x ROI
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* QuantX AI Reinvestment Allocation Preference */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <span>QuantX AI (QTX) Reinvest</span>
                                    <span className="px-1.5 py-0.5 rounded bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[9px] font-bold text-[#0072ED] dark:text-[#FCD535]">
                                        AI Yield
                                    </span>
                                </span>
                                <span className="text-[10px] text-gray-400 font-normal">Backend Automated</span>
                            </label>

                            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                                {[25, 50, 75, 100].map((pct) => {
                                    const isSelected = reinvestPercent === pct;
                                    return (
                                        <button
                                            key={pct}
                                            type="button"
                                            onClick={() => setReinvestPercent(pct)}
                                            className={`pt-2.5 pb-2 px-1 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 relative ${
                                                isSelected
                                                    ? "border-[#0072ED] dark:border-[#FCD535] bg-[#0072ED]/10 dark:bg-[#FCD535]/15 text-[#0072ED] dark:text-[#FCD535] font-bold shadow-xs"
                                                    : "border-gray-200/80 dark:border-white/10 bg-[#F8F9FB] dark:bg-[#191d24] text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20"
                                            }`}
                                        >
                                            {pct === 75 && (
                                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 text-[8px] font-extrabold uppercase rounded-full bg-emerald-500 text-white whitespace-nowrap shadow-xs">
                                                    Default
                                                </span>
                                            )}
                                            <span className="text-xs sm:text-sm font-semibold">{pct}%</span>
                                            <span className="text-[9px] text-gray-400 dark:text-[#848e9c]">Allocation</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <span className="text-[10px] text-gray-500 dark:text-[#848e9c] leading-tight">
                                Automatically routes {reinvestPercent}% of daily reward yields into QuantX AI (QTX) automated algorithmic reinvestment.
                            </span>
                        </div>

                    </div>
                </div>

                {/* Bottom Sign In Link */}
                <div className="text-xs text-gray-500 dark:text-[#848e9c] font-medium pt-1">
                    Already a member?{" "}
                    <Link
                        href="/login"
                        className="text-[#0072ED] dark:text-[#FCD535] font-semibold hover:underline transition-all"
                    >
                        Sign In
                    </Link>
                </div>
            </div>

            {/* Sticky Action Card with Approve and Swipe to Activate CTA */}
            <StickyActionCard
                badge={{
                    icon: "/3d-icons/i6-coin-icon.webp",
                    label: "Activation through",
                    title: "Infinity Six",
                }}
                mode={currentStep === "APPROVE" ? "approve" : "swipe"}
                approveLabel="Approve USDT"
                onApprove={handleAction}
                swipeLabel={
                    investAmount && Number(investAmount) >= 100
                        ? `Swipe to Activate $${parseFloat(investAmount).toFixed(2)}`
                        : "Swipe to Activate"
                }
                onSwipe={handleAction}
                disabled={actionButtonDisabled || busyText !== ""}
                loading={busyText !== ""}
                disabledText={
                    !isConnected
                        ? "Connect Wallet"
                        : !sponsorAddress || !ethers.isAddress(sponsorAddress)
                            ? "Enter Valid Sponsor"
                            : !investAmount || Number(investAmount) < 100
                                ? "Min. Deposit 100 USDT"
                                : statusText
                }
                loadingText={statusText}
            />

            {/* Receipt Modal */}
            <TransactionReceiptModal
                isOpen={Boolean(confirmedTx)}
                txData={confirmedTx}
                onClose={() => setConfirmedTx(null)}
                onViewHistory={() => router.push("/login")}
            />

            {/* Already Registered Modal */}
            {isAlreadyRegistered && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none">
                    <div 
                        className="w-full max-w-sm p-6 sm:p-7 rounded-[32px] flex flex-col items-center text-center gap-3.5 transition-all relative overflow-hidden"
                        style={{
                            background: isDark
                                ? "linear-gradient(135deg, #14171d 0%, #0a0c0f 100%)"
                                : "linear-gradient(135deg, rgba(201, 224, 255, 0.65) 0%, #FFFFFF 85%)",
                            border: isDark
                                ? "1.5px solid rgba(255, 255, 255, 0.12)"
                                : "1.5px solid #FFFFFF",
                            boxShadow: isDark
                                ? "inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 16px 45px rgba(0, 0, 0, 0.75)"
                                : "0 12px 40px rgba(12, 50, 99, 0.12)",
                        }}
                    >
                        {/* Top-left stuck corner icon */}
                        <div className="absolute top-0 left-0 w-20 h-20 sm:w-24 sm:h-24 pointer-events-none z-0 overflow-hidden rounded-tl-[32px]">
                            <Image
                                src={isDark ? "/3d-icons/wallet.webp" : "/3d-icons/wallet-light.webp"}
                                alt="Already Registered"
                                width={96}
                                height={96}
                                className="w-full h-full object-contain object-left-top"
                                priority
                            />
                        </div>

                        {/* Top row with badge on the right */}
                        <div className="relative z-10 w-full flex items-start justify-end shrink-0 h-9 sm:h-10">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                                <TickCircle size={14} color="currentColor" variant="Bold" />
                                <span>Account Active</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-1 relative z-10">
                            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white leading-tight">
                                Already Registered
                            </h3>
                        </div>

                        {/* Wallet Address Pill */}
                        {address && (
                            <div className="px-3.5 py-1.5 rounded-full bg-[#F8F9FB] dark:bg-[#191d24] border border-gray-100 dark:border-white/5 text-xs text-gray-600 dark:text-[#848e9c] font-mono relative z-10">
                                {address.slice(0, 6)}...{address.slice(-4)}
                            </div>
                        )}

                        <p className="text-xs sm:text-sm text-gray-500 dark:text-[#848e9c] leading-relaxed max-w-xs relative z-10">
                            This connected wallet is already active. Please sign in to access your dashboard portal.
                        </p>

                        {/* Actions */}
                        <div className="w-full flex flex-col gap-2 mt-2 relative z-10">
                            <Link
                                href="/login"
                                className="w-full py-3.5 px-5 rounded-2xl bg-[#0072ED] hover:bg-[#0062cc] text-white dark:bg-[#FCD535] dark:hover:bg-[#f0b90b] dark:text-[#0b0e14] text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-md"
                            >
                                <LoginCurve size={18} color="currentColor" />
                                <span>Login to Portal</span>
                            </Link>

                            <button
                                type="button"
                                onClick={() => open()}
                                className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-gray-500 dark:text-[#848e9c] hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                            >
                                Switch Wallet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8] dark:bg-[#0b0e14]">
                <span className="text-sm font-medium text-gray-500 dark:text-[#848e9c]">Loading activation portal...</span>
            </div>
        }>
            <RegisterContent />
        </Suspense>
    );
}
