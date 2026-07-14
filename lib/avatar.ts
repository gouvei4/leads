const AVATAR_COLORS = [
  "#5b8cff",
  "#a78bfa",
  "#4fb3e0",
  "#e3a63a",
  "#34c78a",
  "#ef5a67",
  "#f0729a",
  "#7dd3c0",
];

export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]!;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0]![0] + (parts[1]?.[0] ?? "")).toUpperCase();
}
