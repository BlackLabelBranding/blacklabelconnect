import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, CheckSquare2, Clock3, Inbox, RefreshCw, ContactRound, UserRound, ChevronRight } from 'lucide-react-native';
import type { MobileBootstrap, TabKey } from '../contracts/bootstrap';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';

type ClockStatus = 'loading' | 'in' | 'out' | 'unknown';
type WorkTask = { id: number; status: string | null; title: string; due_date: string | null };
type WorkResponse = { tasks?: WorkTask[] };
type AppCard = { key: string; title: string; caption: string; accent: string; tab: TabKey; icon: typeof Inbox; section?: 'clock' | 'directory' };
type CatalogApp = { app_key: string; title: string; description: string; accent: string; destination: string };

const OPEN = new Set(['complete', 'completed', 'done', 'cancelled', 'canceled']);
const firstName = (name: string) => name.split(/\s+/)[0] || 'there';

export function HomeLaunchpad({ bootstrap, onNavigate }: { bootstrap: MobileBootstrap; onNavigate: (tab: TabKey, section?: 'clock' | 'directory') => void }) {
  const [clock, setClock] = useState<ClockStatus>('loading');
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [workLoading, setWorkLoading] = useState(bootstrap.navigation.work);
  const [workError, setWorkError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [catalogApps, setCatalogApps] = useState<CatalogApp[] | null>(null);
  const [catalogError, setCatalogError] = useState(false);

  const refresh = useCallback(async () => {
    if (!supabase) { setClock('unknown'); setWorkError(true); setWorkLoading(false); return; }
    setRefreshing(true);
    const client = supabase;
    const clockRequest = client.from('time_punches')
      .select('clock_in,clock_out')
      .eq('user_id', bootstrap.user.id)
      .order('clock_in', { ascending: false }).limit(1).maybeSingle();
    const workRequest = bootstrap.navigation.work
      ? client.rpc('mobile_employee_work')
      : Promise.resolve({ data: null, error: null });
    const appsRequest = client.rpc('connect_my_apps');
    const [clockResult, workResult, appsResult] = await Promise.allSettled([clockRequest, workRequest, appsRequest]);
    if (appsResult.status === 'fulfilled' && !appsResult.value.error && Array.isArray(appsResult.value.data)) {
      setCatalogApps(appsResult.value.data as CatalogApp[]);
      setCatalogError(false);
    } else {
      setCatalogError(true);
    }
    if (clockResult.status !== 'fulfilled' || clockResult.value.error) {
      setClock('unknown');
    } else {
      const last = clockResult.value.data;
      setClock(last && last.clock_out == null ? 'in' : 'out');
    }
    if (bootstrap.navigation.work) {
      if (workResult.status !== 'fulfilled' || workResult.value.error) {
        setWorkError(true);
      } else {
        const result = workResult.value.data as WorkResponse | null;
        setTasks(Array.isArray(result?.tasks) ? result.tasks : []);
        setWorkError(false);
      }
    }
    setWorkLoading(false);
    setRefreshing(false);
  }, [bootstrap.navigation.work, bootstrap.user.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  // The catalog is authoritative. On an API failure retain only the last
  // successfully authorized catalog; never fall back to unrestricted cards.
  // Destinations are limited to implemented Connect tabs.
  const cardFor = (app: CatalogApp): AppCard | null => {
    const routes: Record<string, {tab: TabKey; icon: typeof Inbox; section?: 'clock' | 'directory'}> = {
      work: { tab: 'work', icon: CheckSquare2 },
      inbox: { tab: 'inbox', icon: Inbox },
      calendar: { tab: 'calendar', icon: CalendarDays },
      'time-clock': { tab: 'more', icon: Clock3, section: 'clock' },
      directory: { tab: 'inbox', icon: ContactRound, section: 'directory' },
    };
    const route = routes[app.destination];
    if (!route || !bootstrap.navigation[route.tab]) return null;
    return { key: app.app_key, title: app.title, caption: ({work:'Tasks & projects',inbox:'Communications',calendar:'Your schedule','time-clock':'Punches & shifts',directory:'Team & clients'} as Record<string,string>)[app.destination] ?? app.description, accent: /^#[0-9a-f]{6}$/i.test(app.accent) ? app.accent : '#E8B83F', tab: route.tab, icon: route.icon, section: route.section };
  };
  const available = (catalogApps || []).map(cardFor).filter((item): item is AppCard => item !== null);
  if (bootstrap.navigation.more) available.push({key:'my-account',title:'My Account',caption:'Employee profile',accent:'#A99CFF',tab:'more',icon:UserRound});
  const canViewWork = available.some(item => item.key === 'work');
  const openTasks = tasks.filter((task) => !OPEN.has((task.status || '').toLowerCase()));
  const dateLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', weekday: 'long', timeZone: 'America/Chicago' }).format(new Date());

  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>BLACK LABEL CONNECT  /  HOME</Text>
          <Text style={styles.heading}>Welcome, {firstName(bootstrap.user.displayName)}.</Text>
          <Text style={styles.date}>{dateLabel}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Refresh home status" onPress={() => void refresh()} disabled={refreshing} style={styles.refresh}>
          <RefreshCw color={colors.amber} size={19} />
        </Pressable>
      </View>

      <View style={styles.statusSection}>
        <View style={styles.statusCard}>
          <View style={styles.statusTitle}><Clock3 size={17} color={clock === 'in' ? '#41D58B' : clock === 'out' ? '#F57F7F' : '#A7B0BD'}/><Text style={styles.statusCaption}>TIME CLOCK</Text></View>
          <View style={styles.clockRow}>
            <View style={[styles.statusDot, { backgroundColor: clock === 'in' ? '#41D58B' : clock === 'out' ? '#F57F7F' : '#9299A6' }]} />
            <Text style={[styles.statusText, { color: clock === 'in' ? '#41D58B' : clock === 'out' ? '#F57F7F' : '#A7B0BD' }]}>
              {clock === 'in' ? 'Clocked In' : clock === 'out' ? 'Clocked Out' : clock === 'loading' ? 'Checking…' : 'Unavailable'}
            </Text>
          </View>
          <Text style={styles.statusSmall}>Read-only status</Text>
        </View>
        {canViewWork ? (
          <Pressable style={styles.statusCard} accessibilityRole="button" onPress={() => onNavigate('work')}>
            <View style={styles.statusTitle}><CheckSquare2 size={17} color="#6FAFFF"/><Text style={styles.statusCaption}>ASSIGNED TASKS</Text></View>
            {workLoading ? <ActivityIndicator size="small" color="#6FAFFF" style={styles.loader} /> :
              <Text style={styles.taskNumber}>{workError ? '—' : openTasks.length}</Text>}
            <Text style={styles.statusSmall}>{workError ? 'Unable to load' : 'Open tasks · View Work →'}</Text>
          </Pressable>
        ) : null}
      </View>

      {canViewWork && openTasks.length > 0 && !workError ? (
        <Pressable style={styles.nextTask} onPress={() => onNavigate('work')} accessibilityRole="button">
          <View style={styles.nextTaskCopy}>
            <Text style={styles.statusCaption}>NEXT UP · BLACK LABEL WORK</Text>
            <Text style={styles.nextTaskTitle} numberOfLines={2}>{openTasks[0].title}</Text>
            <Text style={styles.statusSmall}>{openTasks[0].due_date ? 'Due ' + openTasks[0].due_date : 'No due date'}</Text>
          </View>
          <ChevronRight color="#9BA8BB" size={20}/>
        </Pressable>
      ) : null}

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>My applications</Text>
        <Text style={styles.sectionNote}>Available to your account</Text>
      </View>
      <View style={styles.grid}>
        {available.map((item) => {
          const Icon = item.icon;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityLabel={'Open ' + item.title}
              onPress={() => onNavigate(item.tab,item.section)}
              style={({ pressed }) => [styles.appCard, { borderColor: item.accent + '44' }, pressed && styles.pressed]}
            >
              <View style={[styles.appIcon, { backgroundColor: item.accent + '1A' }]}><Icon color={item.accent} size={27} /></View>
              <Text style={styles.appTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.appCaption} numberOfLines={2}>{item.caption}</Text>
            </Pressable>
          );
        })}
      </View>
      {available.length === 0 ? <Text style={styles.empty}>{catalogApps === null ? 'Loading your applications…' : 'No applications are assigned to this account. Contact your Hub administrator.'}</Text> : null}
      <Text style={styles.footer}>{catalogError ? 'Application permissions could not be refreshed. Showing last verified permissions.' : 'Application access is managed by Black Label Hub.'}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 26 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  headerText: { flex: 1 },
  kicker: { color: colors.amber, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 11 },
  heading: { color: colors.text, fontSize: 27, fontWeight: '800' },
  date: { color: colors.muted, fontSize: 13, marginTop: 6 },
  refresh: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, borderColor: '#383329', backgroundColor: '#17150F', justifyContent: 'center', alignItems: 'center' },
  statusSection: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statusCard: { flex: 1, backgroundColor: '#11151B', borderWidth: 1, borderColor: '#2A3038', borderRadius: 16, padding: 13, minHeight: 122 },
  statusTitle: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusCaption: { color: '#AAB4C0', fontSize: 9, fontWeight: '800', letterSpacing: .7 },
  clockRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 16 },
  statusDot: { height: 9, width: 9, borderRadius: 6 },
  statusText: { fontWeight: '800', fontSize: 16 },
  statusSmall: { color: '#8D98A6', fontSize: 10, marginTop: 8 },
  taskNumber: { fontSize: 29, color: '#F6F8FB', fontWeight: '900', marginTop: 7 },
  loader: { marginTop: 16, alignSelf: 'flex-start' },
  nextTask: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#101821', borderColor: '#273B51', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 14 },
  nextTaskCopy: { flex: 1 },
  nextTaskTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginTop: 7 },
  sectionHeading: { marginTop: 24, marginBottom: 16 },
  sectionTitle: { color: colors.text, fontSize: 23, fontWeight: '900' },
  sectionNote: { color: colors.muted, fontSize: 12, marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  appCard: { width: '31%', flexGrow: 0, flexShrink: 0, minWidth: 0, backgroundColor: '#11151B', borderWidth: 1, borderRadius: 16, paddingHorizontal: 9, paddingVertical: 16, height: 137, alignItems: 'center', justifyContent: 'center' },
  appIcon: { width: 48, height: 48, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  appTitle: { color: '#F5F7FA', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  appCaption: { color: '#909BAA', fontSize: 10, textAlign: 'center', marginTop: 5 },
  pressed: { opacity: .7 },
  empty: { color: colors.muted, fontSize: 13 },
  footer: { color: '#7D8795', fontSize: 11, lineHeight: 17, marginTop: 19 },
});
