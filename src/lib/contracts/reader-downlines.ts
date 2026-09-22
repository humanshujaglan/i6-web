import { ethers } from "ethers";
import { getProvider } from "../rpc";
import { multicall } from "../multicall";
import { getCache, setCache, msetCache } from "../cache";
import { getUserInfo } from "./reader";
import { MAIN_CONTRACT_ADDRESS, MAIN_CONTRACT_ABI } from "./abis";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export interface DownlineMemberDTO {
    level: number;
    address: string;
    deposit: number;
    teamVolume: number;
    dailyIncome: number;
    isQualified: boolean;
    reqDirects: number;
    roiPercent: number;
    status: { text: string; badgeClass: string; iconClass: string };
    referrer: string;
}

function formatDownlineMembers(
    level: number,
    addresses: string[],
    rawUsers: any[],
    viewerDirects: number,
    viewerCapped: boolean
): DownlineMemberDTO[] {
    const gathered: DownlineMemberDTO[] = [];
    for (let i = 0; i < addresses.length; i++) {
        const u = rawUsers[i];
        if (!u) continue;

        const deposit = parseFloat(ethers.formatUnits(u[0], 18));
        const teamVolume = parseFloat(ethers.formatUnits(u[6], 18));
        const rawRate = Number(u[4]);
        const roiPercent = rawRate === 0 ? 5 : rawRate;

        const dailyRoiGenerated = (deposit * roiPercent) / 1000;
        let levelPercent = 3;
        if (level === 1) levelPercent = 10;
        else if (level === 2) levelPercent = 5;
        else if (level === 3) levelPercent = 4;

        const dailyIncome = (dailyRoiGenerated * levelPercent) / 100;
        const reqDirects = Math.ceil(level / 2);
        const isQualified = viewerDirects >= reqDirects && !viewerCapped;
        const isCapped = Boolean(u[20]);
        const isActive = deposit > 0 && !isCapped;

        let statusText = "Inactive";
        let badgeClass = "badge-inactive";
        let iconClass = "";
        if (isCapped) {
            statusText = "Capped";
            badgeClass = "badge-capped";
            iconClass = "fas fa-ban";
        } else if (isActive) {
            statusText = "Active";
            badgeClass = "badge-active";
            iconClass = "fas fa-check";
        }

        gathered.push({
            level,
            address: addresses[i],
            deposit,
            teamVolume,
            dailyIncome,
            isQualified,
            reqDirects,
            roiPercent,
            status: { text: statusText, badgeClass, iconClass },
            referrer: u[19] || ZERO_ADDRESS,
        });
    }
    return gathered;
}

export async function getCachedDownline(address: string, depth: number): Promise<DownlineMemberDTO[] | null> {
    const depthNum = Math.min(Math.max(Math.floor(depth) || 1, 1), 40);
    return getCache<DownlineMemberDTO[]>(`downline:${address.toLowerCase()}:${depthNum}`);
}

export async function revalidateAndScanDownline(
    address: string,
    depth: number
): Promise<{ data: DownlineMemberDTO[]; cachedData: DownlineMemberDTO[] | null; isUpdated: boolean }> {
    const depthNum = Math.min(Math.max(Math.floor(depth) || 1, 1), 40);
    const normalizedAddr = address.toLowerCase();

    // Check existing cache for comparison
    const cachedData = await getCachedDownline(normalizedAddr, depthNum);

    const rootUser = await getUserInfo(address);
    const viewerDirects = Number(rootUser.directCount);
    const viewerCapped = rootUser.isCapped;

    let frontier: string[] = [address];
    let frontierUsersRaw: any[] | null = null;
    const levelResults: Record<number, DownlineMemberDTO[]> = {};

    for (let level = 1; level <= depthNum; level++) {
        if (frontier.length === 0) {
            levelResults[level] = [];
            continue;
        }

        let usersRaw = frontierUsersRaw;
        if (!usersRaw) {
            const userCalls = frontier.map((addr) => ({
                target: MAIN_CONTRACT_ADDRESS,
                abi: MAIN_CONTRACT_ABI,
                functionName: "users",
                args: [addr],
            }));
            usersRaw = await multicall<any>(getProvider(), userCalls);
        }

        const directsCalls: { parent: string; idx: number }[] = [];
        for (let i = 0; i < frontier.length; i++) {
            const u = usersRaw[i];
            if (!u) continue;
            const directCount = Number(u[2]);
            for (let idx = 0; idx < directCount; idx++) {
                directsCalls.push({ parent: frontier[i], idx });
            }
        }

        if (directsCalls.length === 0) {
            levelResults[level] = [];
            frontier = [];
            frontierUsersRaw = null;
            continue;
        }

        const childCalls = directsCalls.map((d) => ({
            target: MAIN_CONTRACT_ADDRESS,
            abi: MAIN_CONTRACT_ABI,
            functionName: "userDirects",
            args: [d.parent, d.idx],
        }));
        const childAddresses = (await multicall<string>(getProvider(), childCalls)).filter(
            (a): a is string => a !== null && a !== ZERO_ADDRESS
        );

        if (childAddresses.length === 0) {
            levelResults[level] = [];
            frontier = [];
            frontierUsersRaw = null;
            continue;
        }

        const childUserCalls = childAddresses.map((addr) => ({
            target: MAIN_CONTRACT_ADDRESS,
            abi: MAIN_CONTRACT_ABI,
            functionName: "users",
            args: [addr],
        }));
        const childUsersRaw = await multicall<any>(getProvider(), childUserCalls);

        const levelMembers = formatDownlineMembers(
            level,
            childAddresses,
            childUsersRaw,
            viewerDirects,
            viewerCapped
        );
        levelResults[level] = levelMembers;

        frontier = childAddresses;
        frontierUsersRaw = childUsersRaw;
    }

    // Persist all intermediate & target levels in Redis with NO TTL (permanent)
    const cacheEntries = [];
    for (let l = 1; l <= depthNum; l++) {
        cacheEntries.push({
            key: `downline:${normalizedAddr}:${l}`,
            value: levelResults[l] || [],
        });
    }
    await msetCache(cacheEntries);

    const freshTargetData = levelResults[depthNum] || [];
    const isUpdated =
        cachedData === null ||
        cachedData.length !== freshTargetData.length ||
        JSON.stringify(cachedData) !== JSON.stringify(freshTargetData);

    return {
        data: freshTargetData,
        cachedData,
        isUpdated,
    };
}

