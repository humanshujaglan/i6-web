export const MAIN_CONTRACT_ADDRESS = "0x51A36b17b5dbD013C632dCb411F71E935392fe5e";
export const I6_TOKEN_ADDRESS = "0xd2e052c7faE5DDeD7A7B2CdDd27B5d75D18A1593";
export const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
export const ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
export const FUND_CONTRACT_ADDRESS = "0x7230EBc50bE2F074776d6CD5d85C502c79b633db";
export const GENESIS_ADDRESS = "0xdF4fA7B59e9735f273B661153A03e64A6AE61cd1".toLowerCase();
export const PAIR_ADDRESS = "0x13D55200c298Ff1caE3136BE0dd889626DEAC782";
export const FACTORY_ADDRESS = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
export const DAO_ADDRESS = "0x4EA9802681Fb877DE5407974E63F197EE754032f";

export const MAIN_CONTRACT_ABI = [
    {
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "users",
        "outputs": [
            { "internalType": "uint256", "name": "totalDeposits", "type": "uint256" },
            { "internalType": "uint256", "name": "directBonus", "type": "uint256" },
            { "internalType": "uint256", "name": "directCount", "type": "uint256" },
            { "internalType": "uint256", "name": "directVolume", "type": "uint256" },
            { "internalType": "uint256", "name": "currentRwpRate", "type": "uint256" },
            { "internalType": "uint256", "name": "teamVolume", "type": "uint256" },
            { "internalType": "uint256", "name": "totalDownlineBusiness", "type": "uint256" },
            { "internalType": "uint256", "name": "levelRewardsRealized", "type": "uint256" },
            { "internalType": "uint256", "name": "lastLevelUpdateTime", "type": "uint256" },
            { "internalType": "bool", "name": "isUplineEligible", "type": "bool" },
            { "internalType": "uint256", "name": "eligibleL1Count", "type": "uint256" },
            { "internalType": "uint256", "name": "eligibleL2Count", "type": "uint256" },
            { "internalType": "uint256", "name": "eligibleL3Count", "type": "uint256" },
            { "internalType": "uint256", "name": "pendingUplineIncome", "type": "uint256" },
            { "internalType": "uint8", "name": "currentRank", "type": "uint8" },
            { "internalType": "uint256", "name": "salaryLastClaimTime", "type": "uint256" },
            { "internalType": "uint256", "name": "salaryEndTime", "type": "uint256" },
            { "internalType": "uint256", "name": "unwithdrawnSalary", "type": "uint256" },
            { "internalType": "uint256", "name": "totalWithdrawn", "type": "uint256" },
            { "internalType": "address", "name": "referrer", "type": "address" },
            { "internalType": "bool", "name": "isCapped", "type": "bool" },
            { "internalType": "uint256", "name": "firstInvestment", "type": "uint256" },
            { "internalType": "uint256", "name": "freshBusiness", "type": "uint256" },
            { "internalType": "uint256", "name": "directBoosterCount", "type": "uint256" },
            { "internalType": "uint256", "name": "activeon", "type": "uint256" },
            { "internalType": "uint256", "name": "directBoosterBusiness", "type": "uint256" },
            { "internalType": "bool", "name": "isBoosted", "type": "bool" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "", "type": "address" },
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "name": "userInvestments",
        "outputs": [
            { "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "internalType": "uint256", "name": "compoundedPrincipal", "type": "uint256" },
            { "internalType": "uint256", "name": "rwpWithdrawn", "type": "uint256" },
            { "internalType": "uint256", "name": "lastUpdateTime", "type": "uint256" },
            { "internalType": "bool", "name": "isActive", "type": "bool" },
            { "internalType": "uint256", "name": "boostperc", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "userAddress", "type": "address" }],
        "name": "getPendingSalary",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }],
        "name": "getDirectBonusInfo",
        "outputs": [
            { "internalType": "uint256", "name": "availableNow", "type": "uint256" },
            { "internalType": "uint256", "name": "pendingLocked", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "getLevelIncomeData",
        "outputs": [
            { "internalType": "uint256", "name": "pending", "type": "uint256" },
            { "internalType": "uint256", "name": "ratePerDay", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "userAddress", "type": "address" }],
        "name": "getUplineIncome",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "lastWithdrawTime",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "launchTime",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "WITHDRAWAL_COOLING_PERIOD",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "", "type": "address" },
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "name": "userDirects",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getSpotPrice",
        "outputs": [{ "internalType": "uint256", "name": "price", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "usdtAmount", "type": "uint256" },
            { "internalType": "address", "name": "referrer", "type": "address" },
            { "internalType": "uint256", "name": "minTokensOut", "type": "uint256" }
        ],
        "name": "invest",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "claimRank",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "usdtValue", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "tokenAmount", "type": "uint256" }
        ],
        "name": "Withdrawn",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "referrer", "type": "address" }
        ],
        "name": "Invested",
        "type": "event"
    }
];

