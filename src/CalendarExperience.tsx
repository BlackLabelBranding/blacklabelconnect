import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, ChevronRight, Clock3, MapPin, RefreshCw } from 'lucide-react-native';

import type { CalendarTone, EmployeeCalendar, EmployeeCalendarEvent } from './contracts/calendar';
import { toneForCalendarEvent } from './calendar';
import { fetchEmployeeCalendar } from './services/employeeCalendar';
import { colors, spacing } from './theme';

type CalendarView = 'upcoming' | 'day' | 'week' | 'month';

const toneColors: Record<CalendarTone, string> = {
  event: colors.green,
  entertainment: colors.amber,
  meeting: colors.blue,
  travel: colors.violet,
  deadline: colors.red,
};

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const result = startOfDay(date);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

function endOfWeek(date: Date) {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 7);
  return result;
}

function eventDate(event: EmployeeCalendarEvent) {
  return new Date(event.startsAt);
}

function formatTime(event: EmployeeCalendarEvent) {
  if (event.allDay) return 'ALL DAY';
  return eventDate(event).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDayLabel(event: EmployeeCalendarEvent) {
  return eventDate(event).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function monthCells(focus: Date) {
  const first = new Date(focus.getFullYear(), focus.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, muted: date.getMonth() !== focus.getMonth() };
  });
}

function EventRow({ event }: { event: EmployeeCalendarEvent }) {
  const tone = toneColors[toneForCalendarEvent(event)];
  return (
    <Pressable style={({ pressed }) => [styles.eventRow, { borderLeftColor: tone }, pressed && styles.pressed]}>
      <View style={styles.eventTime}>
        <Text style={styles.eventTimePrimary}>{formatTime(event).split(' ')[0]}</Text>
        <Text style={styles.eventTimeSecondary}>{formatTime(event).split(' ').slice(1).join(' ') || 'DAY'}</Text>
      </View>
      <View style={styles.eventMain}>
        <View style={styles.eventTitleLine}>
          <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
          <View style={[styles.typeChip, { borderColor: tone }]}>
            <Text style={[styles.typeChipText, { color: tone }]}>{event.eventType || event.category || 'Event'}</Text>
          </View>
        </View>
        <Text style={styles.eventDate}>{formatDayLabel(event)} · {formatTime(event)}</Text>
        <View style={styles.locationLine}>
          <MapPin color={colors.muted} size={13} />
          <Text style={styles.eventLocation} numberOfLines={1}>{event.location || 'Location TBD'}</Text>
        </View>
      </View>
      <ChevronRight color={colors.muted} size={18} />
    </Pressable>
  );
}

