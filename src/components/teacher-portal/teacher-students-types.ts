export type StudentListItem = {
  id: string;
  name: string;
  grade: string;
  subjects: string;
  phone: string;
  startDate: string;
  firstLessonAt: string | null;
};

export type StudyTaskItem = {
  id: string;
  title: string;
  source?: string;
  isDone: boolean;
  doneAt: string | null;
  order: number;
};

export type StudyPlanItem = {
  id: string;
  date: string;
  comment: string | null;
  commentAt: string | null;
  commentBy: string | null;
  tasks: StudyTaskItem[];
};

export type HomeworkTemplate = {
  id: string;
  name: string;
  days: 4 | 7;
  tasks: string;
  studentId: string | null;
  updatedAt: string;
};

export type QuestionItem = {
  id: string;
  date: string;
  content: string;
  imageUrl: string | null;
  aiAnswer: string | null;
  teacherAnswer: string | null;
  teacherAnswerAt: string | null;
  isResolved: boolean;
  createdAt: string;
};
