import Link from "next/link";

import { DefaultAvatar } from "@/components/ui/DefaultAvatar";

export type TutorCardData = {
  id: string;
  name: string;
  subjects: string[];
  bio: string;
  education: string;
  experience: string;
  photoUrl: string | null;
};

export function TutorCard({ tutor }: { tutor: TutorCardData }) {
  const tagline = tutor.bio || tutor.experience || "학생에게 맞는 수업을 설계합니다.";

  return (
    <article className="flex h-full flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
          {tutor.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tutor.photoUrl}
              alt={`${tutor.name} 프로필 사진`}
              className="h-full w-full object-cover"
            />
          ) : (
            <DefaultAvatar size={80} className="rounded-2xl" />
          )}
        </div>

        <div className="min-w-0">
          <h3 className="text-lg font-black text-text-primary">{tutor.name} 선생님</h3>
          <p className="mt-1 text-sm font-semibold text-primary">
            {tutor.subjects.length > 0 ? tutor.subjects.join(" · ") : "담당 과목 협의"}
          </p>
        </div>
      </div>

      <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-text-secondary">
        {tagline}
      </p>

      <dl className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-xs">
        {tutor.education ? (
          <div>
            <dt className="font-bold text-text-primary">학력</dt>
            <dd className="mt-0.5 text-text-muted">{tutor.education}</dd>
          </div>
        ) : null}
        {tutor.experience ? (
          <div>
            <dt className="font-bold text-text-primary">경력</dt>
            <dd className="mt-0.5 text-text-muted">{tutor.experience}</dd>
          </div>
        ) : null}
      </dl>

      <Link
        href={`/tutors/${tutor.id}`}
        className="mt-auto inline-flex pt-6 text-sm font-bold text-primary underline-offset-4 hover:underline"
      >
        자세히 보기
      </Link>
    </article>
  );
}
