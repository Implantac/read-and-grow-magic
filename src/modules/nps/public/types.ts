export type QType = 'text' | 'number' | 'stars' | 'radio' | 'checkbox' | 'dropdown' | 'likert' | 'emoji' | 'multi_choice' | 'date' | 'file';

export interface Question {
  id: string;
  order_index: number;
  question_text: string;
  question_type: QType;
  required: boolean;
  options: any;
}

export const EMOJIS = ['😡', '😞', '😐', '🙂', '😍'];
