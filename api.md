# i6 Relayer Integration: 2 Public Endpoints Guide

This guide details the two public backend endpoints required for the **`i6` Token Reinvestment Pipeline** on the frontend, configured with a default **75% reinvestment preference**.

---

## Endpoint 1: Check Approval & Fetch Relayer Address

### `GET /api/reinvest/status/:user`

Retrieves the `i6` relayer wallet address and verifies whether the user has granted on-chain ERC-20 token allowance.

* **Method:** `GET`
* **URL:** `http://localhost:3001/api/reinvest/status/:user`
* **URL Parameter:**
  * `:user` — The connected user's EVM wallet address (`0x...`)
* **Headers:** `Content-Type: application/json`

#### Response (`200 OK`)
```json
{
  "userAddress": "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db",
  "relayerAddress": "0x1111111111111111111111111111111111111111",
  "nonce": 0,
  "allowance": "0",
  "hasAllowance": false,
  "preference": null
}
```

#### Frontend Action Required If `hasAllowance === false`
In Web3, token allowances are executed on-chain directly by the user's wallet via the `i6` Token contract:
```typescript
// Approve the relayer to pull tokens when reinvestment executes
const tx = await i6TokenContract.approve(data.relayerAddress, ethers.MaxUint256);
await tx.wait();
```

---

## Endpoint 2: Save Reinvestment Preference (Default 75%)

### `POST /api/reinvest/preference`

Locks the user's reinvestment percentage (**75%**) into the relayer database. This endpoint requires an **EIP-712 typed signature** from the user's wallet.

* **Method:** `POST`
* **URL:** `http://localhost:3001/api/reinvest/preference`
* **Rate Limit:** 30 requests/minute per IP
* **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "userAddress": "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db",
  "percent": 75,
  "nonce": 0,
  "deadline": 1740000000,
  "signature": "0x30450221008d5b4a..."
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "preference": {
    "userAddress": "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db",
    "percent": 75,
    "signature": "0x30450221008d5b4a...",
    "deadline": 1740000000
  }
}
```

---

## Complete Frontend Implementation (Next.js / TypeScript)

Copy and use this standard workflow in your frontend service or component:

```typescript
import { ethers } from "ethers";

const API_BASE = process.env.NEXT_PUBLIC_RELAYER_API || "http://localhost:3001";
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 56); // 56 for BSC Mainnet, 97 for Testnet
const I6_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_I6_TOKEN_ADDRESS!;
const QTX_LAUNCHPAD_ADDRESS = process.env.NEXT_PUBLIC_QTX_LAUNCHPAD_ADDRESS!;

const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

/**
 * Executes the 2-step setup:
 * 1. Checks & requests on-chain approval if needed
 * 2. Signs & saves the 75% default reinvestment preference
 */
export async function setupI6Reinvestment(signer: ethers.Signer) {
  const userAddress = await signer.getAddress();

  // ─── STEP 1: Check Status & Get Relayer Address ──────────────────────────
  const statusRes = await fetch(`${API_BASE}/api/reinvest/status/${userAddress}`);
  if (!statusRes.ok) throw new Error("Failed to fetch relayer status");
  const { relayerAddress, hasAllowance, nonce } = await statusRes.json();

  // Prompt on-chain ERC20 approval if not already approved
  if (!hasAllowance) {
    const i6Contract = new ethers.Contract(I6_TOKEN_ADDRESS, ERC20_ABI, signer);
    const approveTx = await i6Contract.approve(relayerAddress, ethers.MaxUint256);
    await approveTx.wait();
  }

  // ─── STEP 2: Sign & Submit 75% Preference via EIP-712 ───────────────────
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour validity

  const domain = {
    name: "QTX Reinvestment Engine",
    version: "1",
    chainId: CHAIN_ID,
    verifyingContract: QTX_LAUNCHPAD_ADDRESS
  };

  const types = {
    ReinvestPreference: [
      { name: "user", type: "address" },
      { name: "token", type: "address" },
      { name: "percent", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" }
    ]
  };

  const value = {
    user: userAddress,
    token: I6_TOKEN_ADDRESS,
    percent: 75, // Default 75% reinvestment
    nonce: nonce,
    deadline: deadline
  };

  // Trigger wallet signature (MetaMask / TrustWallet / WalletConnect)
  const signature = await (signer as any).signTypedData(domain, types, value);

  // Send signed preference to relayer backend
  const prefRes = await fetch(`${API_BASE}/api/reinvest/preference`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userAddress,
      percent: 75,
      nonce,
      deadline,
      signature
    })
  });

  const result = await prefRes.json();
  if (!prefRes.ok) {
    throw new Error(result.error || "Failed to save preference");
  }

  return result;
}
```
