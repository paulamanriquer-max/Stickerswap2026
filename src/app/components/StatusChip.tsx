type StickerStatus = 'owned' | 'missing' | 'duplicate';

interface StatusChipProps {
  status: StickerStatus;
  count?: number;
}

export function StatusChip({ status, count }: StatusChipProps) {
  const getStatusStyle = () => {
    switch (status) {
      case 'owned':
        return 'bg-success-bg text-success border border-success/30';
      case 'missing':
        return 'bg-warning-bg text-warning border border-warning/30';
      case 'duplicate':
        return 'bg-info-bg text-info border border-info/30';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'owned':
        return 'Owned';
      case 'missing':
        return 'Missing';
      case 'duplicate':
        return 'Duplicate';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl ${getStatusStyle()}`}>
      <span className="font-bold text-sm">{getStatusLabel()}</span>
      {count !== undefined && <span className="font-bold">({count})</span>}
    </div>
  );
}
