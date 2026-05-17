import { ArrowLeft, User, Mail, Camera } from 'lucide-react';
import { useState } from 'react';

interface EditProfileScreenProps {
  onBack?: () => void;
}

export function EditProfileScreen({ onBack }: EditProfileScreenProps) {
  const [fullName, setFullName] = useState('Carlos');
  const [email, setEmail] = useState('carlos@example.com');
  const [fullNameError, setFullNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    if (!fullName.trim()) {
      setFullNameError(true);
      hasError = true;
    }
    if (!email.trim()) {
      setEmailError(true);
      hasError = true;
    }

    if (hasError) return;

    // Handle save logic
    onBack?.();
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
              <span className="text-primary-foreground font-bold text-3xl">C</span>
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
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fullNameError) setFullNameError(false);
                }}
                onBlur={() => {
                  if (!fullName.trim()) setFullNameError(true);
                }}
                className={`w-full h-12 pl-8 pr-4 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground ${
                  fullNameError
                    ? 'border-destructive focus:ring-destructive/50 focus:border-destructive'
                    : 'border-border/50 focus:ring-primary/50 focus:border-primary'
                }`}
                required
              />
            </div>
            {fullNameError && (
              <div className="mt-2 text-sm text-destructive">
                Full name is required
              </div>
            )}
          </div>

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
                className={`w-full h-12 pl-8 pr-4 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground ${
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

          <div className="pt-4">
            <button
              type="submit"
              className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-primary/30"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
