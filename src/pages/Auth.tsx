import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/components/AuthProvider'
import { Feather, ShieldCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import GoogleIcon from '@/components/icons/GoogleIcon'

const Auth = () => {
  const [searchParams] = useSearchParams()
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { signIn, signUp, signInWithGoogle, user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
    } catch (error: any) {
      toast({ title: 'Something went wrong', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // AUTH-02: redirects to Google; the session is delivered back on return and
  // picked up by AuthProvider's onAuthStateChange (no navigate needed here).
  const handleGoogle = async () => {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (error: any) {
      toast({ title: 'Google sign-in failed', description: error.message, variant: 'destructive' })
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
            <Feather className="h-5 w-5" />
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
        <div className="relative flex items-center gap-2 text-sm text-primary-foreground/70">
          <ShieldCheck className="h-4 w-4" />
          Human-in-the-loop by design — never automated grading.
        </div>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/70 p-8 shadow-md animate-fade-up">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Feather className="h-5 w-5" />
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
            <GoogleIcon className="mr-2 h-4 w-4" />
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ms. Rivera" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@school.edu" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'One moment…' : isLogin ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "New to aiTA?" : 'Already have an account?'}{' '}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="font-medium text-primary underline-offset-4 hover:underline">
              {isLogin ? 'Create an account' : 'Sign in'}
            </button>
          </div>
        </Card>
      </main>
    </div>
  )
}

export default Auth
