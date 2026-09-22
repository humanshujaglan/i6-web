import { ethers } from "ethers";
import { getProvider, getLogsProvider } from "../rpc";
import { multicall } from "../multicall";
import { unstable_cache } from "next/cache";
import {
    MAIN_CONTRACT_ADDRESS,
    MAIN_CONTRACT_ABI,
    PAIR_ADDRESS,
    PAIR_ABI,
    I6_TOKEN_ADDRESS,
    USDT_ADDRESS,
    USDT_ABI,
    ROUTER_ADDRESS,
    ROUTER_ABI,
    FUND_CONTRACT_ADDRESS,
    FUND_CONTRACT_ABI,
    TOKEN_ABI,
} from "./abis";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function mainContract() {
    return new ethers.Contract(MAIN_CONTRACT_ADDRESS, MAIN_CONTRACT_ABI, getProvider());
}

function logsContract() {
    return new ethers.Contract(MAIN_CONTRACT_ADDRESS, MAIN_CONTRACT_ABI, getLogsProvider());
}

export interface UserInfoDTO {
    totalDeposits: string;
    directBonus: string;
    directCount: string;
    directVolume: string;
    currentRwpRate: string;
    teamVolume: string;
    totalDownlineBusiness: string;
    levelRewardsRealized: string;
    lastLevelUpdateTime: string;
    isUplineEligible: boolean;
    eligibleL1Count: string;
    eligibleL2Count: string;
    eligibleL3Count: string;
    pendingUplineIncome: string;
    currentRank: number;
    salaryLastClaimTime: string;
    salaryEndTime: string;
    unwithdrawnSalary: string;
    totalWithdrawn: string;
    referrer: string;
    isCapped: boolean;
    firstInvestment: string;
    freshBusiness: string;
    directBoosterCount: string;
    activeon: string;
    directBoosterBusiness: string;
    isBoosted: boolean;
}

export function mapUserInfo(res: any): UserInfoDTO {
    return {
        totalDeposits: res[0].toString(),
        directBonus: res[1].toString(),
        directCount: res[2].toString(),
        directVolume: res[3].toString(),
        currentRwpRate: res[4].toString(),
        teamVolume: res[5].toString(),
        totalDownlineBusiness: res[6].toString(),
        levelRewardsRealized: res[7].toString(),
        lastLevelUpdateTime: res[8].toString(),
        isUplineEligible: res[9],
        eligibleL1Count: res[10].toString(),
        eligibleL2Count: res[11].toString(),
        eligibleL3Count: res[12].toString(),
        pendingUplineIncome: res[13].toString(),
        currentRank: Number(res[14]),
        salaryLastClaimTime: res[15].toString(),
        salaryEndTime: res[16].toString(),
        unwithdrawnSalary: res[17].toString(),
        totalWithdrawn: res[18].toString(),
        referrer: res[19],
        isCapped: res[20],
        firstInvestment: res[21].toString(),
        freshBusiness: res[22].toString(),
        directBoosterCount: res[23].toString(),
        activeon: res[24].toString(),
        directBoosterBusiness: res[25].toString(),
        isBoosted: res[26],
    };
}

export const getUserInfo = unstable_cache(
    async (address: string): Promise<UserInfoDTO> => {
        const res = await mainContract().users(address);
        return mapUserInfo(res);
    },
    ["reader:user"],
    { revalidate: 15 }
);

export interface InvestmentDTO {
    amount: string;
    compoundedPrincipal: string;
    rwpWithdrawn: string;
    lastUpdateTime: string;
    depositTime?: string;
    txHash?: string;
    isActive: boolean;
    boostperc: string;
}

export const getInvestments = unstable_cache(
    async (address: string): Promise<InvestmentDTO[]> => {
        const contract = mainContract();
        const invs: InvestmentDTO[] = [];
        let idx = 0;
        while (idx < 500) {
            try {
                const inv = await contract.userInvestments(address, idx);
                if (inv[0] === 0n && !inv[4]) break;
                invs.push({
                    amount: inv[0].toString(),
                    compoundedPrincipal: inv[1].toString(),
                    rwpWithdrawn: inv[2].toString(),
                    lastUpdateTime: inv[3].toString(),
                    isActive: inv[4],
                    boostperc: inv[5].toString(),
                });
                idx++;
            } catch {
                break;
            }
        }
        return invs;
    },
    ["reader:investments"],
    { revalidate: 15 }
);

export const getPendingSalary = unstable_cache(
    async (address: string): Promise<string> => {
        const res = await mainContract().getPendingSalary(address);
        return res.toString();
    },
    ["reader:salary"],
    { revalidate: 15 }
);

