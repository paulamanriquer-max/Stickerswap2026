import { players } from '../data/players';
import { StickerState } from './backend';

export type StickerStatus = 'owned' | 'missing' | 'duplicate';

export const createDefaultStickerStates = (): StickerState[] =>
  players
    .slice()
    .sort((a, b) => a.albumOrder - b.albumOrder)
    .map(player => ({
      code: player.code,
      owned: false,
      missing: true,
      duplicateCount: 0,
    }));

export const normalizeStickerStates = (storedStickers: StickerState[] = []): StickerState[] => {
  const byCode = new Map(storedStickers.map(sticker => [sticker.code, sticker]));

  return createDefaultStickerStates().map(defaultSticker => {
    const existing = byCode.get(defaultSticker.code);
    if (!existing) return defaultSticker;

    const duplicateCount = Math.max(0, existing.duplicateCount || 0);
    const owned = Boolean(existing.owned || duplicateCount > 0);
    const missing = owned || duplicateCount > 0 ? false : true;

    return {
      ...defaultSticker,
      ...existing,
      owned,
      missing,
      duplicateCount,
    };
  });
};

export const applyStickerStatus = (
  sticker: StickerState,
  status: StickerStatus,
  duplicateIncrement = 1
): StickerState => {
  const updatedAt = new Date().toISOString();

  if (status === 'owned') {
    return {
      ...sticker,
      owned: true,
      missing: false,
      duplicateCount: 0,
      updatedAt,
    };
  }

  if (status === 'duplicate') {
    return {
      ...sticker,
      owned: true,
      missing: false,
      duplicateCount: Math.max(1, (sticker.duplicateCount || 0) + duplicateIncrement),
      updatedAt,
    };
  }

  return {
    ...sticker,
    owned: false,
    missing: true,
    duplicateCount: 0,
    updatedAt,
  };
};

export const setStickerStatus = (sticker: StickerState, status: StickerStatus): StickerState => {
  const updatedAt = new Date().toISOString();

  if (status === 'owned') {
    return { ...sticker, owned: true, missing: false, duplicateCount: 0, updatedAt };
  }

  if (status === 'duplicate') {
    return { ...sticker, owned: true, missing: false, duplicateCount: Math.max(1, sticker.duplicateCount || 1), updatedAt };
  }

  return { ...sticker, owned: false, missing: true, duplicateCount: 0, updatedAt };
};
