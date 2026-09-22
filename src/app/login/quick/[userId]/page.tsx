"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function QuickLoginPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params?.userId as string;

    useEffect(() => {
        if (userId) {
            // Replicate PHP session/cookie and localStorage wallet state setting
            document.cookie = `user_wallet=${userId}; path=/; max-age=86400; SameSite=Strict`;
            localStorage.setItem("user_wallet", userId);
            router.push("/dashboard");
        } else {
            router.push("/login");
        }
    }, [userId, router]);

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-color)", color: "var(--text-main)", fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 800 }}>
            <div style={{ textAlign: "center" }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: "2rem", marginBottom: "15px", color: "var(--brand-blue)" }}></i>
                <div>Entering Portal...</div>
            </div>
        </div>
    );
}
