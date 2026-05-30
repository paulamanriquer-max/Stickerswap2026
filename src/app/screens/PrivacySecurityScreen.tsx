import { ArrowLeft, Lock, Eye, Trash2, ShieldQuestion } from 'lucide-react';
import { useState } from 'react';
import { Toggle } from '../components/Toggle';
import { backend } from '../lib/backend';

interface PrivacySecurityScreenProps {
  onBack?: () => void;
  onDeleteAccount?: () => void;
}

export function PrivacySecurityScreen({ onBack, onDeleteAccount }: PrivacySecurityScreenProps) {
  const [privacyPreferences, setPrivacyPreferences] = useState(() => backend.loadPrivacyPreferences());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const profileVisible = privacyPreferences.profileVisible;

  const toggleProfileVisible = () => {
    const next = { ...privacyPreferences, profileVisible: !profileVisible };
    setPrivacyPreferences(next);
    backend.savePrivacyPreferences(next);
  };

  return (
    <>
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
                <Toggle enabled={profileVisible} onChange={toggleProfileVisible} />
              </div>
            </div>

            <div className="bg-card/30 backdrop-blur-xl rounded-xl border border-border/50 overflow-hidden">
              <div className="w-full flex items-center gap-3 p-4 border-b border-border/50">
                <Lock className="w-5 h-5 text-primary" />
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-foreground">Password</h3>
                  <p className="text-xs text-muted-foreground">Reset it from the Log in screen if needed</p>
                </div>
              </div>

              <div className="w-full flex items-center gap-3 p-4 border-b border-border/50">
                <ShieldQuestion className="w-5 h-5 text-primary" />
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-foreground">Recovery Question</h3>
                  <p className="text-xs text-muted-foreground">Used to reset your password and protect your collection</p>
                </div>
              </div>

              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center gap-3 p-4 active:bg-accent transition-colors"
              >
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

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[80] px-4 sm:pb-6" onClick={() => setConfirmDelete(false)}>
          <div
            className="w-full max-w-md bg-background rounded-t-3xl sm:rounded-3xl p-6 border border-border/50 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="w-12 h-1 rounded-full bg-muted mx-auto mb-5" />
            <h2 className="text-xl font-bold text-foreground mb-2">Delete your account?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              This removes your account and local collection from this app. This cannot be undone.
            </p>
            <div className="space-y-3">
              <button
                onClick={onDeleteAccount}
                className="w-full h-14 rounded-xl bg-destructive text-destructive-foreground font-bold active:scale-95 transition-all"
              >
                Delete account
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="w-full h-12 rounded-xl bg-card/40 border border-border/50 text-foreground font-bold active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
