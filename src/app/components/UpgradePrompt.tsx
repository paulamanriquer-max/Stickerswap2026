import { Mail, X } from 'lucide-react';

interface UpgradePromptProps {
  title?: string;
  message?: string;
  onAddEmail: () => void;
  onDismiss: () => void;
}

export function UpgradePrompt({
  title = 'Save your collection so you don’t lose it',
  message = 'Add an email to back up your stickers, recover your account, and unlock private chat.',
  onAddEmail,
  onDismiss,
}: UpgradePromptProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/60 px-4 pb-4">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-2xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{message}</p>
          </div>
          <button
            onClick={onDismiss}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            className="h-12 flex-1 rounded-xl border border-border bg-card/30 font-bold text-foreground active:scale-95"
          >
            Not now
          </button>
          <button
            onClick={onAddEmail}
            className="h-12 flex-1 rounded-xl bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/30 active:scale-95"
          >
            Add email
          </button>
        </div>
      </div>
    </div>
  );
}

