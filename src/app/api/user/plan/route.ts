import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ethers } from "ethers";

interface PlanRecord {
    plan: "flexible" | "lockin";
    lockinDays?: number;
    timestamp: number;
}

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "user_plans.json");

function getStore(): Record<string, PlanRecord> {
    try {
        if (!fs.existsSync(filePath)) {
            return {};
        }
        const content = fs.readFileSync(filePath, "utf8");
        return JSON.parse(content || "{}");
    } catch (e) {
        console.error("Error reading user_plans.json", e);
        return {};
    }
}

function saveStore(data: Record<string, PlanRecord>) {
    try {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    } catch (e) {
        console.error("Error writing user_plans.json", e);
    }
}

export async function GET(request: NextRequest) {
    const address = request.nextUrl.searchParams.get("address")?.toLowerCase();
    if (!address || !ethers.isAddress(address)) {
        return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    const store = getStore();
    const record = store[address];

    if (record) {
        return NextResponse.json(record);
    }

    return NextResponse.json({
        plan: "flexible",
        lockinDays: 252,
        timestamp: 0,
    });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const address = body?.address?.toLowerCase();
        const plan = body?.plan === "lockin" ? "lockin" : "flexible";
        const lockinDays = Number(body?.lockinDays) || 252;
        const timestamp = Number(body?.timestamp) || Date.now();

        if (!address || !ethers.isAddress(address)) {
            return NextResponse.json({ error: "Invalid address" }, { status: 400 });
        }

        const store = getStore();
        store[address] = {
            plan,
            lockinDays,
            timestamp,
        };
        saveStore(store);

        return NextResponse.json({ success: true, record: store[address] });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Failed to save plan" }, { status: 500 });
    }
}
