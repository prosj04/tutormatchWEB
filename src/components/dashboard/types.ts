export type StudyTask = {
  id: string;
  title: string;
  isDone: boolean;
  doneAt: string | null;
  order: number;
};

export type StudyPlan = {
  id: string;
  date: string;
  comment: string | null;
  commentAt: string | null;
  commentBy: string | null;
  tasks: StudyTask[];
};

export type RecentPlanOption = {
  date: string;
  taskCount: number;
};

export type Question = {
  id: string;
  date: string;
  content: string;
  imageUrl: string | null;
  aiAnswer: string | null;
  teacherAnswer: string | null;
  teacherAnswerAt: string | null;
  answeredBy: string | null;
  isResolved: boolean;
  createdAt: string;
};