export interface DirectBonusDTO {
    availableNow: string;
    pendingLocked: string;
}

export const getDirectBonusInfo = unstable_cache(
    async (address: string): Promise<DirectBonusDTO> => {
        const res = await mainContract().getDirectBonusInfo(address);
        return { availableNow: res[0].toString(), pendingLocked: res[1].toString() };
    },
    ["reader:directbonus"],
    { revalidate: 15 }
);

export interface LevelIncomeDTO {
    pending: string;
    ratePerDay: string;
}

export const getLevelIncomeData = unstable_cache(
    async (address: string): Promise<LevelIncomeDTO> => {
        const res = await mainContract().getLevelIncomeData(address);
        return { pending: res[0].toString(), ratePerDay: res[1].toString() };
    },
    ["reader:level"],
    { revalidate: 15 }
);

export const getUplineIncome = unstable_cache(
    async (address: string): Promise<string> => {
        const res = await mainContract().getUplineIncome(address);
        return res.toString();
    },
    ["reader:upline"],
    { revalidate: 15 }
);

export interface GlobalConstantsDTO {
    launchTime: string;
    cooldownPeriod: string;
}

export const getGlobalConstants = unstable_cache(
    async (): Promise<GlobalConstantsDTO> => {
        const contract = mainContract();
        const [launchTime, cooldownPeriod] = await Promise.all([
            contract.launchTime(),
            contract.WITHDRAWAL_COOLING_PERIOD(),
        ]);
        return { launchTime: launchTime.toString(), cooldownPeriod: cooldownPeriod.toString() };
    },
    ["reader:globals"],
    { revalidate: 300 }
);

export const getLastWithdrawTime = unstable_cache(
    async (address: string): Promise<string> => {
        const res = await mainContract().lastWithdrawTime(address);
        return res.toString();
    },
    ["reader:cooldown"],
    { revalidate: 15 }
);

export interface SpotPriceDTO {
    spot: string;
    formatted: string;
}

export const getSpotPrice = unstable_cache(
    async (): Promise<SpotPriceDTO | null> => {
        const pair = new ethers.Contract(PAIR_ADDRESS, PAIR_ABI, getProvider());
        const [reserves, token0] = await Promise.all([pair.getReserves(), pair.token0()]);
        let i6Reserve: bigint;
        let usdtReserve: bigint;
        if (token0.toLowerCase() === I6_TOKEN_ADDRESS.toLowerCase()) {
            i6Reserve = reserves[0];
            usdtReserve = reserves[1];
        } else {
            usdtReserve = reserves[0];
            i6Reserve = reserves[1];
        }
        if (i6Reserve <= 0n) return null;
        const spot = (usdtReserve * ethers.WeiPerEther) / i6Reserve;
        const formatted = (
            parseFloat(ethers.formatUnits(usdtReserve, 18)) / parseFloat(ethers.formatUnits(i6Reserve, 18))
        ).toFixed(6);
        return { spot: spot.toString(), formatted };
    },
    ["reader:spotprice"],
    { revalidate: 10 }
);

export interface UplineChainDTO {
    l1: string;
    l2: string;
    l3: string;
}

export async function getUplineChain(address: string): Promise<UplineChainDTO> {
    const selfUser = await getUserInfo(address);
    if (!selfUser.isUplineEligible || !selfUser.referrer || selfUser.referrer === ZERO_ADDRESS) {
        return { l1: "", l2: "", l3: "" };
    }
    const l1 = selfUser.referrer;
    const up1 = await getUserInfo(l1);
    if (!up1.referrer || up1.referrer === ZERO_ADDRESS) {
        return { l1, l2: "None", l3: "None" };
    }
    const l2 = up1.referrer;
    const up2 = await getUserInfo(l2);
    const l3 = up2.referrer && up2.referrer !== ZERO_ADDRESS ? up2.referrer : "None";
    return { l1, l2, l3 };
}

export interface DirectWithUserDTO {
    address: string;
    user: UserInfoDTO;
}

