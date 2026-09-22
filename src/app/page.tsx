"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Shield, 
  Layers, 
  Lock, 
  ArrowUpRight, 
  TrendingUp
} from "lucide-react";
import { ethers } from "ethers";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { I6_TOKEN_ADDRESS as CONTRACT_ADDR } from "@/lib/contracts/abis";
import I6PriceCard from "./dashboard/components/cards/I6PriceCard";
const MAX_SUPPLY = 6000000;

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liveSupply, setLiveSupply] = useState<string>("—");
  const [livePct, setLivePct] = useState<string>("Live");
  const [tradingStatus, setTradingStatus] = useState<string>("Checking…");
  const [isStatusWarn, setIsStatusWarn] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("Connecting to BNB Chain…");
  const [connectionClass, setConnectionClass] = useState("connecting");
  const [pairAddress, setPairAddress] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  
  // Accordion active index
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // GSAP animations ref
  const mainRef = useRef<HTMLDivElement>(null);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Theme setup
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("i6-theme");
      const initialTheme = savedTheme === "light" ? "light" : "dark";
      setTheme(initialTheme);
      if (initialTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    try {
      localStorage.setItem("i6-theme", nextTheme);
      if (nextTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Live Blockchain Data Loading
  const loadLive = async () => {
    try {
      setConnectionStatus("Connecting to BNB Chain…");
      setConnectionClass("connecting");

      const res = await fetch("/api/token-stats");
      if (!res.ok) throw new Error("Failed to fetch token stats");
      const data = await res.json();

      const supplyNum = parseFloat(ethers.formatUnits(data.totalSupply, 18));
      setLiveSupply(Math.floor(supplyNum).toLocaleString("en-US"));
      const pct = Math.min(100, (supplyNum / MAX_SUPPLY) * 100);
      setLivePct(`${pct.toFixed(2)}% minted`);

      setTradingStatus(data.buyingEnabled ? "OPEN" : "LOCKED");
      setIsStatusWarn(!data.buyingEnabled);

      if (data.liquidityPair) {
        setPairAddress(data.liquidityPair);
      } else {
        setPairAddress(null);
      }

      setConnectionStatus("Live • Connected to BNB Chain");
      setConnectionClass("");
    } catch (err) {
      console.error("Live data error:", err);
      setConnectionStatus("Unable to reach BNB Chain — retrying");
      setConnectionClass("error");
    }
  };

  useEffect(() => {
    loadLive();
    const interval = setInterval(loadLive, 30000);
    return () => clearInterval(interval);
  }, []);

  // GSAP scroll trigger animations
  useEffect(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);

      // Hero animations
      const ctx = gsap.context(() => {
        // Simple entry animation
        gsap.fromTo(".hero-badge", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 });
        gsap.fromTo(".hero-h1", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.2 });
        gsap.fromTo(".hero-p", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.4 });
        gsap.fromTo(".hero-cta-row", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.6 });
        gsap.fromTo(".contract-pill", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.7 });
        gsap.fromTo(".hero-visual", { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, delay: 0.4, ease: "back.out(1.4)" });

        // Scroll animations for sections
        const scrollSections = gsap.utils.toArray(".reveal-section");
        scrollSections.forEach((sec: any) => {
          gsap.fromTo(sec, 
            { opacity: 0, y: 50 },
            { 
              opacity: 1, 
              y: 0, 
              duration: 0.8, 
              ease: "power3.out",
              scrollTrigger: {
                trigger: sec,
                start: "top 85%",
                toggleActions: "play none none none"
              }
            }
          );
        });

        // Scroll animations for cards
        const scrollCards = gsap.utils.toArray(".reveal-card");
        scrollCards.forEach((card: any) => {
          gsap.fromTo(card,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: {
                trigger: card,
                start: "top 90%",
                toggleActions: "play none none none"
              }
            }
          );
        });

        // Top scroll progress bar
        gsap.to(".scroll-progress-bar", {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: "body",
            start: "top top",
            end: "bottom bottom",
            scrub: 0.2
          }
        });
      }, mainRef);

      return () => ctx.revert();
    }
  }, []);

  const copyContract = () => {
    navigator.clipboard.writeText(CONTRACT_ADDR).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }).catch(err => console.error("Failed to copy address:", err));
  };

  const faqData = [
    {
      q: "What is Infinity Six?",
      a: "Infinity Six is a decentralized ERC20 protocol built around the principle of strict scarcity. With a fixed max supply of 6,000,000 i6 tokens and zero human admin control, it operates entirely through on-chain smart contract logic."
    },
    {
      q: "Why is public buying locked for 180 days?",
      a: "The 180-day DEX lock is hardcoded into the contract to prevent sniper bots and market manipulation during the early ecosystem phase. After the lock, open price discovery begins on decentralized exchanges."
    },
    {
      q: "How do I become eligible for working income?",
      a: "You need to maintain an active account of $100 or more through the whitelisted ecosystem contracts. Once active, working income and affiliate rewards are distributed automatically through the smart ecosystem."
    },
    {
      q: "Is the contract audited and verified?",
      a: "Yes. The smart contract source code is fully verified and publicly viewable on BscScan. Every transaction, mint event, and distribution can be inspected on-chain in real time."
    },
    {
      q: "What wallets can I use?",
      a: "Any standard Web3 wallet compatible with BNB Smart Chain — including MetaMask, Trust Wallet, SafePal, and others. No registration or KYC is required to interact with the protocol."
    },
    {
      q: "How does dynamic minting work?",
      a: "Tokens are minted dynamically based on system withdrawal events. The protocol references real-time spot price metrics to calculate the exact token value required for each event, keeping issuance tightly coupled to actual economic activity."
    }
  ];

  return (
    <div ref={mainRef} className="relative min-h-screen flex flex-col overflow-x-hidden pb-10">
      
      {/* Toast Alert */}
      <div className={`fixed bottom-[30px] right-[30px] z-[1000] bg-[var(--accent-primary)] text-white px-[30px] py-[15px] rounded-[20px] font-bold shadow-lg shadow-[var(--accent-glow)] transition-all duration-300 transform ${copied ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[30px] pointer-events-none"}`}>
        Address Copied!
      </div>

      {/* Background Gradient Mesh Orbs */}
      <div className="fixed top-[-120px] left-[-160px] w-[520px] h-[520px] rounded-full bg-[rgba(59,130,246,0.22)] blur-[90px] z-[-1] pointer-events-none animate-float"></div>
      <div className="fixed bottom-[-10%] right-[-220px] w-[620px] h-[620px] rounded-full bg-[rgba(37,99,235,0.14)] blur-[90px] z-[-1] pointer-events-none animate-float [animation-delay:-7s]"></div>
      <div className="fixed top-[50%] left-[45%] w-[420px] h-[420px] rounded-full bg-[rgba(96,165,250,0.16)] blur-[90px] z-[-1] pointer-events-none animate-float [animation-delay:-12s]"></div>

      {/* Top Scroll Progress Bar */}
      <div className="scroll-progress-bar fixed top-0 left-0 h-[3px] w-full bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-tertiary)] to-[var(--accent-primary)] bg-[size:200%_100%] scale-x-0 origin-left z-[999] pointer-events-none shadow-md shadow-[var(--accent-glow)]"></div>

      {/* Navigation Header */}
      <nav className={`landing-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="logo-container">
          <img src="/i6-logo.webp" alt="Infinity Six Logo" />
        </div>

        <div className="nav-right">
          <div className={`nav-links ${mobileMenuOpen ? "active" : ""}`} id="nav-links">
            <a onClick={() => setMobileMenuOpen(false)} href="#about">About</a>
            <a onClick={() => setMobileMenuOpen(false)} href="#how">How It Works</a>
            <a onClick={() => setMobileMenuOpen(false)} href="#mechanics">Mechanics</a>
            <a onClick={() => setMobileMenuOpen(false)} href="#security">Security</a>
            <a onClick={() => setMobileMenuOpen(false)} href="#tokenomics">Tokenomics</a>
            <a onClick={() => setMobileMenuOpen(false)} href="#onchain">Live Data</a>
            <a onClick={() => setMobileMenuOpen(false)} href="#faq">FAQ</a>

            <div className="nav-auth-container">
              <Link href="/login" className="nav-login">Login</Link>
              <Link href="/register" className="nav-register">Sign Up</Link>
            </div>
          </div>

          <div className="nav-actions">
            <button className="theme-toggle" id="themeToggle" aria-label="Toggle theme" type="button" onClick={toggleTheme}>
              <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
              </svg>
              <svg className="icon-moon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </button>
            <button className="menu-toggle" id="mobile-menu" aria-label="Toggle menu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="hero-grid">
          <div className="hero-text">
            <div className="hero-badge"><span className="dot"></span> Live on BNB Chain</div>
            <h1 className="hero-h1">The <span className="grad">Architecture</span><br />of Scarcity</h1>
            <p className="hero-p">Infinity <strong>Six</strong> is an unstoppable ERC20 protocol — governed by mathematics, not management. Strictly 6,000,000 tokens. Forever.</p>

            <div className="hero-cta-row">
              <Link href="/login" className="btn">Login</Link>
              <Link href="/register" className="btn btn-ghost">Sign Up</Link>
            </div>

            <div className="contract-pill" onClick={copyContract}>
              <span>Contract: <span className="highlight-text contract-address-text">{CONTRACT_ADDR}</span></span>
              <svg viewBox="0 0 24 24">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-emblem">
              <div className="orbit-ring orbit-1"><div className="orbit-dot"></div></div>
              <div className="orbit-ring orbit-2"></div>
              <div className="orbit-ring orbit-3"></div>

              <div className="hero-logo-wrap">
                <img src="/i6-logo.webp" alt="Infinity Six Emblem" />
              </div>

              <div className="float-chip chip-1">
                <strong>6M</strong>
                <span>Max Supply</span>
              </div>
              <div className="float-chip chip-2">
                <strong>180d</strong>
                <span>DEX Lock</span>
              </div>
              <div className="float-chip chip-3">
                <strong>100%</strong>
                <span>On-Chain</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Live On-Chain Stats Banner */}
      <section className="reveal-section px-[5%] py-[40px] max-w-[1200px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[40px]">
          <div className="clay-card p-[30px_24px] text-center flex flex-col items-center">
            <div className="text-[2.6rem]  font-extrabold bg-gradient-to-r from-[var(--accent-secondary)] to-[var(--accent-primary)] bg-clip-text text-transparent leading-[1.1] mb-[6px]">
              {liveSupply}
            </div>
            <div className="text-[0.85rem] font-bold  text-[var(--text-muted)] ">Current Supply</div>
            <div className="inline-flex items-center gap-[6px] mt-[10px] px-[10px] py-[4px] rounded-[20px] bg-[rgba(16,185,129,0.1)] text-[var(--accent-success)] text-[0.7rem] font-bold  ">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-success)] animate-[ping_1.5s_infinite]"></span>
              {livePct}
            </div>
          </div>

          <div className="clay-card p-[30px_24px] text-center flex flex-col items-center justify-center">
            <div className="text-[2.6rem]  font-extrabold bg-gradient-to-r from-[var(--accent-secondary)] to-[var(--accent-primary)] bg-clip-text text-transparent leading-[1.1] mb-[6px]">
              6,000,000
            </div>
            <div className="text-[0.85rem] font-bold  text-[var(--text-muted)] ">Max Supply</div>
            <div className="text-[0.78rem] text-[var(--text-soft)] font-medium mt-[8px]">Hardcoded ceiling</div>
          </div>

          <div className="clay-card p-[30px_24px] text-center flex flex-col items-center">
            <div className="text-[2.6rem]  font-extrabold bg-gradient-to-r from-[var(--accent-secondary)] to-[var(--accent-primary)] bg-clip-text text-transparent leading-[1.1] mb-[6px]">
              {tradingStatus}
            </div>
            <div className="text-[0.85rem] font-bold  text-[var(--text-muted)] ">Trading Status</div>
            <div className={`inline-flex items-center gap-[6px] mt-[10px] px-[10px] py-[4px] rounded-[20px] text-[0.7rem] font-bold   ${isStatusWarn ? "bg-[rgba(245,158,11,0.12)] text-[var(--accent-warn)]" : "bg-[rgba(16,185,129,0.1)] text-[var(--accent-success)]"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isStatusWarn ? "bg-[var(--accent-warn)]" : "bg-[var(--accent-success)]"} animate-pulse`}></span>
              {isStatusWarn ? "DEX Buying Locked" : "Public Trading Live"}
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Decentralization */}
      <section id="about" className="reveal-section px-[5%] py-[80px] max-w-[1200px] mx-auto w-full">
        <h2 className="text-[2.5rem] sm:text-[3.2rem] font-extrabold text-center text-[var(--text-main)] mb-[20px]  ">
          Trust & <span className="text-[var(--accent-primary)] relative inline-block">Decentralization<span className="absolute bottom-[-5px] left-[10%] w-[80%] h-2 bg-[var(--accent-secondary)] rounded-[10px] opacity-[0.5] shadow-[inset_2px_2px_5px_rgba(255,255,255,0.5)]"></span></span>
        </h2>
        <p className="text-center text-[var(--text-soft)] text-[1.1rem] max-w-[700px] mx-auto mb-[60px] font-medium leading-relaxed">
          Code is the contract. Math is the rule. There is no off-switch.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[40px]">
          <div className="clay-card p-[40px_30px] flex flex-col">
            <h3 className="text-[1.6rem]  font-extrabold text-[var(--accent-primary)] mb-[20px] flex items-center">
              <span className="w-3.5 h-3.5 rounded-full bg-[var(--accent-secondary)] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.6)] mr-3 shrink-0"></span>
              Zero Human Intervention
            </h3>
            <p className="text-[var(--text-muted)] text-[1.05rem] font-medium leading-relaxed">
              Ownership of the protocol guarantees absolute transparency. The entire ecosystem lives and breathes purely on the blockchain, executing rules exactly as written.
            </p>
          </div>

          <div className="clay-card p-[40px_30px] flex flex-col">
            <h3 className="text-[1.6rem]  font-extrabold text-[var(--accent-primary)] mb-[20px] flex items-center">
              <span className="w-3.5 h-3.5 rounded-full bg-[var(--accent-secondary)] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.6)] mr-3 shrink-0"></span>
              Strict Scarcity
            </h3>
            <p className="text-[var(--text-muted)] text-[1.05rem] font-medium leading-relaxed">
              Built on a simple principle: true value comes from scarcity. We enforce a strictly limited, fixed supply of 6,000,000 i6 tokens to create a highly rare digital asset.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="reveal-section px-[5%] py-[80px] max-w-[1200px] mx-auto w-full">
        <h2 className="text-[2.5rem] sm:text-[3.2rem] font-extrabold text-center text-[var(--text-main)] mb-[20px]  ">
          How <span className="text-[var(--accent-primary)] relative inline-block">It Works<span className="absolute bottom-[-5px] left-[10%] w-[80%] h-2 bg-[var(--accent-secondary)] rounded-[10px] opacity-[0.5] shadow-[inset_2px_2px_5px_rgba(255,255,255,0.5)]"></span></span>
        </h2>
        <p className="text-center text-[var(--text-soft)] text-[1.1rem] max-w-[700px] mx-auto mb-[60px] font-medium leading-relaxed">
          Three steps from wallet to fully participating in the i6 ecosystem.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[30px]">
          <div className="clay-card p-[36px_28px] flex flex-col">
            <div className="w-[56px] h-[56px] rounded-[18px] bg-gradient-to-r from-[var(--accent-secondary)] to-[var(--accent-primary)] text-white text-[1.7rem]  font-extrabold flex items-center justify-center shadow-md shadow-[rgba(37,99,235,0.3)] mb-[20px]">
              1
            </div>
            <h3 className="text-[1.4rem]  font-bold text-[var(--text-main)] mb-[12px] ">Connect Your Wallet</h3>
            <p className="text-[var(--text-muted)] font-medium leading-relaxed">
              Use any standard Web3 wallet — MetaMask, Trust Wallet, or others. No KYC, no permissions, no gatekeepers.
            </p>
          </div>

          <div className="clay-card p-[36px_28px] flex flex-col">
            <div className="w-[56px] h-[56px] rounded-[18px] bg-gradient-to-r from-[var(--accent-secondary)] to-[var(--accent-primary)] text-white text-[1.7rem]  font-extrabold flex items-center justify-center shadow-md shadow-[rgba(37,99,235,0.3)] mb-[20px]">
              2
            </div>
            <h3 className="text-[1.4rem]  font-bold text-[var(--text-main)] mb-[12px] ">Activate Your Account</h3>
            <p className="text-[var(--text-muted)] font-medium leading-relaxed">
              Maintain an active account of $100 or more through the whitelisted ecosystem contracts to unlock working income eligibility.
            </p>
          </div>

          <div className="clay-card p-[36px_28px] flex flex-col">
            <div className="w-[56px] h-[56px] rounded-[18px] bg-gradient-to-r from-[var(--accent-secondary)] to-[var(--accent-primary)] text-white text-[1.7rem]  font-extrabold flex items-center justify-center shadow-md shadow-[rgba(37,99,235,0.3)] mb-[20px]">
              3
            </div>
            <h3 className="text-[1.4rem]  font-bold text-[var(--text-main)] mb-[12px] ">Earn & Participate</h3>
            <p className="text-[var(--text-muted)] font-medium leading-relaxed">
              Engage with the protocol's organic yield model. All rewards are distributed directly on-chain through the i6 smart ecosystem.
            </p>
          </div>
        </div>
      </section>

      {/* Core Ecosystem */}
      <section id="ecosystem" className="reveal-section px-[5%] py-[80px] max-w-[1200px] mx-auto w-full">
        <h2 className="text-[2.5rem] sm:text-[3.2rem] font-extrabold text-center text-[var(--text-main)] mb-[20px]  ">
          Core <span className="text-[var(--accent-primary)] relative inline-block">Ecosystem<span className="absolute bottom-[-5px] left-[10%] w-[80%] h-2 bg-[var(--accent-secondary)] rounded-[10px] opacity-[0.5] shadow-[inset_2px_2px_5px_rgba(255,255,255,0.5)]"></span></span>
        </h2>
        <p className="text-center text-[var(--text-soft)] text-[1.1rem] max-w-[700px] mx-auto mb-[60px] font-medium leading-relaxed">
          A self-sustaining architecture built around three pillars of decentralized participation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[40px]">
          <div className="clay-card p-[40px_30px] flex flex-col">
            <h3 className="text-[1.6rem]  font-extrabold text-[var(--accent-primary)] mb-[20px] flex items-center">
              <span className="w-3.5 h-3.5 rounded-full bg-[var(--accent-secondary)] shadow-sm mr-3 shrink-0"></span>
              Decentralized Yield
            </h3>
            <p className="text-[var(--text-muted)] text-[1.05rem] font-medium leading-relaxed">
              By interacting with our whitelisted ecosystem contracts, long-term participants can engage in strategic yields powered by organic network activity, completely free from central points of failure.
            </p>
          </div>

          <div className="clay-card p-[40px_30px] flex flex-col">
            <h3 className="text-[1.6rem]  font-extrabold text-[var(--accent-primary)] mb-[20px] flex items-center">
              <span className="w-3.5 h-3.5 rounded-full bg-[var(--accent-secondary)] shadow-sm mr-3 shrink-0"></span>
              Working Income
            </h3>
            <p className="text-[var(--text-muted)] text-[1.05rem] font-medium leading-relaxed">
              Users must maintain an active account of $100 or more to be eligible to receive any working income or affiliate rewards distributed directly through the Infinity Six smart ecosystem.
            </p>
          </div>

          <div className="clay-card p-[40px_30px] flex flex-col">
            <h3 className="text-[1.6rem]  font-extrabold text-[var(--accent-primary)] mb-[20px] flex items-center">
              <span className="w-3.5 h-3.5 rounded-full bg-[var(--accent-secondary)] shadow-sm mr-3 shrink-0"></span>
              Global Reach
            </h3>
            <p className="text-[var(--text-muted)] text-[1.05rem] font-medium leading-relaxed">
              Designed to be borderless. Anyone with a Web3 wallet can interact with the i6 architecture, unlocking a new standard of decentralized finance for contract workers and independent communities.
            </p>
          </div>
        </div>
      </section>

      {/* Verified Contract Mechanics */}
      <section id="mechanics" className="reveal-section px-[5%] py-[80px] max-w-[1200px] mx-auto w-full">
        <h2 className="text-[2.5rem] sm:text-[3.2rem] font-extrabold text-center text-[var(--text-main)] mb-[20px]  ">
          Verified <span className="text-[var(--accent-primary)] relative inline-block">Mechanics<span className="absolute bottom-[-5px] left-[10%] w-[80%] h-2 bg-[var(--accent-secondary)] rounded-[10px] opacity-[0.5] shadow-[inset_2px_2px_5px_rgba(255,255,255,0.5)]"></span></span>
        </h2>
        <p className="text-center text-[var(--text-soft)] text-[1.1rem] max-w-[700px] mx-auto mb-[60px] font-medium leading-relaxed">
          Hardcoded rules that prevent manipulation and protect long-term holders.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[40px]">
          <div className="clay-card p-[40px_30px] flex flex-col">
            <h3 className="text-[1.6rem]  font-extrabold text-[var(--accent-primary)] mb-[20px] flex items-center">
              <span className="w-3.5 h-3.5 rounded-full bg-[var(--accent-secondary)] shadow-sm mr-3 shrink-0"></span>
              180-Day DEX Lock
            </h3>
            <p className="text-[var(--text-muted)] text-[1.05rem] font-medium leading-relaxed">
              To ensure a stable ecosystem and prevent market manipulation, standard public buying on the primary DEX pair is hardcoded to be locked for the first 180 days after deployment.
            </p>
          </div>

          <div className="clay-card p-[40px_30px] flex flex-col">
            <h3 className="text-[1.6rem]  font-extrabold text-[var(--accent-primary)] mb-[20px] flex items-center">
              <span className="w-3.5 h-3.5 rounded-full bg-[var(--accent-secondary)] shadow-sm mr-3 shrink-0"></span>
              Dynamic Minting
            </h3>
            <p className="text-[var(--text-muted)] text-[1.05rem] font-medium leading-relaxed">
              Tokens are dynamically minted purely based on system withdrawal events. The protocol uses real-time spot price metrics to calculate and mint the exact token value required.
            </p>
          </div>

          <div className="clay-card p-[40px_30px] flex flex-col">
            <h3 className="text-[1.6rem]  font-extrabold text-[var(--accent-primary)] mb-[20px] flex items-center">
              <span className="w-3.5 h-3.5 rounded-full bg-[var(--accent-secondary)] shadow-sm mr-3 shrink-0"></span>
              Whitelisted Routes
            </h3>
            <p className="text-[var(--text-muted)] text-[1.05rem] font-medium leading-relaxed">
              During the locked phase, only approved and audited ecosystem contracts can facilitate the distribution of i6, ensuring safe and structured protocol growth.
            </p>
          </div>
        </div>
      </section>

      {/* Security & Audit */}
      <section id="security" className="reveal-section px-[5%] py-[80px] max-w-[1200px] mx-auto w-full">
        <h2 className="text-[2.5rem] sm:text-[3.2rem] font-extrabold text-center text-[var(--text-main)] mb-[20px]  ">
          Security & <span className="text-[var(--accent-primary)] relative inline-block">Transparency<span className="absolute bottom-[-5px] left-[10%] w-[80%] h-2 bg-[var(--accent-secondary)] rounded-[10px] opacity-[0.5] shadow-[inset_2px_2px_5px_rgba(255,255,255,0.5)]"></span></span>
        </h2>
        <p className="text-center text-[var(--text-soft)] text-[1.1rem] max-w-[700px] mx-auto mb-[60px] font-medium leading-relaxed">
          Every transaction, every rule, every token movement is verifiable on-chain.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-[24px]">
          <div className="clay-card p-[30px_22px] text-center flex flex-col items-center">
            <div className="w-[60px] h-[60px] rounded-[18px] bg-[var(--surface-tint)] text-[var(--accent-primary)] flex items-center justify-center mb-4">
              <Shield className="w-7 h-7" />
            </div>
            <h4 className="text-[1.1rem]  font-bold text-[var(--text-main)] mb-2 ">Verified Source</h4>
            <p className="text-[0.95rem] text-[var(--text-soft)] font-medium">Smart contract source code is fully published and verified on BscScan.</p>
          </div>

          <div className="clay-card p-[30px_22px] text-center flex flex-col items-center">
            <div className="w-[60px] h-[60px] rounded-[18px] bg-[var(--surface-tint)] text-[var(--accent-primary)] flex items-center justify-center mb-4">
              <TrendingUp className="w-7 h-7" />
            </div>
            <h4 className="text-[1.1rem]  font-bold text-[var(--text-main)] mb-2 ">Renounced Ownership</h4>
            <p className="text-[0.95rem] text-[var(--text-soft)] font-medium">Protocol ownership is structured for zero unilateral admin control.</p>
          </div>

          <div className="clay-card p-[30px_22px] text-center flex flex-col items-center">
            <div className="w-[60px] h-[60px] rounded-[18px] bg-[var(--surface-tint)] text-[var(--accent-primary)] flex items-center justify-center mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h4 className="text-[1.1rem]  font-bold text-[var(--text-main)] mb-2 ">DEX Lock</h4>
            <p className="text-[0.95rem] text-[var(--text-soft)] font-medium">Public buying hard-locked 180 days post-launch to prevent sniper bots.</p>
          </div>

          <div className="clay-card p-[30px_22px] text-center flex flex-col items-center">
            <div className="w-[60px] h-[60px] rounded-[18px] bg-[var(--surface-tint)] text-[var(--accent-primary)] flex items-center justify-center mb-4">
              <Layers className="w-7 h-7" />
            </div>
            <h4 className="text-[1.1rem]  font-bold text-[var(--text-main)] mb-2 ">Ecosystem Routes</h4>
            <p className="text-[0.95rem] text-[var(--text-soft)] font-medium">Only audited ecosystem contracts can distribute i6 during locked phase.</p>
          </div>
        </div>
      </section>

      {/* Strategic Roadmap */}
      <section id="roadmap" className="reveal-section px-[5%] py-[80px] max-w-[1200px] mx-auto w-full">
        <h2 className="text-[2.5rem] sm:text-[3.2rem] font-extrabold text-center text-[var(--text-main)] mb-[20px]  ">
          Strategic <span className="text-[var(--accent-primary)] relative inline-block">Roadmap<span className="absolute bottom-[-5px] left-[10%] w-[80%] h-2 bg-[var(--accent-secondary)] rounded-[10px] opacity-[0.5] shadow-[inset_2px_2px_5px_rgba(255,255,255,0.5)]"></span></span>
        </h2>
        <p className="text-center text-[var(--text-soft)] text-[1.1rem] max-w-[700px] mx-auto mb-[60px] font-medium leading-relaxed">
          Four phases that take Infinity Six from foundation to apex architecture.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[40px]">
          <div className="clay-card p-[40px_30px] flex flex-col">
            <h3 className="text-[1.4rem]  font-extrabold text-[var(--accent-primary)] mb-[15px] ">Phase 1: Foundation & Lock</h3>
            <p className="text-[var(--text-muted)] font-medium leading-relaxed">
              Deployment of the core i6 smart contract. Initiation of the 180-day DEX lock to prevent sniper bots. Community building begins with strict whitelisted ecosystem distributions.
            </p>
          </div>

          <div className="clay-card p-[40px_30px] flex flex-col">
            <h3 className="text-[1.4rem]  font-extrabold text-[var(--accent-primary)] mb-[15px] ">Phase 2: Global Expansion</h3>
            <p className="text-[var(--text-muted)] font-medium leading-relaxed">
              Integration with top-tier decentralized applications. Launch of specialized working-income dashboards for active network participants. Strategic marketing push to expand the i6 holder base.
            </p>
          </div>

          <div className="clay-card p-[40px_30px] flex flex-col">
            <h3 className="text-[1.4rem]  font-extrabold text-[var(--accent-primary)] mb-[15px] ">Phase 3: DEX Unlock & Discovery</h3>
            <p className="text-[var(--text-muted)] font-medium leading-relaxed">
              Conclusion of the 180-day lock period. Open trading commences on Decentralized Exchanges. True price discovery begins as the dynamic token economy fully activates alongside public market participation.
            </p>
          </div>

          <div className="clay-card p-[40px_30px] flex flex-col">
            <h3 className="text-[1.4rem]  font-extrabold text-[var(--accent-primary)] mb-[15px] ">Phase 4: Apex Architecture</h3>
            <p className="text-[var(--text-muted)] font-medium leading-relaxed">
              Implementation of advanced decentralized governance. Community-driven ecosystem upgrades and potential cross-chain bridges to bring the architecture of scarcity to other major networks.
            </p>
          </div>
        </div>
      </section>

      {/* Live Tokenomics */}
      <section id="tokenomics" className="reveal-section px-[5%] py-[80px] max-w-[1200px] mx-auto w-full">
        <h2 className="text-[2.5rem] sm:text-[3.2rem] font-extrabold text-center text-[var(--text-main)] mb-[20px]  ">
          Live <span className="text-[var(--accent-primary)] relative inline-block">Tokenomics<span className="absolute bottom-[-5px] left-[10%] w-[80%] h-2 bg-[var(--accent-secondary)] rounded-[10px] opacity-[0.5] shadow-[inset_2px_2px_5px_rgba(255,255,255,0.5)]"></span></span>
        </h2>
        <p className="text-center text-[var(--text-soft)] text-[1.1rem] max-w-[700px] mx-auto mb-[60px] font-medium leading-relaxed">
          A fixed-supply asset with hardcoded distribution rules.
        </p>

        <div className="clay-card p-[40px] grid grid-cols-1 md:grid-cols-[320px_1fr] gap-[50px] items-center">
          <div className="flex flex-col items-center gap-[16px] mx-auto">
            {/* Donut Chart */}
            <div className="relative w-[240px] h-[240px] rounded-full bg-[conic-gradient(var(--accent-primary)_0%_55%,var(--accent-secondary)_55%_78%,var(--accent-tertiary)_78%_92%,var(--donut-empty)_92%_100%)] shadow-md flex items-center justify-center">
              <div className="absolute inset-[26px] bg-[var(--clay-bg)] rounded-full shadow-[inset_3px_3px_8px_rgba(30,41,80,0.5)] flex flex-col items-center justify-center text-center z-10">
                <span className=" font-extrabold text-[1.9rem] text-[var(--accent-primary)] leading-none">6,000,000</span>
                <span className="text-[0.75rem] font-bold  text-[var(--text-muted)]  mt-1.5">Max Supply • i6</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-[18px]">
            {/* Legend Items */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[14px]">
              <div className="flex items-center gap-[14px]">
                <div className="w-[14px] h-[14px] rounded-[5px] shrink-0 bg-[var(--accent-primary)] shadow-sm"></div>
                <div className="flex flex-col">
                  <strong className="text-[1rem] text-[var(--text-main)] font-bold">Ecosystem Rewards</strong>
                  <span className="text-[0.85rem] text-[var(--text-soft)]">Working income & affiliate distribution</span>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="h-[8px] bg-[var(--bar-track)] rounded-[10px] overflow-hidden w-full sm:w-[150px] md:w-[220px]">
                  <div className="h-full bg-[var(--accent-primary)] rounded-[10px]" style={{ width: "55%" }}></div>
                </div>
                <div className=" font-extrabold text-[1.1rem] text-[var(--accent-primary)] w-[48px] text-right">55%</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[14px]">
              <div className="flex items-center gap-[14px]">
                <div className="w-[14px] h-[14px] rounded-[5px] shrink-0 bg-[var(--accent-secondary)] shadow-sm"></div>
                <div className="flex flex-col">
                  <strong className="text-[1rem] text-[var(--text-main)] font-bold">Liquidity & DEX</strong>
                  <span className="text-[0.85rem] text-[var(--text-soft)]">Locked liquidity pool reserves</span>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="h-[8px] bg-[var(--bar-track)] rounded-[10px] overflow-hidden w-full sm:w-[150px] md:w-[220px]">
                  <div className="h-full bg-[var(--accent-secondary)] rounded-[10px]" style={{ width: "23%" }}></div>
                </div>
                <div className=" font-extrabold text-[1.1rem] text-[var(--accent-primary)] w-[48px] text-right">23%</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[14px]">
              <div className="flex items-center gap-[14px]">
                <div className="w-[14px] h-[14px] rounded-[5px] shrink-0 bg-[var(--accent-tertiary)] shadow-sm"></div>
                <div className="flex flex-col">
                  <strong className="text-[1rem] text-[var(--text-main)] font-bold">Treasury & Operations</strong>
                  <span className="text-[0.85rem] text-[var(--text-soft)]">Protocol development & growth</span>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="h-[8px] bg-[var(--bar-track)] rounded-[10px] overflow-hidden w-full sm:w-[150px] md:w-[220px]">
                  <div className="h-full bg-[var(--accent-tertiary)] rounded-[10px]" style={{ width: "14%" }}></div>
                </div>
                <div className=" font-extrabold text-[1.1rem] text-[var(--accent-primary)] w-[48px] text-right">14%</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[14px]">
              <div className="flex items-center gap-[14px]">
                <div className="w-[14px] h-[14px] rounded-[5px] shrink-0 bg-[var(--donut-empty)] shadow-sm"></div>
                <div className="flex flex-col">
                  <strong className="text-[1rem] text-[var(--text-main)] font-bold">Community Reserve</strong>
                  <span className="text-[0.85rem] text-[var(--text-soft)]">Long-term contributor allocation</span>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="h-[8px] bg-[var(--bar-track)] rounded-[10px] overflow-hidden w-full sm:w-[150px] md:w-[220px]">
                  <div className="h-full bg-[var(--donut-empty)] rounded-[10px]" style={{ width: "8%" }}></div>
                </div>
                <div className=" font-extrabold text-[1.1rem] text-[var(--accent-primary)] w-[48px] text-right">8%</div>
              </div>
            </div>

            {/* Token Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-[14px] mt-[30px]">
              <div className="bg-[var(--surface-soft)] p-[14px_18px] rounded-[18px] flex flex-col">
                <span className="text-[0.75rem] font-bold text-[var(--text-soft)]  ">Ticker</span>
                <strong className="text-[1.05rem] text-[var(--text-main)] font-bold">i6</strong>
              </div>
              <div className="bg-[var(--surface-soft)] p-[14px_18px] rounded-[18px] flex flex-col">
                <span className="text-[0.75rem] font-bold text-[var(--text-soft)]  ">Chain</span>
                <strong className="text-[1.05rem] text-[var(--text-main)] font-bold">BNB Smart Chain</strong>
              </div>
              <div className="bg-[var(--surface-soft)] p-[14px_18px] rounded-[18px] flex flex-col col-span-2 sm:col-span-1">
                <span className="text-[0.75rem] font-bold text-[var(--text-soft)]  ">Minting</span>
                <strong className="text-[1.05rem] text-[var(--text-main)] font-bold">Dynamic</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* On-Chain Telemetry */}
      <section id="onchain" className="reveal-section px-[5%] py-[80px] max-w-[1200px] mx-auto w-full">
        <h2 className="text-[2.5rem] sm:text-[3.2rem] font-extrabold text-center text-[var(--text-main)] mb-[20px]  ">
          On-Chain <span className="text-[var(--accent-primary)] relative inline-block">Telemetry<span className="absolute bottom-[-5px] left-[10%] w-[80%] h-2 bg-[var(--accent-secondary)] rounded-[10px] opacity-[0.5] shadow-[inset_2px_2px_5px_rgba(255,255,255,0.5)]"></span></span>
        </h2>
        <p className="text-center text-[var(--text-soft)] text-[1.1rem] max-w-[700px] mx-auto mb-[40px] font-medium leading-relaxed">
          Real-time data pulled directly from BNB Smart Chain — no middleman, no API key.
        </p>

        {/* Live i6 Token Market Price Card */}
        <div className="max-w-[800px] mx-auto mb-6">
          <I6PriceCard />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px] max-w-[800px] mx-auto">
          <div className="clay-card p-[26px_22px] flex flex-col gap-[10px]">
            <span className="text-[0.7rem] font-extrabold text-[var(--text-soft)]  ">Contract</span>
            <div className=" text-[1rem] font-bold text-[var(--accent-primary)] truncate">{CONTRACT_ADDR}</div>
            <a href={`https://bscscan.com/address/${CONTRACT_ADDR}#code`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-[4px] text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] text-[0.78rem] font-bold   mt-auto pt-[6px]">
              View on BscScan <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="clay-card p-[26px_22px] flex flex-col gap-[10px]">
            <span className="text-[0.7rem] font-extrabold text-[var(--text-soft)]  ">Liquidity Pair</span>
            <div className=" text-[1rem] font-bold text-[var(--text-main)] truncate">
              {pairAddress ? `${pairAddress.slice(0, 6)}…${pairAddress.slice(-4)}` : "Not Set"}
            </div>
            {pairAddress && (
              <a href={`https://bscscan.com/address/${pairAddress}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-[4px] text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] text-[0.78rem] font-bold   mt-auto pt-[6px]">
                View on BscScan <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        <div className="max-w-[800px] mx-auto mt-[28px] p-[14px_22px] bg-[var(--clay-bg)] border border-[var(--border-soft)] rounded-[18px] shadow-sm flex justify-center items-center gap-[12px] flex-wrap text-[0.85rem]">
          <span className={`inline-flex items-center gap-[8px] font-bold ${connectionClass === "connecting" ? "text-[var(--text-soft)]" : connectionClass === "error" ? "text-[var(--accent-warn)]" : "text-[var(--accent-success)]"}`}>
            <span className={`w-2 h-2 rounded-full ${connectionClass === "connecting" ? "bg-[var(--text-soft)]" : connectionClass === "error" ? "bg-[var(--accent-warn)]" : "bg-[var(--accent-success)]"} ${connectionClass === "connecting" ? "animate-pulse" : "animate-[ping_1.5s_infinite]"}`}></span>
            {connectionStatus}
          </span>
        </div>
      </section>

      {/* Frequently Asked */}
      <section id="faq" className="reveal-section px-[5%] py-[80px] max-w-[1200px] mx-auto w-full">
        <h2 className="text-[2.5rem] sm:text-[3.2rem] font-extrabold text-center text-[var(--text-main)] mb-[20px]  ">
          Frequently <span className="text-[var(--accent-primary)] relative inline-block">Asked<span className="absolute bottom-[-5px] left-[10%] w-[80%] h-2 bg-[var(--accent-secondary)] rounded-[10px] opacity-[0.5] shadow-[inset_2px_2px_5px_rgba(255,255,255,0.5)]"></span></span>
        </h2>
        <p className="text-center text-[var(--text-soft)] text-[1.1rem] max-w-[700px] mx-auto mb-[60px] font-medium leading-relaxed">
          Common questions about the Infinity Six protocol.
        </p>

        <div className="max-w-[850px] mx-auto flex flex-col gap-[16px]">
          {faqData.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="clay-card overflow-hidden transition-all duration-300">
                <div 
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="p-[22px_28px] flex justify-between items-center cursor-pointer  font-bold text-[1.15rem] text-[var(--text-main)]  gap-[16px]"
                >
                  {item.q}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[1.2rem] transition-all duration-300 ${isOpen ? "bg-[var(--accent-primary)] text-white rotate-45" : "bg-[var(--surface-tint)] text-[var(--accent-primary)]"}`}>
                    +
                  </div>
                </div>
                <div className={`transition-all duration-300 ease-in-out px-[28px] overflow-hidden ${isOpen ? "max-h-[260px] pb-[24px]" : "max-h-0"}`}>
                  <p className="text-[var(--text-muted)] font-medium leading-relaxed">{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="reveal-section px-[5%] py-[60px] max-w-[1200px] mx-auto w-full">
        <div className="relative overflow-hidden p-[60px_50px] rounded-[40px] bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white text-center shadow-lg shadow-[var(--accent-glow)] flex flex-col items-center">
          <div className="absolute top-[-150px] right-[-100px] w-[400px] h-[400px] rounded-full bg-white/5 blur-2xl animate-[spin_50s_linear_infinite] pointer-events-none"></div>
          <div className="absolute bottom-[-120px] left-[-80px] w-[300px] h-[300px] rounded-full bg-white/5 blur-2xl animate-[spin_40s_linear_infinite_reverse] pointer-events-none"></div>
          
          <h2 className="text-[2.2rem] sm:text-[2.6rem]  font-extrabold mb-[16px] relative z-10 leading-tight ">Step Into the Architecture of Scarcity</h2>
          <p className="text-[1.15rem] max-w-[600px] mb-[30px] opacity-[0.95] font-medium leading-relaxed relative z-10">
            Join the Infinity Six ecosystem and become part of a fully on-chain, mathematically-driven decentralized economy.
          </p>
          <Link href="/register" className="clay-btn px-[40px] py-[16px] text-[1.1rem] no-underline relative z-10 bg-white text-[var(--accent-primary)] hover:bg-white hover:text-[var(--accent-primary)] hover:scale-[1.02] shadow-md shadow-black/15">
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-inner">
          <div className="footer-grid">
            
            <div className="footer-brand">
              <img src="/i6-logo.webp" alt="Infinity Six Logo" className="footer-logo" />
              <h3 className="footer-tagline">The Architecture of Scarcity</h3>
              <p className="footer-desc">
                An unstoppable ERC20 protocol governed by mathematics, not management. Strictly 6,000,000 tokens. Fully on-chain. Zero human admin control.
              </p>
              
              <div className="footer-social">
                <a href="https://x.com/infinitysix" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" title="X">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="https://t.me/infinitysix" target="_blank" rel="noopener noreferrer" aria-label="Telegram" title="Telegram">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.464.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.061 3.345-.48.329-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </a>
                <a href="https://discord.gg/infinitysix" target="_blank" rel="noopener noreferrer" aria-label="Discord" title="Discord">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </a>
                <a href={`https://bscscan.com/address/${CONTRACT_ADDR}`} target="_blank" rel="noopener noreferrer" aria-label="BscScan" title="BscScan">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M7 12l3 3 7-7"/></svg>
                </a>
              </div>
            </div>

            <div className="footer-col">
              <h4>PROTOCOL</h4>
              <ul>
                <li><a href="#about">About</a></li>
                <li><a href="#how">How It Works</a></li>
                <li><a href="#ecosystem">Ecosystem</a></li>
                <li><a href="#mechanics">Mechanics</a></li>
                <li><a href="#tokenomics">Tokenomics</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>RESOURCES</h4>
              <ul>
                <li><a href="#onchain">Live Data</a></li>
                <li><a href="#security">Security</a></li>
                <li><a href={`https://bscscan.com/address/${CONTRACT_ADDR}#code`} target="_blank" rel="noopener noreferrer">Smart Contract</a></li>
                <li><a href="https://whitepaper.infinitysix.online/" target="_blank" rel="noopener noreferrer">Whitepaper</a></li>
                <li><a href="#faq">FAQ</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>ACCOUNT</h4>
              <ul>
                <li><Link href="/login">Sign In</Link></li>
                <li><Link href="/register">Create Account</Link></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Privacy Policy</a></li>
              </ul>
            </div>

          </div>

          <div className="footer-bottom">
            <p className="copyright">© 2026 Infinity Six Protocol. All rights reserved.</p>
            <p className="disclaimer">Cryptocurrency carries inherent risk. This is not financial advice.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
