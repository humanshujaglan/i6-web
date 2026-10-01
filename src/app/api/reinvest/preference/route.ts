import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ethers } from "ethers";

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "user_reinvest_preferences.json");
const RELAYER_API_BASE = process.env.NEXT_PUBLIC_RELAYER_API || "https://qtx.softricity.in";

function getStoredPreferences(): Record<string, any> {
    try {
        if (!fs.existsSync(filePath)) return {};
        const content = fs.readFileSync(filePath, "utf8");
        return JSON.parse(content || "{}");
    } catch {
        return {};
    }
}

function saveStoredPreferences(data: Record<string, any>) {
    try {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    } catch (e) {
        console.error("Failed to save user_reinvest_preferences.json", e);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const userAddress = body?.userAddress?.toLowerCase();
        const percent = Number(body?.percent) || 75;
        const nonce = Number(body?.nonce) || 0;
        const deadline = Number(body?.deadline) || Math.floor(Date.now() / 1000) + 3600;
        const signature = body?.signature || "";

        if (!userAddress || !ethers.isAddress(userAddress)) {
            return NextResponse.json({ error: "Invalid user address" }, { status: 400 });
        }

        // 1. Save to local store
        const store = getStoredPreferences();
        store[userAddress] = {
            userAddress,
            percent,
            nonce,
            deadline,
            signature,
            updatedAt: Date.now(),
        };
        saveStoredPreferences(store);

        // 2. Forward to external relayer if available
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4000);

            const relayerRes = await fetch(`${RELAYER_API_BASE}/api/reinvest/preference`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userAddress,
                    percent,
                    nonce,
                    deadline,
                    signature,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (relayerRes.ok) {
                const resData = await relayerRes.json();
                return NextResponse.json(resData);
            }
        } catch (e) {
            // Relayer forward failed or timed out, but local save succeeded
        }

        return NextResponse.json({
            success: true,
            preference: {
                userAddress,
                percent,
                signature,
                deadline,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Failed to save preference" }, { status: 500 });
    }
}
