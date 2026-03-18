export type Difficulty = "Easy" | "Medium" | "Hard" | "NA";
export type ItemType = "Question" | "Topic" | "Note";

export type RevisionItem = {
  id: string;
  uid: string;
  subject: string; // DSA / DBMS / CN / OOPS / System Design / custom
  type: ItemType;
  title: string;
  link?: string;
  tags: string[];
  difficulty: Difficulty;
  notes: string;
  createdAt: number; // ms
  updatedAt: number; // ms

  nextRevisionAt: number; // ms
  revisionIntervalDays: number; // user-chosen
  important: boolean;

  // notifications
  remindPush: boolean;
};

export type CalendarEvent = {
  id: string;
  uid: string;
  title: string;
  date: string; // yyyy-MM-dd
  time?: string; // HH:mm
  kind: "revision" | "important" | "interview" | "schedule";
  itemId?: string;
  link?: string;
};

