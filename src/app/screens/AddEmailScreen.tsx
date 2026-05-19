import { ArrowLeft, Mail } from 'lucide-react';
import { useState } from 'react';

interface AddEmailScreenProps {
  onBack: () => void;
  onSubmit: (email: string) => void;
}

export function AddEmailScreen({ onBack, onSubmit }: AddEmailScreenProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Enter a valid email address');
      return;
    }

    setError('');
    setSent(true);
    onSubmit(trimmed);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-6 pt-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium text-sm">Back</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 px-6 pt-10 pb-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">Add email</h1>
          <p className="text-sm leading-5 text-muted-foreground">
            We’ll send a magic link. No password needed. Your username and collection stay attached to this account.
          </p>
        </div>

        <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (error) setError('');
            }}
            placeholder="you@example.com"
            className={`w-full h-12 pl-9 pr-4 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground placeholder:text-muted-foreground ${
              error ? 'border-destructive focus:ring-destructive/50' : 'border-border/50 focus:ring-primary/50 focus:border-primary'
            }`}
          />
        </div>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

        {sent && (
          <div className="mt-5 rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm text-foreground">
            Magic link requested. In the prototype, chat is unlocked immediately; in Supabase this sends the link and links back to this user ID.
          </div>
        )}
      </form>

      <div className="px-6 pt-4 pb-10 bg-background">
        <button
          onClick={handleSubmit as any}
          className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-primary/30"
        >
          Send magic link
        </button>
      </div>
    </div>
  );
}

