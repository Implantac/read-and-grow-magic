// Barrel: split into content-types, content-modules, content-beginner
export type {
  ManualStep,
  ManualSection,
  ManualFAQ,
  ModuleManual,
  Difficulty,
  BeginnerContent,
} from './content-types';

export { MANUAL_MODULES, MANUAL_CATEGORIES } from './content-modules';
export {
  MODULE_DIFFICULTY,
  MODULE_BEGINNER,
  DIFFICULTY_STYLE,
  getBeginner,
  getDifficulty,
} from './content-beginner';
