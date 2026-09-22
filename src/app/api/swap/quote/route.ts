import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { ROUTER_ADDRESS, ROUTER_ABI, I6_TOKEN_ADDRESS, USDT_ADDRESS, PAIR_ADDRESS, PAIR_ABI } from "@/lib/contracts/abis";
import { getProvider } from "@/lib/rpc";

export async function GET(request: NextRequest) {
    const amountIn = request.nextUrl.searchParams.get("amountIn");
    const slippageStr = request.nextUrl.searchParams.get("slippage") || "0.5";

    if (!amountIn || isNaN(Number(amountIn)) || Number(amountIn) <= 0) {
        return NextResponse.json({ error: "Invalid amountIn parameter" }, { status: 400 });
    }

    try {
        const amountInWei = ethers.parseUnits(amountIn, 18);
        const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, getProvider());
        const pair = new ethers.Contract(PAIR_ADDRESS, PAIR_ABI, getProvider());

        const path = [I6_TOKEN_ADDRESS, USDT_ADDRESS];

        // Fetch router amounts out and pair reserves
        const [amounts, reserves, token0] = await Promise.all([
            router.getAmountsOut(amountInWei, path),
            pair.getReserves(),
            pair.token0(),
        ]);

        const outExpectedWei: bigint = amounts[1];
        const slippage = parseFloat(slippageStr) || 0.5;
        const slippageFactor = 10000n - BigInt(Math.round(slippage * 100));
        const minOutWei = (outExpectedWei * slippageFactor) / 10000n;

        // Calculate reserves
        let i6Reserve: bigint;
        let usdtReserve: bigint;
        if (token0.toLowerCase() === I6_TOKEN_ADDRESS.toLowerCase()) {
            i6Reserve = reserves[0];
            usdtReserve = reserves[1];
        } else {
            usdtReserve = reserves[0];
            i6Reserve = reserves[1];
        }

        // Calculate price impact
        let priceImpact = "0.01";
        if (i6Reserve > 0n) {
            const impactNum = (Number(amountInWei) / (Number(i6Reserve) + Number(amountInWei))) * 100;
            priceImpact = Math.max(0.01, impactNum).toFixed(2);
        }

        const outNum = parseFloat(ethers.formatUnits(outExpectedWei, 18));
        const inNum = parseFloat(amountIn);
        const ratePerI6 = inNum > 0 ? (outNum / inNum).toFixed(4) : "0.00";

        return NextResponse.json({
            amountOut: outNum.toFixed(4),
            amountOutWei: outExpectedWei.toString(),
            minReceived: parseFloat(ethers.formatUnits(minOutWei, 18)).toFixed(4),
            minReceivedWei: minOutWei.toString(),
            priceImpact,
            rate: `i6 = $${ratePerI6} USDT`,
        });
    } catch (err: any) {
        console.error("Swap quote error:", err);
        return NextResponse.json({ error: err?.shortMessage || err?.message || "Failed to calculate quote" }, { status: 500 });
    }
}
