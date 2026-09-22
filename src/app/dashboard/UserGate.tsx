"use client";

export default function UserGate({ error, onRetry }: { error: string | null; onRetry: () => void }) {
    return (
        <div className="w-full py-20 flex flex-col items-center justify-center gap-3">
            {error ? (
                <>
                    <span className="text-sm font-bold text-red-400">{error}</span>
                    <button
                        onClick={onRetry}
                        className="px-4 py-2 text-sm font-bold rounded bg-[var(--brand-blue)] text-white"
                    >
                        Retry
                    </button>
                </>
            ) : (
                <>
                    <div className="w-10 h-10 border-4 border-[var(--brand-blue)] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-bold text-[var(--text-muted)]">Loading metrics...</span>
                </>
            )}
        </div>
    );
}
