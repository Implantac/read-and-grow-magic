export type QType = 'text' | 'number' | 'stars' | 'radio' | 'checkbox' | 'dropdown' | 'likert' | 'emoji' | 'multi_choice' | 'date' | 'file';

export type QuestionOption = string | number | { label?: string; value?: string | number };

export type QuestionOptions =
  | QuestionOption[]
  | { choices?: QuestionOption[]; labels?: QuestionOption[] }
  | null
  | undefined;

export type AnswerValue = string | number | string[] | undefined;

export type AnswerMap = Record<string, AnswerValue>;

export interface Question {
  id: string;
  order_index: number;
  question_text: string;
  question_type: QType;
  required: boolean;
  options: QuestionOptions;
}

export interface PublicSurveyCampaign {
  primary_color?: string | null;
  logo_url?: string | null;
  title?: string | null;
  subtitle?: string | null;
  message?: string | null;
}

export interface PublicSurvey {
  campaign: PublicSurveyCampaign;
  company?: { name?: string | null; logo_url?: string | null } | null;
  questions?: Question[];
}

export const EMOJIS = ['😡', '😞', '😐', '🙂', '😍'];
