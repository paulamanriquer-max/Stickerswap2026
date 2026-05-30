import { X, AlertTriangle } from 'lucide-react';

type DuplicateType = 'owned' | 'duplicate' | 'missing';

interface DuplicateWarningModalProps {
  stickerCode: string;
  existingStatus: DuplicateType;
  attemptedStatus: string;
  onClose: () => void;
  onAddAsDuplicate?: () => void;
  onMergeDuplicates?: () => void;
  onCancel: () => void;
}

export function DuplicateWarningModal({
  stickerCode,
  existingStatus,
  attemptedStatus,
  onClose,
  onAddAsDuplicate,
  onMergeDuplicates,
  onCancel,
}: DuplicateWarningModalProps) {
  const getModalContent = () => {
    // Case 1: Already owned, trying to add as owned
    if (existingStatus === 'owned' && attemptedStatus === 'owned') {
      return {
        title: 'Sticker Already Owned',
        message: `You already have ${stickerCode} marked as owned. Would you like to add it as a duplicate instead?`,
        action: 'Add as Duplicate',
        onAction: onAddAsDuplicate,
      };
    }

    // Case 2: Already have duplicates, trying to add more duplicates
    if (existingStatus === 'duplicate' && attemptedStatus === 'duplicate') {
      return {
        title: 'Duplicate Already Exists',
        message: `You already have duplicate(s) of ${stickerCode}. Merge to add to your duplicate count?`,
        action: 'Merge with Existing',
        onAction: onMergeDuplicates,
      };
    }

    // Case 3: Already marked as missing, trying to add as missing again
    if (existingStatus === 'missing' && attemptedStatus === 'missing') {
      return {
        title: 'Already Marked as Missing',
        message: `${stickerCode} is already in your missing list.`,
        action: null,
        onAction: null,
      };
    }

    // Case 4: Owned or duplicate, trying to mark as missing (destructive action)
    if ((existingStatus === 'owned' || existingStatus === 'duplicate') && attemptedStatus === 'missing') {
      return {
        title: 'Confirm Mark as Missing',
        message: `${stickerCode} is currently ${existingStatus === 'owned' ? 'owned' : 'marked as duplicate'}. Marking it as missing will remove this status. Are you sure?`,
        action: 'Mark as Missing',
        onAction: onMergeDuplicates,
      };
    }

    // Default case
    return {
      title: 'Sticker Exists',
      message: `${stickerCode} already exists.`,
      action: 'Update Status',
      onAction: onAddAsDuplicate,
    };
  };

  const content = getModalContent();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[80] px-4 sm:pb-6" onClick={onClose}>
      <div
        className="w-full max-w-md bg-background rounded-t-3xl sm:rounded-3xl p-6 border border-border/50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{content.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-input-background active:scale-90 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">{content.message}</p>

        <div className="flex flex-col gap-3">
          {content.action && content.onAction && (
            <button
              onClick={() => {
                content.onAction?.();
                onClose();
              }}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-primary/30"
            >
              {content.action}
            </button>
          )}
          <button
            onClick={() => {
              onCancel();
              onClose();
            }}
            className="w-full px-4 py-3 bg-muted/20 text-foreground rounded-xl font-semibold active:scale-95 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