export const USDT_ABI = [
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) public view returns (uint256)",
    "function balanceOf(address account) public view returns (uint256)",
    "function decimals() public view returns (uint8)",
];

export const ROUTER_ABI = [
    "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
    "function getAmountsIn(uint amountOut, address[] memory path) public view returns (uint[] memory amounts)",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
    "function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external",
];

export const TOKEN_ABI = [
    "function totalSupply() view returns (uint256)",
    "function buyingEnabled() view returns (bool)",
    "function liquidityPair() view returns (address)",
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) public view returns (uint256)",
    "function balanceOf(address account) public view returns (uint256)",
    "function decimals() public view returns (uint8)",
    "function symbol() public view returns (string)",
];

export const PAIR_ABI = [
    {
        "inputs": [],
        "name": "getReserves",
        "outputs": [
            { "internalType": "uint112", "name": "reserve0", "type": "uint112" },
            { "internalType": "uint112", "name": "reserve1", "type": "uint112" },
            { "internalType": "uint32", "name": "blockTimestampLast", "type": "uint32" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "token0",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    }
];

export const FUND_CONTRACT_ABI = [
    {
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "users",
        "outputs": [
            { "name": "isExist", "type": "bool" },
            { "name": "referrer", "type": "address" },
            { "name": "partnersCount", "type": "uint256" },
            { "name": "activePartners", "type": "uint256" },
            { "name": "totalDepositUSD", "type": "uint256" },
            { "name": "totalNetworkDepositUSD", "type": "uint256" },
            { "name": "totalTeamVolume", "type": "uint256" },
            { "name": "totalDirectBusiness", "type": "uint256" },
            { "name": "joiningTime", "type": "uint256" },
            { "name": "activationTime", "type": "uint256" },
            { "name": "lastLevelWithdraw", "type": "uint256" },
            { "name": "dailyIncomeRate", "type": "uint256" },
            { "name": "accumulatedLevelIncome", "type": "uint256" },
            { "name": "lastRoiWithdraw", "type": "uint256" },
            { "name": "lastUplineWithdraw", "type": "uint256" },
            { "name": "isUplineQualified", "type": "bool" },
            { "name": "salaryRank", "type": "uint256" },
            { "name": "lastSalaryWithdraw", "type": "uint256" },
            { "name": "salarySnapshotLegBC", "type": "uint256" },
            { "name": "salaryCycleTimestamp", "type": "uint256" },
            { "name": "rankMonthsPaid", "type": "uint256" },
            { "name": "earnedFromRoi", "type": "uint256" },
            { "name": "earnedFromDirect", "type": "uint256" },
            { "name": "earnedFromLevel", "type": "uint256" },
            { "name": "earnedFromUpline", "type": "uint256" },
            { "name": "earnedFromSalary", "type": "uint256" },
            { "name": "earnedFromFunds", "type": "uint256" },
            { "name": "roiPercentage", "type": "uint256" },
            { "name": "incomeCapMultiplier", "type": "uint256" },
            { "name": "currentCapUSD", "type": "uint256" },
            { "name": "totalEarnedUSD", "type": "uint256" },
            { "name": "availableWalletUSD", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }],
        "name": "getLegVolumes",
        "outputs": [
            { "name": "legA", "type": "uint256" },
            { "name": "legB", "type": "uint256" },
            { "name": "legC", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "", "type": "address" },
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "name": "directReferrals",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "claimFundReward",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "referrer", "type": "address" }
        ],
        "name": "Invested",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "usdtValue", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "tokenAmount", "type": "uint256" }
        ],
        "name": "Withdrawn",
        "type": "event"
    }
];
