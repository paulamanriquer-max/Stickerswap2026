import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface ResetPasswordScreenProps {
  onNavigate?: (screen: string) => void;
}

export function ResetPasswordScreen({ onNavigate }: ResetPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState(false);

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError(true);
      return;
    }

    // Handle password reset logic
    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="px-4 pt-6">
          <button
            onClick={() => onNavigate?.('sign-in')}
            className="flex items-center gap-2 text-muted-foreground active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium text-sm">Back to Sign In</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center px-4 pb-20">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2 text-center">Check Your Email</h1>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-8">
            We've sent a password reset link to <span className="font-semibold text-foreground">{email}</span>
          </p>
          <button
            onClick={() => onNavigate?.('sign-in')}
            className="w-full max-w-sm h-12 bg-primary text-primary-foreground rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-primary/30"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-4 pt-6">
        <button
          onClick={() => onNavigate?.('sign-in')}
          className="flex items-center gap-2 text-muted-foreground active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium text-sm">Back</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Reset Password</h1>
          <p className="text-sm text-muted-foreground">Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(false);
                }}
                onBlur={() => {
                  if (!email.trim()) setEmailError(true);
                }}
                placeholder="Enter your email"
                className={`w-full h-12 pl-8 pr-4 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground placeholder:text-muted-foreground ${
                  emailError
                    ? 'border-destructive focus:ring-destructive/50 focus:border-destructive'
                    : 'border-border/50 focus:ring-primary/50 focus:border-primary'
                }`}
                required
              />
            </div>
            {emailError && (
              <div className="mt-2 text-sm text-destructive">
                Email is required
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-primary/30"
          >
            Send Reset Link
          </button>

          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => onNavigate?.('sign-in')}
              className="text-sm text-primary font-medium active:scale-95 transition-transform"
            >
              Back to Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
