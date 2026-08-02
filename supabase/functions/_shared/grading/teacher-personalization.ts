export type TeacherPersonalizationPrivacy = {
  allow_training_on_content?: unknown;
} | null | undefined;

/**
 * Personalization is allowed only by an explicit, currently-active opt in.
 * Missing rows, legacy schemas, and non-boolean values all fail closed.
 */
export function canUseTeacherPersonalization(privacy: TeacherPersonalizationPrivacy): boolean {
  return privacy?.allow_training_on_content === true;
}
