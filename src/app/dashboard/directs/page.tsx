"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "../DashboardContext";
import UserGate from "../UserGate";
import { ethers } from "ethers";

interface DirectPartner {
    index: number;
    address: string;
    deposit: number;
    teamVolume: number;
    partnersCount: number;
    status: {
        text: string;
        badgeClass: string;
        iconClass: string;
    };
}

export default function DirectsPage() {
    const { userAddress, user, error, refreshData } = useDashboard();
    const [directs, setDirects] = useState<DirectPartner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userAddress) return;
        try {
            const cached = localStorage.getItem(`i6_directs_cache_${userAddress}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setDirects(parsed);
                    setLoading(false);
                }
            }
        } catch {}
    }, [userAddress]);

    useEffect(() => {
        if (!userAddress || !user) return;

        const loadDirects = async () => {
            try {
                const count = Number(user.directCount);
                if (count === 0) {
                    setDirects([]);
                    setLoading(false);
                    return;
                }

                const res = await fetch(`/api/directs/${userAddress}`);
                if (!res.ok) throw new Error("Failed to fetch directs");
                const data: { address: string; user: any }[] = await res.json();

                const mapped = data.map((entry, idx) => {
                    const d = entry.user;
                    const deposit = parseFloat(ethers.formatUnits(d.totalDeposits, 18));
                    const teamVolume = parseFloat(ethers.formatUnits(d.totalDownlineBusiness, 18));
                    const partnersCount = Number(d.directCount);
                    const isCapped = d.isCapped;
                    const isActive = deposit > 0 && !isCapped;

                    let statusText = "Inactive";
                    let badgeClass = "badge-inactive";
                    let iconClass = "";

                    if (isCapped) {
                        statusText = "Capped";
                        badgeClass = "badge-capped";
                        iconClass = "fas fa-ban";
                    } else if (isActive) {
                        statusText = "Active";
                        badgeClass = "badge-active";
                        iconClass = "fas fa-bolt";
                    }

                    return {
                        index: idx + 1,
                        address: entry.address,
                        deposit,
                        teamVolume,
                        partnersCount,
                        status: {
                            text: statusText,
                            badgeClass,
                            iconClass
                        }
                    };
                });

                setDirects(mapped);
                try {
                    localStorage.setItem(`i6_directs_cache_${userAddress}`, JSON.stringify(mapped));
                } catch {}
            } catch (err) {
                console.error("Directs loading fail:", err);
            } finally {
                setLoading(false);
            }
        };

        loadDirects();
    }, [userAddress, user]);

    if (!user) return <UserGate error={error} onRetry={refreshData} />;

    return (
        <div className="dashboard-container">
            <div className="dashboard-content-wrapper">
                
                <div className="user-header-section">
                    <div className="user-greeting">
                        <h1>My Direct Team</h1>
                        <span>Direct Partners Overview</span>
                    </div>
                    
                    <div className="wallet-control-bar">
                        <div className="wallet-indicator">
                            <div className="status-beacon"></div>
                            <span>BSC NETWORK</span>
                        </div>
                        <button className="wallet-action-btn" style={{ cursor: "default" }}>
                            <i className="fas fa-wallet" style={{ color: "var(--brand-blue)" }}></i> 
                            <span>{userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : "Connecting..."}</span>
                        </button>
                    </div>
                </div>

                <div className="level-card" style={{ padding: 0, overflow: "hidden", marginTop: "2rem" }}>
                    <div className="level-header" style={{ padding: "2.5rem 2.5rem 1rem 2.5rem", marginBottom: 0, borderBottom: "none", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
                        <div><i className="fas fa-users"></i> Frontline Partners</div>
                        
                        <div style={{ fontSize: "0.9rem", background: "var(--surface-color)", padding: "8px 18px", borderRadius: "16px", boxShadow: "var(--clay-inset)", border: "1px solid rgba(0,0,0,0.05)", display: "flex", alignItems: "center" }}>
                            <span style={{ color: "var(--text-muted)", textTransform: "none", fontWeight: 500, fontFamily: "var(--font-plus-jakarta)", fontSize: "0.85rem", letterSpacing: "normal" }}>Total Directs:</span>
                            <span id="totalDirectsBadge" className="font-mono" style={{ color: "var(--brand-blue)", fontWeight: 700, marginLeft: "8px", fontFamily: "var(--font-plus-jakarta)", fontSize: "1.2rem" }}>{Number(user.directCount)}</span>
                        </div>
                    </div>
                    
                    <div className="level-table-container" style={{ boxShadow: "none", borderRadius: 0, padding: "0 2.5rem 2.5rem 2.5rem", height: "600px" }}>
                        <table className="level-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Wallet Address</th>
                                    <th>Total Deposit</th>
                                    <th>Team Volume</th>
                                    <th>Team Size</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                                            <i className="fas fa-circle-notch fa-spin" style={{ fontSize: "2rem", marginBottom: "15px", color: "var(--brand-blue)", display: "block" }}></i>
                                            Syncing with Blockchain...
                                        </td>
                                    </tr>
                                ) : directs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                                            <i className="fas fa-user-slash" style={{ fontSize: "2.5rem", opacity: 0.3, marginBottom: "15px", display: "block" }}></i>
                                            No direct partners found. Share your referral link to build your team!
                                        </td>
                                    </tr>
                                ) : (
                                    directs.map(row => (
                                        <tr key={row.index}>
                                            <td>
                                                <span className="font-mono" style={{ background: "var(--bg-color)", color: "var(--text-main)", padding: "4px 10px", borderRadius: "10px", fontWeight: 600, boxShadow: "var(--clay-inset)", fontFamily: "var(--font-plus-jakarta)", fontSize: "0.8rem", letterSpacing: "normal" }}>
                                                    #{row.index}
                                                </span>
                                            </td>
                                            <td>
                                                <a 
                                                    href={`https://bscscan.com/address/${row.address}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="wallet-link font-mono"
                                                    style={{ fontSize: "0.85rem", fontWeight: 500 }}
                                                >
                                                    {row.address.slice(0, 6)}...{row.address.slice(-4)} <i className="fas fa-external-link-alt" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}></i>
                                                </a>
                                            </td>
                                            <td className="font-mono" style={{ fontWeight: 600, color: "var(--text-main)", fontFamily: "var(--font-plus-jakarta)", fontSize: "0.95rem" }}>
                                                ${row.deposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="font-mono" style={{ fontWeight: 500, color: "var(--text-muted)", fontFamily: "var(--font-plus-jakarta)", fontSize: "0.95rem" }}>
                                                ${row.teamVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ color: "var(--text-main)", fontWeight: 500, fontFamily: "var(--font-plus-jakarta)", fontSize: "0.95rem" }}>
                                                <i className="fas fa-users" style={{ color: "var(--text-light)", marginRight: "5px" }}></i> {row.partnersCount}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${row.status.badgeClass}`} style={{ fontWeight: 600, fontSize: "0.75rem" }}>
                                                    {row.status.iconClass && <i className={row.status.iconClass} style={{ marginRight: "4px" }}></i>}
                                                    {row.status.text}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
