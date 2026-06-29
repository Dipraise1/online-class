"use client";

import { useState } from "react";

export default function CopyLink({ path, label = "Copy invite link" }: { path: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.origin + path);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard blocked */
        }
      }}
      className="rounded-lg border border-line-2 px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:bg-paper-2"
    >
      {done ? "✓ Link copied" : `🔗 ${label}`}
    </button>
  );
}
