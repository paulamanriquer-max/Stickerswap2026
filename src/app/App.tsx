import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { AlbumSelectionScreen } from './screens/AlbumSelectionScreen';
import { MyAlbumScreen } from './screens/MyAlbumScreen';
import { TeamDetailScreen } from './screens/TeamDetailScreen';
import { MatchesScreen } from './screens/MatchesScreen';
import { MatchDetailScreen } from './screens/MatchDetailScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AddStickerSheet } from './screens/AddStickerSheet';
import { BottomNavigation } from './components/BottomNavigation';
import { SignInScreen } from './screens/SignInScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { ResetPasswordScreen } from './screens/ResetPasswordScreen';
import { EditProfileScreen } from './screens/EditProfileScreen';
import { LocationPermissionScreen } from './screens/LocationPermissionScreen';
import { LocationSettingsScreen } from './screens/LocationSettingsScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { PrivacySecurityScreen } from './screens/PrivacySecurityScreen';
import { ChatsScreen } from './screens/ChatsScreen';
import { ChatScreen } from './screens/ChatScreen';
import { AdminLoginScreen } from './screens/AdminLoginScreen';
import { AdminScreen } from './screens/AdminScreen';
import { AddEmailScreen } from './screens/AddEmailScreen';
import { UpgradePrompt } from './components/UpgradePrompt';
import { AppUser, backend, shouldPromptForUpgrade, StickerState } from './lib/backend';
import { installNotificationFeedbackUnlock, showDeviceNotification } from './lib/notificationFeedback';
import { applyStickerStatus, createDefaultStickerStates, normalizeStickerStates, setStickerStatus, StickerStatus } from './lib/stickerState';
import { isInKansasCityMetro, MARKET_NAME, PUBLIC_MARKET_ROOM_NAME } from './lib/location';

type Screen =
  | 'welcome'
  | 'sign-in'
  | 'sign-up'
  | 'reset-password'
  | 'album-selection'
  | 'location-permission'
  | 'album'
  | 'team-detail'
  | 'matches'
  | 'match-detail'
  | 'chats'
  | 'chat'
  | 'profile'
  | 'edit-profile'
  | 'location-settings'
  | 'notifications'
  | 'privacy-security'
  | 'add-email'
  | 'admin-login'
  | 'admin';

type Tab = 'album' | 'matches' | 'chats' | 'profile';

interface Sticker {
  code: string;
  owned: boolean;
  missing: boolean;
  duplicateCount: number;
  updatedAt?: string;
}

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isOwn: boolean;
}

interface Conversation {
  userId?: string;
  username: string;
  messages: Message[];
  lastMessage?: string;
  lastMessageTime?: Date;
}

const MVP_CITY = MARKET_NAME;
const PUBLIC_ROOM_NAME = PUBLIC_MARKET_ROOM_NAME;
const LAST_SEEN_PUBLIC_CHAT_KEY = 'stickerswap.lastSeenPublicChatAt';
const LAST_SEEN_PRIVATE_CHAT_KEY = 'stickerswap.lastSeenPrivateChatAt';

const tabForScreen = (screen: Screen): Tab | null => {
  if (screen === 'album' || screen === 'team-detail') return 'album';
  if (screen === 'matches' || screen === 'match-detail') return 'matches';
  if (screen === 'chats' || screen === 'chat') return 'chats';
  if (screen === 'profile' || screen === 'edit-profile' || screen === 'location-settings' || screen === 'notifications' || screen === 'privacy-security') {
    return 'profile';
  }
  return null;
};

const messageTime = (message: Message) => new Date(message.timestamp).getTime();
const latestMessageTime = (messages: Message[]) => (
  messages.reduce((latest, message) => Math.max(latest, messageTime(message)), 0)
);

const loadLastSeenPrivate = () => {
  try {
    return JSON.parse(localStorage.getItem(LAST_SEEN_PRIVATE_CHAT_KEY) || '{}') as Record<string, number>;
  } catch {
    return {};
  }
};