export function CalendarExperience() {
  const [view, setView] = useState<CalendarView>('upcoming');
  const [calendar, setCalendar] = useState<EmployeeCalendar | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const now = useMemo(() => new Date(), []);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      setCalendar(await fetchEmployeeCalendar(now));
    } catch (caught) {
      setCalendar(null);
      setError(caught instanceof Error ? caught.message : 'Calendar could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [now]);

  useEffect(() => {
    void load();
  }, [load]);

  const events = calendar?.events ?? [];
  const upcoming = useMemo(() => events.filter((event) => {
    const end = event.endsAt ? new Date(event.endsAt) : eventDate(event);
    return end >= startOfDay(now);
  }), [events, now]);

  const visibleEvents = useMemo(() => {
    if (view === 'upcoming') return upcoming;
    if (view === 'day') {
      const key = dayKey(now);
      return events.filter((event) => dayKey(eventDate(event)) === key);
    }
    if (view === 'week') {
      const start = startOfWeek(now);
      const end = endOfWeek(now);
      return events.filter((event) => eventDate(event) >= start && eventDate(event) < end);
    }
    return events.filter((event) => {
      const date = eventDate(event);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    });
  }, [events, now, upcoming, view]);

  const nextEvent = upcoming[0] ?? null;
  const cells = useMemo(() => monthCells(now), [now]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHead}>
          <View>
            <Text style={styles.kicker}>BLACK LABEL CALENDAR</Text>
            <Text style={styles.pageTitle}>Your schedule</Text>
          </View>
          <Pressable
            accessibilityLabel="Refresh calendar"
            disabled={refreshing}
            onPress={() => void load(true)}
            style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}
          >
            {refreshing ? <ActivityIndicator color={colors.text} /> : <RefreshCw color={colors.text} size={20} />}
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={colors.amber} />
            <Text style={styles.stateTitle}>Loading your calendar</Text>
            <Text style={styles.stateCopy}>Pulling the schedule your Hub permissions allow.</Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Calendar unavailable</Text>
            <Text style={styles.stateCopy}>{error}</Text>
            <Pressable onPress={() => void load()} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.nowStrip}>
              <View style={styles.todayBlock}>
                <Text style={styles.todayWeekday}>{now.toLocaleDateString([], { weekday: 'long' }).toUpperCase()}</Text>
                <Text style={styles.todayDate}>{now.getDate()}</Text>
              </View>
              <View style={styles.nextBlock}>
                <Text style={styles.nextKicker}>HAPPENING NEXT</Text>
                {nextEvent ? (
                  <>
                    <Text style={styles.nextTitle} numberOfLines={2}>{nextEvent.title}</Text>
                    <View style={styles.nextMeta}>
                      <Clock3 color={colors.soft} size={14} />
                      <Text style={styles.nextTime}>{formatTime(nextEvent)} · {nextEvent.location || 'Location TBD'}</Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.nextEmpty}>Nothing else scheduled in this calendar window.</Text>
                )}
              </View>
            </View>

            {view === 'month' ? (
              <View style={styles.monthPanel}>
                <View style={styles.monthHead}>
                  <Text style={styles.monthTitle}>{now.toLocaleDateString([], { month: 'long', year: 'numeric' })}</Text>
                  <CalendarDays color={colors.amber} size={20} />
                </View>
                <View style={styles.weekdayGrid}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>)}
                </View>
                <View style={styles.monthGrid}>
                  {cells.map((item) => {
                    const matching = events.find((event) => dayKey(eventDate(event)) === dayKey(item.date));
                    const today = dayKey(item.date) === dayKey(now);
                    return (
                      <View key={dayKey(item.date)} style={[styles.monthCell, today && styles.monthCellToday]}>
                        <Text style={[styles.monthDate, item.muted && styles.monthDateMuted]}>{item.date.getDate()}</Text>
                        {matching ? <View style={[styles.monthEventDot, { backgroundColor: toneColors[toneForCalendarEvent(matching)] }]} /> : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : visibleEvents.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>No events here</Text>
                <Text style={styles.stateCopy}>Nothing is scheduled for this {view === 'upcoming' ? 'calendar window' : view}.</Text>
              </View>
            ) : (
              <View style={styles.agenda}>
                {visibleEvents.map((event, index) => (
                  <View key={event.id}>
                    {index === 0 || formatDayLabel(visibleEvents[index - 1]) !== formatDayLabel(event)
                      ? <Text style={styles.dayLabel}>{formatDayLabel(event)}</Text>
                      : null}
                    <EventRow event={event} />
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.viewTabs}>
        {(['upcoming', 'day', 'week', 'month'] as CalendarView[]).map((item) => (
          <Pressable key={item} onPress={() => setView(item)} style={({ pressed }) => [styles.viewTab, view === item && styles.viewTabActive, pressed && styles.pressed]}>
            <Text style={[styles.viewTabText, view === item && styles.viewTabTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 96, paddingHorizontal: spacing.md },
  pageHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: spacing.md, paddingTop: spacing.lg },
  kicker: { color: colors.amber, fontSize: 10, fontWeight: '800' },
  pageTitle: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: 4 },
  refreshButton: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderColor: colors.line, borderRadius: 8, borderWidth: 1, height: 46, justifyContent: 'center', width: 46 },
  nowStrip: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  todayBlock: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 8, borderWidth: 1, justifyContent: 'center', minHeight: 126, padding: 12, width: 90 },
  todayWeekday: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  todayDate: { color: colors.text, fontSize: 52, fontWeight: '900', lineHeight: 58 },
  nextBlock: { backgroundColor: colors.amberSoft, borderColor: colors.amber, borderLeftWidth: 5, borderRadius: 8, borderWidth: 1, flex: 1, justifyContent: 'center', minWidth: 0, padding: 14 },
  nextKicker: { color: colors.amber, fontSize: 9, fontWeight: '900' },
  nextTitle: { color: colors.text, fontSize: 23, fontWeight: '900', lineHeight: 25, marginVertical: 7 },
  nextEmpty: { color: colors.soft, fontSize: 13, lineHeight: 18, marginTop: 8 },
  nextMeta: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  nextTime: { color: colors.soft, flex: 1, fontSize: 12, fontWeight: '600' },
  agenda: { gap: 10 },
  dayLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', marginBottom: 8, marginTop: 8, textTransform: 'uppercase' },
  eventRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderLeftWidth: 5, borderRadius: 8, borderWidth: 1, flexDirection: 'row', minHeight: 108, padding: 12 },
  eventTime: { alignItems: 'center', borderRightColor: colors.line, borderRightWidth: 1, justifyContent: 'center', marginRight: 12, minHeight: 70, width: 58 },
  eventTimePrimary: { color: colors.text, fontSize: 18, fontWeight: '900' },
  eventTimeSecondary: { color: colors.muted, fontSize: 9, fontWeight: '800', marginTop: 3 },
  eventMain: { flex: 1, minWidth: 0 },
  eventTitleLine: { alignItems: 'flex-start', flexDirection: 'row', gap: 7 },
  eventTitle: { color: colors.text, flex: 1, fontSize: 15, fontWeight: '800', lineHeight: 19 },
  typeChip: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 3 },
  typeChipText: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase' },
  eventDate: { color: colors.soft, fontSize: 11, fontWeight: '600', marginTop: 7 },
  locationLine: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 5 },
  eventLocation: { color: colors.muted, flex: 1, fontSize: 11 },
  monthPanel: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 8, borderWidth: 1, padding: 12 },
  monthHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  monthTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  weekdayGrid: { flexDirection: 'row' },
  weekday: { color: colors.muted, flex: 1, fontSize: 9, fontWeight: '800', paddingVertical: 6, textAlign: 'center' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  monthCell: { alignItems: 'center', borderColor: colors.line, borderRightWidth: StyleSheet.hairlineWidth, borderTopWidth: StyleSheet.hairlineWidth, height: 48, justifyContent: 'center', width: '14.2857%' },
  monthCellToday: { backgroundColor: colors.amberSoft },
  monthDate: { color: colors.text, fontSize: 12, fontWeight: '700' },
  monthDateMuted: { color: colors.muted },
  monthEventDot: { borderRadius: 3, height: 5, marginTop: 4, width: 5 },
  stateCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 8, borderWidth: 1, gap: 8, marginTop: 8, padding: 24 },
  stateTitle: { color: colors.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  stateCopy: { color: colors.muted, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  retryButton: { backgroundColor: colors.text, borderRadius: 7, marginTop: 6, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: colors.canvas, fontSize: 12, fontWeight: '800' },
  viewTabs: { backgroundColor: colors.surfaceRaised, borderColor: colors.line, borderRadius: 8, borderWidth: 1, bottom: 12, flexDirection: 'row', left: 12, padding: 4, position: 'absolute', right: 12 },
  viewTab: { alignItems: 'center', borderRadius: 6, flex: 1, justifyContent: 'center', minHeight: 42 },
  viewTabActive: { backgroundColor: colors.text },
  viewTabText: { color: colors.muted, fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  viewTabTextActive: { color: colors.canvas },
  pressed: { opacity: 0.72 },
});
