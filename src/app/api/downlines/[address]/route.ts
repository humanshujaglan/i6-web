import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import {
    getCachedDownline,
    revalidateAndScanDownline,
    getCachedNodeChildren,
    revalidateNodeChildren,
    warmChildrenTree,
} from "@/lib/contracts/reader-downlines";
import { getUserInfo, getLastWithdrawTime } from "@/lib/contracts/reader";

export const maxDuration = 60;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    const { address } = await params;
    if (!ethers.isAddress(address)) {
        return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    const type = request.nextUrl.searchParams.get("type"); // "children" | scan (default)
    const mode = request.nextUrl.searchParams.get("mode"); // "cached" | "live"

    try {
        // Live user-detail snapshot for the tree node's detail sheet
        if (type === "detail") {
            const [user, lastWithdrawTime] = await Promise.all([
                getUserInfo(address),
                getLastWithdrawTime(address),
            ]);
            return NextResponse.json({ source: "live", data: { ...user, lastWithdrawTime }, found: true });
        }

        // Background prefetch: warms the whole subtree's children cache so later expand-clicks are instant
        if (type === "warmtree") {
            await warmChildrenTree(address.toLowerCase());
            return NextResponse.json({ source: "live", warmed: true });
        }

        // Single-level, on-demand children of :address — used by the tree visualizer's expand-on-click
        if (type === "children") {
            if (mode === "cached") {
                const cached = await getCachedNodeChildren(address.toLowerCase());
                if (cached === null) {
                    return NextResponse.json({ source: "cache", data: null, found: false });
                }
                return NextResponse.json({ source: "cache", data: cached, found: true });
            }

            const result = await revalidateNodeChildren(address.toLowerCase());
            return NextResponse.json({
                source: "live",
                data: result.data,
                updated: result.isUpdated,
                found: true,
            });
        }

        const depthParam = request.nextUrl.searchParams.get("depth");
        const depth = depthParam ? parseInt(depthParam, 10) : 1;
        if (isNaN(depth)) {
            return NextResponse.json({ error: "Invalid depth" }, { status: 400 });
        }

        if (mode === "cached") {
            const cached = await getCachedDownline(address.toLowerCase(), depth);
            if (cached === null) {
                return NextResponse.json({ source: "cache", data: null, found: false });
            }
            return NextResponse.json({ source: "cache", data: cached, found: true });
        }

        // Live mode / default: runs full scan, caches all intermediate levels without TTL, returns fresh data
        const result = await revalidateAndScanDownline(address.toLowerCase(), depth);
        return NextResponse.json({
            source: "live",
            data: result.data,
            updated: result.isUpdated,
            found: true,
        });
    } catch (err) {
        console.error("downlines route failed", err);
        return NextResponse.json({ error: "Upstream read failed" }, { status: 502 });
    }
}

