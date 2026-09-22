import { NextResponse } from "next/server";
import { getTokenStats } from "@/lib/contracts/reader";

export async function GET() {
    const data = await getTokenStats();
    return NextResponse.json(data);
}
