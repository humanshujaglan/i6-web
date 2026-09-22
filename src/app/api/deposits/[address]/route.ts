import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { getDepositHistory } from "@/lib/contracts/reader";

export const maxDuration = 30;
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    const { address } = await params;
    if (!ethers.isAddress(address)) {
        return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }
    try {
        const history = await getDepositHistory(address.toLowerCase());
        return NextResponse.json({ success: true, deposits: history });
    } catch (err) {
        console.error("deposits route failed", err);
        return NextResponse.json({ success: false, deposits: [] }, { status: 200 });
    }
}