export const getDirectsWithUserData = unstable_cache(
    async (address: string): Promise<DirectWithUserDTO[]> => {
        const selfUser = await getUserInfo(address);
        const count = Number(selfUser.directCount);
        if (count === 0) return [];

        const addressCalls = Array.from({ length: count }, (_, i) => ({
            target: MAIN_CONTRACT_ADDRESS,
            abi: MAIN_CONTRACT_ABI,
            functionName: "userDirects",
            args: [address, i],
        }));
        const addresses = (await multicall<string>(getProvider(),addressCalls)).filter(
            (a): a is string => a !== null && a !== ZERO_ADDRESS
        );
        if (addresses.length === 0) return [];

        const userCalls = addresses.map((addr) => ({
            target: MAIN_CONTRACT_ADDRESS,
            abi: MAIN_CONTRACT_ABI,
            functionName: "users",
            args: [addr],
        }));
        const usersRaw = await multicall<any>(getProvider(),userCalls);

        const merged: DirectWithUserDTO[] = [];
        for (let i = 0; i < addresses.length; i++) {
            if (usersRaw[i]) merged.push({ address: addresses[i], user: mapUserInfo(usersRaw[i]) });
        }
        return merged;
    },
    ["reader:directs"],
    { revalidate: 15 }
);

export interface FundStatusDTO {
    exists: boolean;
    legVolumes: [number, number, number];
    earnedFromFunds: number;
}

export const getFundStatusData = unstable_cache(
    async (address: string): Promise<FundStatusDTO> => {
        const contract = new ethers.Contract(FUND_CONTRACT_ADDRESS, FUND_CONTRACT_ABI, getProvider());
        const user = await contract.users(address);
        if (!user.isExist) {
            return { exists: false, legVolumes: [0, 0, 0], earnedFromFunds: 0 };
        }

        let legs: number[] = [0, 0, 0];
        try {
            const legData = await contract.getLegVolumes(address);
            legs = [
                parseFloat(ethers.formatUnits(legData.legA, 18)),
                parseFloat(ethers.formatUnits(legData.legB, 18)),
                parseFloat(ethers.formatUnits(legData.legC, 18)),
            ];
        } catch {
            const partnersCount = Number(user.partnersCount);
            const fetchLimit = Math.min(partnersCount, 50);
            const directCalls = Array.from({ length: fetchLimit }, (_, i) => ({
                target: FUND_CONTRACT_ADDRESS,
                abi: FUND_CONTRACT_ABI,
                functionName: "directReferrals",
                args: [address, i],
            }));
            const directAddresses = (await multicall<string>(getProvider(),directCalls)).filter(
                (a): a is string => a !== null
            );

            const userCalls = directAddresses.map((addr) => ({
                target: FUND_CONTRACT_ADDRESS,
                abi: FUND_CONTRACT_ABI,
                functionName: "users",
                args: [addr],
            }));
            const usersRaw = await multicall<any>(getProvider(),userCalls);

            const volumes = usersRaw
                .filter((u): u is NonNullable<typeof u> => u !== null)
                .map((dUser) => {
                    const netDep = parseFloat(ethers.formatUnits(dUser.totalNetworkDepositUSD, 18));
                    if (netDep >= 100) {
                        const team = parseFloat(ethers.formatUnits(dUser.totalTeamVolume, 18));
                        return netDep + team;
                    }
                    return 0;
                })
                .sort((a, b) => b - a);

            legs[0] = volumes.length > 0 ? volumes[0] : 0;
            legs[1] = volumes.length > 1 ? volumes[1] : 0;
            let rest = 0;
            for (let i = 2; i < volumes.length; i++) rest += volumes[i];
            legs[2] = rest;
        }

        const sortedLegs = legs.sort((a, b) => b - a) as [number, number, number];
        const earnedFromFunds = parseFloat(ethers.formatUnits(user.earnedFromFunds, 18));

        return { exists: true, legVolumes: sortedLegs, earnedFromFunds };
    },
    ["reader:fund"],
    { revalidate: 15 }
);

export interface WalletStateDTO {
    balance: string;
    allowance: string;
}

export async function getWalletState(address: string, spender: string): Promise<WalletStateDTO> {
    const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, getProvider());
    const [balance, allowance] = await Promise.all([
        usdt.balanceOf(address),
        usdt.allowance(address, spender),
    ]);
    return { balance: balance.toString(), allowance: allowance.toString() };
}

export async function getI6TokenState(address: string, spender: string): Promise<WalletStateDTO> {
    const i6 = new ethers.Contract(I6_TOKEN_ADDRESS, TOKEN_ABI, getProvider());
    const [balance, allowance] = await Promise.all([
        i6.balanceOf(address),
        i6.allowance(address, spender),
    ]);
    return { balance: balance.toString(), allowance: allowance.toString() };
}

export const getSwapQuote = unstable_cache(
    async (amountInWei: string, path: string[]): Promise<string[]> => {
        const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, getProvider());
        const amounts: bigint[] = await router.getAmountsOut(BigInt(amountInWei), path);
        return amounts.map((a) => a.toString());
    },
    ["reader:swapquote"],
    { revalidate: 10 }
);

