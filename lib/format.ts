export function fmtDateTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtBytes(n: number) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export type SessionWindow = "upcoming" | "open" | "closed";

export function sessionWindow(startsAt: Date, endsAt: Date, now = new Date()): SessionWindow {
  const opensAt = new Date(startsAt.getTime() - 30 * 60 * 1000);
  if (now < opensAt) return "upcoming";
  if (now > endsAt) return "closed";
  return "open";
}
