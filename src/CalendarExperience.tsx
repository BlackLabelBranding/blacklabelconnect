import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, ChevronRight, Clock3, MapPin, RefreshCw } from 'lucide-react-native';

import type { CalendarEvent, EventTone } from './contracts/operations';
import { calendarEvents } from './fixtures/operations';
import { colors, spacing } from './theme';

type CalendarView = 'upcoming' | 'day' | 'week' | 'month';

const toneColors: Record<EventTone, string> = {
  event: colors.green,
  entertainment: colors.amber,
  meeting: colors.blue,
  travel: colors.violet,
  deadline: colors.red,
};

const monthDays = Array.from({ length: 35 }, (_, index) => {
  const day = index < 4 ? 27 + index : index - 3;
  const month = index < 4 ? 'Sep' : 'Oct';
  return { day, month, muted: index < 4 };
});

function EventRow({ event }: { event: CalendarEvent }) {
  const tone = toneColors[event.tone];
  return (
    <Pressable style={({ pressed }) => [styles.eventRow, { borderLeftColor: tone }, pressed && styles.pressed]}>
      <View style={styles.eventTime}>
        <Text style={styles.eventTimePrimary}>{event.time.split(' ')[0]}</Text>
        <Text style={styles.eventTimeSecondary}>{event.time.split(' ').slice(1).join(' ') || 'DAY'}</Text>
      </View>
      <View style={styles.eventMain}>
        <View style={styles.eventTitleLine}>
          <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
          <View style={[styles.typeChip, { borderColor: tone }]}>
            <Text style={[styles.typeChipText, { color: tone }]}>{event.type}</Text>
          </View>
        </View>
        <Text style={styles.eventDate}>{event.dayLabel} · {event.time}</Text>
        <View style={styles.locationLine}>
          <MapPin color={colors.muted} size={13} />
          <Text style={styles.eventLocation} numberOfLines={1}>{event.location}</Text>
        </View>
      </View>
      <ChevronRight color={colors.muted} size={18} />
    </Pressable>
  );
}

export function CalendarExperience() {
  const [view, setView] = useState<CalendarView>('upcoming');
  const nextEvent = calendarEvents[0];
  const visibleEvents = useMemo(() => {
    if (view === 'day') return calendarEvents.slice(0, 1);
    if (view === 'week') return calendarEvents.slice(0, 3);
    return calendarEvents;
  }, [view]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHead}>
          <View>
            <Text style={styles.kicker}>BLACK LABEL CALENDAR</Text>
            <Text style={styles.pageTitle}>Your schedule</Text>
          </View>
          <Pressable accessibilityLabel="Refresh calendar" style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}>
            <RefreshCw color={colors.text} size={20} />
          </Pressable>
        </View>

        <View style={styles.nowStrip}>
          <View style={styles.todayBlock}>
            <Text style={styles.todayWeekday}>MONDAY</Text>
            <Text style={styles.todayDate}>28</Text>
          </View>
          <View style={styles.nextBlock}>
            <Text style={styles.nextKicker}>HAPPENING NEXT</Text>
            <Text style={styles.nextTitle} numberOfLines={2}>{nextEvent.title}</Text>
            <View style={styles.nextMeta}>
              <Clock3 color={colors.soft} size={14} />
              <Text style={styles.nextTime}>{nextEvent.time} · {nextEvent.location}</Text>
            </View>
          </View>
        </View>

        {view === 'month' ? (
          <View style={styles.monthPanel}>
            <View style={styles.monthHead}>
              <Text style={styles.monthTitle}>October 2026</Text>
              <CalendarDays color={colors.amber} size={20} />
            </View>
            <View style={styles.weekdayGrid}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>)}
            </View>
            <View style={styles.monthGrid}>
              {monthDays.map((item, index) => {
                const event = calendarEvents.find((entry) => Number(entry.date.slice(-2)) === item.day && entry.date.includes(item.month === 'Sep' ? '-09-' : '-10-'));
                return (
                  <View key={`${item.month}-${item.day}`} style={[styles.monthCell, index === 1 && styles.monthCellToday]}>
                    <Text style={[styles.monthDate, item.muted && styles.monthDateMuted]}>{item.day}</Text>
                    {event ? <View style={[styles.monthEventDot, { backgroundColor: toneColors[event.tone] }]} /> : null}
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.agenda}>
            {visibleEvents.map((event, index) => (
              <View key={event.id}>
                {index === 0 || visibleEvents[index - 1]?.dayLabel !== event.dayLabel ? <Text style={styles.dayLabel}>{event.dayLabel}</Text> : null}
                <EventRow event={event} />
              </View>
            ))}
          </View>
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
  viewTabs: { backgroundColor: colors.surfaceRaised, borderColor: colors.line, borderRadius: 8, borderWidth: 1, bottom: 12, flexDirection: 'row', left: 12, padding: 4, position: 'absolute', right: 12 },
  viewTab: { alignItems: 'center', borderRadius: 6, flex: 1, justifyContent: 'center', minHeight: 42 },
  viewTabActive: { backgroundColor: colors.text },
  viewTabText: { color: colors.muted, fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  viewTabTextActive: { color: colors.canvas },
  pressed: { opacity: 0.72 },
});
