import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { getSwapQuote } from "@/lib/contracts/reader";

export async function GET(request: NextRequest) {
    const amount = request.nextUrl.searchParams.get("amount");
    const pathParam = request.nextUrl.searchParams.get("path");
    if (!amount || !pathParam) {
        return NextResponse.json({ error: "Missing amount or path" }, { status: 400 });
    }

    const path = pathParam.split(",").map((p) => p.toLowerCase());
    if (path.length === 0 || !path.every((p) => ethers.isAddress(p))) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    try {
        BigInt(amount);
    } catch {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const data = await getSwapQuote(amount, path);
    return NextResponse.json(data);
}
