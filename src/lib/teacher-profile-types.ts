export type EducationEntry = {
  school: string;
  major: string;
  year: string;
};

export type CareerEntry = {
  org: string;
  role: string;
  period: string;
};

export type CertificateEntry = {
  name: string;
  year: string;
};

export type TeacherProfileFormData = {
  photoUrl: string | null;
  intro: string;
  education: EducationEntry[];
  career: CareerEntry[];
  certificates: CertificateEntry[];
  resumeUrls: string[];
  documentUrls: string[];
};

export function emptyEducation(): EducationEntry {
  return { school: "", major: "", year: "" };
}

export function emptyCareer(): CareerEntry {
  return { org: "", role: "", period: "" };
}

export function emptyCertificate(): CertificateEntry {
  return { name: "", year: "" };
}

export function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function profileToFormData(
  profile: {
    photoUrl: string | null;
    intro: string | null;
    education: string | null;
    career: string | null;
    certificates: string | null;
    resumeUrls?: string | null;
    documentUrls?: string | null;
  } | null,
): TeacherProfileFormData {
  return {
    photoUrl: profile?.photoUrl ?? null,
    intro: profile?.intro ?? "",
    education: parseJsonArray<EducationEntry>(profile?.education ?? null),
    career: parseJsonArray<CareerEntry>(profile?.career ?? null),
    certificates: parseJsonArray<CertificateEntry>(profile?.certificates ?? null),
    resumeUrls: parseJsonArray<string>(profile?.resumeUrls ?? null),
    documentUrls: parseJsonArray<string>(profile?.documentUrls ?? null),
  };
}