export async function getDownlineScan(address: string, depth: number): Promise<DownlineMemberDTO[]> {
    const result = await revalidateAndScanDownline(address, depth);
    return result.data;
}

export interface TreeNodeDTO {
    address: string;
    deposit: number;
    directCount: number;
    isCapped: boolean;
    isActive: boolean;
    referrer: string;
}

function formatTreeNode(address: string, u: any): TreeNodeDTO {
    const deposit = parseFloat(ethers.formatUnits(u[0], 18));
    const isCapped = Boolean(u[20]);
    return {
        address,
        deposit,
        directCount: Number(u[2]),
        isCapped,
        isActive: deposit > 0 && !isCapped,
        referrer: u[19] || ZERO_ADDRESS,
    };
}

export async function getCachedNodeChildren(address: string): Promise<TreeNodeDTO[] | null> {
    return getCache<TreeNodeDTO[]>(`children:${address.toLowerCase()}`);
}

/**
 * Warms the `children:*` cache for an address's entire subtree, batched level-by-level
 * (same traversal shape as revalidateAndScanDownline), so later per-node "Expand" clicks
 * in the tree UI hit Redis instead of round-tripping to the RPC. Append-only per node —
 * never overwrites an already-cached parent's children, only fills in ones still missing.
 */
export async function warmChildrenTree(rootAddress: string, maxDepth = 4): Promise<void> {
    let frontier = [rootAddress.toLowerCase()];

    for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
        // Skip parents whose children are already fully cached
        const parentCache = await Promise.all(frontier.map((a) => getCachedNodeChildren(a)));
        const uncachedIdx = parentCache
            .map((c, i) => (c === null ? i : -1))
            .filter((i) => i !== -1);

        const nextFrontier: string[] = [];
        for (let i = 0; i < frontier.length; i++) {
            if (uncachedIdx.includes(i)) continue;
            nextFrontier.push(...(parentCache[i] || []).map((n) => n.address.toLowerCase()));
        }

        if (uncachedIdx.length === 0) {
            frontier = nextFrontier;
            continue;
        }

        const uncachedAddrs = uncachedIdx.map((i) => frontier[i]);
        const usersRaw = await multicall<any>(
            getProvider(),
            uncachedAddrs.map((addr) => ({
                target: MAIN_CONTRACT_ADDRESS,
                abi: MAIN_CONTRACT_ABI,
                functionName: "users",
                args: [addr],
            }))
        );

        const directsCalls: { parent: string; idx: number }[] = [];
        for (let i = 0; i < uncachedAddrs.length; i++) {
            const u = usersRaw[i];
            if (!u) continue;
            const directCount = Number(u[2]);
            for (let idx = 0; idx < directCount; idx++) {
                directsCalls.push({ parent: uncachedAddrs[i], idx });
            }
        }

        if (directsCalls.length === 0) {
            frontier = nextFrontier;
            continue;
        }

        const childAddresses = await multicall<string>(
            getProvider(),
            directsCalls.map((d) => ({
                target: MAIN_CONTRACT_ADDRESS,
                abi: MAIN_CONTRACT_ABI,
                functionName: "userDirects",
                args: [d.parent, d.idx],
            }))
        );

        const byParent = new Map<string, string[]>();
        for (let i = 0; i < directsCalls.length; i++) {
            const child = childAddresses[i];
            if (!child || child === ZERO_ADDRESS) continue;
            const parent = directsCalls[i].parent;
            if (!byParent.has(parent)) byParent.set(parent, []);
            byParent.get(parent)!.push(child);
        }

        const allChildAddrs = Array.from(new Set([...byParent.values()].flat()));
        const allChildUsersRaw = await multicall<any>(
            getProvider(),
            allChildAddrs.map((addr) => ({
                target: MAIN_CONTRACT_ADDRESS,
                abi: MAIN_CONTRACT_ABI,
                functionName: "users",
                args: [addr],
            }))
        );
        const childUserByAddr = new Map(allChildAddrs.map((a, i) => [a, allChildUsersRaw[i]]));

        const cacheEntries: { key: string; value: TreeNodeDTO[] }[] = [];
        for (const [parent, children] of byParent) {
            const nodes = children
                .map((addr) => {
                    const raw = childUserByAddr.get(addr);
                    return raw ? formatTreeNode(addr, raw) : null;
                })
                .filter((n): n is TreeNodeDTO => n !== null);
            cacheEntries.push({ key: `children:${parent}`, value: nodes });
            nextFrontier.push(...nodes.map((n) => n.address.toLowerCase()));
        }
        // Parents with zero on-chain directs still need an empty-array entry cached (prevents re-scanning them every warm)
        for (const addr of uncachedAddrs) {
            if (!byParent.has(addr)) cacheEntries.push({ key: `children:${addr}`, value: [] });
        }

        await msetCache(cacheEntries);

        frontier = nextFrontier;
    }
}

