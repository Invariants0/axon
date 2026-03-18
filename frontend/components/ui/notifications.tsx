"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { Notification } from "@/types";

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: "border-emerald-500/30 bg-emerald-950/80 text-emerald-400",
  error: "border-red-500/30 bg-red-950/80 text-red-400",
  warning: "border-yellow-500/30 bg-yellow-950/80 text-yellow-400",
  info: "border-blue-500/30 bg-blue-950/80 text-blue-400",
};

const GLOW = {
  success: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
  error: "shadow-[0_0_20px_rgba(239,68,68,0.15)]",
  warning: "shadow-[0_0_20px_rgba(234,179,8,0.15)]",
  info: "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
};

function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: (id: string) => void;
}) {
  const Icon = ICONS[notification.type];

  useEffect(() => {
    if (!notification.autoDismiss) return;
    const timer = setTimeout(() => onDismiss(notification.id), 5000);
    return () => clearTimeout(timer);
  }, [notification.id, notification.autoDismiss, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`flex items-start gap-3 p-3 pr-2 rounded-xl border backdrop-blur-xl ${STYLES[notification.type]} ${GLOW[notification.type]} max-w-[340px] min-w-[240px]`}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <p className="flex-1 text-xs leading-relaxed font-medium">{notification.message}</p>
      <button
        onClick={() => onDismiss(notification.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

export function NotificationBar() {
  const { notifications, dismissNotification } = useAppStore();

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {notifications.map((n) => (
          <NotificationItem
            key={n.id}
            notification={n}
            onDismiss={dismissNotification}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Utility to imperatively fire notifications (for use outside React tree)
export function useNotify() {
  return useAppStore((s) => s.addNotification);
}
