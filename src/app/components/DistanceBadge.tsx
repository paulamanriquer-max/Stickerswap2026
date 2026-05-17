import { MapPin } from 'lucide-react';

interface DistanceBadgeProps {
  distance: string;
}

export function DistanceBadge({ distance }: DistanceBadgeProps) {
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <MapPin className="w-3.5 h-3.5" />
      <span className="text-sm">{distance}</span>
    </div>
  );
}
