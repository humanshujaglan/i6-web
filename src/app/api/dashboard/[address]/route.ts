import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { getDashboardAggregate } from "@/lib/contracts/reader";

export const maxDuration = 30;

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    const { address } = await params;
    if (!ethers.isAddress(address)) {
        return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }
    try {
        const data = await getDashboardAggregate(address.toLowerCase());
        return NextResponse.json(data);
    } catch (err) {
        console.error("dashboard route failed", err);
        return NextResponse.json({ error: "Upstream read failed" }, { status: 502 });
    }
}
