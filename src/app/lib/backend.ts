import { players } from '../data/players';
import {
  isSupabaseConfigured,
  supabaseLogIn,
  supabaseRefreshSession,
  supabaseRest,
  supabaseRpc,
  supabaseResetPasswordWithRecovery,
  supabaseSignUp,
} from './supabaseClient';

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

export interface StoredConversation {
  userId?: string;
  username: string;
  messages: StoredMessage[];
  lastMessage?: string;
  lastMessageTime?: Date;
}

export interface AnalyticsEvent {
  id: string;
  name: string;
  createdAt: string;
  properties?: Record<string, unknown>;
}

export type AccountStatus = 'active' | 'suspended' | 'banned';

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  lastActive: string;
  stickers: number;
  trades: number;
  status: AccountStatus;
  location: string;
}

export interface CollectorComparison {
  id: string;
  username: string;
  email: string;
  distance: string;
  matchScore: number;
  matches: string[];
  youNeed: string[];
  theyNeed: string[];
  theyHaveYouNeed: number;
  youHaveTheyNeed: number;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  matches: boolean;
  messages: boolean;
  tradeRequests: boolean;
  permission: NotificationPermission | 'unsupported';
  updatedAt: string;
}

export interface PrivacyPreferences {
  profileVisible: boolean;
  updatedAt: string;
}

interface StoredAccount {
  user: AppUser;
  passwordDigest: string;
  recoveryQuestion?: string;
  recoveryAnswerDigest?: string;
  stickers: StickerState[];
  conversations: unknown[];
  notificationPreferences?: NotificationPreferences;
  privacyPreferences?: PrivacyPreferences;
  status: AccountStatus;
}

const USER_KEY = 'stickerswap.currentUser';
const STICKERS_KEY = 'stickerswap.userStickers';
const CONVERSATIONS_KEY = 'stickerswap.conversations';
const PUBLIC_MESSAGES_KEY = 'stickerswap.publicMessages';
const ANALYTICS_KEY = 'stickerswap.analyticsEvents';
const ACCOUNTS_KEY = 'stickerswap.accounts';
const NOTIFICATION_PREFS_KEY = 'stickerswap.notificationPreferences';
const SUPABASE_SESSION_KEY = 'stickerswap.supabaseSession';
const SUPABASE_COMPARISONS_KEY = 'stickerswap.supabaseComparisons';

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

const passwordDigest = (email: string, password: string) => {
  const input = `${email.trim().toLowerCase()}:stickerswap:${password}`;
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(index);
  }
  return (hash >>> 0).toString(16);
};

const recoveryAnswerDigest = (email: string, answer: string) => {
  const normalizedAnswer = answer.trim().toLowerCase().replace(/\s+/g, ' ');
  return passwordDigest(email, `recovery:${normalizedAnswer}`);
};

interface SupabaseSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

interface SupabaseProfile {
  id: string;
  username: string;
  email: string;
  created_at: string;
  last_active: string;
  latitude: number | null;
  longitude: number | null;
}

interface SupabaseStickerRow {
  sticker_code: string;
  owned: boolean;
  missing: boolean;
  duplicate_count: number;
  updated_at: string;
}

interface SupabaseComparisonRow {
  user_id: string;
  username: string;
  email: string;
  distance_km: number | null;
  match_score: number;
  matches: string[];
  you_need: string[];
  they_need: string[];
  they_have_you_need: number;
  you_have_they_need: number;
}

interface SupabasePublicMessageRow {
  id: string;
  message_text: string;
  created_at: string;
  profiles?: { username?: string } | { username?: string }[];
}

interface SupabasePrivateMessageRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
}

const usingSupabase = () => isSupabaseConfigured();

const readSupabaseSession = () => readJson<SupabaseSession | null>(SUPABASE_SESSION_KEY, null);

const writeSupabaseSession = (session: SupabaseSession | null) => {
  if (!session) {
    localStorage.removeItem(SUPABASE_SESSION_KEY);
    return;
  }
  writeJson(SUPABASE_SESSION_KEY, session);
};

