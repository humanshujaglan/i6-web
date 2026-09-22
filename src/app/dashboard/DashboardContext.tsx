"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

interface UserInfo {
    totalDeposits: bigint;
    directBonus: bigint;
    directCount: bigint;
    directVolume: bigint;
    currentRwpRate: bigint;
    teamVolume: bigint;
    totalDownlineBusiness: bigint;
    levelRewardsRealized: bigint;
    lastLevelUpdateTime: bigint;
    isUplineEligible: boolean;
    eligibleL1Count: bigint;
    eligibleL2Count: bigint;
    eligibleL3Count: bigint;
    pendingUplineIncome: bigint;
    currentRank: number;
    salaryLastClaimTime: bigint;
    salaryEndTime: bigint;
    unwithdrawnSalary: bigint;
    totalWithdrawn: bigint;
    referrer: string;
    isCapped: boolean;
    firstInvestment: bigint;
    freshBusiness: bigint;
    directBoosterCount: bigint;
    activeon: bigint;
    directBoosterBusiness: bigint;
    isBoosted: boolean;
}

interface Investment {
    amount: bigint;
    compoundedPrincipal: bigint;
    rwpWithdrawn: bigint;
    lastUpdateTime: bigint;
    depositTime: bigint;
    txHash?: string;
    isActive: boolean;
    boostperc: bigint;
}

interface DashboardContextType {
    userAddress: string;
    user: UserInfo | null;
    investments: Investment[];
    pendingSalary: bigint;
    directAvailableNow: number;
    directPendingLocked: number;
    levelPendingDynamic: number;
    levelRatePerDay: number;
    exactLiveUpline: number;
    spotPrice: bigint;
    i6Price: string;
    usdtBalance: string;
    i6Balance: string;
    rawI6Balance: number;
    loading: boolean;
    error: string | null;
    lastWithdrawTime: number;
    launchTime: number;
    cooldownPeriod: number;
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
    refreshData: () => Promise<void>;
    refreshWalletBalance: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { address, isConnected, status } = useAccount();

    const [userAddress, setUserAddress] = useState<string>("");
    const [user, setUser] = useState<UserInfo | null>(null);
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [pendingSalary, setPendingSalary] = useState<bigint>(0n);
    const [directAvailableNow, setDirectAvailableNow] = useState<number>(0);
    const [directPendingLocked, setDirectPendingLocked] = useState<number>(0);
    const [levelPendingDynamic, setLevelPendingDynamic] = useState<number>(0);
    const [levelRatePerDay, setLevelRatePerDay] = useState<number>(0);
    const [exactLiveUpline, setExactLiveUpline] = useState<number>(0);
    const [spotPrice, setSpotPrice] = useState<bigint>(0n);
    const [i6Price, setI6Price] = useState<string>("...");
    const [usdtBalance, setUsdtBalance] = useState<string>("0.00");
    const [i6Balance, setI6Balance] = useState<string>("0.00");
    const [rawI6Balance, setRawI6Balance] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [lastWithdrawTime, setLastWithdrawTime] = useState<number>(0);
    const [launchTime, setLaunchTime] = useState<number>(0);
    const [cooldownPeriod, setCooldownPeriod] = useState<number>(3600);
    const [modalCount, setModalCount] = useState<number>(0);
    const isModalOpen = modalCount > 0;
    const setIsModalOpen = useCallback((open: boolean) => {
        setModalCount((prev) => (open ? prev + 1 : Math.max(0, prev - 1)));
    }, []);

