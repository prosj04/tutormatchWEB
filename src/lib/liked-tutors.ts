const STORAGE_KEY = "likedTutors";

export function getLikedTutors(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function isLiked(tutorId: string): boolean {
  return getLikedTutors().includes(tutorId);
}

export function toggleLike(tutorId: string): boolean {
  const current = getLikedTutors();
  const next = current.includes(tutorId)
    ? current.filter((id) => id !== tutorId)
    : [...current, tutorId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next.includes(tutorId);
}

export function mockLikeCount(tutorId: string): number {
  let hash = 0;
  for (let i = 0; i < tutorId.length; i++) {
    hash = (hash + tutorId.charCodeAt(i) * (i + 1)) % 1000;
  }
  return 12 + (hash % 78);
}
