"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import BackButton from "../components/BackButton";
import { useTheme } from "@/app/context/ThemeContext";
import {
    Notification,
    MoneySend,
    ShieldSecurity,
    ArrowRight,
    InfoCircle,
    TickCircle,
} from "iconsax-react";

export default function NotificationsPage() {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const notifications = [
        {
            id: "holding-removed",
            title: "Holding Condition Removed for Withdrawals",
            category: "Policy Update",
            categoryClass: "bg-emerald-500/10 text-emerald-600 dark:text-[#0ecb81] border-emerald-500/20",
            icon: <TickCircle size={22} color="currentColor" className="text-emerald-500 dark:text-[#0ecb81]" />,
            message: "The i6 token holding condition is now removed. You are no longer required to hold equivalent i6 tokens in your wallet to process your withdrawals.",
            actionLabel: "View Withdraw Portal",
            actionHref: "/dashboard/withdraw",
            unread: true,
        },
        {
            id: "min-withdraw",
            title: "Minimum Withdrawal Limit is $20",
            category: "Withdrawal Rule",
            categoryClass: "bg-blue-500/10 text-[#0072ED] dark:text-[#7CD4FD] border-blue-500/20",
            icon: <MoneySend size={22} color="currentColor" className="text-[#0072ED] dark:text-[#FCD535]" />,
            message: "You can now make a withdrawal once your withdrawable rewards reach at least $20. Any amount below $20 cannot be submitted.",
            actionLabel: "View Withdraw Portal",
            actionHref: "/dashboard/withdraw",
            unread: true,
        },
        {
            id: "i6-holding",
            title: "Hold Equivalent i6 Tokens to Withdraw",
            category: "Previous Rule",
            categoryClass: "bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500/20",
            icon: (
                <Image
                    src="/3d-icons/i6-coin-icon.webp"
                    alt="i6 Token"
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full object-contain opacity-60"
                />
            ),
            message: "To withdraw your earnings, you must keep the same dollar value of i6 tokens in your connected wallet. (Note: This condition has now been lifted).",
            actionLabel: "View Withdraw Portal",
            actionHref: "/dashboard/withdraw",
            unread: false,
        },
    ];

    return (
        <div className="dashboard-container relative">
            <div className="dashboard-content-wrapper max-w-lg mx-auto flex flex-col gap-5 py-4 pb-28">
                {/* Top Navigation Bar with Back Button */}
                <div className="flex items-center justify-between py-1">
                    <BackButton href="/dashboard" />

                    <div className="flex items-center gap-1.5">
                        <span className="text-base font-semibold text-[#0f172a] dark:text-white">
                            Notifications
                        </span>
                    </div>

                    <div className="w-11 h-11 flex items-center justify-center rounded-full bg-[#F4F4F7] dark:bg-[#14171d] text-gray-700 dark:text-white">
                        <Notification size={18} color="currentColor" />
                    </div>
                </div>

                {/* Summary Header */}
                <div className="bg-[#F4F4F7] dark:bg-[#14171d] rounded-[24px] p-4 sm:p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#191d24] flex items-center justify-center text-[#0072ED] dark:text-[#FCD535] shadow-xs">
                            <InfoCircle size={20} color="currentColor" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                                System Announcements
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-[#848e9c]">
                                Important updates for your account
                            </p>
                        </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-white dark:bg-[#191d24] text-xs font-bold text-[#0072ED] dark:text-[#FCD535] shadow-xs">
                        {notifications.length} Updates
                    </span>
                </div>

                {/* Notification List */}
                <div className="flex flex-col gap-3.5">
                    {notifications.map((item) => (
                        <div
                            key={item.id}
                            className="rounded-[22px] p-5 flex flex-col gap-3.5 transition-all duration-200 border"
                            style={{
                                background: isDark
                                    ? "linear-gradient(135deg, #14171d 0%, #0a0c0f 100%)"
                                    : "linear-gradient(135deg, rgba(201, 224, 255, 0.65) 0%, #FFFFFF 85%)",
                                borderColor: isDark
                                    ? "rgba(255, 255, 255, 0.12)"
                                    : "#FFFFFF",
                                boxShadow: isDark
                                    ? "inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 4px 14px rgba(0, 0, 0, 0.35)"
                                    : "0 3px 12px rgba(12, 50, 99, 0.06)",
                            }}
                        >
                            {/* Card Header: Icon + Category Badge + Unread Indicator */}
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-full bg-white dark:bg-[#191d24] flex items-center justify-center shadow-xs shrink-0">
                                        {item.icon}
                                    </div>
                                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${item.categoryClass}`}>
                                        {item.category}
                                    </span>
                                </div>

                                {item.unread && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                        New
                                    </span>
                                )}
                            </div>

                            {/* Card Title & Content */}
                            <div className="flex flex-col gap-1.5">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                    {item.title}
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-[#848e9c] leading-relaxed">
                                    {item.message}
                                </p>
                            </div>

                            {/* Action Link Button */}
                            <div className="pt-2 border-t border-dashed border-gray-200/90 dark:border-white/10 flex justify-end">
                                <Link
                                    href={item.actionHref}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0072ED] dark:text-[#FCD535] hover:underline"
                                >
                                    <span>{item.actionLabel}</span>
                                    <ArrowRight size={14} color="currentColor" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
