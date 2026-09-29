import { useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppHeader, TabBar } from './components';
import type { Persona, TabKey } from './contracts/bootstrap';
import { bootstrapFixtures } from './fixtures/bootstrap';
import { getEnabledTabs } from './navigation';
import { CalendarScreen, HomeScreen, InboxScreen, MoreScreen, WorkScreen } from './screens';
import { colors } from './theme';

export function AppShell() {
  const [persona, setPersona] = useState<Persona>('employee');
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const { width } = useWindowDimensions();
  const bootstrap = bootstrapFixtures[persona];
  const tabs = useMemo(() => getEnabledTabs(bootstrap), [bootstrap]);
  const constrained = width > 720;

  const switchPersona = () => {
    setPersona((current) => (current === 'employee' ? 'contractor' : 'employee'));
    setActiveTab('home');
  };

  if (tabs.length === 0) {
    return (
      <SafeAreaView style={styles.denied}>
        <Text style={styles.deniedTitle}>Mobile access unavailable</Text>
        <Text style={styles.deniedCopy}>Ask a Black Label Hub administrator to review your access.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.canvas}>
      <View style={[styles.app, constrained && styles.appConstrained]}>
        <AppHeader bootstrap={bootstrap} onSwitchPersona={switchPersona} />
        <View style={styles.content}>
          {activeTab === 'home' ? <HomeScreen bootstrap={bootstrap} /> : null}
          {activeTab === 'inbox' ? <InboxScreen /> : null}
          {activeTab === 'calendar' ? <CalendarScreen /> : null}
          {activeTab === 'work' ? <WorkScreen bootstrap={bootstrap} /> : null}
          {activeTab === 'more' ? <MoreScreen bootstrap={bootstrap} /> : null}
        </View>
        <TabBar
          activeTab={activeTab}
          tabs={tabs}
          unreadCount={bootstrap.notifications.unreadCount}
          onChange={setActiveTab}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  canvas: { backgroundColor: '#050608', flex: 1 },
  app: { alignSelf: 'center', backgroundColor: colors.canvas, flex: 1, width: '100%' },
  appConstrained: { borderColor: colors.line, borderLeftWidth: 1, borderRightWidth: 1, maxWidth: 440 },
  content: { flex: 1 },
  denied: { alignItems: 'center', backgroundColor: colors.canvas, flex: 1, justifyContent: 'center', padding: 32 },
  deniedTitle: { color: colors.text, fontSize: 22, fontWeight: '700' },
  deniedCopy: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: 'center' },
});
