import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppHeader, TabBar } from './components';
import type { MobileBootstrap, TabKey } from './contracts/bootstrap';
import { getEnabledTabs } from './navigation';
import { CalendarScreen, HomeScreen, InboxScreen, MoreScreen, WorkScreen } from './screens';
import { colors } from './theme';

export function AppShell({
  bootstrap,
  onSignOut,
}: {
  bootstrap: MobileBootstrap;
  onSignOut: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const { width } = useWindowDimensions();
  const tabs = useMemo(() => getEnabledTabs(bootstrap), [bootstrap]);
  const constrained = width > 720;

  useEffect(() => {
    if (!tabs.includes(activeTab)) setActiveTab(tabs[0] ?? 'home');
  }, [activeTab, tabs]);

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
        <AppHeader bootstrap={bootstrap} onOpenAccount={() => setActiveTab('more')} />
        <View style={styles.content}>
          {activeTab === 'home' ? <HomeScreen bootstrap={bootstrap} /> : null}
          {activeTab === 'inbox' ? <InboxScreen /> : null}
          {activeTab === 'calendar' ? <CalendarScreen /> : null}
          {activeTab === 'work' ? <WorkScreen bootstrap={bootstrap} /> : null}
          {activeTab === 'more' ? <MoreScreen bootstrap={bootstrap} onSignOut={onSignOut} /> : null}
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
