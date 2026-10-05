const WHITELISTED_ADDRESSES = [
    "0x19717a322455764cE7667f0466b5ca5E2BbBd6E0"
] as const;

const normalizedWhitelistedAddresses = new Set(
    WHITELISTED_ADDRESSES.map((address) => address.toLowerCase())
);

export function isWhitelistedAddress(address?: string | null): boolean {
    return Boolean(address && normalizedWhitelistedAddresses.has(address.toLowerCase()));
}

export { WHITELISTED_ADDRESSES };
