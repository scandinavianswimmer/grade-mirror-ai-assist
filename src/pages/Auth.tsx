import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/components/AuthProvider'
import { Feather, ShieldCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import GoogleIcon from '@/components/icons/GoogleIcon'
import { MIN_PASSWORD_LENGTH } from '@/lib/passwordRecovery'

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }

  return fallback
}

const Auth = () => {
  const [searchParams] = useSearchParams()
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  const { signIn, signUp, signInWithGoogle, user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  useEffect(() => {
    if (formError) errorRef.current?.focus()
  }, [formError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setLoading(true)
    try {
      if (isLogin) {
        await signIn(email, password)
        toast({ title: 'Welcome back', description: 'Signed in to aiTA.' })
        navigate('/')
      } else {
        await signUp(email, password, name)
        toast({ title: 'Account created', description: 'Check your email to verify your account.' })
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Please try again.')
      setFormError(message)
      toast({
        title: 'Something went wrong',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // AUTH-02: redirects to Google; the session is delivered back on return and
  // picked up by AuthProvider's onAuthStateChange (no navigate needed here).
  const handleGoogle = async () => {
    setFormError(null)
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Could not sign in with Google. Please try again.')
      setFormError(message)
      toast({
        title: 'Google sign-in failed',
        description: message,
        variant: 'destructive',
      })
      setGoogleLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand / value panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '22px 22px' }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-foreground/15">
            <Feather className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight">aiTA</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight">
            Grade in your voice. Stay the final word.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-primary-foreground/80">
            aiTA reads, annotates, and proposes rubric-aligned feedback — like a thoughtful TA in the margins.
            You approve, edit, or reject every note.
          </p>
        </div>
        <div className="relative flex items-center gap-2 text-sm text-primary-foreground/80">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Human-controlled by design — unattended publication is opt-in.
        </div>
      </aside>

      {/* Form */}
      <main className="flex min-w-0 items-center justify-center px-4 py-6 sm:p-6">
        <Card className="w-full min-w-0 max-w-md border-border/70 p-5 shadow-md animate-fade-up sm:p-8">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Feather className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-display text-2xl font-semibold tracking-tight">aiTA</span>
            </div>
          </div>

          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isLogin ? 'Sign in to your grading workspace.' : 'Set up your teacher workspace in a minute.'}
          </p>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="mt-7 w-full"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
          >
            <GoogleIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          {formError && (
            <div
              ref={errorRef}
              role="alert"
              tabIndex={-1}
              className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setFormError(null)
                  }}
                  required
                  placeholder="Ms. Rivera"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setFormError(null)
                }}
                required
                placeholder="you@school.edu"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                aria-describedby={isLogin ? undefined : 'password-requirements'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setFormError(null)
                }}
                minLength={isLogin ? undefined : MIN_PASSWORD_LENGTH}
                required
                placeholder="••••••••"
              />
              {!isLogin && (
                <p id="password-requirements" className="text-xs text-muted-foreground">
                  Use at least {MIN_PASSWORD_LENGTH} characters. You can paste or use a password manager.
                </p>
              )}
              {isLogin && (
                <div className="flex justify-end">
                  <Link
                    to="/auth/forgot-password"
                    className="inline-flex min-h-6 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'One moment…' : isLogin ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "New to aiTA?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsLogin((current) => !current)
                setFormError(null)
              }}
              className="inline-flex min-h-6 items-center font-medium text-primary underline-offset-4 hover:underline"
            >
              {isLogin ? 'Create an account' : 'Sign in'}
            </button>
          </div>

          <p className="mt-6 border-t border-border/70 pt-5 text-center text-xs leading-5 text-muted-foreground">
            Launch preview · Read our{' '}
            <Link to="/privacy" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
              Privacy preview
            </Link>{' '}
            and{' '}
            <Link to="/terms" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
              Terms preview
            </Link>
            . Final legal details are pending review.
          </p>
        </Card>
      </main>
    </div>
  )
}

export default Auth
