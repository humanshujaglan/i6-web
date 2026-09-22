"use client";

import { ReactNode, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "@/app/context/ThemeContext";

const MetalFxDynamic = dynamic(
    () => import("metal-fx").then((mod) => mod.MetalFx),
    { ssr: false }
);

interface MetalBorderProps {
    children: ReactNode;
    preset?: "chromatic" | "silver" | "gold";
    variant?: "button" | "circle";
    borderRadius?: number;
    className?: string;
    strength?: number;
    innerShadow?: boolean;
    style?: React.CSSProperties;
}

export default function MetalBorder({
    children,
    preset = "chromatic",
    variant = "button",
    borderRadius = 37,
    className = "",
    strength = 1,
    innerShadow = true,
    style,
}: MetalBorderProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = theme === "dark";
    const baseBackground = isDark ? "#191d24" : "#F4F4F7";

    if (!mounted) {
        return (
            <div
                className={`rounded-[37px] border transition-all ${className}`}
                style={{
                    background: baseBackground,
                    borderColor: isDark ? "rgba(252, 213, 53, 0.2)" : "rgba(0, 114, 237, 0.15)",
                    ...style,
                }}
            >
                {children}
            </div>
        );
    }

    return (
        <MetalFxDynamic
            preset={preset}
            variant={variant}
            theme={isDark ? "dark" : "light"}
            strength={strength}
            borderRadius={borderRadius}
            innerShadow={innerShadow}
            className={className}
            style={{
                background: baseBackground,
                borderRadius,
                ...style,
            }}
        >
            {children}
        </MetalFxDynamic>
    );
}