export default function App() {
  const [user, setUser] = useState<AppUser | null>(() => backend.loadUser());
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => backend.loadUser() ? 'matches' : 'welcome');
  const [activeTab, setActiveTab] = useState<Tab>('matches');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedCollector, setSelectedCollector] = useState<string>('');
  const [selectedChatUser, setSelectedChatUser] = useState<string>('');
  const [selectedChatUserId, setSelectedChatUserId] = useState<string>('');
  const [showAddSticker, setShowAddSticker] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => Boolean(backend.loadUser()));
  const [previousScreen, setPreviousScreen] = useState<Screen | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>(() => normalizeStickerStates(backend.loadStickers()));
  const [conversations, setConversations] = useState<Conversation[]>(() => backend.loadConversations<Conversation>());
  const [publicMessages, setPublicMessages] = useState<Message[]>(() => backend.loadPublicMessages());
  const [upgradePrompt, setUpgradePrompt] = useState<{ title?: string; message?: string } | null>(null);
  const [chatError, setChatError] = useState('');
  const [lastSeenPublicChatAt, setLastSeenPublicChatAt] = useState(() => Number(localStorage.getItem(LAST_SEEN_PUBLIC_CHAT_KEY) || 0));
  const [lastSeenPrivateChatAt, setLastSeenPrivateChatAt] = useState<Record<string, number>>(() => loadLastSeenPrivate());
  const notifiedMessageIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedNotificationsRef = useRef(false);
  const currentScreenRef = useRef(currentScreen);
  const skipNextHistoryPushRef = useRef(false);
  const lastHistoryScreenRef = useRef<Screen | null>(null);

  useEffect(() => {
    backend.track('app_open', { user_id: user?.id, anonymous: user?.isAnonymous ?? true });
    return installNotificationFeedbackUnlock();
  }, []);

  useEffect(() => {
    const updateAppHeight = () => {
      const visualViewport = window.visualViewport;
      const height = visualViewport?.height || window.innerHeight;
      const keyboardInset = visualViewport
        ? Math.max(0, window.innerHeight - visualViewport.height - visualViewport.offsetTop)
        : 0;
      document.documentElement.style.setProperty('--stickerswap-app-height', `${height}px`);
      document.documentElement.style.setProperty('--stickerswap-keyboard-inset', `${keyboardInset}px`);
    };

    updateAppHeight();
    window.visualViewport?.addEventListener('resize', updateAppHeight);
    window.visualViewport?.addEventListener('scroll', updateAppHeight);
    window.addEventListener('resize', updateAppHeight);
    window.addEventListener('orientationchange', updateAppHeight);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateAppHeight);
      window.visualViewport?.removeEventListener('scroll', updateAppHeight);
      window.removeEventListener('resize', updateAppHeight);
      window.removeEventListener('orientationchange', updateAppHeight);
    };
  }, []);

  useEffect(() => {
    currentScreenRef.current = currentScreen;
  }, [currentScreen]);

  useEffect(() => {
    const state = { stickerswap: true, screen: currentScreenRef.current };
    window.history.replaceState(state, '', window.location.href);
    window.history.pushState(state, '', window.location.href);
    lastHistoryScreenRef.current = currentScreenRef.current;

    const handleBrowserBack = (event: PopStateEvent) => {
      const nextScreen = event.state?.stickerswap ? event.state.screen as Screen : null;

      if (!nextScreen) {
        window.history.pushState(
          { stickerswap: true, screen: currentScreenRef.current },
          '',
          window.location.href
        );
        return;
      }

      skipNextHistoryPushRef.current = true;
      setCurrentScreen(nextScreen);
      const nextTab = tabForScreen(nextScreen);
      if (nextTab) setActiveTab(nextTab);
    };

    window.addEventListener('popstate', handleBrowserBack);
    return () => window.removeEventListener('popstate', handleBrowserBack);
  }, []);

  useEffect(() => {
    if (skipNextHistoryPushRef.current) {
      skipNextHistoryPushRef.current = false;
      lastHistoryScreenRef.current = currentScreen;
      return;
    }

    if (lastHistoryScreenRef.current === currentScreen) return;

    window.history.pushState(
      { stickerswap: true, screen: currentScreen },
      '',
      window.location.href
    );
    lastHistoryScreenRef.current = currentScreen;
  }, [currentScreen]);

  useEffect(() => {
    if (!user || !['chats', 'chat'].includes(currentScreen)) return;
    let cancelled = false;
    const refreshMessages = () => {
      void backend.loadPrivateMessagesRemote().then(next => {
        if (!cancelled) setConversations(next);
      }).catch(() => {});
      void backend.loadPublicMessagesRemote().then(next => {
        if (!cancelled) setPublicMessages(next);
      }).catch(() => {});
    };
    refreshMessages();
    const interval = window.setInterval(refreshMessages, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [currentScreen, user?.id]);

  useEffect(() => {
    void backend.saveStickers(stickers as StickerState[]).catch(() => {
      // Local preview still works if the live backend is temporarily unavailable.
    });
  }, [stickers]);

  useEffect(() => {
    backend.saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    backend.savePublicMessages(publicMessages);
  }, [publicMessages]);

  const privateUnreadByUser = useMemo(() => {
    return conversations.reduce<Record<string, number>>((counts, conversation) => {
      const key = conversation.userId || conversation.username;
      const seenAt = lastSeenPrivateChatAt[key] || 0;
      const unread = conversation.messages.filter(message => !message.isOwn && messageTime(message) > seenAt).length;
      if (unread > 0) counts[key] = unread;
      return counts;
    }, {});
  }, [conversations, lastSeenPrivateChatAt]);

  const publicUnreadCount = useMemo(() => (
    publicMessages.filter(message => !message.isOwn && messageTime(message) > lastSeenPublicChatAt).length
  ), [publicMessages, lastSeenPublicChatAt]);

  const totalUnreadChats = publicUnreadCount + Object.values(privateUnreadByUser).reduce((sum, count) => sum + count, 0);
  const isOutsideKansasCityMarket = useMemo(() => {
    if (typeof user?.latitude !== 'number' || typeof user?.longitude !== 'number') return false;
    return !isInKansasCityMetro(user.latitude, user.longitude);
  }, [user?.latitude, user?.longitude]);

  const markPublicChatRead = useCallback(() => {
    const nextSeenAt = Math.max(Date.now(), latestMessageTime(publicMessages));
    setLastSeenPublicChatAt(nextSeenAt);
    localStorage.setItem(LAST_SEEN_PUBLIC_CHAT_KEY, String(nextSeenAt));
  }, [publicMessages]);

  const markPrivateChatRead = (username: string, userId?: string) => {
    const key = userId || conversations.find(conversation => conversation.username === username)?.userId || username;
    const messages = conversations.find(conversation => conversation.username === username)?.messages || [];
    const nextSeenAt = Math.max(Date.now(), latestMessageTime(messages));
    setLastSeenPrivateChatAt(prev => {
      const next = { ...prev, [key]: nextSeenAt };
      localStorage.setItem(LAST_SEEN_PRIVATE_CHAT_KEY, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (currentScreen !== 'chat' || !selectedChatUser) return;
    if (isPublicRoom(selectedChatUser)) markPublicChatRead();
    else markPrivateChatRead(selectedChatUser, selectedChatUserId);
  }, [currentScreen, selectedChatUser, selectedChatUserId, publicMessages, conversations]);

  useEffect(() => {
    const incomingMessages = [
      ...publicMessages
        .filter(message => !message.isOwn)
        .map(message => ({
          id: `public-${message.id}`,
          title: `${message.sender} in ${PUBLIC_ROOM_NAME}`,
          body: message.text,
        })),
      ...conversations.flatMap(conversation =>
        conversation.messages
          .filter(message => !message.isOwn)
          .map(message => ({
            id: `private-${message.id}`,
            title: conversation.username,
            body: message.text,
          }))
      ),
    ];

    if (!hasInitializedNotificationsRef.current) {
      incomingMessages.forEach(message => notifiedMessageIdsRef.current.add(message.id));
      hasInitializedNotificationsRef.current = true;
      return;
    }

    const preferences = backend.loadNotificationPreferences();
    const canNotify =
      preferences.pushEnabled &&
      preferences.messages;

    incomingMessages.forEach(message => {
      if (notifiedMessageIdsRef.current.has(message.id)) return;
      notifiedMessageIdsRef.current.add(message.id);
      if (!canNotify) return;
      showDeviceNotification(message.title, message.body);
    });
  }, [publicMessages, conversations]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'album') setCurrentScreen('album');
    else if (tab === 'matches') setCurrentScreen('matches');
    else if (tab === 'chats') {
      void backend.loadPrivateMessagesRemote().then(setConversations).catch(() => {});
      void backend.loadPublicMessagesRemote().then(setPublicMessages).catch(() => {});
      setCurrentScreen('chats');
    }
    else if (tab === 'profile') setCurrentScreen('profile');
  };

  const enterKansasCityMarket = () => {
    setHasCompletedOnboarding(true);
    backend.track('nearby_users_found', { city: MVP_CITY, market: 'fixed_mvp' });
    setCurrentScreen('matches');
  };

  const requestLocation = (onDone = enterKansasCityMarket) => {
    if (!navigator.geolocation) {
      backend.track('location_unavailable', { city: MVP_CITY });
      onDone();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const updatedUser = backend.updateLocation(position.coords.latitude, position.coords.longitude);
        if (updatedUser) setUser(updatedUser);
        backend.track('location_enabled', { city: MVP_CITY });
        onDone();
      },
      () => {
        backend.updateLocation(null, null);
        backend.track('location_denied', { city: MVP_CITY });
        onDone();
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const disableLocation = () => {
    const updatedUser = backend.updateLocation(null, null);
    if (updatedUser) setUser(updatedUser);
    backend.track('location_disabled', { city: MVP_CITY });
  };

  const handleCreateAccount = async (name: string, email: string, password: string, recoveryQuestion: string, recoveryAnswer: string) => {
    if (await backend.accountExists(email)) return false;
    const createdUser = await backend.createEmailUser(name, email, password, recoveryQuestion, recoveryAnswer);
    setUser(createdUser);
    setStickers(createDefaultStickerStates());
    setConversations([]);
    setCurrentScreen('location-permission');
    return true;
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    const signedInUser = await backend.signInWithEmail(email, password);
    if (!signedInUser) return false;
    setUser(signedInUser);
    const savedStickers = await backend.loadStickersRemote();
    setStickers(normalizeStickerStates(savedStickers));
    setConversations(await backend.loadPrivateMessagesRemote());
    setPublicMessages(await backend.loadPublicMessagesRemote());
    enterKansasCityMarket();
    return true;
  };

  const handleLogout = () => {
    backend.signOut();
    setUser(null);
    setStickers([]);
    setConversations([]);
    setSelectedTeam('');
    setSelectedCollector('');
    setSelectedChatUser('');
    setSelectedChatUserId('');
    setPreviousScreen(null);
    setActiveTab('matches');
    setHasCompletedOnboarding(false);
    window.history.replaceState({ stickerswap: true, screen: 'welcome' }, '', window.location.href);
    lastHistoryScreenRef.current = 'welcome';
    setCurrentScreen('welcome');
  };

  const handlePasswordReset = async (email: string, answer: string, password: string) => {
    return backend.resetPassword(email, answer, password);
  };

  const handleProfileUpdate = (name: string, email: string) => {
    const updatedUser = backend.updateCurrentUserProfile(name, email);
    if (!updatedUser || 'error' in updatedUser) return false;
    setUser(updatedUser);
    setCurrentScreen('profile');
    return true;
  };

  const handleDeleteCurrentAccount = () => {
    const email = user?.email;
    if (email) backend.deleteAccount(email);
    handleLogout();
  };

  const handleNavigate = (screen: string) => {
    if (['album', 'matches', 'chats', 'profile'].includes(screen)) {
      setHasCompletedOnboarding(true);
    }
    setPreviousScreen(currentScreen);
    setCurrentScreen(screen as Screen);
  };

  const handleBack = () => {
    if (window.history.state?.stickerswap) {
      window.history.back();
    } else if (previousScreen) {
      setCurrentScreen(previousScreen);
      setPreviousScreen(null);
    }
  };

  const handleSendMessage = (username: string, text: string, receiverId?: string) => {
    if (!user?.email) {
      backend.track('chat_attempted', { target: username, blocked: true });
      setUpgradePrompt({
        title: 'Add your email to chat and trade with others',
        message: 'Private messages are unlocked after you add an email. Your current username and stickers stay saved.',
      });
      return;
    }

    const resolvedReceiverId =
      receiverId ||
      conversations.find(c => c.username === username)?.userId ||
      backend.getCollectorComparisons(stickers as StickerState[]).find(c => c.username === username)?.id ||
      '';

    if (!resolvedReceiverId) {
      setChatError('This chat could not connect. Go back to Matches and open this collector again.');
      return;
    }

    setChatError('');
    backend.track('message_sent', { target: username, type: 'private' });

    void backend.sendPrivateMessage(resolvedReceiverId, text)
      .then((saved) => {
        if (!saved) {
          setChatError('Message could not send. Check your connection and try again.');
          return;
        }
        setConversations(prev => {
          const existingConv = prev.find(c => c.username === username);
          if (existingConv) {
            return prev.map(c =>
              c.username === username
                ? { ...c, messages: [...c.messages, saved], lastMessage: text, lastMessageTime: saved.timestamp }
                : c
            );
          }
          return [...prev, { userId: resolvedReceiverId, username, messages: [saved], lastMessage: text, lastMessageTime: saved.timestamp }];
        });
        return backend.loadPrivateMessagesRemote().then(setConversations);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : '';
        setChatError(`Message could not send. ${message || 'Check your connection and try again.'}`);
      });
  };

  const handleSendPublicMessage = (text: string) => {
    if (!text.trim()) return;
    setChatError('');
    backend.track('message_sent', { type: 'public' });
    void backend.sendPublicMessage(text.trim())
      .then((saved) => {
        if (!saved) {
          setChatError('Message could not send. Check your connection and try again.');
          return;
        }
        setPublicMessages(prev => [...prev, saved]);
        return backend.loadPublicMessagesRemote().then(setPublicMessages);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : '';
        setChatError(`Message could not send. ${message || 'Check your connection and try again.'}`);
      });
  };

  const handleUpgradeWithEmail = (email: string) => {
    const updatedUser = backend.addEmailToCurrentUser(email);
    if (updatedUser) setUser(updatedUser);
    setUpgradePrompt(null);
    if (selectedChatUser) setCurrentScreen('chat');
    else setCurrentScreen('profile');
  };

  const requestUpgrade = (title?: string, message?: string) => {
    setUpgradePrompt({ title, message });
  };

  const isPublicRoom = (name: string) => name === PUBLIC_ROOM_NAME;

  const showBottomNav = hasCompletedOnboarding &&
    ['album', 'matches', 'chats', 'profile'].includes(currentScreen);
  const isFixedScreen = ['welcome', 'sign-in', 'sign-up'].includes(currentScreen);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return (
          <WelcomeScreen
            onNavigate={handleNavigate}
          />
        );

      case 'sign-in':
        return <SignInScreen onNavigate={handleNavigate} onEmailSignIn={handleEmailSignIn} />;

      case 'sign-up':
        return (
          <SignUpScreen
            onNavigate={handleNavigate}
            onCreateAccount={handleCreateAccount}
            onEmailExists={backend.accountExists}
          />
        );

      case 'add-email':
        return (
          <AddEmailScreen
            onBack={handleBack}
            onSubmit={handleUpgradeWithEmail}
          />
        );

      case 'reset-password':
        return (
          <ResetPasswordScreen
            onNavigate={handleNavigate}
            onLookupRecoveryQuestion={backend.getRecoveryQuestion}
            onVerifyRecoveryAnswer={backend.verifyRecoveryAnswer}
            onResetPassword={handlePasswordReset}
          />
        );

      case 'album-selection':
        return (
          <AlbumSelectionScreen
            onContinue={enterKansasCityMarket}
          />
        );

      case 'location-permission':
        return (
          <LocationPermissionScreen
            city={MVP_CITY}
            onBack={() => setCurrentScreen('sign-up')}
            onAllow={() => requestLocation()}
            onSkip={() => {
              backend.track('location_skipped', { city: MVP_CITY });
              enterKansasCityMarket();
            }}
          />
        );

      case 'album':
        return (
          <MyAlbumScreen
            onTeamClick={(code) => {
              setSelectedTeam(code);
              setCurrentScreen('team-detail');
            }}
            onAddSticker={() => setShowAddSticker(true)}
            stickers={stickers}
            onUpdateSticker={(code, updates) => {
              setStickers(prev => prev.map(sticker =>
                sticker.code === code ? { ...sticker, ...updates } : sticker
              ));
            }}
            onBulkUpdate={(codes, status) => {
              setStickers(prev => {
                const codeSet = new Set(codes);
                const nextStickers = prev.map(sticker =>
                  codeSet.has(sticker.code) ? setStickerStatus(sticker, status) : sticker
                );

                backend.track('collection_progress', {
                  action: 'bulk_update',
                  status,
                  count: codes.length,
                  collected: nextStickers.filter(s => s.owned || s.duplicateCount > 0).length,
                  duplicates: nextStickers.reduce((sum, s) => sum + s.duplicateCount, 0),
                });
                return nextStickers;
              });
            }}
          />
        );

      case 'team-detail':
        return (
          <TeamDetailScreen
            teamCode={selectedTeam}
            onBack={() => setCurrentScreen('album')}
            onStickerClick={() => {}}
            stickers={stickers}
            onUpdateSticker={(code, updates) => {
              setStickers(prev => {
                const existingIndex = prev.findIndex(s => s.code === code);
                if (existingIndex !== -1) {
                  return prev.map((s, i) => i === existingIndex ? { ...s, ...updates } : s);
                } else {
                  return [...prev, { code, owned: false, missing: true, duplicateCount: 0, ...updates }];
                }
              });
            }}
            onDeleteSticker={(code) => {
              setStickers(prev => prev.map(s => s.code === code ? setStickerStatus(s, 'missing') : s));
            }}
          />
        );

      case 'matches':
        return (
          <MatchesScreen
            onCollectorClick={(collectorId) => {
              setSelectedCollector(collectorId);
              setCurrentScreen('match-detail');
            }}
            city={MVP_CITY}
            stickers={stickers as StickerState[]}
          />
        );

      case 'match-detail': {
        const selectedComparison = backend
          .getCollectorComparisons(stickers as StickerState[])
          .find(collector => collector.id === selectedCollector);
        const selectedChatTarget = selectedComparison?.username || selectedCollector;

        return (
          <MatchDetailScreen
            comparison={selectedComparison}
            onBack={() => setCurrentScreen('matches')}
            onStartChat={() => {
              backend.track('chat_attempted', { target: selectedChatTarget, blocked: !user?.email });
              if (!user?.email) {
                setSelectedChatUser(selectedChatTarget);
                setSelectedChatUserId(selectedComparison?.id || '');
                requestUpgrade(
                  'Add your email to chat and trade with others',
                  'Private chat uses magic-link accounts so collectors can recover conversations and keep trades safer.'
                );
                return;
              }
              setSelectedChatUser(selectedChatTarget);
              setSelectedChatUserId(selectedComparison?.id || '');
              setChatError('');
              setCurrentScreen('chat');
            }}
          />
        );
      }

      case 'chats':
        return (
          <ChatsScreen
            conversations={conversations}
            publicMessages={publicMessages}
            publicRoomName={PUBLIC_ROOM_NAME}
            publicUnreadCount={publicUnreadCount}
            privateUnreadByUser={privateUnreadByUser}
            city={MVP_CITY}
            canUsePrivateChat={Boolean(user?.email)}
            onPublicVisible={markPublicChatRead}
            onUpgradeRequest={() => requestUpgrade('Add your email to chat and trade with others')}
            onChatClick={(username, userId) => {
              const publicRoom = isPublicRoom(username);
              backend.track('chat_attempted', { target: username, blocked: !user?.email && !publicRoom });
              if (!user?.email && !publicRoom) {
                setSelectedChatUser(username);
                setSelectedChatUserId(userId || '');
                requestUpgrade('Add your email to chat and trade with others');
                return;
              }
              setSelectedChatUser(username);
              setSelectedChatUserId(publicRoom ? '' : userId || '');
              if (publicRoom) markPublicChatRead();
              else markPrivateChatRead(username, userId);
              setChatError('');
              setCurrentScreen('chat');
            }}
          />
        );

      case 'chat':
        const isViewingPublicChat = isPublicRoom(selectedChatUser);
        const publicChatBlocked = isViewingPublicChat && isOutsideKansasCityMarket;
        const privateChatBlocked = !isViewingPublicChat && !user?.email;
        return (
          <ChatScreen
            username={selectedChatUser}
            messages={isViewingPublicChat ? publicMessages : conversations.find(c => c.username === selectedChatUser)?.messages || []}
            isPublic={isViewingPublicChat}
            canSend={isViewingPublicChat ? !publicChatBlocked : Boolean(user?.email)}
            errorMessage={chatError}
            blockedMessage={publicChatBlocked
              ? 'StickerSwap public chat is currently limited to Kansas City metro collectors while we test this MVP.'
              : privateChatBlocked
                ? 'Add your email to send private messages.'
                : ''}
            blockedActionLabel={privateChatBlocked ? 'Add email to chat and trade with others' : ''}
            onBack={() => setCurrentScreen('chats')}
            onUpgradeRequest={() => requestUpgrade('Add your email to chat and trade with others')}
            onSendMessage={(text) => {
              if (isViewingPublicChat) handleSendPublicMessage(text);
              else handleSendMessage(selectedChatUser, text, selectedChatUserId);
            }}
          />
        );

      case 'profile':
        return <ProfileScreen onNavigate={handleNavigate} onLogout={handleLogout} stickers={stickers} user={user} />;

      case 'edit-profile':
        return <EditProfileScreen onBack={handleBack} user={user} onSave={handleProfileUpdate} />;

      case 'location-settings':
        return (
          <LocationSettingsScreen
            onBack={handleBack}
            city={MVP_CITY}
            user={user}
            onEnableLocation={() => requestLocation(() => setCurrentScreen('location-settings'))}
            onDisableLocation={disableLocation}
          />
        );

      case 'notifications':
        return <NotificationsScreen onBack={handleBack} />;

      case 'privacy-security':
        return <PrivacySecurityScreen onBack={handleBack} onDeleteAccount={handleDeleteCurrentAccount} />;

      case 'admin-login':
        return (
          <AdminLoginScreen
            onSuccess={() => setCurrentScreen('admin')}
            onBack={() => setCurrentScreen('sign-in')}
          />
        );

      case 'admin':
        return <AdminScreen onLogout={() => setCurrentScreen('welcome')} />;

      default:
        return null;
    }
  };

  return (
    <div className={`w-full bg-background overscroll-none dark ${isFixedScreen ? 'h-[var(--stickerswap-app-height,100svh)] overflow-hidden' : 'h-dvh overflow-auto'}`}>
      <div className={`max-w-md mx-auto relative bg-background ${isFixedScreen ? 'h-full overflow-hidden' : 'min-h-screen'}`}>
        {renderScreen()}

        {showBottomNav && (
          <BottomNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
            chatUnreadCount={totalUnreadChats}
          />
        )}

        {showAddSticker && (
          <AddStickerSheet
            onClose={() => setShowAddSticker(false)}
            existingStickers={stickers}
            onAdd={(code, status, duplicateCount) => {
              const existingIndex = stickers.findIndex(s => s.code === code);
              const safeStatus = status as StickerStatus;
              const applyStickerUpdate = (list: Sticker[]) => {
                if (existingIndex !== -1) {
                  return list.map((s, i) => {
                    if (i !== existingIndex) return s;
                    return applyStickerStatus(s, safeStatus, duplicateCount || 1);
                  });
                }

                return [...list, applyStickerStatus({
                  code,
                  owned: false,
                  missing: true,
                  duplicateCount: 0,
                }, safeStatus, duplicateCount || 1)];
              };

              const nextStickers = applyStickerUpdate(stickers);
              setStickers(() => nextStickers);

              backend.track(status === 'duplicate' ? 'duplicate_added' : 'sticker_added', { code, status, quantity: duplicateCount || 1 });
              backend.track('collection_progress', {
                collected: nextStickers.filter(s => s.owned || s.duplicateCount > 0).length,
                duplicates: nextStickers.reduce((sum, s) => sum + s.duplicateCount, 0),
              });
              if (!user?.email && shouldPromptForUpgrade(nextStickers as StickerState[])) {
                requestUpgrade('Save your collection so you don’t lose it');
              }

              setShowAddSticker(false);
            }}
          />
        )}
        {upgradePrompt && (
          <UpgradePrompt
            title={upgradePrompt.title}
            message={upgradePrompt.message}
            onDismiss={() => setUpgradePrompt(null)}
            onAddEmail={() => {
              setPreviousScreen(currentScreen);
              setUpgradePrompt(null);
              setCurrentScreen('add-email');
            }}
          />
        )}
      </div>
    </div>
  );
}
