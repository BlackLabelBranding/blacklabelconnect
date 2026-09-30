import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bell, BriefcaseBusiness, Clock3, MapPin, ShieldCheck } from 'lucide-react-native';

import { CalendarExperience } from './CalendarExperience';
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
  const contractor = bootstrap.activePersona === 'contractor';
  const firstName = bootstrap.user.displayName.split(/\s+/)[0] || 'there';
  return (
    <Screen>
      <View style={styles.greeting}>
        <Text style={styles.kicker}>{contractor ? 'CONTRACTOR VIEW' : 'MONDAY · SEPTEMBER 28'}</Text>
        <Text style={styles.title}>Good evening, {firstName}.</Text>
        <Text style={styles.subtitle}>{contractor ? 'One assignment needs your response.' : 'Here is what needs attention next.'}</Text>
      </View>

      <View style={styles.statusStrip}>
        <View>
          <Text style={styles.statusLabel}>CLOCK STATUS</Text>
          <Text style={styles.statusValue}>{contractor ? 'Not scheduled' : 'Clocked out'}</Text>
        </View>
        <View style={styles.statusRule} />
        <View>
          <Text style={styles.statusLabel}>NEXT</Text>
          <Text style={styles.statusValue}>{contractor ? 'Respond by 9 AM' : 'Team call · 9:30 AM'}</Text>
        </View>
      </View>

      <SectionHeader title="Priority" action="See all" />
      {contractor ? (
        <ListRow eyebrow="Response required" title="Brand ambassador shift" detail="Friday · 6:00 PM · Oak & Main" meta="$180" tone="amber" onPress={() => undefined} />
      ) : (
        <>
          <ListRow eyebrow="Due tonight" title="Approve launch photo set" detail="12 images are ready for review." meta="8:00 PM" tone="amber" onPress={() => undefined} />
          <ListRow title="Confirm Friday staffing" detail="Two open roles remain for Oak & Main." meta="2 open" onPress={() => undefined} />
        </>
      )}

      <SectionHeader title="Today" />
      <ListRow title="Team operations call" detail="Google Meet · Black Label Branding" meta="9:30 AM" tone="green" onPress={() => undefined} />
      <ListRow title="Venue walkthrough" detail="Oak & Main · 1420 Market Street" meta="2:00 PM" onPress={() => undefined} />
    </Screen>
  );
}

export function InboxScreen() {
  return (
    <Screen>
      <Text style={styles.pageTitle}>Inbox</Text>
      <Text style={styles.pageSubtitle}>Messages across your authorized workspaces.</Text>
      <SectionHeader title="Unread" action="Mark all read" />
      <ListRow eyebrow="Operations" title="Maya Rodriguez" detail="The Friday load-in moved to 3:30. Can you confirm?" meta="8m" tone="amber" onPress={() => undefined} />
      <ListRow eyebrow="Oak & Main" title="James Chen" detail="The updated floor plan is attached." meta="31m" tone="amber" onPress={() => undefined} />
      <ListRow title="Production team" detail="Lance: Final photo selections are ready." meta="1h" onPress={() => undefined} />
      <SectionHeader title="Earlier" />
      <ListRow title="Black Label Talent" detail="Availability request for October 3." meta="Fri" onPress={() => undefined} />
      <ListRow title="Promo Proof" detail="Campaign BL-284 was approved." meta="Thu" tone="green" onPress={() => undefined} />
    </Screen>
  );
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
