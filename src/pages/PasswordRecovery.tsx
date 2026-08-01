import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Feather, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_RESET_CONFIRMATION,
  validateNewPassword,
} from '@/lib/passwordRecovery';

const REQUEST_ERROR = 'We could not request a reset link. Check your connection and try again.';
const UPDATE_ERROR = 'We could not update your password. Request a new reset link and try again.';

type RecoveryShellProps = {
  children: React.ReactNode;
  eyebrow: string;
};

const RecoveryShell = ({ children, eyebrow }: RecoveryShellProps) => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/30 px-4 py-10 sm:px-6">
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.035]"
      aria-hidden="true"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
        backgroundSize: '22px 22px',
      }}
    />
    <main id="main-content" className="relative w-full max-w-md">
      <div className="mb-6 flex items-center justify-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Feather className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="font-display text-2xl font-semibold tracking-tight">aiTA</span>
      </div>
      <Card className="border-border/70 p-6 shadow-lg sm:p-8">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
        {children}
      </Card>
      <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        Your password is handled securely by our authentication provider.
      </p>
    </main>
  </div>
);

const FocusedError = ({ message }: { message: string }) => {
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    errorRef.current?.focus();
  }, [message]);

  return (
    <div
      id="password-recovery-error"
      ref={errorRef}
      role="alert"
      tabIndex={-1}
      className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {message}
    </div>
  );
};

export const ForgotPassword = () => {
  const { requestPasswordReset } = useAuth();
  const emailRef = useRef<HTMLInputElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (submitted) successHeadingRef.current?.focus({ preventScroll: true });
  }, [submitted]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setLoading(true);

    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch {
      setFormError(REQUEST_ERROR);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <RecoveryShell eyebrow="Password recovery">
        <section aria-labelledby="reset-requested-title" className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1
            id="reset-requested-title"
            ref={successHeadingRef}
            tabIndex={-1}
            className="mt-5 font-display text-2xl font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Check your inbox
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground" role="status" aria-live="polite">
            {PASSWORD_RESET_CONFIRMATION}
          </p>
          <Button asChild size="lg" className="mt-7 w-full">
            <Link to="/auth">Back to sign in</Link>
          </Button>
          <button
            type="button"
            className="mt-4 inline-flex min-h-6 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => {
              setSubmitted(false);
              setEmail('');
              window.requestAnimationFrame(() => emailRef.current?.focus());
            }}
          >
            Send a link to another email
          </button>
        </section>
      </RecoveryShell>
    );
  }

  return (
    <RecoveryShell eyebrow="Password recovery">
      <div className="text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <KeyRound className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Enter your account email and we will send a secure reset link.
        </p>
      </div>

      <div className="mt-7">
        {formError && <FocusedError message={formError} />}
        <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loading}>
          <div className="space-y-1.5">
            <Label htmlFor="recovery-email">Email</Label>
            <Input
              ref={emailRef}
              id="recovery-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFormError(null);
              }}
              required
              aria-describedby="recovery-privacy-note"
              placeholder="you@school.edu"
            />
            <p id="recovery-privacy-note" className="text-xs leading-5 text-muted-foreground">
              For your privacy, we will not confirm whether an account exists.
            </p>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Sending secure link…' : 'Send reset link'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remembered your password?{' '}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/auth">
            Back to sign in
          </Link>
        </p>
      </div>
    </RecoveryShell>
  );
};

export const ResetPassword = () => {
  const { loading: authLoading, passwordRecovery, session, updatePassword } = useAuth();
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<'password' | 'confirmation' | null>(null);

  useEffect(() => {
    if (updated) successHeadingRef.current?.focus({ preventScroll: true });
  }, [updated]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setInvalidField(null);

    const validationError = validateNewPassword(password, confirmation);
    if (validationError) {
      setFormError(validationError);
      setInvalidField(password.length < MIN_PASSWORD_LENGTH ? 'password' : 'confirmation');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setUpdated(true);
      setPassword('');
      setConfirmation('');
    } catch {
      setFormError(UPDATE_ERROR);
      setInvalidField(null);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <RecoveryShell eyebrow="Secure password update">
        <p className="text-center text-sm text-muted-foreground" role="status" aria-live="polite">
          Verifying your reset link…
        </p>
      </RecoveryShell>
    );
  }

  if (updated) {
    return (
      <RecoveryShell eyebrow="Secure password update">
        <section className="text-center" aria-labelledby="password-updated-title">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1
            id="password-updated-title"
            ref={successHeadingRef}
            tabIndex={-1}
            className="mt-5 font-display text-2xl font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Password updated
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground" role="status" aria-live="polite">
            Your new password is ready. You can continue to your grading workspace.
          </p>
          <Button asChild size="lg" className="mt-7 w-full">
            <Link to="/">Continue to aiTA</Link>
          </Button>
        </section>
      </RecoveryShell>
    );
  }

  if (!session || !passwordRecovery) {
    return (
      <RecoveryShell eyebrow="Secure password update">
        <section className="text-center" aria-labelledby="expired-reset-title">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <KeyRound className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 id="expired-reset-title" className="mt-5 font-display text-2xl font-semibold tracking-tight">
            This reset link is not valid
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            It may have expired or already been used. Request a fresh link to continue.
          </p>
          <Button asChild size="lg" className="mt-7 w-full">
            <Link to="/auth/forgot-password">Request a new link</Link>
          </Button>
          <Link
            className="mt-4 inline-flex min-h-6 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
            to="/auth"
          >
            Back to sign in
          </Link>
        </section>
      </RecoveryShell>
    );
  }

  return (
    <RecoveryShell eyebrow="Secure password update">
      <div className="text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <KeyRound className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">Choose a new password</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Use a unique password you do not use for another service.
        </p>
      </div>

      <div className="mt-7">
        {formError && <FocusedError message={formError} />}
        <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              name="new-password"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setFormError(null);
                setInvalidField(null);
              }}
              required
              aria-invalid={invalidField === 'password' || undefined}
              aria-describedby={
                invalidField === 'password'
                  ? 'new-password-requirements password-recovery-error'
                  : 'new-password-requirements'
              }
            />
            <p id="new-password-requirements" className="text-xs leading-5 text-muted-foreground">
              Use at least {MIN_PASSWORD_LENGTH} characters. Paste and password managers are supported.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-new-password">Confirm new password</Label>
            <Input
              id="confirm-new-password"
              name="confirm-new-password"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              value={confirmation}
              onChange={(event) => {
                setConfirmation(event.target.value);
                setFormError(null);
                setInvalidField(null);
              }}
              required
              aria-invalid={invalidField === 'confirmation' || undefined}
              aria-describedby={
                invalidField === 'confirmation' ? 'password-recovery-error' : undefined
              }
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Updating password…' : 'Update password'}
          </Button>
        </form>
      </div>
    </RecoveryShell>
  );
};