const toStoredSession = (auth: { access_token: string; refresh_token?: string; expires_in?: number }): SupabaseSession => ({
  accessToken: auth.access_token,
  refreshToken: auth.refresh_token,
  expiresAt: Date.now() + ((auth.expires_in || 3600) - 60) * 1000,
});

const getActiveSupabaseSession = async (): Promise<SupabaseSession | null> => {
  const session = readSupabaseSession();
  if (!session) return null;
  if (!session.refreshToken || (session.expiresAt && session.expiresAt > Date.now())) return session;

  try {
    const refreshed = await supabaseRefreshSession(session.refreshToken);
    const nextSession = toStoredSession(refreshed);
    writeSupabaseSession(nextSession);
    return nextSession;
  } catch {
    writeSupabaseSession(null);
    return null;
  }
};

const toAppUser = (profile: SupabaseProfile): AppUser => ({
  id: profile.id,
  username: profile.username,
  email: profile.email,
  isAnonymous: false,
  createdAt: profile.created_at,
  lastActive: profile.last_active,
  latitude: profile.latitude,
  longitude: profile.longitude,
});

const fetchCurrentProfile = async (userId: string, accessToken: string): Promise<AppUser | null> => {
  const rows = await supabaseRest<SupabaseProfile[]>(
    `/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=*&limit=1`,
    { accessToken }
  );
  const profile = rows[0];
  return profile ? toAppUser(profile) : null;
};

const fetchSupabaseStickers = async (accessToken: string): Promise<StickerState[]> => {
  const rows = await supabaseRest<SupabaseStickerRow[]>(
    '/rest/v1/user_stickers?select=sticker_code,owned,missing,duplicate_count,updated_at',
    { accessToken }
  );
  return rows.map(row => ({
    code: row.sticker_code,
    owned: row.owned,
    missing: row.missing,
    duplicateCount: row.duplicate_count,
    updatedAt: row.updated_at,
  }));
};

const toComparison = (row: SupabaseComparisonRow): CollectorComparison => ({
  id: row.user_id,
  username: row.username,
  email: row.email,
  distance: row.distance_km && row.distance_km > 0 ? `${row.distance_km.toFixed(1)} km` : 'Kansas City',
  matchScore: row.match_score,
  matches: row.matches || [],
  youNeed: row.you_need || [],
  theyNeed: row.they_need || [],
  theyHaveYouNeed: row.they_have_you_need || 0,
  youHaveTheyNeed: row.you_have_they_need || 0,
});

const readAccounts = () => readJson<Record<string, StoredAccount>>(ACCOUNTS_KEY, {});

const defaultNotificationPreferences = (): NotificationPreferences => ({
  pushEnabled: false,
  matches: true,
  messages: true,
  tradeRequests: true,
  permission: typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  updatedAt: now(),
});

const defaultPrivacyPreferences = (): PrivacyPreferences => ({
  profileVisible: true,
  updatedAt: now(),
});

const normalizeAccount = (account: StoredAccount | AppUser): StoredAccount => {
  if ('user' in account) {
    return {
      ...account,
      stickers: account.stickers || [],
      conversations: account.conversations || [],
      notificationPreferences: account.notificationPreferences,
      privacyPreferences: account.privacyPreferences,
      status: account.status || 'active',
    };
  }

  return {
    user: account,
    passwordDigest: '',
    recoveryQuestion: undefined,
    recoveryAnswerDigest: undefined,
    stickers: [],
    conversations: [],
    notificationPreferences: undefined,
    privacyPreferences: undefined,
    status: 'active',
  };
};

const stickerStatesWithMissingDefaults = (stickers: StickerState[] = []): StickerState[] => {
  const savedByCode = new Map(stickers.map(sticker => [sticker.code, sticker]));
  return players.map(player => {
    const saved = savedByCode.get(player.code);
    if (saved) return saved;
    return {
      code: player.code,
      owned: false,
      missing: true,
      duplicateCount: 0,
      updatedAt: now(),
    };
  });
};

