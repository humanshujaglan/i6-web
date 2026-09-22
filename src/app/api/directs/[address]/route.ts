import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { getDirectsWithUserData } from "@/lib/contracts/reader";

export const maxDuration = 30;

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    const { address } = await params;
    if (!ethers.isAddress(address)) {
        return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }
    const data = await getDirectsWithUserData(address.toLowerCase());
    return NextResponse.json(data);
}
