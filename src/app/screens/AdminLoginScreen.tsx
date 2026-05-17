import { useState } from 'react';
import { Lock, Mail, ArrowLeft, ShieldCheck } from 'lucide-react';

// Admin credentials — change these to something only you know
const ADMIN_EMAIL = 'admin@stickerswap.app';
const ADMIN_PASSWORD = 'Sticker2026Mundia!';

interface AdminLoginScreenProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function AdminLoginScreen({ onSuccess, onBack }: AdminLoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-6 pt-6 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin Access</h1>
            <p className="text-sm text-muted-foreground">Restricted area</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(false); }}
                placeholder="Admin email"
                className={`w-full h-12 pl-8 pr-4 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground placeholder:text-muted-foreground ${
                  error ? 'border-destructive focus:ring-destructive/50' : 'border-border/50 focus:ring-primary/50 focus:border-primary'
                }`}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                placeholder="Admin password"
                className={`w-full h-12 pl-8 pr-10 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground placeholder:text-muted-foreground ${
                  error ? 'border-destructive focus:ring-destructive/50' : 'border-border/50 focus:ring-primary/50 focus:border-primary'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive">Invalid admin credentials.</p>
          )}
        </form>
      </div>

      <div className="shrink-0 px-6 pt-4 pb-10 bg-background">
        <button
          onClick={handleSubmit as any}
          className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-primary/30"
        >
          Sign In as Admin
        </button>
      </div>
    </div>
  );
}
