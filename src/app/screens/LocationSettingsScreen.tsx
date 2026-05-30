import { ArrowLeft, MapPin, Navigation } from 'lucide-react';
import { AppUser } from '../lib/backend';
import { Toggle } from '../components/Toggle';

interface LocationSettingsScreenProps {
  onBack?: () => void;
  city?: string;
  user?: AppUser | null;
  onEnableLocation: () => void;
  onDisableLocation: () => void;
}

export function LocationSettingsScreen({
  onBack,
  city = 'Kansas City',
  user,
  onEnableLocation,
  onDisableLocation,
}: LocationSettingsScreenProps) {
  const locationEnabled = Boolean(user?.latitude && user?.longitude);

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
          <h1 className="text-2xl font-bold text-foreground mb-1">Location Settings</h1>
          <p className="text-sm text-muted-foreground">Control how StickerSwap uses location for nearby trades</p>
        </div>

        <div className="space-y-4">
          <div className="bg-card/30 backdrop-blur-xl rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Trading Market</h3>
                <p className="text-xs text-muted-foreground">{city}</p>
              </div>
            </div>
          </div>

          <div className="bg-card/30 backdrop-blur-xl rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <Navigation className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Location Matching</h3>
                <p className="text-xs text-muted-foreground">
                  {locationEnabled
                    ? 'On. Nearby matches can use your current location.'
                    : 'Off. You will still be shown in the Kansas City market.'}
                </p>
              </div>
              <Toggle enabled={locationEnabled} onChange={locationEnabled ? onDisableLocation : onEnableLocation} />
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/30 p-4">
            <h3 className="font-semibold text-foreground">How this works</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Your phone or browser will ask for permission before sharing location. You can also revoke access from device settings at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
