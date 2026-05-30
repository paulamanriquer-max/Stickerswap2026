import { ArrowLeft, Camera, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { AppUser } from '../lib/backend';
import { Button } from '../components/Button';

interface EditProfileScreenProps {
  onBack?: () => void;
  user?: AppUser | null;
  onSave?: (name: string, email: string) => boolean;
}

const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

export function EditProfileScreen({ onBack, user, onSave }: EditProfileScreenProps) {
  const [fullName, setFullName] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [fullNameError, setFullNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [emailExistsError, setEmailExistsError] = useState(false);
  const initial = (fullName || 'C').charAt(0).toUpperCase();

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();

    const nextNameError = !fullName.trim();
    const nextEmailError = !isValidEmail(email.trim());
    setFullNameError(nextNameError);
    setEmailError(nextEmailError);
    setEmailExistsError(false);
    if (nextNameError || nextEmailError) return;

    const saved = onSave?.(fullName.trim(), email.trim()) ?? false;
    if (!saved) setEmailExistsError(true);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-6 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground active:scale-95 transition-transform mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium text-sm">Back</span>
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Edit Profile</h1>
          <p className="text-sm text-muted-foreground">Update your personal information</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-primary-foreground font-bold text-3xl">{initial}</span>
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-card/30 backdrop-blur-xl border border-border/50 flex items-center justify-center active:scale-90 transition-transform">
              <Camera className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  if (fullNameError) setFullNameError(false);
                }}
                onBlur={() => setFullNameError(!fullName.trim())}
                className={`w-full h-12 pl-8 pr-4 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground ${
                  fullNameError
                    ? 'border-destructive focus:ring-destructive/50 focus:border-destructive'
                    : 'border-border/50 focus:ring-primary/50 focus:border-primary'
                }`}
                required
              />
            </div>
            {fullNameError && <div className="mt-2 text-sm text-destructive">Full name is required</div>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (emailError) setEmailError(false);
                  if (emailExistsError) setEmailExistsError(false);
                }}
                onBlur={() => setEmailError(!isValidEmail(email.trim()))}
                className={`w-full h-12 pl-8 pr-4 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground ${
                  emailError || emailExistsError
                    ? 'border-destructive focus:ring-destructive/50 focus:border-destructive'
                    : 'border-border/50 focus:ring-primary/50 focus:border-primary'
                }`}
                required
              />
            </div>
            {emailError && <div className="mt-2 text-sm text-destructive">Enter a valid email address</div>}
            {emailExistsError && <div className="mt-2 text-sm text-destructive">That email is already connected to another account</div>}
          </div>

          <div className="pt-4">
            <Button type="submit" fullWidth>
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
