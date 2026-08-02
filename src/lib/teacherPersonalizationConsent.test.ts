import { describe, expect, it } from 'vitest';

import { canUseTeacherPersonalization } from '../../supabase/functions/_shared/grading/teacher-personalization';

describe('teacher personalization consent', () => {
  it('allows personalization only for an explicit current opt in', () => {
    expect(canUseTeacherPersonalization({ allow_training_on_content: true })).toBe(true);
    expect(canUseTeacherPersonalization({ allow_training_on_content: false })).toBe(false);
    expect(canUseTeacherPersonalization({})).toBe(false);
    expect(canUseTeacherPersonalization(null)).toBe(false);
    expect(canUseTeacherPersonalization(undefined)).toBe(false);
  });

  it('fails closed for legacy or malformed values', () => {
    expect(canUseTeacherPersonalization({ allow_training_on_content: 'true' })).toBe(false);
    expect(canUseTeacherPersonalization({ allow_training_on_content: 1 })).toBe(false);
  });
});
