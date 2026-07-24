"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface DashboardRoleToastProps {
  message: string;
}

export function DashboardRoleToast({ message }: DashboardRoleToastProps) {
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return; // guards against React Strict Mode's dev double-invoke
    shown.current = true;
    toast(message);
  }, [message]);

  return null;
}
