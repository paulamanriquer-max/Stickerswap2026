import { ArrowLeft, MapPin, Navigation, ShieldCheck } from 'lucide-react';
import { Button } from '../components/Button';

interface LocationPermissionScreenProps {
  city?: string;
  onAllow: () => void;
  onSkip: () => void;
  onBack?: () => void;
}

export function LocationPermissionScreen({
  city = 'Kansas City',
  onAllow,
  onSkip,
  onBack,
}: LocationPermissionScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-6 pt-6 shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium text-sm">Back</span>
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col px-6 pt-10 pb-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
          <Navigation className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">Allow location?</h1>
        <p className="text-sm leading-6 text-muted-foreground mb-6">
          StickerSwap uses your location to find nearby collectors in {city}. You can turn this on or off anytime in settings.
        </p>

        <div className="space-y-3">
          <div className="rounded-xl border border-border/50 bg-card/30 p-4">
            <div className="flex gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-foreground">Better local matches</h3>
                <p className="text-xs leading-5 text-muted-foreground mt-1">
                  We only need this for nearby trade matching. For this MVP, the market stays focused on {city}.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/30 p-4">
            <div className="flex gap-3">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-foreground">You control it</h3>
                <p className="text-xs leading-5 text-muted-foreground mt-1">
                  Turning location off removes your saved coordinates from this device and account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 px-6 pt-4 pb-10 bg-background space-y-3">
        <Button onClick={onAllow} fullWidth>
          Allow location
        </Button>
        <button
          onClick={onSkip}
          className="w-full h-12 rounded-xl border border-border/50 bg-card/30 text-foreground font-bold active:scale-95 transition-all"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