    const applyDashboardData = (data: any) => {
        if (!data?.user) return;
        const userInfo: UserInfo = {
            totalDeposits: BigInt(data.user.totalDeposits || 0),
            directBonus: BigInt(data.user.directBonus || 0),
            directCount: BigInt(data.user.directCount || 0),
            directVolume: BigInt(data.user.directVolume || 0),
            currentRwpRate: BigInt(data.user.currentRwpRate || 0),
            teamVolume: BigInt(data.user.teamVolume || 0),
            totalDownlineBusiness: BigInt(data.user.totalDownlineBusiness || 0),
            levelRewardsRealized: BigInt(data.user.levelRewardsRealized || 0),
            lastLevelUpdateTime: BigInt(data.user.lastLevelUpdateTime || 0),
            isUplineEligible: Boolean(data.user.isUplineEligible),
            eligibleL1Count: BigInt(data.user.eligibleL1Count || 0),
            eligibleL2Count: BigInt(data.user.eligibleL2Count || 0),
            eligibleL3Count: BigInt(data.user.eligibleL3Count || 0),
            pendingUplineIncome: BigInt(data.user.pendingUplineIncome || 0),
            currentRank: Number(data.user.currentRank || 0),
            salaryLastClaimTime: BigInt(data.user.salaryLastClaimTime || 0),
            salaryEndTime: BigInt(data.user.salaryEndTime || 0),
            unwithdrawnSalary: BigInt(data.user.unwithdrawnSalary || 0),
            totalWithdrawn: BigInt(data.user.totalWithdrawn || 0),
            referrer: data.user.referrer || "",
            isCapped: Boolean(data.user.isCapped),
            firstInvestment: BigInt(data.user.firstInvestment || 0),
            freshBusiness: BigInt(data.user.freshBusiness || 0),
            directBoosterCount: BigInt(data.user.directBoosterCount || 0),
            activeon: BigInt(data.user.activeon || 0),
            directBoosterBusiness: BigInt(data.user.directBoosterBusiness || 0),
            isBoosted: Boolean(data.user.isBoosted)
        };
        setUser(userInfo);

        const invs: Investment[] = (data.investments || []).map((inv: any, idx: number) => ({
            amount: BigInt(inv.amount || 0),
            compoundedPrincipal: BigInt(inv.compoundedPrincipal || 0),
            rwpWithdrawn: BigInt(inv.rwpWithdrawn || 0),
            lastUpdateTime: BigInt(inv.lastUpdateTime || 0),
            depositTime: BigInt(inv.depositTime || (idx === 0 ? data.user.activeon : 0) || inv.lastUpdateTime || 0),
            txHash: inv.txHash || "",
            isActive: Boolean(inv.isActive),
            boostperc: BigInt(inv.boostperc || 0)
        }));
        setInvestments(invs);

        if (data.pendingSalary !== null && data.pendingSalary !== undefined) {
            setPendingSalary(BigInt(data.pendingSalary));
        }

        if (data.directBonus) {
            setDirectAvailableNow(parseFloat(ethers.formatUnits(data.directBonus.availableNow || 0, 18)));
            setDirectPendingLocked(parseFloat(ethers.formatUnits(data.directBonus.pendingLocked || 0, 18)));
        } else {
            setDirectAvailableNow(parseFloat(ethers.formatUnits(userInfo.directBonus, 18)));
        }

        if (data.levelIncome) {
            const unrealized = parseFloat(ethers.formatUnits(data.levelIncome.pending || 0, 18));
            const realized = parseFloat(ethers.formatUnits(userInfo.levelRewardsRealized, 18));
            setLevelPendingDynamic(realized + unrealized);
            setLevelRatePerDay(parseFloat(ethers.formatUnits(data.levelIncome.ratePerDay || 0, 18)));
        } else {
            setLevelPendingDynamic(parseFloat(ethers.formatUnits(userInfo.levelRewardsRealized, 18)));
        }

        if (data.spotPrice) {
            setSpotPrice(BigInt(data.spotPrice.spot || 0));
            setI6Price("$" + (data.spotPrice.formatted || "0.00"));
        }

        if (data.uplineIncome !== null && data.uplineIncome !== undefined) {
            setExactLiveUpline(parseFloat(ethers.formatUnits(data.uplineIncome, 18)));
        } else {
            setExactLiveUpline(parseFloat(ethers.formatUnits(userInfo.pendingUplineIncome, 18)));
        }

        setLastWithdrawTime(Number(data.lastWithdrawTime || 0));
        setLaunchTime(Number(data.launchTime || 0));
        setCooldownPeriod(Number(data.cooldownPeriod || 3600));
        setError(null);
    };

    // Immediate rehydration from local cache on mount
    useEffect(() => {
        const savedWallet = localStorage.getItem("user_wallet");
        if (savedWallet && ethers.isAddress(savedWallet)) {
            const addr = savedWallet.toLowerCase();
            setUserAddress(addr);

            try {
                const cachedRaw = localStorage.getItem(`i6_dashboard_cache_${addr}`);
                if (cachedRaw) {
                    const parsed = JSON.parse(cachedRaw);
                    if (parsed?.user) {
                        applyDashboardData(parsed);
                        setLoading(false);
                    }
                }
            } catch (e) {
                console.error("Dashboard cache restore error", e);
            }

            try {
                const walletCacheRaw = localStorage.getItem(`i6_wallet_cache_${addr}`);
                if (walletCacheRaw) {
                    const wParsed = JSON.parse(walletCacheRaw);
                    if (wParsed.usdt) setUsdtBalance(wParsed.usdt);
                    if (wParsed.i6) setI6Balance(wParsed.i6);
                    if (wParsed.rawI6 !== undefined) {
                        setRawI6Balance(Number(wParsed.rawI6) || 0);
                    } else if (wParsed.i6) {
                        setRawI6Balance(parseFloat(String(wParsed.i6).replace(/,/g, "")) || 0);
                    }
                }
            } catch (e) {
                console.error("Wallet cache restore error", e);
            }
        }
    }, []);

