import type { ComponentType } from 'react';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  House,
  Inbox,
  Menu,
  type LucideProps,
  Search,
  Wrench,
} from 'lucide-react-native';

import type { MobileBootstrap, TabKey } from './contracts/bootstrap';
import { colors, spacing } from './theme';

const BLACK_LABEL_LOGO_URL =
  'https://xopcttkrmjvwdddawdaa.supabase.co/storage/v1/object/public/Logos/blacklabellogoog.png';

const tabIcons: Record<TabKey, ComponentType<LucideProps>> = {
  home: House,
  inbox: Inbox,
  calendar: CalendarDays,
  work: Wrench,
  more: Menu,
};

export function AppHeader({
  bootstrap,
  onSwitchPersona,
}: {
  bootstrap: MobileBootstrap;
  onSwitchPersona: () => void;
}) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <View style={styles.header}>
      <View style={styles.brandBlock}>
        {logoFailed ? (
          <Text style={styles.brandFallback}>BLACK LABEL</Text>
        ) : (
          <Image
            accessibilityLabel="Black Label Branding"
            onError={() => setLogoFailed(true)}
            resizeMode="contain"
            source={{ uri: BLACK_LABEL_LOGO_URL }}
            style={styles.brandLogo}
          />
        )}
      </View>
      <View style={styles.headerActions}>
        <Pressable accessibilityLabel="Search" style={styles.iconButton}>
          <Search color={colors.text} size={19} strokeWidth={1.8} />
        </Pressable>
        <Pressable
          accessibilityLabel="Switch preview persona"
          onPress={onSwitchPersona}
          style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
        >
          <Text style={styles.avatarText}>{bootstrap.user.initials}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

export function TabBar({
  activeTab,
  tabs,
  unreadCount,
  onChange,
}: {
  activeTab: TabKey;
  tabs: TabKey[];
  unreadCount: number;
  onChange: (tab: TabKey) => void;
}) {
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const Icon = tabIcons[tab];
        const active = tab === activeTab;
        return (
          <Pressable
            accessibilityLabel={`Open ${tab}`}
            key={tab}
            onPress={() => onChange(tab)}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <View>
              <Icon color={active ? colors.white : colors.muted} size={21} strokeWidth={active ? 2.2 : 1.8} />
              {tab === 'inbox' && unreadCount > 0 ? <View style={styles.unreadDot} /> : null}
            </View>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ListRow({
  eyebrow,
  title,
  detail,
  meta,
  tone = 'default',
  onPress,
}: {
  eyebrow?: string;
  title: string;
  detail?: string;
  meta?: string;
  tone?: 'default' | 'amber' | 'green';
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && onPress ? styles.rowPressed : undefined]}
    >
      <View style={[styles.rowMarker, tone === 'amber' && styles.amberMarker, tone === 'green' && styles.greenMarker]} />
      <View style={styles.rowBody}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
        {detail ? <Text style={styles.rowDetail} numberOfLines={2}>{detail}</Text> : null}
      </View>
      <View style={styles.rowEnd}>
        {meta ? <Text style={styles.rowMeta}>{meta}</Text> : null}
        {onPress ? <ChevronRight color={colors.muted} size={17} /> : null}
      </View>
    </Pressable>
  );
}

export function EmptyIcon() {
  return <CircleUserRound color={colors.muted} size={24} strokeWidth={1.5} />;
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 68,
    paddingBottom: 12,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
  },
  brandBlock: { alignItems: 'flex-start', flex: 1, justifyContent: 'center', minWidth: 0 },
  brandLogo: { height: 42, width: 96 },
  brandFallback: { color: colors.text, fontSize: 17, fontWeight: '800', letterSpacing: 0 },
  headerActions: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  iconButton: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: 19,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  avatarText: { color: colors.canvas, fontSize: 12, fontWeight: '800' },
  sectionHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  sectionAction: { color: colors.amber, fontSize: 13, fontWeight: '600' },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 72,
    paddingBottom: 8,
    paddingTop: 9,
  },
  tab: { alignItems: 'center', flex: 1, gap: 4, justifyContent: 'center' },
  tabLabel: { color: colors.muted, fontSize: 10, textTransform: 'capitalize' },
  tabLabelActive: { color: colors.white, fontWeight: '700' },
  unreadDot: {
    backgroundColor: colors.amber,
    borderColor: colors.surface,
    borderRadius: 5,
    borderWidth: 2,
    height: 9,
    position: 'absolute',
    right: -3,
    top: -2,
    width: 9,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 78,
    paddingVertical: 12,
  },
  rowPressed: { backgroundColor: colors.surfaceRaised },
  rowMarker: { backgroundColor: colors.line, borderRadius: 2, height: 38, marginRight: 14, width: 3 },
  amberMarker: { backgroundColor: colors.amber },
  greenMarker: { backgroundColor: colors.green },
  rowBody: { flex: 1, minWidth: 0 },
  eyebrow: { color: colors.amber, fontSize: 10, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  rowDetail: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 4 },
  rowEnd: { alignItems: 'flex-end', flexDirection: 'row', gap: spacing.xs, marginLeft: spacing.sm },
  rowMeta: { color: colors.muted, fontSize: 11 },
  pressed: { opacity: 0.68 },
});
