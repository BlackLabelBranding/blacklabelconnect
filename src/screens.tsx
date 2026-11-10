import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bell, BriefcaseBusiness, Clock3, MapPin, ShieldCheck } from 'lucide-react-native';

import { CalendarExperience } from './CalendarExperience';
import { InboxExperience } from './InboxExperience';
import { ListRow, SectionHeader } from './components';
import type { MobileBootstrap } from './contracts/bootstrap';
import { TalentWorkScreen } from './TalentWorkScreen';
import { colors, spacing } from './theme';

const Screen = ({ children }: { children: React.ReactNode }) => (
  <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
    {children}
  </ScrollView>
);

export function HomeScreen({ bootstrap }: { bootstrap: MobileBootstrap }) {
  const firstName = bootstrap.user.displayName.split(/\s+/)[0] || 'there';
  const today = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', weekday: 'long', month: 'long', day: 'numeric',
  }).format(new Date());
  return (
    <Screen>
      <View style={styles.greeting}>
        <Text style={styles.kicker}>{today.toUpperCase()} · CENTRAL TIME</Text>
        <Text style={styles.title}>Welcome, {firstName}.</Text>
        <Text style={styles.subtitle}>Your Black Label workspace is ready.</Text>
      </View>
      <SectionHeader title="Your workspace" />
      <Text style={styles.pageSubtitle}>Open Calendar to see your scheduled events, Work for assignments, or Inbox for messages and invitations. Only information available to your account will appear.</Text>
    </Screen>
  );
}

export function InboxScreen() {
  return <InboxExperience />;
}

export function CalendarScreen() {
  return <CalendarExperience />;
}

export function WorkScreen({ bootstrap }: { bootstrap: MobileBootstrap }) {
  return <TalentWorkScreen bootstrap={bootstrap} />;
}

export function MoreScreen({
  bootstrap,
  onSignOut,
}: {
  bootstrap: MobileBootstrap;
  onSignOut: () => void;
}) {
  return (
    <Screen>
      <View style={styles.profile}>
        <View style={styles.profileAvatar}><Text style={styles.profileInitials}>{bootstrap.user.initials}</Text></View>
        <View style={styles.profileCopy}>
          <Text style={styles.profileName}>{bootstrap.user.displayName}</Text>
          <Text style={styles.profileRole}>{bootstrap.activePersona} · {bootstrap.activeAccount.name}</Text>
        </View>
      </View>
      <SectionHeader title="Tools" />
      <ListRow title="Time clock" detail="Clock in, clock out, and review your time" onPress={() => undefined} />
      <ListRow title="Files" detail="Authorized documents and uploads" onPress={() => undefined} />
      <ListRow title="Notification settings" detail="Categories, quiet hours, and devices" onPress={() => undefined} />
      <SectionHeader title="Access" />
      <View style={styles.accessLine}><ShieldCheck color={colors.green} size={20} /><Text style={styles.accessText}>Permissions issued by Black Label Hub</Text></View>
      <View style={styles.accessLine}><Bell color={colors.amber} size={20} /><Text style={styles.accessText}>Device registration pending</Text></View>
      <View style={styles.accessLine}><BriefcaseBusiness color={colors.muted} size={20} /><Text style={styles.accessText}>1 active workspace</Text></View>
      <View style={styles.accessLine}><Clock3 color={colors.muted} size={20} /><Text style={styles.accessText}>Bootstrap contract version 1</Text></View>
      <View style={styles.accessLine}><MapPin color={colors.muted} size={20} /><Text style={styles.accessText}>Central time</Text></View>
      <SectionHeader title="Session" />
      <ListRow title="Sign out" detail={bootstrap.user.displayName} onPress={onSignOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 42, paddingHorizontal: spacing.lg },
  greeting: { paddingBottom: spacing.lg, paddingTop: spacing.xl },
  kicker: { color: colors.amber, fontSize: 11, fontWeight: '800', marginBottom: 10 },
  title: { color: colors.text, fontSize: 28, fontWeight: '700', letterSpacing: 0 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 7 },
  statusStrip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  statusLabel: { color: colors.muted, fontSize: 9, fontWeight: '700', marginBottom: 6 },
  statusValue: { color: colors.text, fontSize: 13, fontWeight: '600' },
  statusRule: { backgroundColor: colors.line, height: 32, width: StyleSheet.hairlineWidth },
  pageTitle: { color: colors.text, fontSize: 28, fontWeight: '700', marginTop: spacing.xl },
  pageSubtitle: { color: colors.muted, fontSize: 14, marginTop: 6 },
  dateRail: { flexDirection: 'row', gap: 7, marginTop: spacing.lg },
  date: { alignItems: 'center', borderColor: colors.line, borderRadius: 7, borderWidth: 1, flex: 1, paddingVertical: 13 },
  dateActive: { backgroundColor: colors.text, borderColor: colors.text },
  dateText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  dateTextActive: { color: colors.canvas },
  profile: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.xl },
  profileAvatar: { alignItems: 'center', backgroundColor: colors.text, borderRadius: 28, height: 56, justifyContent: 'center', width: 56 },
  profileInitials: { color: colors.canvas, fontSize: 17, fontWeight: '800' },
  profileCopy: { marginLeft: 14 },
  profileName: { color: colors.text, fontSize: 21, fontWeight: '700' },
  profileRole: { color: colors.muted, fontSize: 13, marginTop: 4, textTransform: 'capitalize' },
  accessLine: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, minHeight: 52 },
  accessText: { color: colors.text, flex: 1, fontSize: 13 },
});
