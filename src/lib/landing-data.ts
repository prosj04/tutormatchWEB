import type { ShowcaseTutor } from "./landing-data-types";
import { tutors } from "./tutors-data";

function toShowcase(t: (typeof tutors)[0]): ShowcaseTutor {
  return {
    id: t.id,
    name: t.name,
    subject: t.subjects.slice(0, 2).join(" · "),
    background: t.credentials.find((c) => c.category === "학력")?.title ?? "",
    rating: t.rating,
    image: t.image,
  };
}

export type { ShowcaseTutor } from "./landing-data-types";

export const showcaseTutors: ShowcaseTutor[] = tutors.slice(0, 4).map(toShowcase);

export const heroSampleTutor = showcaseTutors[0];
