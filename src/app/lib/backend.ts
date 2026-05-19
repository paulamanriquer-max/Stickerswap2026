export interface AppUser {
  id: string;
  username: string;
  email: string | null;
  isAnonymous: boolean;
  createdAt: string;
  lastActive: string;
  latitude: number | null;
  longitude: number | null;
}

export interface StickerState {
  code: string;
  owned: boolean;
  missing: boolean;
  duplicateCount: number;
  updatedAt: string;
}

export interface StoredMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isOwn: boolean;
  isPublic?: boolean;
}

export interface AnalyticsEvent {
  id: string;
  name: string;
  createdAt: string;
  properties?: Record<string, unknown>;
}

const USER_KEY = 'stickerswap.currentUser';
const STICKERS_KEY = 'stickerswap.userStickers';
const CONVERSATIONS_KEY = 'stickerswap.conversations';
const PUBLIC_MESSAGES_KEY = 'stickerswap.publicMessages';
const ANALYTICS_KEY = 'stickerswap.analyticsEvents';

const now = () => new Date().toISOString();

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const backend = {
  loadUser(): AppUser | null {
    return readJson<AppUser | null>(USER_KEY, null);
  },

  createAnonymousUser(username: string): AppUser {
    const user: AppUser = {
      id: createId(),
      username: username.trim(),
      email: null,
      isAnonymous: true,
      createdAt: now(),
      lastActive: now(),
      latitude: null,
      longitude: null,
    };
    writeJson(USER_KEY, user);
    backend.track('username_created', { user_id: user.id, username: user.username });
    return user;
  },

  addEmailToCurrentUser(email: string): AppUser | null {
    const user = backend.loadUser();
    if (!user) return null;
    const updated = {
      ...user,
      email: email.trim(),
      isAnonymous: false,
      lastActive: now(),
    };
    writeJson(USER_KEY, updated);
    backend.track('email_added', { user_id: updated.id });
    backend.track('chat_unlocked', { user_id: updated.id });
    return updated;
  },

  updateLocation(latitude: number | null, longitude: number | null): AppUser | null {
    const user = backend.loadUser();
    if (!user) return null;
    const updated = { ...user, latitude, longitude, lastActive: now() };
    writeJson(USER_KEY, updated);
    return updated;
  },

  loadStickers(): StickerState[] {
    return readJson<StickerState[]>(STICKERS_KEY, []);
  },

  saveStickers(stickers: StickerState[]) {
    writeJson(STICKERS_KEY, stickers);
  },

  loadConversations<T>(): T[] {
    return readJson<T[]>(CONVERSATIONS_KEY, []);
  },

  saveConversations(conversations: unknown[]) {
    writeJson(CONVERSATIONS_KEY, conversations);
  },

  loadPublicMessages(): StoredMessage[] {
    return readJson<StoredMessage[]>(PUBLIC_MESSAGES_KEY, [
      {
        id: 'welcome-public-chat',
        text: 'Welcome to local trades. Share what you need or what you have to trade.',
        sender: 'Sticker Swap',
        timestamp: new Date(),
        isOwn: false,
        isPublic: true,
      },
    ]);
  },

  savePublicMessages(messages: StoredMessage[]) {
    writeJson(PUBLIC_MESSAGES_KEY, messages);
  },

  track(name: string, properties?: Record<string, unknown>) {
    const events = readJson<AnalyticsEvent[]>(ANALYTICS_KEY, []);
    events.push({ id: createId(), name, createdAt: now(), properties });
    writeJson(ANALYTICS_KEY, events);
  },

  getAnalyticsEvents(): AnalyticsEvent[] {
    return readJson<AnalyticsEvent[]>(ANALYTICS_KEY, []);
  },
};

export const shouldPromptForUpgrade = (stickers: StickerState[]) => {
  const collected = stickers.filter(sticker => sticker.owned || sticker.duplicateCount > 0).length;
  const duplicates = stickers.reduce((sum, sticker) => sum + sticker.duplicateCount, 0);
  return collected > 20 || duplicates > 5;
};