export interface TokenStatsDTO {
    totalSupply: string;
    buyingEnabled: boolean;
    liquidityPair: string | null;
}

export const getTokenStats = unstable_cache(
    async (): Promise<TokenStatsDTO> => {
        const token = new ethers.Contract(I6_TOKEN_ADDRESS, TOKEN_ABI, getProvider());
        const [supply, buying, pair] = await Promise.all([
            token.totalSupply().catch(() => null),
            token.buyingEnabled().catch(() => null),
            token.liquidityPair().catch(() => null),
        ]);
        return {
            totalSupply: supply !== null ? supply.toString() : "0",
            buyingEnabled: buying === true,
            liquidityPair: pair && pair !== ZERO_ADDRESS ? pair : null,
        };
    },
    ["reader:tokenstats"],
    { revalidate: 20 }
);

export interface DashboardAggregateDTO {
    user: UserInfoDTO;
    investments: InvestmentDTO[];
    pendingSalary: string | null;
    directBonus: DirectBonusDTO | null;
    levelIncome: LevelIncomeDTO | null;
    spotPrice: SpotPriceDTO | null;
    uplineIncome: string | null;
    lastWithdrawTime: string;
    launchTime: string;
    cooldownPeriod: string;
}

export async function getDashboardAggregate(address: string): Promise<DashboardAggregateDTO> {
    const user = await getUserInfo(address);

    const [rawInvestments, pendingSalary, directBonus, levelIncome, spotPrice, uplineIncome, lastWithdrawTime, globals] =
        await Promise.all([
            getInvestments(address).catch(() => []),
            getPendingSalary(address).catch(() => null),
            getDirectBonusInfo(address).catch(() => null),
            getLevelIncomeData(address).catch(() => null),
            getSpotPrice().catch(() => null),
            user.isUplineEligible ? getUplineIncome(address).catch(() => null) : Promise.resolve(null),
            getLastWithdrawTime(address).catch(() => "0"),
            getGlobalConstants().catch(() => ({ launchTime: "0", cooldownPeriod: "3600" })),
        ]);

    const activeonNum = Number(user.activeon);
    let cachedEvents = depositHistoryCache.get(address.toLowerCase())?.data;

    if (!cachedEvents && rawInvestments.length > 1) {
        cachedEvents = await getDepositHistory(address).catch(() => []);
    }

    const investments: InvestmentDTO[] = rawInvestments.map((inv, idx) => {
        const ev = cachedEvents?.find((e) => e.packageIndex === idx) || cachedEvents?.[idx];
        let depTimestamp = ev?.timestamp || 0;
        if (!depTimestamp && idx === 0 && activeonNum > 0) {
            depTimestamp = activeonNum;
        }
        return {
            ...inv,
            depositTime: depTimestamp ? depTimestamp.toString() : "",
            txHash: ev?.txHash || "",
        };
    });

    return {
        user,
        investments,
        pendingSalary,
        directBonus,
        levelIncome,
        spotPrice,
        uplineIncome,
        lastWithdrawTime,
        launchTime: globals.launchTime,
        cooldownPeriod: globals.cooldownPeriod,
    };
}

export interface WithdrawalEventDTO {
    txHash: string;
    usdtAmount: string;
    usdtAmountFloat: number;
    tokenAmount: string;
    tokenAmountFloat: number;
    timestamp: number;
    blockNumber: number;
}

const withdrawalHistoryCache = new Map<string, { data: WithdrawalEventDTO[]; timestamp: number }>();

