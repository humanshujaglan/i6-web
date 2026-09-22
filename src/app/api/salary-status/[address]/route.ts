import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { getPendingSalary, getDirectsWithUserData, getUserInfo } from "@/lib/contracts/reader";

export const maxDuration = 30;

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    const { address } = await params;
    if (!ethers.isAddress(address)) {
        return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }
    const normalised = address.toLowerCase();
    const [user, pendingSalary, directs] = await Promise.all([
        getUserInfo(normalised),
        getPendingSalary(normalised),
        getDirectsWithUserData(normalised),
    ]);

    const directDetails = directs.map((d) => ({
        address: d.address,
        totalBusiness: (BigInt(d.user.totalDownlineBusiness || "0") + BigInt(d.user.totalDeposits || "0")).toString(),
        freshBusiness: d.user.freshBusiness,
        totalDeposits: d.user.totalDeposits,
        totalDownlineBusiness: d.user.totalDownlineBusiness,
        user: d.user,
    }));

    return NextResponse.json({ 
        user,
        pendingSalary, 
        directs,
        directDetails 
    });
}
