import { MapPin } from 'lucide-react';

interface LocationPermissionScreenProps {
  onAllow: () => void;
  onSkip: () => void;
}

export function LocationPermissionScreen({ onAllow, onSkip }: LocationPermissionScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-8">
        <MapPin className="w-12 h-12 text-blue-600" />
      </div>

      <h1 className="mb-4 text-center">Enable Location (Optional)</h1>
      <p className="text-muted-foreground text-center mb-8 max-w-sm">
        Allow location access to see exact distances to nearby collectors. You can still use all features without this.
      </p>

      <div className="w-full max-w-sm space-y-3 mb-8">
        <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
          <div>
            <h4 className="font-semibold mb-1">See Exact Distances</h4>
            <p className="text-sm text-muted-foreground">
              View distances like "2.3 miles away" for each collector
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border">
          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
          <div>
            <h4 className="font-semibold mb-1">Privacy Protected</h4>
            <p className="text-sm text-muted-foreground">
              Only approximate distance is shown, never your exact location
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={onAllow}
          className="w-full h-14 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          Allow Location Access
        </button>
        <button
          onClick={onSkip}
          className="w-full h-14 bg-card/30 text-foreground rounded-xl font-semibold border border-border/50 active:scale-95 transition-all"
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
}
