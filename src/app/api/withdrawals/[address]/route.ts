import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { getWithdrawalHistory } from "@/lib/contracts/reader";

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
        const history = await getWithdrawalHistory(address.toLowerCase());
        return NextResponse.json({ success: true, withdrawals: history });
    } catch (err) {
        console.error("withdrawals route failed", err);
        return NextResponse.json({ success: false, withdrawals: [] }, { status: 200 });
    }
}
