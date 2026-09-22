import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { getUserInfo } from "@/lib/contracts/reader";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    const { address } = await params;
    if (!ethers.isAddress(address)) {
        return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }
    const data = await getUserInfo(address.toLowerCase());
    return NextResponse.json(data);
}
