User Detail View Page (Downlines): Yes. Any downline address can be passed to 

reader.ts
 (getUserInfo, getInvestments, getDirectBonusInfo, etc.) to view their complete investment tranches, team volume, rank, direct referrals, and qualification status.

Income Report Page: Yes. Current accrued income, active daily earning rates, and realized earnings can be read directly from contract state. Historical daily logs can be derived from contract events (Invested, Withdrawn, SalaryClaimed) or computed daily rates.

Smart Contract Data Catalog
1. User Account & Profile Data
totalDeposits: Total USDT deposited
firstInvestment: Amount of initial deposit
activeon: Timestamp of activation
referrer: Address of direct sponsor/upline
isCapped: 3x earnings limit status (true/false)
totalWithdrawn: Lifetime withdrawn earnings
lastWithdrawTime: Timestamp of last withdrawal
2. Downline & Team Data
directCount: Number of direct referrals
directVolume: Cumulative deposit volume from direct referrals
directReferrals[index]: Address of each direct referral
teamVolume: Total team volume across all levels
totalDownlineBusiness: Lifetime downline volume
freshBusiness: Recent business volume counted for booster/rank
directBoosterCount & directBoosterBusiness: Count and volume for booster qualification
isBoosted: Booster status (true/false)
legVolumes (Leg A, Leg B, Leg C): 3-leg volume breakdown from fund contract
3. Income Streams & Real-Time Rates
ROI / RWP Income:
currentRwpRate: Active daily base ROI rate (e.g., 0.5%–1.5%/day)
userInvestments[index]:
amount: Principal deposit
compoundedPrincipal: Principal after compounding
rwpWithdrawn: ROI already claimed
lastUpdateTime: Timestamp of last ROI calculation
isActive: Tranche active status
boostperc: Additional booster percentage on tranche
Direct Bonus:
directBonus: Realized direct commission
getDirectBonusInfo: Available now vs pending locked bonus
Level Income:
ratePerDay: Current daily earning rate from downline ROI
pending: Accrued uncollected level income
levelRewardsRealized: Total level rewards realized
lastLevelUpdateTime: Timestamp of last level update
Upline Income:
isUplineEligible: Qualification status for upline income
eligibleL1Count, eligibleL2Count, eligibleL3Count: Count of eligible downlines matching tiers
pendingUplineIncome: Accrued uncollected upline earnings
getUplineIncome: Real-time query for pending upline reward
Salary & Rank Income:
currentRank: Current achieved leadership rank (0–8)
getPendingSalary: Available salary claimable
unwithdrawnSalary: Retained unpaid salary
salaryLastClaimTime: Timestamp of last salary withdrawal
salaryEndTime: Expiration time for current rank salary
Fund Rewards:
earnedFromFunds: Accumulated club/fund pool rewards
4. System & Global Platform Data
launchTime: Platform launch unix timestamp
WITHDRAWAL_COOLING_PERIOD: Minimum wait time between withdrawals
FUND_CONTRACT_ADDRESS: Deployed fund/pool contract address
MAIN_CONTRACT_ADDRESS: Deployed platform contract address
5. Token & DEX Liquidity Data
totalSupply: Total circulating supply of I6 token
buyingEnabled: DEX swap enablement state
liquidityPair: PancakeSwap LP contract address
getReserves: USDT and I6 pool reserve balances
getSpotPrice: Real-time swap price of I6 in USDT
getAmountsOut: Expected output token amount for a given swap input