import { getCmsSectionValue } from "@/lib/cms-page-defaults";

export type ProfileGender = "MALE" | "FEMALE";

const DEFAULT_MALE = "/images/teachers/default-male.png";
const DEFAULT_FEMALE = "/images/teachers/default-female.png";

export function parseProfileGender(value: unknown): ProfileGender | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toUpperCase();
  if (v === "FEMALE" || v === "여" || v === "여성") return "FEMALE";
  if (v === "MALE" || v === "남" || v === "남성") return "MALE";
  return null;
}

/** CMS 강사진 탭 기본 사진 — 선생님·학생 공통 */
export function getGenderDefaultPhotoUrl(
  gender: string | null | undefined,
  siteContent?: Record<string, Record<string, string>>,
): string {
  const male = getCmsSectionValue(
    siteContent,
    "tutors_page",
    "public_photo_male",
    DEFAULT_MALE,
  );
  const female = getCmsSectionValue(
    siteContent,
    "tutors_page",
    "public_photo_female",
    DEFAULT_FEMALE,
  );
  if (gender === "FEMALE") return female;
  return male;
}

export function getEffectivePhotoUrl(
  photoUrl: string | null | undefined,
  gender: string | null | undefined,
  siteContent?: Record<string, Record<string, string>>,
): string {
  if (photoUrl?.trim()) return photoUrl.trim();
  return getGenderDefaultPhotoUrl(gender, siteContent);
}
