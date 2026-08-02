import { describe, expect, it } from 'vitest';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_RESET_CONFIRMATION,
  clearPasswordRecoveryIntent,
  getInitialPasswordRecoveryIntent,
  getPasswordResetRedirectUrl,
  isPasswordRecoveryCallbackUrl,
  rememberPasswordRecoveryIntent,
  validateNewPassword,
} from './passwordRecovery';

const createMemoryStorage = () => {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    values,
  };
};

describe('password recovery helpers', () => {
  it('builds the callback from the current origin without a hard-coded host', () => {
    expect(getPasswordResetRedirectUrl('https://preview.example.test')).toBe(
      'https://preview.example.test/auth/reset-password',
    );
    expect(getPasswordResetRedirectUrl('http://localhost:8080')).toBe(
      'http://localhost:8080/auth/reset-password',
    );
  });

  it('uses a non-enumerating reset confirmation', () => {
    expect(PASSWORD_RESET_CONFIRMATION).toContain('If an account exists');
    expect(PASSWORD_RESET_CONFIRMATION).not.toMatch(/account (?:was|is) found/i);
  });

  it('recognizes exact recovery callbacks in query or hash parameters', () => {
    expect(isPasswordRecoveryCallbackUrl('https://preview.example.test/auth/reset-password?type=recovery')).toBe(true);
    expect(isPasswordRecoveryCallbackUrl('https://preview.example.test/auth/reset-password#type=recovery&access_token=secret')).toBe(true);
    expect(isPasswordRecoveryCallbackUrl('https://preview.example.test/auth/reset-password?code=abc')).toBe(false);
    expect(isPasswordRecoveryCallbackUrl('https://preview.example.test/auth/reset-password#note=type%3Drecovery')).toBe(false);
    expect(isPasswordRecoveryCallbackUrl('https://preview.example.test/?type=recovery')).toBe(false);
    expect(isPasswordRecoveryCallbackUrl('not a URL')).toBe(false);
  });

  it('persists only a tab-scoped intent marker across reloads', () => {
    const storage = createMemoryStorage();
    const callbackUrl = 'https://preview.example.test/auth/reset-password#type=recovery&access_token=never-store-me';

    expect(getInitialPasswordRecoveryIntent(callbackUrl, storage)).toBe(true);
    expect([...storage.values.values()]).toEqual(['1']);
    expect(getInitialPasswordRecoveryIntent('https://preview.example.test/auth/reset-password', storage)).toBe(true);

    clearPasswordRecoveryIntent(storage);
    expect(getInitialPasswordRecoveryIntent('https://preview.example.test/auth/reset-password', storage)).toBe(false);
  });

  it('can remember recovery intent from the auth event without storing session data', () => {
    const storage = createMemoryStorage();

    rememberPasswordRecoveryIntent(storage);
    expect([...storage.values.values()]).toEqual(['1']);
    clearPasswordRecoveryIntent(storage);
    expect(storage.values.size).toBe(0);
  });

  it('fails closed when tab-scoped storage is unavailable', () => {
    const unavailableStorage = {
      getItem: () => {
        throw new Error('storage blocked');
      },
      setItem: () => {
        throw new Error('storage blocked');
      },
      removeItem: () => {
        throw new Error('storage blocked');
      },
    };

    expect(
      getInitialPasswordRecoveryIntent(
        'https://preview.example.test/auth/reset-password?type=recovery',
        unavailableStorage,
      ),
    ).toBe(true);
    expect(
      getInitialPasswordRecoveryIntent(
        'https://preview.example.test/auth/reset-password',
        unavailableStorage,
      ),
    ).toBe(false);
    expect(() => rememberPasswordRecoveryIntent(unavailableStorage)).not.toThrow();
    expect(() => clearPasswordRecoveryIntent(unavailableStorage)).not.toThrow();
  });

  it('requires a useful minimum password length', () => {
    expect(validateNewPassword('x'.repeat(MIN_PASSWORD_LENGTH - 1), 'x'.repeat(MIN_PASSWORD_LENGTH - 1))).toBe(
      `Use at least ${MIN_PASSWORD_LENGTH} characters for your new password.`,
    );
  });

  it('requires the confirmation to match', () => {
    expect(validateNewPassword('new-password', 'different-password')).toBe(
      'The passwords do not match. Re-enter them and try again.',
    );
  });

  it('accepts matching passwords and does not block password-manager values', () => {
    expect(validateNewPassword('pasted value from a manager', 'pasted value from a manager')).toBeNull();
  });
});
