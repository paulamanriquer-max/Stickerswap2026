import { useState } from 'react';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { AlbumSelectionScreen } from './screens/AlbumSelectionScreen';
import { LocationPermissionScreen } from './screens/LocationPermissionScreen';
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
import { LocationSettingsScreen } from './screens/LocationSettingsScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { PrivacySecurityScreen } from './screens/PrivacySecurityScreen';
import { ChatsScreen } from './screens/ChatsScreen';
import { ChatScreen } from './screens/ChatScreen';
import { AdminLoginScreen } from './screens/AdminLoginScreen';
import { AdminScreen } from './screens/AdminScreen';
import { CitySelectionScreen } from './screens/CitySelectionScreen';

type Screen =
  | 'welcome'
  | 'sign-in'
  | 'sign-up'
  | 'reset-password'
  | 'album-selection'
  | 'location-permission'
  | 'city-selection'
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
  | 'admin-login'
  | 'admin';

type Tab = 'album' | 'matches' | 'chats' | 'profile';

interface Sticker {
  code: string;
  owned: boolean;
  missing: boolean;
  duplicateCount: number;
}

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isOwn: boolean;
}

interface Conversation {
  username: string;
  messages: Message[];
  lastMessage?: string;
  lastMessageTime?: Date;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [activeTab, setActiveTab] = useState<Tab>('matches');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedCollector, setSelectedCollector] = useState<string>('');
  const [selectedChatUser, setSelectedChatUser] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('Kansas City');
  const [locationEnabled, setLocationEnabled] = useState<boolean>(false);
  const [showAddSticker, setShowAddSticker] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [previousScreen, setPreviousScreen] = useState<Screen | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'album') setCurrentScreen('album');
    else if (tab === 'matches') setCurrentScreen('matches');
    else if (tab === 'chats') setCurrentScreen('chats');
    else if (tab === 'profile') setCurrentScreen('profile');
  };

  const handleOnboardingComplete = (hasLocation: boolean) => {
    setLocationEnabled(hasLocation);
    setCurrentScreen('city-selection');
  };

  const handleCitySelected = (city: string) => {
    setSelectedCity(city);
    setHasCompletedOnboarding(true);
    setCurrentScreen('matches');
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

  const handleSendMessage = (username: string, text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'You',
      timestamp: new Date(),
      isOwn: true,
    };

    setConversations(prev => {
      const existingConv = prev.find(c => c.username === username);
      if (existingConv) {
        return prev.map(c =>
          c.username === username
            ? { ...c, messages: [...c.messages, newMessage], lastMessage: text, lastMessageTime: new Date() }
            : c
        );
      } else {
        return [...prev, { username, messages: [newMessage], lastMessage: text, lastMessageTime: new Date() }];
      }
    });
  };

  const showBottomNav = hasCompletedOnboarding &&
    ['album', 'matches', 'chats', 'profile'].includes(currentScreen);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return (
          <WelcomeScreen
            onCreateAccount={() => setCurrentScreen('sign-up')}
            onLogIn={() => setCurrentScreen('sign-in')}
          />
        );

      case 'sign-in':
        return <SignInScreen onNavigate={handleNavigate} />;

      case 'sign-up':
        return <SignUpScreen onNavigate={handleNavigate} />;

      case 'reset-password':
        return <ResetPasswordScreen onNavigate={handleNavigate} />;

      case 'album-selection':
        return (
          <AlbumSelectionScreen
            onContinue={() => setCurrentScreen('location-permission')}
          />
        );

      case 'location-permission':
        return (
          <LocationPermissionScreen
            onAllow={() => handleOnboardingComplete(true)}
            onSkip={() => handleOnboardingComplete(false)}
          />
        );

      case 'city-selection':
        return <CitySelectionScreen onContinue={handleCitySelected} />;

      case 'album':
        return (
          <MyAlbumScreen
            onTeamClick={(code) => {
              setSelectedTeam(code);
              setCurrentScreen('team-detail');
            }}
            onAddSticker={() => setShowAddSticker(true)}
            stickers={stickers}
          />
        );

      case 'team-detail':
        return (
          <TeamDetailScreen
            teamCode={selectedTeam}
            onBack={() => setCurrentScreen('album')}
            onStickerClick={(code) => {
              console.log('Sticker clicked:', code);
            }}
            stickers={stickers}
            onUpdateSticker={(code, updates) => {
              setStickers(prev => {
                const existingIndex = prev.findIndex(s => s.code === code);
                if (existingIndex !== -1) {
                  return prev.map((s, i) => i === existingIndex ? { ...s, ...updates } : s);
                } else {
                  return [...prev, { code, owned: false, missing: false, duplicateCount: 0, ...updates }];
                }
              });
            }}
            onDeleteSticker={(code) => {
              setStickers(prev => prev.filter(s => s.code !== code));
            }}
          />
        );

      case 'matches':
        return (
          <MatchesScreen
            onCollectorClick={(username) => {
              setSelectedCollector(username);
              setCurrentScreen('match-detail');
            }}
            locationEnabled={locationEnabled}
            city={selectedCity}
          />
        );

      case 'match-detail':
        return (
          <MatchDetailScreen
            username={selectedCollector}
            onBack={() => setCurrentScreen('matches')}
            onStartChat={() => {
              setSelectedChatUser(selectedCollector);
              setCurrentScreen('chat');
            }}
          />
        );

      case 'chats':
        return (
          <ChatsScreen
            conversations={conversations}
            city={selectedCity}
            onChatClick={(username) => {
              setSelectedChatUser(username);
              setCurrentScreen('chat');
            }}
          />
        );

      case 'chat':
        return (
          <ChatScreen
            username={selectedChatUser}
            messages={conversations.find(c => c.username === selectedChatUser)?.messages || []}
            onBack={() => setCurrentScreen('chats')}
            onSendMessage={(text) => handleSendMessage(selectedChatUser, text)}
          />
        );

      case 'profile':
        return <ProfileScreen onNavigate={handleNavigate} stickers={stickers} />;

      case 'edit-profile':
        return <EditProfileScreen onBack={handleBack} />;

      case 'location-settings':
        return (
          <LocationSettingsScreen
            onBack={handleBack}
            locationEnabled={locationEnabled}
            onLocationChange={setLocationEnabled}
          />
        );

      case 'notifications':
        return <NotificationsScreen onBack={handleBack} />;

      case 'privacy-security':
        return <PrivacySecurityScreen onBack={handleBack} />;

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

              if (existingIndex !== -1) {
                setStickers(prev => prev.map((s, i) => {
                  if (i !== existingIndex) return s;
                  if (status === 'owned') return { ...s, owned: true, missing: false };
                  if (status === 'duplicate') return { ...s, duplicateCount: s.duplicateCount + (duplicateCount || 1), missing: false };
                  if (status === 'missing') return { ...s, missing: true, owned: false, duplicateCount: 0 };
                  return s;
                }));
              } else {
                setStickers(prev => [...prev, {
                  code,
                  owned: status === 'owned',
                  missing: status === 'missing',
                  duplicateCount: status === 'duplicate' ? (duplicateCount || 1) : 0,
                }]);
              }

              setShowAddSticker(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
