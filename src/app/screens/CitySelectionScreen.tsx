import { useState } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';

interface CitySelectionScreenProps {
  onContinue: (city: string) => void;
}

const CITIES = [
  'Kansas City',
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Phoenix',
  'Philadelphia',
  'San Antonio',
  'San Diego',
  'Dallas',
  'Austin',
  'Seattle',
  'Denver',
  'Boston',
  'Miami',
];

export function CitySelectionScreen({ onContinue }: CitySelectionScreenProps) {
  const [selectedCity, setSelectedCity] = useState('Kansas City');

  return (
    <div className="min-h-screen bg-background px-6 py-8 flex flex-col">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Select Your City</h1>
          <p className="text-sm text-muted-foreground">
            This helps us connect you with collectors in your area
          </p>
        </div>

        {/* City List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                selectedCity === city
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-card/30 border-border/50 text-foreground hover:border-primary/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className={`w-5 h-5 ${selectedCity === city ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="font-medium">{city}</span>
              </div>
              {selectedCity === city && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={() => onContinue(selectedCity)}
        className="w-full mt-6 h-14 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all"
      >
        Continue
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