const saveAccount = (email: string, account: StoredAccount) => {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = readAccounts();
  writeJson(ACCOUNTS_KEY, {
    ...accounts,
    [normalizedEmail]: normalizeAccount(account),
  });
};

const getCurrentAccount = () => {
  const user = readJson<AppUser | null>(USER_KEY, null);
  if (!user?.email) return null;
  const normalizedEmail = user.email.trim().toLowerCase();
  const account = readAccounts()[normalizedEmail];
  if (!account) return null;
  return { email: normalizedEmail, account: normalizeAccount(account) };
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

  async createEmailUser(name: string, email: string, password: string, recoveryQuestion: string, recoveryAnswer: string): Promise<AppUser> {
    const normalizedEmail = email.trim().toLowerCase();
    if (usingSupabase()) {
      const exists = await backend.accountExists(normalizedEmail);
      if (exists) throw new Error('ACCOUNT_EXISTS');

      let signUp;
      try {
        signUp = await supabaseSignUp(normalizedEmail, password, {
          username: name.trim(),
          recovery_question: recoveryQuestion,
          recovery_answer_digest: recoveryAnswerDigest(normalizedEmail, recoveryAnswer),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : '';
        if (message.includes('already registered') || message.includes('already exists')) {
          throw new Error('ACCOUNT_EXISTS');
        }
        throw error;
      }
      if (!signUp.access_token) {
        throw new Error('ACCOUNT_CONFIRM_EMAIL');
      }

      const auth = signUp;
      const accessToken = auth.access_token;
      const userId = auth.user?.id;
      if (!accessToken || !userId) throw new Error('ACCOUNT_NOT_READY');

      writeSupabaseSession(toStoredSession({
        access_token: accessToken,
        refresh_token: 'refresh_token' in auth ? auth.refresh_token : undefined,
        expires_in: 'expires_in' in auth ? auth.expires_in as number : undefined,
      }));
      const createdUser = await fetchCurrentProfile(userId, accessToken);
      if (!createdUser) throw new Error('PROFILE_NOT_READY');
      writeJson(USER_KEY, createdUser);
      backend.track('username_created', { user_id: createdUser.id, username: createdUser.username });
      backend.track('email_added', { user_id: createdUser.id });
      backend.track('chat_unlocked', { user_id: createdUser.id });
      return createdUser;
    }

    const accounts = readAccounts();
    if (accounts[normalizedEmail]) {
      throw new Error('ACCOUNT_EXISTS');
    }
    const user: AppUser = {
      id: createId(),
      username: name.trim(),
      email: normalizedEmail,
      isAnonymous: false,
      createdAt: now(),
      lastActive: now(),
      latitude: null,
      longitude: null,
    };
    writeJson(USER_KEY, user);
    writeJson(ACCOUNTS_KEY, {
      ...accounts,
      [normalizedEmail]: {
        user,
        passwordDigest: passwordDigest(normalizedEmail, password),
        recoveryQuestion,
        recoveryAnswerDigest: recoveryAnswerDigest(normalizedEmail, recoveryAnswer),
        stickers: [],
        conversations: [],
        status: 'active',
      },
    });
    backend.track('username_created', { user_id: user.id, username: user.username });
    backend.track('email_added', { user_id: user.id });
    backend.track('chat_unlocked', { user_id: user.id });
    return user;
  },

  async signInWithEmail(email: string, password: string): Promise<AppUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    if (usingSupabase()) {
      try {
        const auth = await supabaseLogIn(normalizedEmail, password);
        writeSupabaseSession(toStoredSession(auth));
        const signedInUser = await fetchCurrentProfile(auth.user.id, auth.access_token);
        if (!signedInUser) throw new Error('PROFILE_NOT_READY');
        writeJson(USER_KEY, signedInUser);
        return signedInUser;
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : '';
        if (message.includes('email not confirmed')) throw new Error('ACCOUNT_CONFIRM_EMAIL');
        if (message.includes('invalid login') || message.includes('invalid credentials')) throw new Error('ACCOUNT_INVALID');
        throw new Error('ACCOUNT_LOGIN_FAILED');
      }
    }

    const accounts = readAccounts();
    const account = accounts[normalizedEmail] ? normalizeAccount(accounts[normalizedEmail]) : null;
    if (!account) return null;
    if (account.status !== 'active') return null;
    if (account.passwordDigest !== passwordDigest(normalizedEmail, password)) return null;
    const updated = { ...account.user, lastActive: now() };
    writeJson(USER_KEY, updated);
    writeJson(ACCOUNTS_KEY, { ...accounts, [normalizedEmail]: { ...account, user: updated } });
    return updated;
  },

  async accountExists(email: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    if (usingSupabase()) {
      try {
        return await supabaseRpc<boolean>('email_exists', { p_email: normalizedEmail });
      } catch {
        return false;
      }
    }

    const accounts = readAccounts();
    return Boolean(accounts[normalizedEmail]);
  },

  async getRecoveryQuestion(email: string): Promise<string | null> {
    const normalizedEmail = email.trim().toLowerCase();
    if (usingSupabase()) {
      try {
        return await supabaseRpc<string | null>('get_recovery_question', { p_email: normalizedEmail });
      } catch {
        return null;
      }
    }

    const accounts = readAccounts();
    const account = accounts[normalizedEmail] ? normalizeAccount(accounts[normalizedEmail]) : null;
    if (!account?.recoveryQuestion || !account.recoveryAnswerDigest) return null;
    return account.recoveryQuestion;
  },

  async verifyRecoveryAnswer(email: string, answer: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    if (usingSupabase()) {
      try {
        return await supabaseRpc<boolean>('verify_recovery_answer', {
          p_email: normalizedEmail,
          p_recovery_answer_digest: recoveryAnswerDigest(normalizedEmail, answer),
        });
      } catch {
        return false;
      }
    }

    const accounts = readAccounts();
    const account = accounts[normalizedEmail] ? normalizeAccount(accounts[normalizedEmail]) : null;
    if (!account?.recoveryAnswerDigest) return false;
    return account.recoveryAnswerDigest === recoveryAnswerDigest(normalizedEmail, answer);
  },

  async resetPassword(email: string, answer: string, password: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    if (usingSupabase()) {
      try {
        await supabaseResetPasswordWithRecovery(
          normalizedEmail,
          recoveryAnswerDigest(normalizedEmail, answer),
          password
        );
        backend.track('password_reset', { email: normalizedEmail });
        return true;
      } catch {
        return false;
      }
    }

    const accounts = readAccounts();
    const account = accounts[normalizedEmail] ? normalizeAccount(accounts[normalizedEmail]) : null;
    if (!account) return false;
    if (!backend.verifyRecoveryAnswer(normalizedEmail, answer)) return false;
    writeJson(ACCOUNTS_KEY, {
      ...accounts,
      [normalizedEmail]: {
        ...account,
        passwordDigest: passwordDigest(normalizedEmail, password),
        user: { ...account.user, lastActive: now() },
      },
    });
    backend.track('password_reset', { user_id: account.user.id });
    return true;
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
    const accounts = readAccounts();
    const normalizedEmail = updated.email.toLowerCase();
    writeJson(ACCOUNTS_KEY, {
      ...accounts,
      [normalizedEmail]: accounts[normalizedEmail] || {
        user: updated,
        passwordDigest: '',
        stickers: backend.loadStickers(),
        conversations: backend.loadConversations(),
        status: 'active',
      },
    });
    backend.track('email_added', { user_id: updated.id });
    backend.track('chat_unlocked', { user_id: updated.id });
    return updated;
  },

  signOut() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(STICKERS_KEY);
    localStorage.removeItem(CONVERSATIONS_KEY);
    localStorage.removeItem(SUPABASE_SESSION_KEY);
    localStorage.removeItem(SUPABASE_COMPARISONS_KEY);
  },

  updateLocation(latitude: number | null, longitude: number | null): AppUser | null {
    const user = backend.loadUser();
    if (!user) return null;
    const updated = { ...user, latitude, longitude, lastActive: now() };
    writeJson(USER_KEY, updated);
    const session = readSupabaseSession();
    if (usingSupabase() && session) {
      void supabaseRest('/rest/v1/profiles?id=eq.' + encodeURIComponent(user.id), {
        method: 'PATCH',
        accessToken: session.accessToken,
        prefer: 'return=minimal',
        body: {
          latitude,
          longitude,
          location_enabled: latitude !== null && longitude !== null,
          last_active: now(),
        },
      }).catch(() => {});
    }
    if (updated.email) {
      const current = getCurrentAccount();
      if (current) saveAccount(current.email, { ...current.account, user: updated });
    }
    return updated;
  },

  updateCurrentUserProfile(name: string, email: string): AppUser | { error: 'EMAIL_EXISTS' } | null {
    const current = getCurrentAccount();
    const user = backend.loadUser();
    if (!user) return null;

    const normalizedEmail = email.trim().toLowerCase();
    const previousEmail = user.email?.trim().toLowerCase() || current?.email;
    const accounts = readAccounts();
    if (previousEmail !== normalizedEmail && accounts[normalizedEmail]) {
      return { error: 'EMAIL_EXISTS' };
    }

    const updatedUser = {
      ...user,
      username: name.trim(),
      email: normalizedEmail,
      lastActive: now(),
    };

    const previousAccount = current?.account || {
      user,
      passwordDigest: '',
      stickers: backend.loadStickers(),
      conversations: backend.loadConversations(),
      status: 'active' as AccountStatus,
    };
    const nextAccounts = { ...accounts };
    if (previousEmail && previousEmail !== normalizedEmail) delete nextAccounts[previousEmail];
    nextAccounts[normalizedEmail] = normalizeAccount({ ...previousAccount, user: updatedUser });
    writeJson(ACCOUNTS_KEY, nextAccounts);
    writeJson(USER_KEY, updatedUser);
    backend.track('profile_updated', { user_id: updatedUser.id });
    return updatedUser;
  },

  loadStickers(): StickerState[] {
    const current = getCurrentAccount();
    if (current) return current.account.stickers;
    return readJson<StickerState[]>(STICKERS_KEY, []);
  },

  async loadStickersRemote(): Promise<StickerState[]> {
    const session = await getActiveSupabaseSession();
    if (!usingSupabase() || !session) return backend.loadStickers();
    const remoteStickers = await fetchSupabaseStickers(session.accessToken);
    const normalized = stickerStatesWithMissingDefaults(remoteStickers);
    writeJson(STICKERS_KEY, normalized);
    return normalized;
  },

  async saveStickers(stickers: StickerState[]) {
    const current = getCurrentAccount();
    if (current) {
      saveAccount(current.email, { ...current.account, stickers });
    }
    writeJson(STICKERS_KEY, stickers);
    const session = await getActiveSupabaseSession();
    if (usingSupabase() && session) {
      await supabaseRpc('upsert_user_stickers_bulk', {
        p_stickers: stickers.map(sticker => ({
          sticker_code: sticker.code,
          owned: sticker.owned,
          missing: sticker.missing,
          duplicate_count: sticker.duplicateCount,
        })),
      }, session.accessToken);
    }
  },

  loadConversations<T>(): T[] {
    const current = getCurrentAccount();
    if (current) return current.account.conversations as T[];
    return readJson<T[]>(CONVERSATIONS_KEY, []);
  },

  async loadPrivateMessagesRemote(): Promise<StoredConversation[]> {
    const session = await getActiveSupabaseSession();
    const user = backend.loadUser();
    if (!usingSupabase() || !session || !user) return backend.loadConversations<StoredConversation>();

    const rows = await supabaseRest<SupabasePrivateMessageRow[]>(
      '/rest/v1/messages?select=id,sender_id,receiver_id,message_text,created_at&order=created_at.asc&limit=300',
      { accessToken: session.accessToken }
    );
    const otherUserIds = Array.from(new Set(rows.map(row => row.sender_id === user.id ? row.receiver_id : row.sender_id)));
    const profiles = otherUserIds.length > 0
      ? await supabaseRest<Array<{ id: string; username: string }>>(
        `/rest/v1/profiles?id=in.(${otherUserIds.join(',')})&select=id,username`,
        { accessToken: session.accessToken }
      ).catch(() => [])
      : [];
    const usernamesById = new Map(profiles.map(profile => [profile.id, profile.username]));

    const conversationsByUser = new Map<string, StoredConversation>();
    rows.forEach(row => {
      const isOwn = row.sender_id === user.id;
      const otherUserId = isOwn ? row.receiver_id : row.sender_id;
      const otherUsername = usernamesById.get(otherUserId) || 'Collector';
      const message: StoredMessage = {
        id: row.id,
        text: row.message_text,
        sender: isOwn ? 'You' : otherUsername,
        timestamp: new Date(row.created_at),
        isOwn,
      };
      const existing = conversationsByUser.get(otherUserId) || {
        userId: otherUserId,
        username: otherUsername,
        messages: [],
      };
      const messages = [...existing.messages, message];
      conversationsByUser.set(otherUserId, {
        ...existing,
        username: otherUsername,
        messages,
        lastMessage: message.text,
        lastMessageTime: message.timestamp,
      });
    });

    const conversations = Array.from(conversationsByUser.values())
      .sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime());
    writeJson(CONVERSATIONS_KEY, conversations);
    return conversations;
  },

  saveConversations(conversations: unknown[]) {
    const current = getCurrentAccount();
    if (current) {
      saveAccount(current.email, { ...current.account, conversations });
    }
    writeJson(CONVERSATIONS_KEY, conversations);
  },

  loadPublicMessages(): StoredMessage[] {
    return readJson<StoredMessage[]>(PUBLIC_MESSAGES_KEY, []);
  },

  async loadPublicMessagesRemote(): Promise<StoredMessage[]> {
    const session = await getActiveSupabaseSession();
    const user = backend.loadUser();
    if (!usingSupabase() || !session) return backend.loadPublicMessages();
    const rows = await supabaseRest<SupabasePublicMessageRow[]>(
      '/rest/v1/public_messages?room_key=eq.kansas_city&select=id,message_text,created_at,profiles(username)&order=created_at.asc&limit=100',
      { accessToken: session.accessToken }
    );
    const messages = rows.map(row => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        id: row.id,
        text: row.message_text,
        sender: profile?.username || 'Collector',
        timestamp: new Date(row.created_at),
        isOwn: false,
        isPublic: true,
      };
    }).map(message => ({
      ...message,
      isOwn: message.sender === user?.username,
    }));
    writeJson(PUBLIC_MESSAGES_KEY, messages);
    return messages;
  },

  savePublicMessages(messages: StoredMessage[]) {
    writeJson(PUBLIC_MESSAGES_KEY, messages);
  },

  async sendPublicMessage(text: string): Promise<StoredMessage | null> {
    const session = await getActiveSupabaseSession();
    const user = backend.loadUser();
    if (!usingSupabase() || !session || !user) return null;
    let saved: {
      id: string;
      message_text: string;
      created_at: string;
    };

    try {
      saved = await supabaseRpc<{
        id: string;
        message_text: string;
        created_at: string;
      }>('send_public_message', {
        p_room_key: 'kansas_city',
        p_message_text: text,
      }, session.accessToken);
    } catch {
      const rows = await supabaseRest<Array<{
        id: string;
        message_text: string;
        created_at: string;
      }>>('/rest/v1/public_messages', {
        method: 'POST',
        accessToken: session.accessToken,
        prefer: 'return=representation',
        body: {
          room_key: 'kansas_city',
          user_id: user.id,
          message_text: text,
        },
      });
      saved = rows[0];
    }

    if (!saved) return null;
    return {
      id: saved.id,
      text: saved.message_text,
      sender: user.username,
      timestamp: new Date(saved.created_at),
      isOwn: true,
      isPublic: true,
    };
  },

  async sendPrivateMessage(receiverId: string, text: string): Promise<StoredMessage | null> {
    const session = await getActiveSupabaseSession();
    const user = backend.loadUser();
    if (!usingSupabase() || !session || !user || !receiverId) return null;
    let saved: {
      id: string;
      message_text: string;
      created_at: string;
    };

    try {
      saved = await supabaseRpc<{
        id: string;
        message_text: string;
        created_at: string;
      }>('send_private_message', {
        p_receiver_id: receiverId,
        p_message_text: text,
      }, session.accessToken);
    } catch {
      const rows = await supabaseRest<Array<{
        id: string;
        message_text: string;
        created_at: string;
      }>>('/rest/v1/messages', {
        method: 'POST',
        accessToken: session.accessToken,
        prefer: 'return=representation',
        body: {
          sender_id: user.id,
          receiver_id: receiverId,
          message_text: text,
        },
      });
      saved = rows[0];
    }

    if (!saved) return null;
    return {
      id: saved.id,
      text: saved.message_text,
      sender: 'You',
      timestamp: new Date(saved.created_at),
      isOwn: true,
    };
  },

  loadNotificationPreferences(): NotificationPreferences {
    const current = getCurrentAccount();
    if (current?.account.notificationPreferences) {
      return {
        ...defaultNotificationPreferences(),
        ...current.account.notificationPreferences,
      };
    }
    return {
      ...defaultNotificationPreferences(),
      ...readJson<Partial<NotificationPreferences>>(NOTIFICATION_PREFS_KEY, {}),
    };
  },

  saveNotificationPreferences(preferences: NotificationPreferences) {
    const next = { ...preferences, updatedAt: now() };
    const current = getCurrentAccount();
    if (current) {
      saveAccount(current.email, { ...current.account, notificationPreferences: next });
    }
    writeJson(NOTIFICATION_PREFS_KEY, next);
    backend.track('notification_preferences_updated', {
      push_enabled: next.pushEnabled,
      matches: next.matches,
      messages: next.messages,
      trade_requests: next.tradeRequests,
      permission: next.permission,
    });
  },

  loadPrivacyPreferences(): PrivacyPreferences {
    const current = getCurrentAccount();
    if (current?.account.privacyPreferences) {
      return {
        ...defaultPrivacyPreferences(),
        ...current.account.privacyPreferences,
      };
    }
    return defaultPrivacyPreferences();
  },

  savePrivacyPreferences(preferences: PrivacyPreferences) {
    const next = { ...preferences, updatedAt: now() };
    const current = getCurrentAccount();
    if (current) {
      saveAccount(current.email, { ...current.account, privacyPreferences: next });
    }
    backend.track('privacy_preferences_updated', {
      profile_visible: next.profileVisible,
    });
  },

  track(name: string, properties?: Record<string, unknown>) {
    const events = readJson<AnalyticsEvent[]>(ANALYTICS_KEY, []);
    events.push({ id: createId(), name, createdAt: now(), properties });
    writeJson(ANALYTICS_KEY, events);
    const session = readSupabaseSession();
    const user = backend.loadUser();
    if (usingSupabase() && session) {
      void supabaseRest('/rest/v1/analytics_events', {
        method: 'POST',
        accessToken: session.accessToken,
        prefer: 'return=minimal',
        body: {
          user_id: user?.id || null,
          event_name: name,
          properties: properties || {},
        },
      }).catch(() => {});
    }
  },

  getAnalyticsEvents(): AnalyticsEvent[] {
    return readJson<AnalyticsEvent[]>(ANALYTICS_KEY, []);
  },

  getAdminUsers(): AdminUserSummary[] {
    return Object.values(readAccounts()).map(rawAccount => {
      const account = normalizeAccount(rawAccount);
      const collected = account.stickers.filter(sticker => sticker.owned || sticker.duplicateCount > 0).length;
      return {
        id: account.user.id,
        name: account.user.username,
        email: account.user.email || '',
        joinedAt: account.user.createdAt.slice(0, 10),
        lastActive: account.user.lastActive.slice(0, 10),
        stickers: collected,
        trades: account.conversations.length,
        status: account.status,
        location: 'Kansas City',
      };
    }).sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
  },

  getCollectorComparisons(currentStickers: StickerState[]): CollectorComparison[] {
    if (usingSupabase()) {
      return readJson<CollectorComparison[]>(SUPABASE_COMPARISONS_KEY, []);
    }

    const currentUser = backend.loadUser();
    const normalizedCurrentStickers = stickerStatesWithMissingDefaults(currentStickers);
    const currentMissing = normalizedCurrentStickers.filter(sticker => sticker.missing).map(sticker => sticker.code);
    const currentDuplicateCodes = new Set(
      normalizedCurrentStickers
        .filter(sticker => sticker.owned && sticker.duplicateCount > 0)
        .map(sticker => sticker.code)
    );

    return Object.values(readAccounts())
      .map(rawAccount => normalizeAccount(rawAccount))
      .filter(account => account.status === 'active' && account.user.email !== currentUser?.email)
      .filter(account => account.privacyPreferences?.profileVisible !== false)
      .map(account => {
        const accountStickers = stickerStatesWithMissingDefaults(account.stickers);
        const theirDuplicateCodes = new Set(
          accountStickers
            .filter(sticker => sticker.owned && sticker.duplicateCount > 0)
            .map(sticker => sticker.code)
        );
        const theirMissing = accountStickers
          .filter(sticker => sticker.missing)
          .map(sticker => sticker.code);
        const matches = currentMissing.filter(code => theirDuplicateCodes.has(code));
        const youHaveTheyNeed = theirMissing.filter(code => currentDuplicateCodes.has(code)).length;
        const matchScore = currentMissing.length > 0
          ? Math.round((matches.length / currentMissing.length) * 100)
          : 0;

        return {
          id: account.user.id,
          username: account.user.username,
          email: account.user.email || account.user.id,
          distance: account.user.latitude && account.user.longitude ? 'Nearby' : 'Kansas City',
          matchScore,
          matches,
          youNeed: currentMissing,
          theyNeed: theirMissing,
          theyHaveYouNeed: matches.length,
          youHaveTheyNeed,
        };
      })
      .sort((a, b) => b.theyHaveYouNeed - a.theyHaveYouNeed || b.matchScore - a.matchScore);
  },

  async refreshCollectorComparisons(): Promise<CollectorComparison[]> {
    const session = await getActiveSupabaseSession();
    if (!usingSupabase() || !session) {
      return backend.getCollectorComparisons(backend.loadStickers());
    }

    const rows = await supabaseRpc<SupabaseComparisonRow[]>(
      'find_matches',
      { p_radius_km: 50, p_limit: 50 },
      session.accessToken
    );
    const comparisons = rows.map(toComparison);
    writeJson(SUPABASE_COMPARISONS_KEY, comparisons);
    return comparisons;
  },

  updateAccountStatus(email: string, status: AccountStatus) {
    const normalizedEmail = email.trim().toLowerCase();
    const account = readAccounts()[normalizedEmail];
    if (!account) return;
    saveAccount(normalizedEmail, { ...normalizeAccount(account), status });
  },

  deleteAccount(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const accounts = readAccounts();
    const nextAccounts = { ...accounts };
    delete nextAccounts[normalizedEmail];
    writeJson(ACCOUNTS_KEY, nextAccounts);
    const currentUser = backend.loadUser();
    if (currentUser?.email?.toLowerCase() === normalizedEmail) {
      backend.signOut();
    }
  },
};

export const shouldPromptForUpgrade = (stickers: StickerState[]) => {
  const collected = stickers.filter(sticker => sticker.owned || sticker.duplicateCount > 0).length;
  const duplicates = stickers.reduce((sum, sticker) => sum + sticker.duplicateCount, 0);
  return collected > 20 || duplicates > 5;
};
