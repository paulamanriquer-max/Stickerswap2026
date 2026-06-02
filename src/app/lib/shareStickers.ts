import { getPlayerByCode } from '../data/players';

interface ShareSticker {
  code: string;
  duplicateCount?: number;
}

const stickerLine = (sticker: ShareSticker, includeDuplicateCount: boolean) => {
  const name = getPlayerByCode(sticker.code)?.name || 'Sticker';
  const count = includeDuplicateCount && sticker.duplicateCount && sticker.duplicateCount > 1
    ? ` x${sticker.duplicateCount}`
    : '';
  return `${sticker.code}${count} - ${name}`;
};

export const buildStickerShareText = (
  listTitle: string,
  stickers: ShareSticker[],
  includeDuplicateCount = false
) => {
  const lines = stickers.map(sticker => stickerLine(sticker, includeDuplicateCount));
  return [
    `StickerSwap KC - ${listTitle}`,
    `${stickers.length} sticker${stickers.length !== 1 ? 's' : ''}`,
    '',
    ...lines,
  ].join('\n');
};

export const shareStickerText = async (title: string, text: string) => {
  if (navigator.share) {
    await navigator.share({ title, text });
    return 'shared';
  }

  await navigator.clipboard.writeText(text);
  return 'copied';
};
