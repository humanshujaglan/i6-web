"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TickCircle } from "iconsax-react";

interface CopyAlertProps {
    show: boolean;
    message?: string;
}

export default function CopyAlert({ show, message = "Copied to clipboard!" }: CopyAlertProps) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: -24, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -24, scale: 0.94 }}
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/95 dark:bg-[#14171d]/95 backdrop-blur-md shadow-[0_12px_32px_rgba(0,0,0,0.18)] border border-gray-100 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white"
                >
                    <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <TickCircle size={14} color="currentColor" variant="Bold" />
                    </div>
                    <span>{message}</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