export async function getWithdrawalHistory(userAddress: string): Promise<WithdrawalEventDTO[]> {
    const key = userAddress.toLowerCase();
    const cached = withdrawalHistoryCache.get(key);
    if (cached && Date.now() - cached.timestamp < 120_000) {
        return cached.data;
    }

    const provider = getLogsProvider();
    const contract = logsContract();

    try {
        const filter = contract.filters.Withdrawn(userAddress);
        const currentBlock = await provider.getBlockNumber().catch(() => 0);
        if (currentBlock === 0) return cached?.data || [];

        const CHUNK_SIZE = 5000;
        const MAX_CHUNKS = 25;
        const chunkRanges: { start: number; end: number }[] = [];
        let end = currentBlock;
        for (let i = 0; i < MAX_CHUNKS && end >= 0; i++) {
            const start = Math.max(end - CHUNK_SIZE + 1, 0);
            chunkRanges.push({ start, end });
            if (start === 0) break;
            end = start - 1;
        }

        const chunkResults = await Promise.all(
            chunkRanges.map((r) => contract.queryFilter(filter, r.start, r.end).catch(() => []))
        );
        const logs = chunkResults.flat();

        const blockTimeCache = new Map<number, number>();

        const results: WithdrawalEventDTO[] = [];
        for (const log of logs) {
            const parsed = contract.interface.parseLog({
                topics: log.topics as string[],
                data: log.data,
            });
            if (parsed && parsed.args) {
                let timestamp = blockTimeCache.get(log.blockNumber) || 0;
                if (!timestamp) {
                    const block = await provider.getBlock(log.blockNumber).catch(() => null);
                    timestamp = block ? block.timestamp : 0;
                    if (timestamp) blockTimeCache.set(log.blockNumber, timestamp);
                }

                const usdtWei = parsed.args.usdtValue;
                const tokensWei = parsed.args.tokenAmount;
                const usdtFloat = parseFloat(ethers.formatUnits(usdtWei, 18));
                const tokenFloat = parseFloat(ethers.formatUnits(tokensWei, 18));

                results.push({
                    txHash: log.transactionHash,
                    usdtAmount: usdtWei.toString(),
                    usdtAmountFloat: usdtFloat,
                    tokenAmount: tokensWei.toString(),
                    tokenAmountFloat: tokenFloat,
                    timestamp,
                    blockNumber: log.blockNumber,
                });
            }
        }

        const sorted = results.sort((a, b) => b.blockNumber - a.blockNumber);
        withdrawalHistoryCache.set(key, { data: sorted, timestamp: Date.now() });
        return sorted;
    } catch (err) {
        console.error("getWithdrawalHistory failed", err);
        return cached?.data || [];
    }
}

export interface DepositEventDTO {
    txHash: string;
    amount: string;
    amountFloat: number;
    referrer: string;
    timestamp: number;
    blockNumber: number;
    packageIndex: number;
}

const depositHistoryCache = new Map<string, { data: DepositEventDTO[]; timestamp: number }>();

export async function getDepositHistory(userAddress: string): Promise<DepositEventDTO[]> {
    const key = userAddress.toLowerCase();
    const cached = depositHistoryCache.get(key);
    if (cached && Date.now() - cached.timestamp < 120_000) {
        return cached.data;
    }

    const provider = getLogsProvider();
    const contract = logsContract();

    try {
        const filter = contract.filters.Invested(userAddress);
        const currentBlock = await provider.getBlockNumber().catch(() => 0);
        if (currentBlock === 0) return cached?.data || [];

        const CHUNK_SIZE = 5000;
        const MAX_CHUNKS = 25;
        const chunkRanges: { start: number; end: number }[] = [];
        let end = currentBlock;
        for (let i = 0; i < MAX_CHUNKS && end >= 0; i++) {
            const start = Math.max(end - CHUNK_SIZE + 1, 0);
            chunkRanges.push({ start, end });
            if (start === 0) break;
            end = start - 1;
        }

        const chunkResults = await Promise.all(
            chunkRanges.map((r) => contract.queryFilter(filter, r.start, r.end).catch(() => []))
        );
        const logs = chunkResults.flat();

        // Sort chronologically (oldest block to newest block)
        logs.sort((a, b) => a.blockNumber - b.blockNumber || a.index - b.index);

        const blockTimeCache = new Map<number, number>();
        const results: DepositEventDTO[] = [];

        for (let idx = 0; idx < logs.length; idx++) {
            const log = logs[idx];
            const parsed = contract.interface.parseLog({
                topics: log.topics as string[],
                data: log.data,
            });
            if (parsed && parsed.args) {
                let timestamp = blockTimeCache.get(log.blockNumber) || 0;
                if (!timestamp) {
                    const block = await provider.getBlock(log.blockNumber).catch(() => null);
                    timestamp = block ? block.timestamp : 0;
                    if (timestamp) blockTimeCache.set(log.blockNumber, timestamp);
                }

                const amountWei = parsed.args.amount;
                const amountFloat = parseFloat(ethers.formatUnits(amountWei, 18));

                results.push({
                    txHash: log.transactionHash,
                    amount: amountWei.toString(),
                    amountFloat,
                    referrer: parsed.args.referrer || "",
                    timestamp,
                    blockNumber: log.blockNumber,
                    packageIndex: idx,
                });
            }
        }

        depositHistoryCache.set(key, { data: results, timestamp: Date.now() });
        return results;
    } catch (err) {
        console.error("getDepositHistory failed", err);
        return cached?.data || [];
    }
}


