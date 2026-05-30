import { ArrowLeft, CheckCircle, Eye, EyeOff, Lock, Mail, ShieldQuestion } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';

interface ResetPasswordScreenProps {
  onNavigate?: (screen: string) => void;
  onLookupRecoveryQuestion?: (email: string) => string | null | Promise<string | null>;
  onVerifyRecoveryAnswer?: (email: string, answer: string) => boolean | Promise<boolean>;
  onResetPassword?: (email: string, answer: string, password: string) => boolean | Promise<boolean>;
}

type RecoveryStep = 'email' | 'verify' | 'password';

const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
const isValidPassword = (password: string) => password.length >= 8;

export function ResetPasswordScreen({
  onNavigate,
  onLookupRecoveryQuestion,
  onVerifyRecoveryAnswer,
  onResetPassword,
}: ResetPasswordScreenProps) {
  const [step, setStep] = useState<RecoveryStep>('email');
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [answerError, setAnswerError] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goBack = () => {
    if (step === 'password') {
      setStep('verify');
      return;
    }
    if (step === 'verify') {
      setStep('email');
      return;
    }
    onNavigate?.('sign-in');
  };

  const handleFindAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    const normalizedEmail = email.trim();
    if (!isValidEmail(normalizedEmail)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setIsSubmitting(true);
    const recoveryQuestion = await onLookupRecoveryQuestion?.(normalizedEmail);
    if (!recoveryQuestion) {
      setEmailError('No account with recovery setup was found for this email');
      setIsSubmitting(false);
      return;
    }
    setEmailError('');
    setQuestion(recoveryQuestion);
    setStep('verify');
    setIsSubmitting(false);
  };

  const handleVerifyAnswer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (answer.trim().length < 2) {
      setAnswerError('Enter your recovery answer');
      return;
    }
    setIsSubmitting(true);
    const verified = await onVerifyRecoveryAnswer?.(email.trim(), answer.trim()) ?? false;
    if (!verified) {
      setAnswerError('That answer does not match this account');
      setIsSubmitting(false);
      return;
    }
    setAnswerError('');
    setStep('password');
    setIsSubmitting(false);
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    const nextPasswordError = !isValidPassword(password);
    setPasswordError(nextPasswordError);
    if (nextPasswordError) return;

    setIsSubmitting(true);
    const success = await onResetPassword?.(email.trim(), answer.trim(), password) ?? false;
    if (!success) {
      setAnswerError('We could not reset this password. Try the recovery answer again.');
      setStep('verify');
      setIsSubmitting(false);
      return;
    }
    setIsComplete(true);
    setIsSubmitting(false);
  };

  const submitHandler = step === 'email'
    ? handleFindAccount
    : step === 'verify'
      ? handleVerifyAnswer
      : handleResetPassword;

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex flex-col justify-center items-center px-6 pb-20">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2 text-center">Password updated</h1>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-8">
            Your collection is still saved. Log in with your new password.
          </p>
          <div className="w-full max-w-sm">
            <Button onClick={() => onNavigate?.('sign-in')} fullWidth>
              Log in
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-6 pt-6 shrink-0">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-muted-foreground active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium text-sm">Back</span>
        </button>
      </div>

      <form onSubmit={submitHandler} className="flex-1 flex flex-col px-6 pt-10 pb-6 overflow-y-auto">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Reset password</h1>
          <p className="text-sm text-muted-foreground">
            {step === 'email' && 'Enter your account email to find your recovery question'}
            {step === 'verify' && 'Answer your security question to protect your sticker data'}
            {step === 'password' && 'Choose a new password for your account'}
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className={`h-1.5 rounded-full ${step === 'email' ? 'bg-primary' : 'bg-primary/50'}`} />
            <div className={`h-1.5 rounded-full ${step === 'verify' ? 'bg-primary' : step === 'password' ? 'bg-primary/50' : 'bg-card/60'}`} />
            <div className={`h-1.5 rounded-full ${step === 'password' ? 'bg-primary' : 'bg-card/60'}`} />
          </div>
        </div>

        {step === 'email' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (emailError) setEmailError('');
                }}
                placeholder="you@example.com"
                className={`w-full h-12 pl-8 pr-4 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground placeholder:text-muted-foreground ${
                  emailError ? 'border-destructive focus:ring-destructive/50 focus:border-destructive' : 'border-border/50 focus:ring-primary/50 focus:border-primary'
                }`}
                required
              />
            </div>
            {emailError && <p className="mt-1.5 text-xs text-destructive">{emailError}</p>}
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-5">
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
              <div className="flex gap-3">
                <ShieldQuestion className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Security question</p>
                  <p className="text-sm font-bold text-foreground">{question}</p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Answer</label>
              <input
                type="text"
                value={answer}
                onChange={(event) => {
                  setAnswer(event.target.value);
                  if (answerError) setAnswerError('');
                }}
                placeholder="Your answer"
                className={`w-full h-12 px-4 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground placeholder:text-muted-foreground ${
                  answerError ? 'border-destructive focus:ring-destructive/50 focus:border-destructive' : 'border-border/50 focus:ring-primary/50 focus:border-primary'
                }`}
                autoCapitalize="words"
                required
              />
              {answerError && <p className="mt-1.5 text-xs text-destructive">{answerError}</p>}
            </div>
          </div>
        )}

        {step === 'password' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">New password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (passwordError) setPasswordError(false);
                }}
                placeholder="At least 8 characters"
                className={`w-full h-12 pl-8 pr-11 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground placeholder:text-muted-foreground ${
                  passwordError ? 'border-destructive focus:ring-destructive/50 focus:border-destructive' : 'border-border/50 focus:ring-primary/50 focus:border-primary'
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
            <p className={`mt-1.5 text-xs ${passwordError ? 'text-destructive' : 'text-muted-foreground'}`}>
              Use 8 or more characters.
            </p>
          </div>
        )}
      </form>

      <div className="shrink-0 px-6 pt-4 pb-10 bg-background">
        <Button onClick={submitHandler as any} fullWidth disabled={isSubmitting}>
          {isSubmitting && 'Working...'}
          {!isSubmitting && step === 'email' && 'Continue'}
          {!isSubmitting && step === 'verify' && 'Verify answer'}
          {!isSubmitting && step === 'password' && 'Reset password'}
        </Button>
      </div>
    </div>
  );
}
