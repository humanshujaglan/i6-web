"use client";

import { useState, useEffect, useRef } from "react";
import { useDashboard } from "../DashboardContext";
import UserGate from "../UserGate";

interface DownlineMember {
    level: number;
    address: string;
    deposit: number;
    teamVolume: number;
    dailyIncome: number;
    isQualified: boolean;
    reqDirects: number;
    roiPercent: number;
    status: { text: string; badgeClass: string; iconClass: string };
    referrer: string;
}

export default function DownlinesPage() {
    const { userAddress, user, error, refreshData } = useDashboard();
    const [depth, setDepth] = useState<string>("1");
    const [isScanning, setIsScanning] = useState(false);
    const [isSyncingLive, setIsSyncingLive] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);
    const [scanProgress, setScanProgress] = useState(0);
    const [foundCount, setFoundCount] = useState(0);
    const [results, setResults] = useState<DownlineMember[]>([]);
    const [hasScanned, setHasScanned] = useState(false);
    const [scanError, setScanError] = useState("");
    const [filterLevel, setFilterLevel] = useState<string>("");
    const [searchAddress, setSearchAddress] = useState<string>("");

    useEffect(() => {
        if (!userAddress) return;
        try {
            const cached = localStorage.getItem(`i6_downlines_cache_${userAddress}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setResults(parsed);
                    setFoundCount(parsed.length);
                    setHasScanned(true);
                }
            }
        } catch {}
    }, [userAddress]);

    const scanReqIdRef = useRef(0);

    const startScan = async (targetDepth?: string | number) => {
        if (!userAddress || !user) return;
        const currentReqId = ++scanReqIdRef.current;
        const effectiveDepth = targetDepth !== undefined ? targetDepth : depth;
        const depthNum = Math.min(Math.max(parseInt(String(effectiveDepth), 10) || 1, 1), 40);

        setScanError("");
        setSyncMessage(null);

        let hasCachedHit = false;

        // Step 1: Check cache instantly (sub-50ms)
        try {
            const cachedRes = await fetch(`/api/downlines/${userAddress}?depth=${depthNum}&mode=cached`);
            if (cachedRes.ok && scanReqIdRef.current === currentReqId) {
                const cachedJson = await cachedRes.json();
                if (cachedJson.found && Array.isArray(cachedJson.data)) {
                    hasCachedHit = true;
                    setResults(cachedJson.data);
                    setFoundCount(cachedJson.data.length);
                    setHasScanned(true);
                    setIsSyncingLive(true);
                    setSyncMessage("Instant cache loaded • Checking live on-chain updates...");
                    try {
                        localStorage.setItem(`i6_downlines_cache_${userAddress}`, JSON.stringify(cachedJson.data));
                    } catch {}
                }
            }
        } catch {
            // Ignore cache check errors; fallback to live scan
        }

        if (scanReqIdRef.current !== currentReqId) return;

        // Step 2: If no cache hit, show full scan loader
        if (!hasCachedHit) {
            setIsScanning(true);
            setScanProgress(25);
            setResults([]);
            setFoundCount(0);
            setHasScanned(true);
        }

        // Step 3: Run live on-chain revalidation
        try {
            if (!hasCachedHit) setScanProgress(50);
            const liveRes = await fetch(`/api/downlines/${userAddress}?depth=${depthNum}&mode=live`);
            if (scanReqIdRef.current !== currentReqId) return;
            if (!liveRes.ok) throw new Error("Scan failed");
            const liveJson = await liveRes.json();

            const liveData: DownlineMember[] = Array.isArray(liveJson) ? liveJson : (liveJson.data || []);
            if (!hasCachedHit) setScanProgress(85);

            setResults(liveData);
            setFoundCount(liveData.length);
            if (!hasCachedHit) setScanProgress(100);

            if (hasCachedHit) {
                if (liveJson.updated) {
                    setSyncMessage("Live sync complete: updated records saved to cache.");
                } else {
                    setSyncMessage("Live sync complete: all records up to date.");
                }
                setTimeout(() => {
                    if (scanReqIdRef.current === currentReqId) setSyncMessage(null);
                }, 4000);
            }
        } catch (err) {
            console.error(err);
            if (!hasCachedHit) {
                setScanError("Scan interrupted. Please check your connection or RPC endpoint.");
            } else {
                setSyncMessage("Live sync interrupted. Displaying cached records.");
                setTimeout(() => {
                    if (scanReqIdRef.current === currentReqId) setSyncMessage(null);
                }, 5000);
            }
        } finally {
            if (scanReqIdRef.current === currentReqId) {
                setIsScanning(false);
                setIsSyncingLive(false);
            }
        }
    };

    useEffect(() => {
        if (userAddress && user && !hasScanned) {
            startScan(depth);
        }
    }, [userAddress, user]);

    const displayResults = results.filter((r) => {
        if (filterLevel && r.level !== parseInt(filterLevel, 10)) return false;
        if (searchAddress && !r.address.toLowerCase().includes(searchAddress.toLowerCase().trim())) return false;
        return true;
    });

    if (!user) {
        return <UserGate error={error} onRetry={refreshData} />;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-content-wrapper">

                <div className="user-header-section">
                    <div className="user-greeting">
                        <h1>Global Team</h1>
                        <span>Multi-Level Downline Viewer</span>
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

                <div className="upline-card" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                            {/* Target Level Input */}
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontFamily: "var(--font-plus-jakarta)", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-soft)", display: "flex", alignItems: "center", gap: "5px" }}>
                                    <i className="fas fa-layer-group" style={{ color: "var(--brand-blue)" }}></i> Target:
                                </span>
                                <div className="flex items-center gap-1.5 bg-white dark:bg-[#191d24] px-3 py-2 rounded-xl border border-gray-200/90 dark:border-white/10 shadow-xs hover:border-gray-300 dark:hover:border-white/20 focus-within:border-[#0072ED] dark:focus-within:border-[#FCD535] focus-within:ring-2 focus-within:ring-[#0072ED]/15 dark:focus-within:ring-[#FCD535]/15 transition-all">
                                    <span className="text-xs font-semibold text-[#0072ED] dark:text-[#FCD535] font-mono select-none">
                                        L1-
                                    </span>
                                    <input
                                        type="number"
                                        id="depthInput"
                                        min="1"
                                        max="40"
                                        value={depth}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            if (v === "") { setDepth(""); return; }
                                            const n = parseInt(v);
                                            if (!isNaN(n)) {
                                                const clamped = String(Math.min(Math.max(n, 1), 40));
                                                setDepth(clamped);
                                                startScan(clamped);
                                            }
                                        }}
                                        className="w-10 bg-transparent text-xs font-semibold font-mono text-[var(--text-main)] outline-none text-center"
                                    />
                                    <span className="text-[11px] text-[var(--text-muted)] font-mono select-none">
                                        /40
                                    </span>
                                </div>
                            </div>

                            {/* Scan Button */}
                            <button
                                id="startScanBtn"
                                className="referral-btn"
                                style={{ width: "auto", padding: "9px 20px", fontSize: "0.85rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: "12px", cursor: isScanning || isSyncingLive ? "not-allowed" : "pointer" }}
                                onClick={() => startScan()}
                                disabled={isScanning || isSyncingLive}
                            >
                                {isScanning || isSyncingLive ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-satellite-dish"></i>} {isSyncingLive ? "Syncing..." : "Scan Level"}
                            </button>

                            {/* Filter by Level */}
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontFamily: "var(--font-plus-jakarta)", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-soft)", display: "flex", alignItems: "center", gap: "5px" }}>
                                    <i className="fas fa-filter" style={{ color: "var(--brand-blue)" }}></i> Filter:
                                </span>
                                <div className="flex items-center gap-1.5 bg-white dark:bg-[#191d24] px-3 py-2 rounded-xl border border-gray-200/90 dark:border-white/10 shadow-xs hover:border-gray-300 dark:hover:border-white/20 focus-within:border-[#0072ED] dark:focus-within:border-[#FCD535] focus-within:ring-2 focus-within:ring-[#0072ED]/15 dark:focus-within:ring-[#FCD535]/15 transition-all">
                                    <input
                                        type="number"
                                        min="1"
                                        max="40"
                                        placeholder="Level (1-40)"
                                        value={filterLevel}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            if (v === "") { setFilterLevel(""); return; }
                                            const n = parseInt(v, 10);
                                            if (!isNaN(n)) {
                                                const clamped = Math.min(Math.max(n, 1), 40);
                                                setFilterLevel(String(clamped));
                                                if (clamped > parseInt(depth || "1", 10)) {
                                                    setDepth(String(clamped));
                                                    startScan(String(clamped));
                                                }
                                            }
                                        }}
                                        className="w-24 bg-transparent text-xs font-semibold font-mono text-[var(--text-main)] outline-none placeholder:text-gray-400 dark:placeholder:text-[#848e9c]"
                                    />
                                    {filterLevel && (
                                        <button
                                            type="button"
                                            onClick={() => setFilterLevel("")}
                                            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem" }}
                                            title="Clear filter"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Filter by Address */}
                            <div className="flex items-center gap-2 bg-white dark:bg-[#191d24] px-3 py-2 rounded-xl border border-gray-200/90 dark:border-white/10 shadow-xs hover:border-gray-300 dark:hover:border-white/20 focus-within:border-[#0072ED] dark:focus-within:border-[#FCD535] focus-within:ring-2 focus-within:ring-[#0072ED]/15 dark:focus-within:ring-[#FCD535]/15 transition-all">
                                <i className="fas fa-search text-xs text-gray-400"></i>
                                <input
                                    type="text"
                                    placeholder="Search 0x address..."
                                    value={searchAddress}
                                    onChange={(e) => setSearchAddress(e.target.value)}
                                    className="w-32 sm:w-44 bg-transparent text-xs text-[var(--text-main)] outline-none placeholder:text-gray-400 dark:placeholder:text-[#848e9c] font-medium font-mono"
                                />
                                {searchAddress && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchAddress("")}
                                        style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem" }}
                                        title="Clear search"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Partners Counter */}
                        <div className="flex items-center gap-2 bg-white dark:bg-[#191d24] px-4 py-2 rounded-xl border border-gray-200/90 dark:border-white/10 shadow-xs">
                            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontFamily: "var(--font-plus-jakarta)", fontWeight: 500 }}>
                                Partners:
                            </span>
                            <span id="totalFoundBadge" className="font-mono font-bold text-sm" style={{ color: "var(--brand-blue)" }}>
                                {filterLevel || searchAddress ? `${displayResults.length} / ${results.length}` : results.length}
                            </span>
                        </div>

                    </div>

                    {syncMessage && (
                        <div style={{
                            marginTop: "16px",
                            padding: "10px 18px",
                            borderRadius: "12px",
                            background: "var(--surface-color)",
                            boxShadow: "var(--clay-inset)",
                            fontSize: "0.9rem",
                            color: isSyncingLive ? "var(--brand-gold)" : "var(--brand-green)",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            fontFamily: "var(--font-plus-jakarta)",
                            fontWeight: 700
                        }}>
                            {isSyncingLive ? (
                                <i className="fas fa-rotate fa-spin"></i>
                            ) : (
                                <i className="fas fa-check-circle"></i>
                            )}
                            <span>{syncMessage}</span>
                        </div>
                    )}

                    {isScanning && (
                        <div className="progress-wrapper" id="scanProgress" style={{ display: "block", marginTop: "25px" }}>
                            <div className="progress-text" style={{ color: "var(--brand-gold)" }}>
                                <span><i className="fas fa-circle-notch fa-spin"></i> Interrogating Blockchain...</span>
                            </div>
                            <div className="progress-container" style={{ height: "10px" }}>
                                <div className="progress-bar" id="scanBar" style={{ background: "linear-gradient(90deg, var(--brand-blue), var(--brand-gold))", width: `${scanProgress}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="level-card" style={{ padding: 0, overflow: "hidden" }}>
                    <div className="level-header" style={{ padding: "2.5rem 2.5rem 1rem 2.5rem", marginBottom: 0, borderBottom: "none" }}>
                        <i className="fas fa-network-wired"></i> Network Directory
                    </div>

                    <div className="level-table-container" style={{ boxShadow: "none", borderRadius: 0, height: "600px", padding: "0 2.5rem 2.5rem 2.5rem" }}>
                        <table className="level-table">
                            <thead>
                                <tr>
                                    <th>Level</th>
                                    <th>Wallet Address</th>
                                    <th>Deposit & ROI</th>
                                    <th>Team Business</th>
                                    <th>My Income (Daily)</th>
                                    <th>Status</th>
                                    <th>Sponsor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!hasScanned ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                                            <i className="fas fa-project-diagram" style={{ fontSize: "2.5rem", opacity: 0.3, marginBottom: "15px", display: "block" }}></i>
                                            Select a Level depth and click <strong>Scan Level</strong> to view your downline.
                                        </td>
                                    </tr>
                                ) : scanError ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                                            <i className="fas fa-exclamation-triangle" style={{ fontSize: "2.5rem", opacity: 0.3, marginBottom: "15px", display: "block", color: "var(--accent-warn)" }}></i>
                                            {scanError}
                                            <br /><br />
                                            <button
                                                className="referral-btn"
                                                style={{ width: "auto", padding: "10px 30px", fontSize: "1rem" }}
                                                onClick={() => startScan()}
                                            >
                                                <i className="fas fa-redo" style={{ marginRight: "8px" }}></i> Retry
                                            </button>
                                        </td>
                                    </tr>
                                ) : displayResults.length === 0 && !isScanning ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                                            <i className="fas fa-users-slash" style={{ fontSize: "2.5rem", opacity: 0.3, marginBottom: "15px", display: "block" }}></i>
                                            {filterLevel ? `No users found on Level ${filterLevel}.` : "No users found in this scan range."}
                                        </td>
                                    </tr>
                                ) : (
                                    displayResults.map((row, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <span className="font-mono" style={{ background: "var(--bg-color)", color: "var(--brand-blue)", padding: "4px 10px", borderRadius: "10px", fontWeight: 600, boxShadow: "var(--clay-inset)", fontFamily: "var(--font-plus-jakarta)", fontSize: "0.8rem", letterSpacing: "normal" }}>
                                                    LVL {row.level}
                                                </span>
                                            </td>
                                            <td>
                                                <a
                                                    href={`https://bscscan.com/address/${row.address}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ color: "var(--brand-blue)", textDecoration: "none", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px", transition: "0.2s" }}
                                                    className="wallet-link-hover"
                                                >
                                                    {row.address.slice(0, 6)}...{row.address.slice(-4)} <i className="fas fa-external-link-alt" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}></i>
                                                </a>
                                            </td>
                                            <td className="font-mono" style={{ fontWeight: 600, color: "var(--text-main)", fontFamily: "var(--font-plus-jakarta)", fontSize: "0.95rem" }}>
                                                ${row.deposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                <span style={{ fontSize: "0.75rem", background: "var(--bg-color)", color: "var(--brand-gold)", padding: "2px 6px", borderRadius: "6px", marginLeft: "8px", boxShadow: "var(--clay-inset)", fontFamily: "var(--font-main)", fontWeight: 500 }} title="User Base ROI">
                                                    <i className="fas fa-fire"></i> {(row.roiPercent / 10).toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="font-mono" style={{ fontWeight: 500, color: "var(--text-muted)", fontFamily: "var(--font-plus-jakarta)", fontSize: "0.95rem" }}>
                                                ${row.teamVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td>
                                                {row.isQualified ? (
                                                    <span className="font-mono" style={{ color: "var(--brand-green)", fontWeight: 600, fontFamily: "var(--font-plus-jakarta)", fontSize: "0.95rem" }}>${row.dailyIncome.toFixed(4)}</span>
                                                ) : (
                                                    <>
                                                        <span className="font-mono" style={{ color: "var(--text-light)", fontFamily: "var(--font-plus-jakarta)", fontSize: "0.85rem" }}>$0.0000</span>
                                                        <i className="fas fa-lock" style={{ color: "var(--brand-blue)", marginLeft: "5px", fontSize: "0.8rem" }} title={`Locked: Requires ${row.reqDirects} Directs`}></i>
                                                    </>
                                                )}
                                            </td>
                                            <td>
                                                {row.status.text === "Capped" && (
                                                    <span style={{ background: "var(--brand-blue)", color: "white", padding: "4px 10px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: 600, textTransform: "none", boxShadow: "var(--clay-btn-shadow)", display: "inline-flex", alignItems: "center" }}>
                                                        <i className="fas fa-ban" style={{ marginRight: "4px" }}></i> Capped
                                                    </span>
                                                )}
                                                {row.status.text === "Active" && (
                                                    <span style={{ background: "var(--brand-green)", color: "white", padding: "4px 10px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: 600, textTransform: "none", boxShadow: "var(--clay-btn-shadow)", display: "inline-flex", alignItems: "center" }}>
                                                        <i className="fas fa-check" style={{ marginRight: "4px" }}></i> Active
                                                    </span>
                                                )}
                                                {row.status.text === "Inactive" && (
                                                    <span style={{ background: "var(--bg-color)", color: "var(--text-light)", padding: "4px 10px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: 500, textTransform: "none", boxShadow: "var(--clay-inset)", display: "inline-flex", alignItems: "center" }}>
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontWeight: 500, fontSize: "0.85rem" }}>
                                                {row.referrer.slice(0, 6)}...{row.referrer.slice(-4)}
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
