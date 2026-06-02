import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';

interface SignInScreenProps {
  onNavigate?: (screen: string) => void;
  onEmailSignIn?: (email: string, password: string) => boolean | Promise<boolean>;
}

const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

export function SignInScreen({ onNavigate, onEmailSignIn }: SignInScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    const nextEmailError = !isValidEmail(email.trim());
    const nextPasswordError = !password;
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setAccountError('');
    if (nextEmailError || nextPasswordError) return;

    setIsSubmitting(true);
    try {
      const success = await onEmailSignIn?.(email.trim(), password) ?? false;
      if (!success) setAccountError('Email or password did not match. Try again or reset your password.');
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'ACCOUNT_CONFIRM_EMAIL') {
        setAccountError('Check your email to confirm your account, then come back and log in.');
      } else if (message === 'ACCOUNT_INVALID') {
        setAccountError('Email or password did not match. Try again or reset your password.');
      } else {
        setAccountError('We could not log you in. Check your connection and try again.');
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="h-full min-h-0 bg-background overflow-hidden flex flex-col">
      <div className="px-6 pt-6 shrink-0 flex items-center justify-between">
        <button
          onClick={() => onNavigate?.('welcome')}
          className="flex items-center gap-2 text-muted-foreground active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium text-sm">Back</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.('admin-login')}
          className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors tracking-widest uppercase"
        >
          Admin
        </button>
      </div>

      <form onSubmit={handleLogIn} className="flex-1 min-h-0 flex flex-col px-6 pt-8 pb-4">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Log in</h1>
          <p className="text-sm text-muted-foreground">Access your saved collection</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (emailError) setEmailError(false);
                  if (accountError) setAccountError('');
                }}
                onBlur={() => setEmailError(!isValidEmail(email.trim()))}
                placeholder="you@example.com"
                className={`w-full h-12 pl-8 pr-4 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground placeholder:text-muted-foreground ${
                  emailError || accountError ? 'border-destructive focus:ring-destructive/50 focus:border-destructive' : 'border-border/50 focus:ring-primary/50 focus:border-primary'
                }`}
                required
              />
            </div>
            {emailError && <p className="mt-1.5 text-xs text-destructive">Enter a valid email address</p>}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Password</label>
              <button
                type="button"
                onClick={() => onNavigate?.('reset-password')}
                className="text-xs font-semibold text-primary active:scale-95 transition-transform"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (passwordError) setPasswordError(false);
                  if (accountError) setAccountError('');
                }}
                placeholder="Enter your password"
                className={`w-full h-12 pl-8 pr-11 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground placeholder:text-muted-foreground ${
                  passwordError || accountError ? 'border-destructive focus:ring-destructive/50 focus:border-destructive' : 'border-border/50 focus:ring-primary/50 focus:border-primary'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(value => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground active:scale-95 transition-transform"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && <p className="mt-1.5 text-xs text-destructive">Password is required</p>}
          </div>

          {accountError && (
            <p className="text-xs text-destructive">{accountError}</p>
          )}
        </div>
      </form>

      <div className="shrink-0 px-6 pt-4 pb-[calc(24px+env(safe-area-inset-bottom))] bg-background">
        <Button
          onClick={handleLogIn as any}
          fullWidth
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </Button>
        <p className="text-center mt-5 text-sm text-muted-foreground">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate?.('sign-up')}
            className="text-primary font-bold active:scale-95 transition-transform"
          >
            Create account
          </button>
        </p>
      </div>
    </div>
  );
}
