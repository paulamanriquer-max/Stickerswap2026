import { useEffect, useState } from 'react';
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
import { applyStickerStatus, createDefaultStickerStates, normalizeStickerStates, setStickerStatus, StickerStatus } from './lib/stickerState';

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

const MVP_CITY = 'Kansas City';
const PUBLIC_ROOM_NAME = `${MVP_CITY} Community`;

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

  useEffect(() => {
    backend.track('app_open', { user_id: user?.id, anonymous: user?.isAnonymous ?? true });
  }, []);

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
    const interval = window.setInterval(refreshMessages, 5000);
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
    if (previousScreen) {
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
            city={MVP_CITY}
            canUsePrivateChat={Boolean(user?.email)}
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
              setChatError('');
              setCurrentScreen('chat');
            }}
          />
        );

      case 'chat':
        return (
          <ChatScreen
            username={selectedChatUser}
            messages={isPublicRoom(selectedChatUser) ? publicMessages : conversations.find(c => c.username === selectedChatUser)?.messages || []}
            isPublic={isPublicRoom(selectedChatUser)}
            canSend={isPublicRoom(selectedChatUser) || Boolean(user?.email)}
            errorMessage={chatError}
            onBack={() => setCurrentScreen('chats')}
            onUpgradeRequest={() => requestUpgrade('Add your email to chat and trade with others')}
            onSendMessage={(text) => {
              if (isPublicRoom(selectedChatUser)) handleSendPublicMessage(text);
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
    <div className="size-full bg-background overflow-auto dark">
      <div className="max-w-md mx-auto min-h-screen relative bg-background">
        {renderScreen()}

        {showBottomNav && (
          <BottomNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
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
