"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Polls the server component so a waiting student auto-enters the room
// the moment the lecturer goes live.
export default function AutoRefresh({ seconds = 8 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
