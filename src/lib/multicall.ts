import { ethers } from "ethers";

export const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

const MULTICALL3_ABI = [
    "function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)",
];

export interface MulticallRequest {
    target: string;
    abi: ethers.InterfaceAbi;
    functionName: string;
    args?: unknown[];
}

export async function multicall<T = unknown>(
    provider: ethers.Provider,
    calls: MulticallRequest[]
): Promise<(T | null)[]> {
    if (calls.length === 0) return [];

    const multicallContract = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);
    const interfaceCache = new Map<ethers.InterfaceAbi, ethers.Interface>();
    const interfaces = calls.map((c) => {
        let iface = interfaceCache.get(c.abi);
        if (!iface) {
            iface = new ethers.Interface(c.abi);
            interfaceCache.set(c.abi, iface);
        }
        return iface;
    });

    const encodedCalls = calls.map((c, i) => ({
        target: c.target,
        allowFailure: true,
        callData: interfaces[i].encodeFunctionData(c.functionName, c.args ?? []),
    }));

    const results: { success: boolean; returnData: string }[] =
        await multicallContract.aggregate3.staticCall(encodedCalls);

    return results.map((r, i) => {
        if (!r.success) return null;
        const decoded = interfaces[i].decodeFunctionResult(calls[i].functionName, r.returnData);
        return (decoded.length === 1 ? decoded[0] : decoded) as T;
    });
}
