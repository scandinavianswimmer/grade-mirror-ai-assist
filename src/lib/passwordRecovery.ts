export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_RESET_CONFIRMATION =
  'If an account exists for that email address, a password reset link is on its way. Check your inbox and spam folder.';

const PASSWORD_RECOVERY_INTENT_KEY = 'aita:password-recovery-intent';

type RecoveryIntentStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const getPasswordResetRedirectUrl = (origin: string): string =>
  new URL('/auth/reset-password', origin).toString();

export const isPasswordRecoveryCallbackUrl = (href: string): boolean => {
  const url = new URL(href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));

  return url.searchParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery';
};

export const getInitialPasswordRecoveryIntent = (
  href: string,
  storage: RecoveryIntentStorage,
): boolean => {
  try {
    if (isPasswordRecoveryCallbackUrl(href)) {
      storage.setItem(PASSWORD_RECOVERY_INTENT_KEY, '1');
      return true;
    }

    return storage.getItem(PASSWORD_RECOVERY_INTENT_KEY) === '1';
  } catch {
    // sessionStorage can be unavailable in hardened browser contexts. The
    // PASSWORD_RECOVERY event remains the source of truth in that case.
    return isPasswordRecoveryCallbackUrl(href);
  }
};

export const rememberPasswordRecoveryIntent = (storage: RecoveryIntentStorage): void => {
  try {
    storage.setItem(PASSWORD_RECOVERY_INTENT_KEY, '1');
  } catch {
    // Recovery still works for the current render via provider state.
  }
};

export const clearPasswordRecoveryIntent = (storage: RecoveryIntentStorage): void => {
  try {
    storage.removeItem(PASSWORD_RECOVERY_INTENT_KEY);
  } catch {
    // A blocked storage API must not prevent password update or sign-out.
  }
};

export const validateNewPassword = (password: string, confirmation: string): string | null => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters for your new password.`;
  }

  if (password !== confirmation) {
    return 'The passwords do not match. Re-enter them and try again.';
  }

  return null;
};
