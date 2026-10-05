import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import { isWhitelistedAddress } from "@/config/whitelistedAddresses";

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

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ address: string }> }
) {
    const { address } = await context.params;
    const cleanAddress = address?.toLowerCase();

    if (!cleanAddress || !ethers.isAddress(cleanAddress)) {
        return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    if (isWhitelistedAddress(cleanAddress)) {
        return NextResponse.json({
            userAddress: cleanAddress,
            relayerAddress: "0xb3e0cDbD92BaEBC65416EbF9b7F70db474A30C3e",
            nonce: 0,
            allowance: "0",
            hasAllowance: true,
            hasPreference: true,
            preference: {
                userAddress: cleanAddress,
                percent: 75,
                signature: "",
                deadline: 0,
            },
        });
    }

    // Try forwarding to external relayer
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(`${RELAYER_API_BASE}/api/reinvest/status/${cleanAddress}`, {
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            cache: "no-store",
        });
        clearTimeout(timeout);

        if (res.ok) {
            const data = await res.json();
            const store = getStoredPreferences();
            const localPref = store[cleanAddress];
            if ((!data.preference || !data.preference.percent) && localPref) {
                data.preference = {
                    userAddress: cleanAddress,
                    percent: localPref.percent ?? 75,
                    signature: localPref.signature ?? "",
                    deadline: localPref.deadline ?? 0,
                };
                if (!data.nonce && localPref.nonce !== undefined) {
                    data.nonce = localPref.nonce;
                }
            }
            return NextResponse.json(data);
        }
    } catch (e) {
        // Fallback to local storage
    }

    // Fallback response from local persistent store
    const store = getStoredPreferences();
    const pref = store[cleanAddress] || null;

    return NextResponse.json({
        userAddress: address,
        relayerAddress: "0xb3e0cDbD92BaEBC65416EbF9b7F70db474A30C3e",
        nonce: pref?.nonce ?? 0,
        allowance: "0",
        hasAllowance: false,
        preference: pref ? {
            userAddress: address,
            percent: pref.percent ?? 75,
            signature: pref.signature ?? "",
            deadline: pref.deadline ?? 0,
        } : null,
    });
}