    // Sync account state with Wagmi: on disconnect, wipe state and bounce to /login
    useEffect(() => {
        if (status === "disconnected" || (!isConnected && status !== "connecting" && status !== "reconnecting")) {
            document.cookie = "user_wallet=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            localStorage.removeItem("user_wallet");
            setUserAddress("");
            setUser(null);
            setInvestments([]);
            router.push("/login");
            return;
        }

        if (isConnected && address) {
            const activeAddr = address.toLowerCase();
            if (activeAddr !== userAddress) {
                setUserAddress(activeAddr);
                localStorage.setItem("user_wallet", activeAddr);
                document.cookie = `user_wallet=${activeAddr}; path=/; max-age=2592000; SameSite=Strict`;
            }
        }
    }, [isConnected, address, status, router, userAddress]);

    const refreshWalletBalance = async () => {
        if (!userAddress) return;
        try {
            const [usdtRes, i6Res] = await Promise.all([
                fetch(`/api/wallet/${userAddress}?token=usdt&spender=${userAddress}`).catch(() => null),
                fetch(`/api/wallet/${userAddress}?token=i6&spender=${userAddress}`).catch(() => null),
            ]);

            let uFmt = usdtBalance;
            let iFmt = i6Balance;

            if (usdtRes && usdtRes.ok) {
                const uData = await usdtRes.json();
                if (uData.balance) {
                    const raw = ethers.formatUnits(uData.balance, 18);
                    uFmt = parseFloat(raw).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    setUsdtBalance(uFmt);
                }
            }

            let rawI6Val = 0;
            if (i6Res && i6Res.ok) {
                const iData = await i6Res.json();
                if (iData.balance) {
                    const raw = ethers.formatUnits(iData.balance, 18);
                    rawI6Val = parseFloat(raw);
                    if (isNaN(rawI6Val)) rawI6Val = 0;
                    setRawI6Balance(rawI6Val);
                    iFmt = rawI6Val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    setI6Balance(iFmt);
                }
            }

            localStorage.setItem(`i6_wallet_cache_${userAddress}`, JSON.stringify({ usdt: uFmt, i6: iFmt, rawI6: rawI6Val }));
        } catch (e) {
            console.error("Wallet balance refresh error", e);
        }
    };

    const refreshData = async () => {
        if (!userAddress) return;
        try {
            const res = await fetch(`/api/dashboard/${userAddress}`);
            if (!res.ok) throw new Error("Failed to fetch dashboard data");
            const data = await res.json();

            applyDashboardData(data);
            try {
                localStorage.setItem(`i6_dashboard_cache_${userAddress}`, JSON.stringify(data));
            } catch {}

            setError(null);
        } catch (err: any) {
            console.error(err);
            setError("Error connecting to Binance Smart Chain. Retrying...");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!userAddress) return;
        refreshData();
        refreshWalletBalance();
        const interval = setInterval(() => {
            refreshData();
            refreshWalletBalance();
        }, 12000);
        return () => clearInterval(interval);
    }, [userAddress]);

    return (
        <DashboardContext.Provider value={{
            userAddress,
            user,
            investments,
            pendingSalary,
            directAvailableNow,
            directPendingLocked,
            levelPendingDynamic,
            levelRatePerDay,
            exactLiveUpline,
            spotPrice,
            i6Price,
            usdtBalance,
            i6Balance,
            rawI6Balance,
            loading,
            error,
            lastWithdrawTime,
            launchTime,
            cooldownPeriod,
            isModalOpen,
            setIsModalOpen,
            refreshData,
            refreshWalletBalance
        }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) throw new Error("useDashboard must be used within DashboardProvider");
    return context;
}

export function useDashboardSafe() {
    return useContext(DashboardContext);
}

