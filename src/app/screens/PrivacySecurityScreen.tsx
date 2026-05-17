import { ArrowLeft, Lock, Eye, Trash2, Shield } from 'lucide-react';
import { useState } from 'react';

interface PrivacySecurityScreenProps {
  onBack?: () => void;
}

export function PrivacySecurityScreen({ onBack }: PrivacySecurityScreenProps) {
  const [profileVisible, setProfileVisible] = useState(true);

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        enabled ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <div
        className={`absolute top-1 w-5 h-5 rounded-full transition-transform ${
          enabled ? 'translate-x-6 bg-[#0a1929]' : 'translate-x-1 bg-white'
        }`}
      />
    </button>
  );

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
          <h1 className="text-2xl font-bold text-foreground mb-1">Privacy & Security</h1>
          <p className="text-sm text-muted-foreground">Control your data and security</p>
        </div>

        <div className="space-y-4">
          <div className="bg-card/30 backdrop-blur-xl rounded-xl border border-border/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">Profile Visibility</h3>
                  <p className="text-xs text-muted-foreground">Show profile to nearby collectors</p>
                </div>
              </div>
              <Toggle enabled={profileVisible} onChange={() => setProfileVisible(!profileVisible)} />
            </div>
          </div>

          <div className="bg-card/30 backdrop-blur-xl rounded-xl border border-border/50 overflow-hidden">
            <button className="w-full flex items-center gap-3 p-4 active:bg-accent transition-colors border-b border-border/50">
              <Lock className="w-5 h-5 text-primary" />
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-foreground">Change Password</h3>
                <p className="text-xs text-muted-foreground">Update your password</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 p-4 active:bg-accent transition-colors border-b border-border/50">
              <Shield className="w-5 h-5 text-primary" />
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-foreground">Two-Factor Authentication</h3>
                <p className="text-xs text-muted-foreground">Add extra security to your account</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 p-4 active:bg-accent transition-colors">
              <Trash2 className="w-5 h-5 text-destructive" />
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-destructive">Delete Account</h3>
                <p className="text-xs text-muted-foreground">Permanently remove your account</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
