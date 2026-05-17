import { Button } from '../components/Button';
import { Check } from 'lucide-react';
import { useState } from 'react';

interface AlbumSelectionScreenProps {
  onContinue: () => void;
}

export function AlbumSelectionScreen({ onContinue }: AlbumSelectionScreenProps) {
  const [selected, setSelected] = useState('fifa-2026');

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      <div className="flex-1">
        <h1 className="mb-2">Select Your Album</h1>
        <p className="text-muted-foreground mb-8">
          Choose which Panini album you're collecting
        </p>

        <div className="space-y-4">
          <button
            onClick={() => setSelected('fifa-2026')}
            className={`w-full p-6 rounded-2xl border-2 transition-all active:scale-[0.98] ${
              selected === 'fifa-2026'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="text-5xl">🏆</div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold mb-1">FIFA World Cup 2026</h3>
                <p className="text-sm text-muted-foreground">
                  USA, Canada & Mexico • 48 teams • 960 stickers
                </p>
              </div>
              {selected === 'fifa-2026' && (
                <Check className="w-6 h-6 text-primary" />
              )}
            </div>
          </button>

          <button
            onClick={() => setSelected('fifa-2022')}
            className={`w-full p-6 rounded-2xl border-2 transition-all active:scale-[0.98] ${
              selected === 'fifa-2022'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="text-5xl">⚽</div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold mb-1">FIFA World Cup Qatar 2022</h3>
                <p className="text-sm text-muted-foreground">
                  Past tournament - complete your collection
                </p>
              </div>
              {selected === 'fifa-2022' && (
                <Check className="w-6 h-6 text-primary" />
              )}
            </div>
          </button>
        </div>
      </div>

      <Button onClick={onContinue} fullWidth>
        Continue
      </Button>
    </div>
  );
}
