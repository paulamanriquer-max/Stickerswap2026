import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

interface SignInScreenProps {
  onNavigate?: (screen: string) => void;
}

export function SignInScreen({ onNavigate }: SignInScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    if (!email.trim()) { setEmailError(true); hasError = true; }
    if (!password.trim()) { setPasswordError(true); hasError = true; }
    if (hasError) return;
    onNavigate?.('matches');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-6 pt-6 shrink-0">
        <button
          onClick={() => onNavigate?.('welcome')}
          className="flex items-center gap-2 text-muted-foreground active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium text-sm">Back</span>
        </button>
      </div>

      {/* Scrollable content */}
      <form onSubmit={handleSignIn} className="flex-1 flex flex-col px-6 pt-10 pb-6 overflow-y-auto">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue collecting</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(false); }}
                onBlur={() => { if (!email.trim()) setEmailError(true); }}
                placeholder="Enter your email"
                className={`w-full h-12 pl-8 pr-4 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground placeholder:text-muted-foreground ${
                  emailError ? 'border-destructive focus:ring-destructive/50 focus:border-destructive' : 'border-border/50 focus:ring-primary/50 focus:border-primary'
                }`}
                required
              />
            </div>
            {emailError && <p className="mt-1.5 text-xs text-destructive">Email is required</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Password</label>
              <button
                type="button"
                onClick={() => onNavigate?.('reset-password')}
                className="text-xs text-primary font-medium active:scale-95 transition-transform"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(false); }}
                onBlur={() => { if (!password.trim()) setPasswordError(true); }}
                placeholder="Enter your password"
                className={`w-full h-12 pl-8 pr-4 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground placeholder:text-muted-foreground ${
                  passwordError ? 'border-destructive focus:ring-destructive/50 focus:border-destructive' : 'border-border/50 focus:ring-primary/50 focus:border-primary'
                }`}
                required
              />
            </div>
            {passwordError && <p className="mt-1.5 text-xs text-destructive">Password is required</p>}
          </div>
        </div>
      </form>

      {/* Sticky bottom — identical height on both screens */}
      <div className="shrink-0 px-6 pt-4 pb-10 bg-background">
        <button
          type="submit"
          form="sign-in-form"
          onClick={handleSignIn as any}
          className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-primary/30"
        >
          Sign In
        </button>
        <p className="text-center mt-5 text-sm text-muted-foreground">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate?.('sign-up')}
            className="text-primary font-bold active:scale-95 transition-transform"
          >
            Sign Up
          </button>
        </p>
        <button
          type="button"
          onClick={() => onNavigate?.('admin-login')}
          className="w-full mt-6 text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors text-center tracking-widest uppercase"
        >
          Admin
        </button>
      </div>
    </div>
  );
}
