import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { getWalletState, getI6TokenState } from "@/lib/contracts/reader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    const { address } = await params;
    const spender = request.nextUrl.searchParams.get("spender");
    const token = request.nextUrl.searchParams.get("token") || "usdt";

    if (!ethers.isAddress(address) || !spender || !ethers.isAddress(spender)) {
        return NextResponse.json({ error: "Invalid address or spender" }, { status: 400 });
    }

    if (token.toLowerCase() === "i6") {
        const data = await getI6TokenState(address.toLowerCase(), spender.toLowerCase());
        return NextResponse.json(data);
    }

    const data = await getWalletState(address.toLowerCase(), spender.toLowerCase());
    return NextResponse.json(data);
}
