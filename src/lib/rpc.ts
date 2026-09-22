import { ethers } from "ethers";
import { requireEnv } from "./env";

const globalForProvider = globalThis as unknown as { bscProvider?: ethers.JsonRpcProvider };

export function getProvider(): ethers.JsonRpcProvider {
    if (!globalForProvider.bscProvider) {
        const rpcUrl = requireEnv("BSC_RPC_URL");
        const chainId = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID, 10) : undefined;

        // Without a timeout a stalled/rate-limited RPC response hangs the request forever
        // instead of just being slow — fail fast so callers' own retry/fallback paths can run.
        const fetchRequest = new ethers.FetchRequest(rpcUrl);
        fetchRequest.timeout = 10_000;

        globalForProvider.bscProvider = new ethers.JsonRpcProvider(
            fetchRequest,
            chainId,
            chainId ? { staticNetwork: true } : undefined
        );
    }
    return globalForProvider.bscProvider;
}

const globalForLogs = globalThis as unknown as { logsProvider?: ethers.JsonRpcProvider };

export function getLogsProvider(): ethers.JsonRpcProvider {
    if (!globalForLogs.logsProvider) {
        const url = process.env.BSC_LOGS_RPC_URL || "https://56.rpc.thirdweb.com";
        const fetchRequest = new ethers.FetchRequest(url);
        fetchRequest.timeout = 10_000;
        globalForLogs.logsProvider = new ethers.JsonRpcProvider(fetchRequest, 56, { staticNetwork: true });
    }
    return globalForLogs.logsProvider;
}

