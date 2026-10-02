"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAccount, useDisconnect } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { DashboardProvider, useDashboard } from "./DashboardContext";
import ThemeToggle from "./components/ThemeToggle";
import { useTheme } from "@/app/context/ThemeContext";
import {
    Home2,
    Briefcase,
    Category,
    CardAdd,
    ReceiptText,
    People,
    Crown,
    ArrowSwapHorizontal,
    MoneySend,
    Wallet3,
    HambergerMenu,
    CloseCircle,
    ArrowDown2,
    LogoutCurve,
    Notification,
} from "iconsax-react";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { userAddress, user, loading, isModalOpen } = useDashboard();
    const { address, isConnected, status } = useAccount();
    const { open } = useAppKit();
    const { disconnect } = useDisconnect();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);
    const [walletMenuOpen, setWalletMenuOpen] = useState(false);
    const walletMenuRef = useRef<HTMLDivElement>(null);

    const isActionPage = pathname.startsWith("/dashboard/investment") || 
                         pathname.startsWith("/dashboard/swap") || 
                         pathname.startsWith("/dashboard/withdraw") ||
                         pathname.startsWith("/dashboard/investment-history") ||
                         pathname.startsWith("/dashboard/refer");

    const hideBottomNav = isActionPage || isModalOpen || pathname.startsWith("/dashboard/reinvest");
    const hideHeader = isActionPage || pathname.startsWith("/dashboard/reinvest");

    // Close wallet dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (walletMenuRef.current && !walletMenuRef.current.contains(event.target as Node)) {
                setWalletMenuOpen(false);
            }
        };
        if (walletMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [walletMenuOpen]);

    const handleLogout = () => {
        try {
            disconnect();
        } catch (e) {}
        document.cookie = "user_wallet=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        localStorage.removeItem("user_wallet");
        router.push("/login");
    };

    const handleWalletClick = () => {
        if (!isWalletConnected) {
            open();
        } else {
            setWalletMenuOpen((prev) => !prev);
        }
    };

    const handleSwitchWallet = () => {
        setWalletMenuOpen(false);
        open();
    };

    const handleDisconnect = () => {
        setWalletMenuOpen(false);
        handleLogout();
    };

    // Redirect when wallet truly disconnects (not during page-load reconnection)
    useEffect(() => {
        if (status === "connecting" || status === "reconnecting") return;
        if (isConnected) return;

        // Give wagmi time to finish reconnecting before deciding the user is logged out
        const timer = setTimeout(() => {
            const savedWallet = localStorage.getItem("user_wallet") ||
                document.cookie.split(";").find(c => c.trim().startsWith("user_wallet="))?.split("=")[1];
            if (!savedWallet) {
                document.cookie = "user_wallet=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                localStorage.removeItem("user_wallet");
                router.push("/login");
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [status, isConnected, router]);

    useEffect(() => {
        if (isConnected && address) {
            const newAddr = address.toLowerCase();
            if (userAddress && newAddr !== userAddress.toLowerCase()) {
                localStorage.setItem("user_wallet", newAddr);
                document.cookie = `user_wallet=${newAddr}; path=/; max-age=2592000; SameSite=Strict`;
                window.location.reload();
            }
        }
    }, [address, isConnected, userAddress]);

    const isWalletConnected = isConnected && Boolean(address);
    const shortAddress = isWalletConnected && address
        ? `${address.slice(0, 6)}...${address.slice(-4)}` 
        : "Connect";

    return (
        <div className="min-h-screen flex flex-col text-[var(--text-main)] bg-[var(--bg-color)] relative overflow-x-hidden transition-colors duration-200">
            {/* Top Cloud Hero Background - Dashboard Home Only (Light Mode only) */}
            {pathname === "/dashboard" && !isDark && (
                <>
                    <div 
                        className="pointer-events-none absolute select-none z-0"
                        style={{
                            position: "absolute",
                            width: "686px",
                            height: "224px",
                            left: "-99px",
                            top: "0px",
                            backgroundImage: "url(/cloud-hero-img.webp)",
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "cover",
                            backgroundPosition: "center top",
                            opacity: 0.45,
                            maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)",
                            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)",
                            pointerEvents: "none",
                        }}
                    />
                    {/* White Hue & Diminishing Blur at end of image */}
                    <div 
                        className="pointer-events-none absolute select-none z-0"
                        style={{
                            position: "absolute",
                            width: "686px",
                            height: "120px",
                            left: "-99px",
                            top: "104px",
                            background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 60%, #ffffff 100%)",
                            backdropFilter: "blur(6px)",
                            WebkitBackdropFilter: "blur(6px)",
                            maskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)",
                            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)",
                            pointerEvents: "none",
                        }}
                    />
                </>
            )}

            {/* Top Header / Topbar */}
            {!hideHeader && (
                <header className="dashboard-header relative z-10 bg-transparent px-4 py-3 flex items-center justify-between" style={{ background: "transparent", borderBottom: "none" }}>
                    <div className="header-left flex items-center gap-3">
                        <Link href="/dashboard" className="flex items-center">
                            <img src="/i6-logo.webp" alt="Infinity Six" className="h-7 sm:h-8 w-auto object-contain" />
                        </Link>
                    </div>

                    <div className="header-right relative flex items-center gap-2" ref={walletMenuRef}>
                        {/* Notification Button */}
                        <Link
                            href="/dashboard/notifications"
                            className="relative inline-flex items-center justify-center w-[44px] h-[44px] rounded-full bg-black dark:bg-[#14171d] text-white transition-all hover:bg-black/90 dark:hover:bg-[#191d24] cursor-pointer shrink-0 border border-transparent dark:border-[#20252d]"
                            style={{
                                boxShadow: isDark 
                                    ? "inset 4px 6px 10.8px rgba(255, 255, 255, 0.14), 0 4px 12px rgba(0, 0, 0, 0.3)" 
                                    : "inset 4px 6px 10.8px rgba(255, 255, 255, 0.4)",
                            }}
                            title="Notifications"
                            aria-label="View notifications"
                        >
                            <Notification size={18} color="currentColor" />
                            <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-black dark:ring-[#14171d]" />
                        </Link>

                        {/* Theme Toggle Button */}
                        <ThemeToggle />

                        {/* Wallet Connect Pill */}
                        <button 
                            type="button" 
                            onClick={handleWalletClick} 
                            className="flex flex-row items-center justify-center gap-2 px-5 py-2.5 h-[44px] rounded-full bg-black dark:bg-[#14171d] text-white font-medium text-xs transition-all hover:bg-black/90 dark:hover:bg-[#191d24] cursor-pointer shrink-0 border border-transparent dark:border-[#20252d]"
                            style={{
                                boxShadow: isDark 
                                    ? "inset 4px 6px 10.8px rgba(255, 255, 255, 0.14), 0 4px 12px rgba(0, 0, 0, 0.3)" 
                                    : "inset 4px 6px 10.8px rgba(255, 255, 255, 0.4)",
                            }}
                            title={isWalletConnected ? "Click to switch wallet or disconnect" : "Connect Wallet"}
                        >
                            <Wallet3 size={18} color="currentColor" />
                            <span className="font-mono text-xs">{shortAddress}</span>
                            {isWalletConnected && (
                                <ArrowDown2 
                                    size={12} 
                                    color="currentColor" 
                                    className={`transition-transform duration-200 ${walletMenuOpen ? "rotate-180" : ""}`} 
                                />
                            )}
                        </button>

                        {/* Wallet Options Dropdown */}
                        {walletMenuOpen && isWalletConnected && (
                            <div 
                                className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#14171d] rounded-2xl p-1.5 shadow-[0_10px_38px_rgba(0,0,0,0.14),0_4px_12px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-[#20252d] flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                            >
                                <button
                                    type="button"
                                    onClick={handleSwitchWallet}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#191d24] transition-colors text-left cursor-pointer group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-[#191d24] text-[#0072ED] dark:text-[#FCD535] flex items-center justify-center shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-[#21262f] transition-colors">
                                        <ArrowSwapHorizontal size={16} color="currentColor" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-semibold text-gray-900 dark:text-white">Switch Wallet</span>
                                    </div>
                                </button>

                                <div className="h-[1px] bg-gray-100 dark:bg-[#20252d] mx-2" />

                                <button
                                    type="button"
                                    onClick={handleDisconnect}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left cursor-pointer group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
                                        <LogoutCurve size={16} color="currentColor" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-semibold text-red-600">Disconnect</span>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </header>
            )}

            {/* Navigation Modal Overlay (Sidebar Drawer) */}
            <div 
                className={`nav-modal-overlay ${sidebarOpen ? "active" : ""}`} 
                id="navModalOverlay"
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        setSidebarOpen(false);
                    }
                }}
            >
                <div className="nav-modal-content bg-white dark:bg-[#14171d] dark:border-r dark:border-[#20252d]">
                    <button className="modal-close-btn text-[var(--text-main)]" id="closeNavModal" onClick={() => setSidebarOpen(false)}>
                        <CloseCircle size={22} color="currentColor" />
                    </button>
                    
                    <img src="/i6-logo.webp" alt="Infinity Six" className="nav-modal-logo" />
                    
                    <div className="user-card bg-[#F4F4F7] dark:bg-[#191d24]">
                        <div className="user-profile">
                            <div className="user-avatar overflow-hidden flex items-center justify-center bg-white dark:bg-[#0b0e14]">
                                <img src="/3d-icons/boy.webp" alt="Avatar" className="w-full h-full object-contain" />
                            </div>
                            <div className="user-details">
                                <h3 className="user-name font-medium text-gray-900 dark:text-white">i6 Partner</h3>
                                <p className="user-role text-xs text-gray-400 font-mono">
                                    {shortAddress}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="nav-menu">
                        <Link 
                            href="/dashboard" 
                            onClick={() => setSidebarOpen(false)}
                            className={`nav-item ${pathname === "/dashboard" ? "active" : ""}`}
                        >
                            <Home2 size={18} color="currentColor" />
                            <span>Home Dashboard</span>
                        </Link>

                        <Link 
                            href="/dashboard/investment" 
                            onClick={() => setSidebarOpen(false)}
                            className={`nav-item ${pathname === "/dashboard/investment" ? "active" : ""}`}
                        >
                            <CardAdd size={18} color="currentColor" />
                            <span>Deposit USDT</span>
                        </Link>

                        <Link 
                            href="/dashboard/swap" 
                            onClick={() => setSidebarOpen(false)}
                            className={`nav-item ${pathname === "/dashboard/swap" ? "active" : ""}`}
                        >
                            <ArrowSwapHorizontal size={18} color="currentColor" />
                            <span>PancakeSwap DEX</span>
                        </Link>

                        <Link 
                            href="/dashboard/withdraw" 
                            onClick={() => setSidebarOpen(false)}
                            className={`nav-item ${pathname === "/dashboard/withdraw" ? "active" : ""}`}
                        >
                            <MoneySend size={18} color="currentColor" />
                            <span>Withdraw Rewards</span>
                        </Link>

                        <Link 
                            href="/dashboard/business" 
                            onClick={() => setSidebarOpen(false)}
                            className={`nav-item ${pathname === "/dashboard/business" ? "active" : ""}`}
                        >
                            <Briefcase size={18} color="currentColor" />
                            <span>Business & Team</span>
                        </Link>

                        <Link 
                            href="/dashboard/salary-status" 
                            onClick={() => setSidebarOpen(false)}
                            className={`nav-item ${pathname === "/dashboard/salary-status" ? "active" : ""}`}
                        >
                            <Crown size={18} color="currentColor" />
                            <span>Rank & Salary</span>
                        </Link>

                        <Link 
                            href="/dashboard/reinvest" 
                            onClick={() => setSidebarOpen(false)}
                            className={`nav-item ${pathname.startsWith("/dashboard/reinvest") ? "active" : ""}`}
                        >
                            <ArrowSwapHorizontal size={18} color="currentColor" />
                            <span>QuantX AI Reinvest</span>
                        </Link>
                    </div>

                    {/* Theme Toggle in Sidebar */}
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#2b313a]">
                        <ThemeToggle variant="row" />
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <main className={`flex-1 content relative z-0 ${!hideBottomNav ? "pb-32" : "pb-10"}`}>
                {loading ? (
                    <div className="w-full py-20 flex flex-col items-center justify-center gap-3">
                        <div className="w-10 h-10 border-4 border-[#0072ED] dark:border-[#FCD535] border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium text-[var(--text-muted)]">Loading account metrics...</span>
                    </div>
                ) : (
                    children
                )}
            </main>

            {/* Floating Designer Bottom Navbar - Only on Home, Business, Rank */}
            {!hideBottomNav && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center max-w-[95vw]">
                    {/* Main Pill Container */}
                    <nav 
                        className={`relative flex flex-row items-center p-1.5 rounded-[32px] transition-all ${
                            isDark
                                ? "bg-[#14171d] shadow-[0_12px_36px_rgba(0,0,0,0.75)]"
                                : "bg-[#0072ED]"
                        }`}
                        style={!isDark ? {
                            boxShadow: "inset 3px 4px 8px rgba(255, 255, 255, 0.4)",
                        } : undefined}
                    >
                        {[
                            { name: "Home", href: "/dashboard", icon: Home2, exact: true },
                            { name: "Business", href: "/dashboard/business", icon: Briefcase, matchPrefix: ["/dashboard/business", "/dashboard/directs", "/dashboard/downlines"] },
                            { name: "Rank", href: "/dashboard/salary-status", icon: Crown, matchPrefix: ["/dashboard/salary-status"] },
                            { name: "Reinvest", href: "/dashboard/reinvest", imageIcon: "/3d-icons/swap.webp", matchPrefix: ["/dashboard/reinvest"] },
                        ].map((tab) => {
                            const isActive = tab.exact 
                                ? pathname === tab.href 
                                : tab.matchPrefix ? tab.matchPrefix.some(p => pathname.startsWith(p)) : pathname.startsWith(tab.href);
                            const IconComponent = tab.icon;

                            return (
                                <Link
                                    key={tab.name}
                                    href={tab.href}
                                    className={`relative flex flex-row items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-[26px] text-[12px] sm:text-sm whitespace-nowrap transition-all duration-200 ${
                                        isActive
                                            ? (isDark ? "text-[#0b0e14] font-semibold" : "text-[#0072ED] font-normal")
                                            : (isDark ? "text-[#848e9c] hover:text-white font-normal" : "text-white/85 hover:text-white hover:bg-white/10 font-normal")
                                    }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeBottomNavPill"
                                            className="absolute inset-0 rounded-[26px]"
                                            style={isDark ? {
                                                background: "#FCD535",
                                                boxShadow: "0px 2px 10px rgba(252, 213, 53, 0.35)",
                                            } : {
                                                background: "linear-gradient(131.76deg, #D4E8FF 11.56%, #FFFFFF 69.18%)",
                                                border: "1px solid #FFFFFF",
                                                boxShadow: "3px 3px 14px rgba(0, 0, 0, 0.1)",
                                            }}
                                            transition={{ type: "spring", stiffness: 400, damping: 32 }}
                                        />
                                    )}
                                    {tab.imageIcon ? (
                                        <div className="relative z-10 w-5 h-5 flex items-center justify-center shrink-0">
                                            <Image
                                                src={tab.imageIcon}
                                                alt={tab.name}
                                                width={20}
                                                height={20}
                                                className={`object-contain transition-transform duration-200 ${isActive ? "scale-110 drop-shadow-sm" : "opacity-80"}`}
                                            />
                                        </div>
                                    ) : IconComponent ? (
                                        <IconComponent
                                            size={20}
                                            color={isActive ? (isDark ? "#0b0e14" : "#0072ED") : "currentColor"}
                                            variant={isActive ? "Bold" : "Linear"}
                                            className="relative z-10"
                                        />
                                    ) : null}
                                    <span className="inline-block leading-none relative z-10 tracking-tight font-normal">{tab.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardProvider>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </DashboardProvider>
    );
}
