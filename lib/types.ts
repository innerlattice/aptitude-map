export type RatingValue = number | null;

export interface ProfileRecord {
  id: string;
  schemaVersion: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionSetRecord {
  id: string;
  profileId: string;
  code: string;
  title: string;
  description: string;
  position: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionRecord {
  id: string;
  questionSetId: string;
  code: string;
  title: string;
  detail: string;
  position: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResponseRecord {
  id: string;
  questionId: string;
  ability: RatingValue;
  energy: RatingValue;
  criticality: RatingValue;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface AptitudeProfile {
  schemaVersion: 2;
  profile: ProfileRecord;
  questionSets: QuestionSetRecord[];
  questions: QuestionRecord[];
  responses: ResponseRecord[];
}

export type Mutation =
  | {
      type: "updateResponse";
      responseId: string;
      field: "ability" | "energy" | "criticality" | "note";
      value: number | string | null;
    }
  | {
      type: "updateQuestionSet";
      questionSetId: string;
      field: "code" | "title" | "description";
      value: string;
    }
  | {
      type: "updateQuestion";
      questionId: string;
      field: "code" | "title" | "detail";
      value: string;
    }
  | { type: "addQuestionSet" }
  | { type: "addQuestion"; questionSetId: string }
  | {
      type: "setQuestionSetArchived";
      questionSetId: string;
      archived: boolean;
    }
  | {
      type: "setQuestionArchived";
      questionId: string;
      archived: boolean;
    }
  | { type: "reorderQuestionSets"; orderedIds: string[] }
  | {
      type: "reorderQuestions";
      questionSetId: string;
      orderedIds: string[];
    };
