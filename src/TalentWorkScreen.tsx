import { useState } from 'react';
import type { ComponentType } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Banknote, CalendarCheck2, FileSignature, MapPin, UserRoundCheck, type LucideProps } from 'lucide-react-native';

import type { MobileBootstrap } from './contracts/bootstrap';
import type { GigOpportunity } from './contracts/operations';
import { gigOpportunities, talentAssignments, talentSummary } from './fixtures/operations';
import { colors, spacing } from './theme';

function SummaryStat({ label, value, icon: Icon }: { label: string; value: string; icon: ComponentType<LucideProps> }) {
  return (
    <View style={styles.stat}>
      <Icon color={colors.amber} size={17} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function OpportunityCard({ gig, status, onStatus }: { gig: GigOpportunity; status: GigOpportunity['status']; onStatus: (status: GigOpportunity['status']) => void }) {
  return (
    <View style={styles.gigCard}>
      <View style={styles.gigTop}>
        <View style={styles.gigHeading}>
          <Text style={styles.miniLabel}>{gig.date}</Text>
          <Text style={styles.gigTitle}>{gig.title}</Text>
        </View>
        <View style={[styles.statusChip, status === 'Accepted' && styles.statusAccepted, status === 'Declined' && styles.statusDeclined]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>
      <View style={styles.metaLine}><UserRoundCheck color={colors.muted} size={15} /><Text style={styles.metaText}>{gig.role}</Text></View>
      <View style={styles.metaLine}><MapPin color={colors.muted} size={15} /><Text style={styles.metaText}>{gig.location} · {gig.time}</Text></View>
      <View style={styles.metaLine}><Banknote color={colors.muted} size={15} /><Text style={styles.metaText}>{gig.pay}</Text></View>
      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>REQUIREMENTS</Text>
        <Text style={styles.detailCopy}>{gig.requirements}</Text>
      </View>
      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>DELIVERABLES</Text>
        <Text style={styles.detailCopy}>{gig.deliverables}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={() => onStatus('Interested')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>Interested</Text></Pressable>
        <Pressable onPress={() => onStatus('Declined')} style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>Decline</Text></Pressable>
        <Pressable onPress={() => onStatus('Accepted')} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>Accept</Text></Pressable>
      </View>
    </View>
  );
}

export function TalentWorkScreen({ bootstrap }: { bootstrap: MobileBootstrap }) {
  const [responses, setResponses] = useState<Record<string, GigOpportunity['status']>>({});
  const contractor = bootstrap.activePersona === 'contractor';
  return (
    <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>{contractor ? 'BLACK LABEL TALENT' : 'FIELD OPERATIONS'}</Text>
      <Text style={styles.pageTitle}>Work</Text>
      <Text style={styles.pageCopy}>{contractor ? 'Open gigs, confirmed assignments, contracts, and pay.' : 'Staffing needs, assignments, and completion status.'}</Text>

      <View style={styles.summaryStrip}>
        <SummaryStat icon={CalendarCheck2} label="Next gig" value={talentSummary.nextGig} />
        <SummaryStat icon={Banknote} label="Pending pay" value={talentSummary.pendingPay} />
        <SummaryStat icon={UserRoundCheck} label="Profile" value={talentSummary.profileStatus} />
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Open gigs</Text>
        <Text style={styles.sectionCount}>{gigOpportunities.length} LIVE</Text>
      </View>
      {gigOpportunities.map((gig) => <OpportunityCard key={gig.id} gig={gig} status={responses[gig.id] ?? gig.status} onStatus={(status) => setResponses((current) => ({ ...current, [gig.id]: status }))} />)}

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>My gigs</Text>
        <Text style={styles.sectionCount}>{talentAssignments.length} BOOKED</Text>
      </View>
      {talentAssignments.map((assignment) => (
        <View key={assignment.id} style={styles.assignmentRow}>
          <View style={styles.assignmentDate}><Text style={styles.assignmentDateText}>{assignment.date.split(',')[0]}</Text></View>
          <View style={styles.assignmentMain}>
            <Text style={styles.assignmentTitle}>{assignment.title}</Text>
            <Text style={styles.assignmentMeta}>{assignment.role} · {assignment.callTime}</Text>
            <Text style={styles.assignmentMeta}>{assignment.location} · {assignment.pay}</Text>
            <View style={styles.assignmentStatuses}>
              <View style={styles.assignmentStatus}><FileSignature color={assignment.contractStatus === 'Signed' ? colors.green : colors.amber} size={13} /><Text style={styles.assignmentStatusText}>{assignment.contractStatus}</Text></View>
              <View style={styles.assignmentStatus}><Banknote color={assignment.paymentStatus === 'Paid' ? colors.green : colors.amber} size={13} /><Text style={styles.assignmentStatusText}>{assignment.paymentStatus}</Text></View>
            </View>
          </View>
        </View>
      ))}

      <View style={styles.availabilityLine}>
        <CalendarCheck2 color={colors.green} size={19} />
        <View><Text style={styles.availabilityLabel}>AVAILABILITY</Text><Text style={styles.availabilityValue}>{talentSummary.availability}</Text></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 42, paddingHorizontal: spacing.md },
  kicker: { color: colors.amber, fontSize: 10, fontWeight: '800', marginTop: spacing.lg },
  pageTitle: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: 4 },
  pageCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
  summaryStrip: { borderBottomColor: colors.line, borderBottomWidth: 1, borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', marginTop: spacing.lg, paddingVertical: 14 },
  stat: { flex: 1, minWidth: 0, paddingHorizontal: 7 },
  statLabel: { color: colors.muted, fontSize: 8, fontWeight: '800', marginTop: 7, textTransform: 'uppercase' },
  statValue: { color: colors.text, fontSize: 12, fontWeight: '800', marginTop: 3 },
  sectionHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: 26 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800' },
  sectionCount: { color: colors.amber, fontSize: 9, fontWeight: '900' },
  gigCard: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 8, borderWidth: 1, marginBottom: 12, padding: 14 },
  gigTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  gigHeading: { flex: 1, minWidth: 0 },
  miniLabel: { color: colors.amber, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  gigTitle: { color: colors.text, fontSize: 18, fontWeight: '800', lineHeight: 22, marginBottom: 10, marginTop: 4 },
  statusChip: { backgroundColor: colors.amberSoft, borderColor: colors.amber, borderRadius: 4, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 4 },
  statusAccepted: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  statusDeclined: { backgroundColor: colors.surfaceRaised, borderColor: colors.muted },
  statusText: { color: colors.text, fontSize: 9, fontWeight: '800' },
  metaLine: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 5 },
  metaText: { color: colors.soft, flex: 1, fontSize: 12 },
  detailBlock: { borderTopColor: colors.line, borderTopWidth: 1, marginTop: 12, paddingTop: 10 },
  detailLabel: { color: colors.muted, fontSize: 8, fontWeight: '800' },
  detailCopy: { color: colors.text, fontSize: 12, lineHeight: 18, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  secondaryButton: { alignItems: 'center', borderColor: colors.line, borderRadius: 7, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 42 },
  iconAction: { alignItems: 'center', borderColor: colors.line, borderRadius: 7, borderWidth: 1, justifyContent: 'center', minHeight: 42, paddingHorizontal: 10 },
  secondaryButtonText: { color: colors.text, fontSize: 10, fontWeight: '800' },
  primaryButton: { alignItems: 'center', backgroundColor: colors.amber, borderRadius: 7, flex: 1, justifyContent: 'center', minHeight: 42 },
  primaryButtonText: { color: colors.canvas, fontSize: 10, fontWeight: '900' },
  assignmentRow: { alignItems: 'flex-start', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', paddingVertical: 14 },
  assignmentDate: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderRadius: 6, justifyContent: 'center', marginRight: 12, minHeight: 52, width: 58 },
  assignmentDateText: { color: colors.text, fontSize: 9, fontWeight: '800', textAlign: 'center', textTransform: 'uppercase' },
  assignmentMain: { flex: 1 },
  assignmentTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  assignmentMeta: { color: colors.muted, fontSize: 11, marginTop: 4 },
  assignmentStatuses: { flexDirection: 'row', gap: 8, marginTop: 9 },
  assignmentStatus: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  assignmentStatusText: { color: colors.soft, fontSize: 10, fontWeight: '700' },
  availabilityLine: { alignItems: 'center', backgroundColor: colors.greenSoft, borderColor: colors.green, borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 11, marginTop: 22, padding: 14 },
  availabilityLabel: { color: colors.green, fontSize: 8, fontWeight: '900' },
  availabilityValue: { color: colors.text, fontSize: 12, fontWeight: '700', marginTop: 3 },
  pressed: { opacity: 0.7 },
});
