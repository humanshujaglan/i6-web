export function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(
            `Missing required environment variable: ${name}. ` +
            `Set it in Vercel → Project → Settings → Environment Variables (or nextjs/.env.local for local dev).`
        );
    }
    return value;
}