/**
 * Redis is the priority source: whatever it already holds is returned as-is.
 * The contract is only consulted as a verification step — a cheap directCount
 * check first, and a full child fetch only when that count implies unseen
 * members. Any newly-discovered members are appended and persisted; existing
 * cached entries are never overwritten (direct-referral links are permanent
 * on-chain, so this can never go stale in the "removed member" direction).
 */
export async function revalidateNodeChildren(
    address: string
): Promise<{ data: TreeNodeDTO[]; cachedData: TreeNodeDTO[] | null; isUpdated: boolean }> {
    const normalizedAddr = address.toLowerCase();
    const cachedData = await getCachedNodeChildren(normalizedAddr);
    const known = cachedData ?? [];
    const knownAddresses = new Set(known.map((n) => n.address.toLowerCase()));

    const [parentRaw] = await multicall<any>(getProvider(), [
        { target: MAIN_CONTRACT_ADDRESS, abi: MAIN_CONTRACT_ABI, functionName: "users", args: [address] },
    ]);
    const directCount = parentRaw ? Number(parentRaw[2]) : 0;

    // Redis already accounts for every direct referral on-chain — skip the RPC round-trip entirely.
    if (directCount <= knownAddresses.size) {
        return { data: known, cachedData, isUpdated: false };
    }

    const directsCalls = Array.from({ length: directCount }, (_, idx) => ({
        target: MAIN_CONTRACT_ADDRESS,
        abi: MAIN_CONTRACT_ABI,
        functionName: "userDirects",
        args: [address, idx],
    }));
    const childAddresses = (await multicall<string>(getProvider(), directsCalls)).filter(
        (a): a is string => a !== null && a !== ZERO_ADDRESS
    );
    const newAddresses = childAddresses.filter((a) => !knownAddresses.has(a.toLowerCase()));

    if (newAddresses.length === 0) {
        return { data: known, cachedData, isUpdated: false };
    }

    const childUserCalls = newAddresses.map((addr) => ({
        target: MAIN_CONTRACT_ADDRESS,
        abi: MAIN_CONTRACT_ABI,
        functionName: "users",
        args: [addr],
    }));
    const childUsersRaw = await multicall<any>(getProvider(), childUserCalls);
    const newNodes = newAddresses
        .map((addr, i) => (childUsersRaw[i] ? formatTreeNode(addr, childUsersRaw[i]) : null))
        .filter((n): n is TreeNodeDTO => n !== null);

    if (newNodes.length === 0) {
        return { data: known, cachedData, isUpdated: false };
    }

    // Append-only: verified new members join Redis's existing set, nothing already cached is touched
    const merged = [...known, ...newNodes];
    await setCache(`children:${normalizedAddr}`, merged);

    return { data: merged, cachedData, isUpdated: true };
}

