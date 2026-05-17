import { Button } from '../components/Button';
import { SegmentedControl } from '../components/SegmentedControl';
import { SearchBar } from '../components/SearchBar';
import { DuplicateWarningModal } from '../components/DuplicateWarningModal';
import { X, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { worldCupTeams } from '../data/teams';
import { getPlayersByTeam } from '../data/players';

interface Sticker {
  code: string;
  owned: boolean;
  missing: boolean;
  duplicateCount: number;
}

interface AddStickerSheetProps {
  onClose: () => void;
  existingStickers: Sticker[];
  onAdd: (code: string, status: string, duplicateCount?: number) => void;
}

export function AddStickerSheet({ onClose, existingStickers, onAdd }: AddStickerSheetProps) {
  const [selectedTeam, setSelectedTeam] = useState('BRA');
  const [stickerNumber, setStickerNumber] = useState('');
  const [status, setStatus] = useState('owned');
  const [teamSearch, setTeamSearch] = useState('');
  const [duplicateCount, setDuplicateCount] = useState(1);
  const [stickerNumberError, setStickerNumberError] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    code: string;
    existingStatus: 'owned' | 'missing' | 'duplicate';
    attemptedStatus: string;
  } | null>(null);

  const teams = worldCupTeams.map(t => ({
    code: t.code,
    name: t.name,
    flag: t.flag,
  }));

  const selectedTeamStickers = getPlayersByTeam(selectedTeam);
  const resolvedSticker = selectedTeamStickers.find((sticker) => {
    const input = stickerNumber.replace(/\s+/g, '').toUpperCase();
    return (
      sticker.number.toString() === stickerNumber.trim() ||
      sticker.stickerNumber.toUpperCase() === input ||
      sticker.code.replace(/\s+/g, '').toUpperCase() === input
    );
  });
  const resolvedStickerCode = resolvedSticker?.code || '';

  const handleAdd = () => {
    if (!stickerNumber.trim()) {
      setStickerNumberError(true);
      return;
    }

    if (!resolvedSticker) {
      setStickerNumberError(true);
      return;
    }

    const stickerCode = resolvedSticker.code;
    const existingSticker = existingStickers.find(s => s.code === stickerCode);

    // Check for conflicts based on new rules
    if (existingSticker) {
      // Case 1: Already owned, trying to add as owned
      if (existingSticker.owned && status === 'owned') {
        setDuplicateInfo({
          code: stickerCode,
          existingStatus: 'owned',
          attemptedStatus: status,
        });
        setShowDuplicateModal(true);
        return;
      }

      // Case 2: Already have duplicates, trying to add more duplicates
      if (existingSticker.duplicateCount > 0 && status === 'duplicate') {
        setDuplicateInfo({
          code: stickerCode,
          existingStatus: 'duplicate',
          attemptedStatus: status,
        });
        setShowDuplicateModal(true);
        return;
      }

      // Case 3: Already marked as missing, trying to add as missing again
      if (existingSticker.missing && status === 'missing') {
        setDuplicateInfo({
          code: stickerCode,
          existingStatus: 'missing',
          attemptedStatus: status,
        });
        setShowDuplicateModal(true);
        return;
      }

      // Case 4: Has owned or duplicates, trying to mark as missing (destructive action)
      if ((existingSticker.owned || existingSticker.duplicateCount > 0) && status === 'missing') {
        setDuplicateInfo({
          code: stickerCode,
          existingStatus: existingSticker.owned ? 'owned' : 'duplicate',
          attemptedStatus: 'missing',
        });
        setShowDuplicateModal(true);
        return;
      }
    }

    // No conflict, proceed with adding
    onAdd(stickerCode, status, duplicateCount);
    setStickerNumber('');
    setDuplicateCount(1);
    setStickerNumberError(false);
  };

  const handleAddAsDuplicate = () => {
    if (duplicateInfo) {
      onAdd(duplicateInfo.code, 'duplicate', duplicateCount);
      setStickerNumber('');
      setDuplicateCount(1);
      setStickerNumberError(false);
    }
  };

  const handleMergeDuplicates = () => {
    if (duplicateInfo) {
      // If attempting to mark as missing, use the attempted status
      if (duplicateInfo.attemptedStatus === 'missing') {
        onAdd(duplicateInfo.code, 'missing', 0);
      } else {
        // Otherwise merge duplicates
        onAdd(duplicateInfo.code, 'duplicate', duplicateCount);
      }
      setStickerNumber('');
      setDuplicateCount(1);
      setStickerNumberError(false);
    }
  };

  const handleCancelDuplicate = () => {
    // Just close the modal, don't add anything
    setDuplicateInfo(null);
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
    team.code.toLowerCase().includes(teamSearch.toLowerCase())
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
        <div
          className="w-full bg-background rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto border-t border-border/50"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex items-center justify-between mb-6">
          <h2>Add Sticker</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-input-background active:scale-90 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block mb-3">Select Category</label>
            <div className="mb-3">
              <SearchBar
                value={teamSearch}
                onChange={setTeamSearch}
                placeholder="Search categories..."
              />
            </div>
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {filteredTeams.map((team) => (
                <button
                  key={team.code}
                  onClick={() => setSelectedTeam(team.code)}
                  className={`p-3 rounded-xl border-2 transition-all active:scale-95 ${
                    selectedTeam === team.code
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background'
                  }`}
                >
                  <div className="text-3xl mb-1">{team.flag}</div>
                  <div className="text-xs font-medium">{team.code}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-3">Sticker Number</label>
            <input
              type="text"
              value={stickerNumber}
              onChange={(e) => {
                setStickerNumber(e.target.value);
                if (stickerNumberError) setStickerNumberError(false);
              }}
              onBlur={() => {
                if (!stickerNumber.trim()) setStickerNumberError(true);
              }}
              placeholder="e.g., 3"
              className={`w-full h-12 px-4 bg-card/30 backdrop-blur-xl rounded-xl border outline-none focus:ring-2 transition-all text-foreground placeholder:text-muted-foreground ${
                stickerNumberError
                  ? 'border-destructive focus:ring-destructive/50 focus:border-destructive'
                  : 'border-border/50 focus:ring-primary/50 focus:border-primary'
              }`}
            />
            {stickerNumberError && (
              <div className="mt-2 text-sm text-destructive">
                Enter a valid sticker number for this category
              </div>
            )}
            {stickerNumber && !stickerNumberError && resolvedSticker && (
              <div className="mt-2 text-sm text-muted-foreground">
                Sticker code: <span className="font-semibold text-foreground">{resolvedStickerCode}</span>
                <span className="block text-xs mt-1">{resolvedSticker.name}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block mb-3">Status</label>
            <SegmentedControl
              options={[
                { value: 'owned', label: 'Owned' },
                { value: 'missing', label: 'Missing' },
                { value: 'duplicate', label: 'Duplicate' },
              ]}
              value={status}
              onChange={(newStatus) => {
                setStatus(newStatus);
                if (newStatus !== 'duplicate') {
                  setDuplicateCount(1);
                }
              }}
            />
            {status === 'duplicate' && (
              <div className="mt-4 p-4 bg-card/30 backdrop-blur-xl rounded-xl border border-border/50">
                <label className="block text-sm font-semibold text-foreground mb-3">Duplicate Count</label>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setDuplicateCount(Math.max(1, duplicateCount - 1))}
                    disabled={duplicateCount <= 1}
                    className="w-12 h-12 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-5 h-5 text-primary" />
                  </button>
                  <span className="text-3xl font-bold text-foreground">{duplicateCount}</span>
                  <button
                    onClick={() => setDuplicateCount(duplicateCount + 1)}
                    className="w-12 h-12 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 flex items-center justify-center transition-all active:scale-95"
                  >
                    <Plus className="w-5 h-5 text-primary" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAdd}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-primary/30"
            >
              <Plus className="w-5 h-5" />
              <span>Add Sticker</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    {showDuplicateModal && duplicateInfo && (
      <DuplicateWarningModal
        stickerCode={duplicateInfo.code}
        existingStatus={duplicateInfo.existingStatus}
        attemptedStatus={duplicateInfo.attemptedStatus}
        onClose={() => setShowDuplicateModal(false)}
        onAddAsDuplicate={handleAddAsDuplicate}
        onMergeDuplicates={handleMergeDuplicates}
        onCancel={handleCancelDuplicate}
      />
    )}
  </>
  );
}
