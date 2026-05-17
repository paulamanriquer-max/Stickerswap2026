import { User, Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface SignUpScreenProps {
  onNavigate?: (screen: string) => void;
}

export function SignUpScreen({ onNavigate }: SignUpScreenProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullNameError, setFullNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    if (!fullName.trim()) { setFullNameError(true); hasError = true; }
    if (!email.trim()) { setEmailError(true); hasError = true; }
    if (!password.trim()) { setPasswordError(true); hasError = true; }
    if (!confirmPassword.trim()) { setConfirmPasswordError(true); hasError = true; }
    if (password !== confirmPassword) { setPasswordMismatch(true); hasError = true; }
    if (hasError) return;
    onNavigate?.('location-permission');
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
      <form onSubmit={handleSignUp} className="flex-1 flex flex-col px-6 pt-10 pb-6 overflow-y-auto">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Create Account</h1>
          <p className="text-sm text-muted-foreground">Join thousands of collectors worldwide</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); if (fullNameError) setFullNameError(false); }}
                onBlur={() => { if (!fullName.trim()) setFullNameError(true); }}
                placeholder="Enter your full name"
                className={`w-full h-12 pl-8 pr-4 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground placeholder:text-muted-foreground ${
                  fullNameError ? 'border-destructive focus:ring-destructive/50 focus:border-destructive' : 'border-border/50 focus:ring-primary/50 focus:border-primary'
                }`}
                required
              />
            </div>
            {fullNameError && <p className="mt-1.5 text-xs text-destructive">Full name is required</p>}
          </div>

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
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(false); if (passwordMismatch) setPasswordMismatch(false); }}
                onBlur={() => { if (!password.trim()) setPasswordError(true); }}
                placeholder="Create a password"
                className={`w-full h-12 pl-8 pr-10 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground placeholder:text-muted-foreground ${
                  passwordError ? 'border-destructive focus:ring-destructive/50 focus:border-destructive' : 'border-border/50 focus:ring-primary/50 focus:border-primary'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && <p className="mt-1.5 text-xs text-destructive">Password is required</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (confirmPasswordError) setConfirmPasswordError(false); if (passwordMismatch) setPasswordMismatch(false); }}
                onBlur={() => { if (!confirmPassword.trim()) setConfirmPasswordError(true); }}
                placeholder="Confirm your password"
                className={`w-full h-12 pl-8 pr-10 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground placeholder:text-muted-foreground ${
                  confirmPasswordError || passwordMismatch ? 'border-destructive focus:ring-destructive/50 focus:border-destructive' : 'border-border/50 focus:ring-primary/50 focus:border-primary'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPasswordError && <p className="mt-1.5 text-xs text-destructive">Please confirm your password</p>}
            {passwordMismatch && !confirmPasswordError && <p className="mt-1.5 text-xs text-destructive">Passwords do not match</p>}
          </div>
        </div>
      </form>

      {/* Sticky bottom — identical height on both screens */}
      <div className="shrink-0 px-6 pt-4 pb-10 bg-background">
        <button
          type="submit"
          form="sign-up-form"
          onClick={handleSignUp as any}
          className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-primary/30"
        >
          Create Account
        </button>
        <p className="text-center mt-5 text-sm text-muted-foreground">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate?.('sign-in')}
            className="text-primary font-bold active:scale-95 transition-transform"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
