import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './lib/supabase';
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
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase!.from('team_members').select('avatar_url').eq('user_id', bootstrap.user.id).maybeSingle();
      if (active) setPhoto(data?.avatar_url ?? null);
    })();
    return () => { active = false; };
  }, [bootstrap.user.id]);
  async function changePhoto() {
    if (!supabase || photoBusy) return;
    setPhotoError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setPhotoError('Photo library permission is required to change your photo.'); return; }
    const selected = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.75, base64: true });
    if (selected.canceled || !selected.assets[0]) return;
    const asset = selected.assets[0];
    if (!asset.base64) { setPhotoError('Unable to read the selected image.'); return; }
    setPhotoBusy(true);
    try {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      const cleaned = asset.base64.replace(/[^A-Za-z0-9+/]/g, '');
      const bytes = new Uint8Array(Math.floor(cleaned.length * 3 / 4));
      let count = 0, buffer = 0, bits = 0;
      for (const char of cleaned) { const digit = alphabet.indexOf(char); if (digit < 0) continue; buffer = (buffer << 6) | digit; bits += 6; if (bits >= 8) { bits -= 8; bytes[count++] = (buffer >> bits) & 255; } }
      const path = `${bootstrap.user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('team-members').upload(path, bytes.slice(0, count), { contentType: 'image/jpeg', upsert: false });
      if (uploadError) throw uploadError;
      const url = supabase.storage.from('team-members').getPublicUrl(path).data.publicUrl;
      const { error: saveError } = await supabase.rpc('mobile_update_own_employee_photo', { p_photo_url: url });
      if (saveError) throw saveError;
      setPhoto(url);
    } catch (err) { setPhotoError(err instanceof Error ? err.message : 'Photo could not be saved.'); }
    finally { setPhotoBusy(false); }
  }
  return (
    <Screen>
      <View style={styles.profile}>
        <Pressable onPress={() => void changePhoto()} accessibilityRole="button" accessibilityLabel="Change employee profile photo" style={styles.profileAvatar}>
          {photo ? <Image source={{ uri: photo }} style={{ width: 56, height: 56, borderRadius: 28 }} /> : <Text style={styles.profileInitials}>{bootstrap.user.initials}</Text>}
          {photoBusy ? <ActivityIndicator color={colors.amber} style={{ position: 'absolute' }} /> : null}
        </Pressable>
        <View style={styles.profileCopy}>
          <Text style={styles.profileName}>{bootstrap.user.displayName}</Text>
          <Text style={styles.profileRole}>{bootstrap.activePersona} · {bootstrap.activeAccount.name}</Text>
        </View>
      </View>
      <Text style={styles.pageSubtitle}>Tap your photo to change it. Your employee photo is shared with Black Label Hub.</Text>
      {photoError ? <Text style={{ color: colors.amber, marginTop: 10 }}>{photoError}</Text> : null}
      <SectionHeader title="Tools" />
      <Text style={styles.pageSubtitle}>Time clock, files and notification preferences are not connected yet. They will appear here once the employee services are ready.</Text>
      <SectionHeader title="Access" />
      <View style={styles.accessLine}><ShieldCheck color={colors.green} size={20} /><Text style={styles.accessText}>Permissions issued by Black Label Hub</Text></View>
      <View style={styles.accessLine}><Bell color={colors.amber} size={20} /><Text style={styles.accessText}>{bootstrap.notifications.deviceRegistered ? "Device registered" : "Push notification registration not confirmed"}</Text></View>
      <View style={styles.accessLine}><BriefcaseBusiness color={colors.muted} size={20} /><Text style={styles.accessText}>{bootstrap.memberships.length} workspace memberships</Text></View>

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
