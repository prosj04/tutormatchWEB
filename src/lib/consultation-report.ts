const MAX_GOAL_ITEMS = 10;
const MAX_GOAL_LENGTH = 200;

export type ConsultationGoals = {
  quantitative: string[];
  qualitative: string[];
};

/** Safely parse the `goals` JSON string stored in ConsultationReport. */
export function parseGoals(raw: string | null | undefined): ConsultationGoals {
  if (!raw) return { quantitative: [], qualitative: [] };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { quantitative: [], qualitative: [] };
    }
    const obj = parsed as Record<string, unknown>;
    return {
      quantitative: parseStringArray(obj["quantitative"]),
      qualitative: parseStringArray(obj["qualitative"]),
    };
  } catch {
    return { quantitative: [], qualitative: [] };
  }
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Validate and sanitise goals from user input.
 * Returns cleaned goals or an error string.
 */
export function validateGoals(
  raw: unknown,
): { ok: true; goals: ConsultationGoals } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "goals must be an object" };
  }
  const obj = raw as Record<string, unknown>;

  const quantitative = sanitiseItems(obj["quantitative"]);
  const qualitative = sanitiseItems(obj["qualitative"]);

  if (typeof quantitative === "string") return { ok: false, error: `quantitative: ${quantitative}` };
  if (typeof qualitative === "string") return { ok: false, error: `qualitative: ${qualitative}` };

  return { ok: true, goals: { quantitative, qualitative } };
}

function sanitiseItems(
  value: unknown,
): string[] | string {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return "must be an array";
  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  if (cleaned.length > MAX_GOAL_ITEMS) return `too many items (max ${MAX_GOAL_ITEMS})`;
  for (const item of cleaned) {
    if (item.length > MAX_GOAL_LENGTH) {
      return `item too long (max ${MAX_GOAL_LENGTH} chars)`;
    }
  }
  return cleaned;
}

export function hasNonEmptyGoals(goals: ConsultationGoals): boolean {
  return goals.quantitative.length > 0 || goals.qualitative.length > 0;
}

export function serializeGoals(goals: ConsultationGoals): string {
  return JSON.stringify(goals);
}
