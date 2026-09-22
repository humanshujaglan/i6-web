"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "../DashboardContext";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { FUND_CONTRACT_ADDRESS } from "@/lib/contracts/abis";

interface FundItem {
    id: number;
    name: string;
    reward: number;
    legTarget: number;
    icon: string;
    color: string;
}

const FUNDS: FundItem[] = [
    { id: 0, name: "Starter Fund", reward: 300, legTarget: 2000, icon: "fa-seedling", color: "var(--brand-green)" },
    { id: 1, name: "Builder Fund", reward: 500, legTarget: 5500, icon: "fa-tools", color: "var(--text-muted)" },
    { id: 2, name: "Pro Fund", reward: 5000, legTarget: 50000, icon: "fa-briefcase", color: "var(--brand-gold)" },
    { id: 3, name: "Car Fund", reward: 25000, legTarget: 300000, icon: "fa-car", color: "var(--brand-red)" },
    { id: 4, name: "House Fund", reward: 75000, legTarget: 1000000, icon: "fa-home", color: "var(--text-main)" },
    { id: 5, name: "Luxury Fund", reward: 250000, legTarget: 5000000, icon: "fa-gem", color: "var(--brand-gold)" },
    { id: 6, name: "Villa Fund", reward: 1000000, legTarget: 15000000, icon: "fa-umbrella-beach", color: "var(--brand-green)" },
    { id: 7, name: "Yacht Fund", reward: 2500000, legTarget: 50000000, icon: "fa-ship", color: "var(--text-main)" },
    { id: 8, name: "Crown Fund", reward: 5000000, legTarget: 150000000, icon: "fa-crown", color: "var(--brand-red)" }
];

const FUND_CONTRACT_ABI = [
    {
        "inputs": [],
        "name": "claimFundReward",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

export default function FundStatusPage() {
    const { userAddress } = useDashboard();
    const { address, isConnected } = useAccount();
    const { open } = useAppKit();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient();

    const [legVolumes, setLegVolumes] = useState<number[]>([0, 0, 0]);
    const [fundsReceived, setFundsReceived] = useState<boolean[]>(new Array(9).fill(false));
    
    const [loading, setLoading] = useState(true);
    const [claimingId, setClaimingId] = useState<number | null>(null);

    const loadFundData = async () => {
        const activeAddr = address || userAddress;
        if (!activeAddr) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`/api/fund-status/${activeAddr}`);
            if (!res.ok) throw new Error("Failed to fetch fund status");
            const data = await res.json();

            if (!data.exists) {
                setLoading(false);
                return;
            }

            setLegVolumes(data.legVolumes);

            let totalEarnedFunds = data.earnedFromFunds;
            const received = new Array(9).fill(false);
            for (let i = 0; i < 9; i++) {
                if (totalEarnedFunds >= FUNDS[i].reward) {
                    received[i] = true;
                    totalEarnedFunds -= FUNDS[i].reward;
                }
            }
            setFundsReceived(received);

        } catch (error) {
            console.error("Fund Data Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFundData();
    }, [userAddress, address]);

    const handleRedeem = async (fundId: number) => {
        if (claimingId !== null) return;

        if (!address && !isConnected) {
            open();
            return;
        }

        setClaimingId(fundId);

        try {
            const hash = await writeContractAsync({
                address: FUND_CONTRACT_ADDRESS as `0x${string}`,
                abi: FUND_CONTRACT_ABI,
                functionName: "claimFundReward",
            });
            
            if (publicClient) {
                await publicClient.waitForTransactionReceipt({ hash });
            }

            alert("Success! Reward claimed.");
            loadFundData();
        } catch (error: any) {
            console.error("Redeem error", error);
            alert(error?.shortMessage || error?.message || "Transaction Failed.");
        } finally {
            setClaimingId(null);
        }
    };

    const formatCompact = (num: number) => {
        return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(num);
    };

    return (
        <div className="fund-wrapper">

            <div className="page-header">
                <div>
                    <h1>Fund Achievements</h1>
                    <p>Qualify for lifetime rewards by maintaining 3 strong business legs. No time limits.</p>
                </div>
            </div>

            {loading ? (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "50px", color: "var(--text-muted)", fontSize: "1.2rem", fontWeight: 600 }}>
                    <i className="fas fa-circle-notch fa-spin fa-2x" style={{ marginBottom: "15px" }}></i><br />Analyzing Business Legs & Team Volume...
                </div>
            ) : (
                <div className="fund-grid">
                    {FUNDS.map((fund) => {
                        let qualifiedLegs = 0;
                        legVolumes.forEach((vol) => {
                            if (vol >= fund.legTarget) qualifiedLegs++;
                        });

                        const isClaimed = fundsReceived[fund.id];

                        return (
                            <div key={fund.id} className="fund-card" style={{ borderTop: `6px solid ${fund.color}` }}>
                                <div className="f-header">
                                    <div className="f-icon-box" style={{ color: fund.color }}><i className={`fas ${fund.icon}`}></i></div>
                                    <div className="f-reward"><label>Reward</label><span>${fund.reward.toLocaleString()}</span></div>
                                </div>
                                <div className="f-title">{fund.name}</div>
                                
                                <div className="leg-progress-box">
                                    <div style={{ marginBottom: "15px", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "none" }}>Leg Performance target</div>
                                    {legVolumes.map((vol, idx) => {
                                        const isLegQualified = vol >= fund.legTarget;
                                        const valClass = isLegQualified ? "leg-val-pass" : "leg-val-fail";
                                        const icon = isLegQualified ? <i className="fas fa-check"></i> : <i className="fas fa-times"></i>;
                                        
                                        return (
                                            <div key={idx} className="leg-stat-row">
                                                <span className="leg-name">Leg {idx + 1}</span>
                                                <div>
                                                    <span className={valClass}>{icon} ${formatCompact(vol)}</span>
                                                    <span className="target-dim"> / ${formatCompact(fund.legTarget)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="f-footer">
                                    <div><div className="lifetime-badge"><i className="fas fa-infinity" style={{ marginRight: "5px" }}></i> Lifetime</div></div>
                                    {isClaimed ? (
                                        <span className="status-pill st-won">Collected</span>
                                    ) : qualifiedLegs >= 3 ? (
                                        <span className="status-pill st-won">Qualified</span>
                                    ) : (
                                        <span className="status-pill st-running">In Progress</span>
                                    )}
                                </div>

                                {isClaimed ? (
                                    <button className="btn-redeem btn-claimed" disabled>
                                        <i className="fas fa-check-circle"></i> Reward Received
                                    </button>
                                ) : qualifiedLegs >= 3 ? (
                                    <button className="btn-redeem" disabled={claimingId === fund.id} onClick={() => handleRedeem(fund.id)}>
                                        {claimingId === fund.id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-hand-holding-usd"></i>} Claim ${fund.reward.toLocaleString()}
                                    </button>
                                ) : (
                                    <button className="btn-redeem" disabled>
                                        <i className="fas fa-lock"></i> Locked
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

        </div>
    );
}
