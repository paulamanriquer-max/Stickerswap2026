import { ArrowLeft, MapPin, Navigation } from 'lucide-react';
import { useState } from 'react';
import { Toggle } from '../components/Toggle';

interface LocationSettingsScreenProps {
  onBack?: () => void;
  locationEnabled: boolean;
  onLocationChange: (enabled: boolean) => void;
}

export function LocationSettingsScreen({ onBack, locationEnabled, onLocationChange }: LocationSettingsScreenProps) {
  const [radius, setRadius] = useState(5);

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
          <p className="text-sm text-muted-foreground">Manage how we use your location</p>
        </div>

        <div className="space-y-4">
          <div className="bg-card/30 backdrop-blur-xl rounded-xl border border-border/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">Enable Location</h3>
                  <p className="text-xs text-muted-foreground">Find nearby collectors</p>
                </div>
              </div>
              <Toggle enabled={locationEnabled} onChange={() => onLocationChange(!locationEnabled)} />
            </div>
          </div>

          <div className="bg-card/30 backdrop-blur-xl rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-3 mb-4">
              <Navigation className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Search Radius</h3>
                <p className="text-xs text-muted-foreground">Maximum distance to find collectors</p>
              </div>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min="1"
                max="50"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">1 mi</span>
                <span className="font-bold text-primary">{radius} mi</span>
                <span className="text-muted-foreground">50 mi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
