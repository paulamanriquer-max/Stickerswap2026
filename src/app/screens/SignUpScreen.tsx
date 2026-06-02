import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldQuestion, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';

interface SignUpScreenProps {
  onNavigate?: (screen: string) => void;
  onCreateAccount?: (name: string, email: string, password: string, recoveryQuestion: string, recoveryAnswer: string) => boolean | Promise<boolean>;
  onEmailExists?: (email: string) => boolean | Promise<boolean>;
}

const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
const isValidPassword = (password: string) => password.length >= 8;
const recoveryQuestions = [
  'What was the name of your first school?',
  'What city were you born in?',
  'What was your childhood nickname?',
  'What is the name of your favorite teacher?',
];

export function SignUpScreen({ onNavigate, onCreateAccount, onEmailExists }: SignUpScreenProps) {
  const [step, setStep] = useState<'account' | 'recovery'>('account');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryQuestion, setRecoveryQuestion] = useState(recoveryQuestions[0]);
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [recoveryAnswerError, setRecoveryAnswerError] = useState(false);
  const [accountExistsError, setAccountExistsError] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateAccountStep = async () => {
    const nextNameError = !name.trim();
    const nextEmailError = !isValidEmail(email.trim());
    const nextPasswordError = !isValidPassword(password);
    const nextAccountExistsError = !nextEmailError && Boolean(await onEmailExists?.(email.trim()));
    setNameError(nextNameError);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setAccountExistsError(nextAccountExistsError);
    return !(nextNameError || nextEmailError || nextPasswordError || nextAccountExistsError);
  };

  const handleContinue = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setFormMessage('');
    setIsSubmitting(true);
    if (await validateAccountStep()) setStep('recovery');
    setIsSubmitting(false);
  };

  const handleCreateAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setFormMessage('');
    setIsSubmitting(true);
    if (!await validateAccountStep()) {
      setStep('account');
      setIsSubmitting(false);
      return;
    }
    const nextRecoveryAnswerError = recoveryAnswer.trim().length < 2;
    setRecoveryAnswerError(nextRecoveryAnswerError);
    if (nextRecoveryAnswerError) {
      setIsSubmitting(false);
      return;
    }

    try {
      const created = await onCreateAccount?.(name.trim(), email.trim(), password, recoveryQuestion, recoveryAnswer) ?? false;
      if (!created) {
        setAccountExistsError(true);
        setStep('account');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'ACCOUNT_EXISTS') {
        setAccountExistsError(true);
        setStep('account');
      } else if (message === 'ACCOUNT_CONFIRM_EMAIL') {
        setFormMessage('Check your email to confirm your account, then come back and log in.');
      } else {
        setFormMessage('We could not create your account. Check your connection and try again.');
      }
      setStep('account');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="h-dvh min-h-screen bg-background overflow-hidden flex flex-col">
      <div className="px-6 pt-6 shrink-0">
        <button
          onClick={() => step === 'recovery' ? setStep('account') : onNavigate?.('welcome')}
          className="flex items-center gap-2 text-muted-foreground active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium text-sm">Back</span>
        </button>
      </div>

      <form onSubmit={step === 'account' ? handleContinue : handleCreateAccount} className="flex-1 min-h-0 flex flex-col px-6 pt-8 pb-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Create account</h1>
          <p className="text-sm text-muted-foreground">
            {step === 'account'
              ? 'Use your name, email, and password to protect your collection'
              : 'Set up account recovery so you do not lose your sticker data if you forget your password'}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className={`h-1.5 rounded-full ${step === 'account' ? 'bg-primary' : 'bg-primary/50'}`} />
            <div className={`h-1.5 rounded-full ${step === 'recovery' ? 'bg-primary' : 'bg-card/60'}`} />
          </div>
        </div>

        {step === 'account' ? (
          <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (nameError) setNameError(false);
                }}
                onBlur={() => setNameError(!name.trim())}
                placeholder="Your name"
                className={`w-full h-12 pl-8 pr-4 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground placeholder:text-muted-foreground ${
                  nameError ? 'border-destructive focus:ring-destructive/50 focus:border-destructive' : 'border-border/50 focus:ring-primary/50 focus:border-primary'
                }`}
                required
              />
            </div>
            {nameError && <p className="mt-1.5 text-xs text-destructive">Name is required</p>}
          </div>

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
                  if (accountExistsError) setAccountExistsError(false);
                }}
                onBlur={() => setEmailError(!isValidEmail(email.trim()))}
                placeholder="you@example.com"
                className={`w-full h-12 pl-8 pr-4 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground placeholder:text-muted-foreground ${
                  emailError ? 'border-destructive focus:ring-destructive/50 focus:border-destructive' : 'border-border/50 focus:ring-primary/50 focus:border-primary'
                }`}
                required
              />
            </div>
            {emailError && <p className="mt-1.5 text-xs text-destructive">Enter a valid email address</p>}
            {accountExistsError && (
              <p className="mt-1.5 text-xs text-destructive">
                An account already exists for this email. Log in or reset your password.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (passwordError) setPasswordError(false);
                }}
                onBlur={() => setPasswordError(!isValidPassword(password))}
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

          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
              <div className="flex gap-3">
                <ShieldQuestion className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs leading-5 text-muted-foreground">
                  This question helps verify it is you if you forget your password. Choose an answer you can remember, but other people cannot easily guess.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Security question</label>
              <select
                value={recoveryQuestion}
                onChange={(event) => setRecoveryQuestion(event.target.value)}
                className="w-full h-12 px-4 bg-card/30 backdrop-blur-xl rounded-xl border border-border/50 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-foreground"
              >
                {recoveryQuestions.map(question => (
                  <option key={question} value={question}>{question}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Answer</label>
              <input
                type="text"
                value={recoveryAnswer}
                onChange={(event) => {
                  setRecoveryAnswer(event.target.value);
                  if (recoveryAnswerError) setRecoveryAnswerError(false);
                }}
                onBlur={() => setRecoveryAnswerError(recoveryAnswer.trim().length < 2)}
                placeholder="Your answer"
                className={`w-full h-12 px-4 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground placeholder:text-muted-foreground ${
                  recoveryAnswerError ? 'border-destructive focus:ring-destructive/50 focus:border-destructive' : 'border-border/50 focus:ring-primary/50 focus:border-primary'
                }`}
                autoCapitalize="words"
                required
              />
              {recoveryAnswerError && <p className="mt-1.5 text-xs text-destructive">Enter an answer for account recovery</p>}
            </div>
          </div>
        )}

        {formMessage && (
          <div className="mt-5 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm font-semibold text-foreground">
            {formMessage}
          </div>
        )}
      </form>

      <div className="shrink-0 px-6 pt-4 pb-[max(24px,env(safe-area-inset-bottom))] bg-background">
        <Button
          onClick={(step === 'account' ? handleContinue : handleCreateAccount) as any}
          fullWidth
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Working...' : step === 'account' ? 'Continue' : 'Create account'}
        </Button>
        <p className="text-center mt-5 text-sm text-muted-foreground">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate?.('sign-in')}
            className="text-primary font-bold active:scale-95 transition-transform"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
