import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Inbox as InboxIcon, MessageSquare, RefreshCw } from 'lucide-react-native';

import type { EmployeeInbox, EmployeeInboxConversation } from './contracts/inbox';
import { formatInboxTimestamp, titleForConversation } from './inbox';
import { fetchEmployeeInbox } from './services/employeeInbox';
import { colors, spacing } from './theme';

function ConversationRow({ conversation }: { conversation: EmployeeInboxConversation }) {
  const timestamp = conversation.lastMessageAt ?? conversation.latestMessage?.createdAt ?? null;
  const preview = conversation.latestMessage?.body.trim() || 'No messages yet.';

  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <MessageSquare color={colors.amber} size={19} strokeWidth={1.8} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTitleLine}>
          <Text numberOfLines={1} style={styles.rowTitle}>{titleForConversation(conversation)}</Text>
          <Text style={styles.rowTime}>{formatInboxTimestamp(timestamp)}</Text>
        </View>
        {conversation.clientName && conversation.subject ? (
          <Text numberOfLines={1} style={styles.rowAccount}>{conversation.clientName}</Text>
        ) : null}
        <Text numberOfLines={2} style={styles.rowPreview}>{preview}</Text>
      </View>
    </View>
  );
}

export function InboxExperience() {
  const [inbox, setInbox] = useState<EmployeeInbox | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      setInbox(await fetchEmployeeInbox());
    } catch (caught) {
      setInbox(null);
      setError(caught instanceof Error ? caught.message : 'Inbox could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHead}>
          <View style={styles.pageCopy}>
            <Text style={styles.kicker}>BLACK LABEL MESSAGES</Text>
            <Text style={styles.pageTitle}>Inbox</Text>
          </View>
          <Pressable
            accessibilityLabel="Refresh inbox"
            disabled={refreshing}
            onPress={() => void load(true)}
            style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}
          >
            {refreshing ? <ActivityIndicator color={colors.text} /> : <RefreshCw color={colors.text} size={20} />}
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.statePanel}>
            <ActivityIndicator color={colors.amber} />
            <Text style={styles.stateTitle}>Loading your inbox</Text>
            <Text style={styles.stateCopy}>Pulling the conversations your Hub permissions allow.</Text>
          </View>
        ) : error ? (
          <View style={styles.statePanel}>
            <InboxIcon color={colors.red} size={28} strokeWidth={1.6} />
            <Text style={styles.stateTitle}>Inbox unavailable</Text>
            <Text style={styles.stateCopy}>{error}</Text>
            <Pressable onPress={() => void load()} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : inbox?.conversations.length ? (
          <View style={styles.list}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Recent conversations</Text>
              <Text style={styles.listCount}>{inbox.conversations.length}</Text>
            </View>
            {inbox.conversations.map((conversation) => (
              <ConversationRow conversation={conversation} key={conversation.id} />
            ))}
          </View>
        ) : (
          <View style={styles.statePanel}>
            <InboxIcon color={colors.muted} size={30} strokeWidth={1.5} />
            <Text style={styles.stateTitle}>Your inbox is clear</Text>
            <Text style={styles.stateCopy}>No employee conversations are available right now.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: spacing.xl, paddingHorizontal: spacing.md },
  pageHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: spacing.lg, paddingTop: spacing.lg },
  pageCopy: { flex: 1, minWidth: 0 },
  kicker: { color: colors.amber, fontSize: 10, fontWeight: '800' },
  pageTitle: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: 4 },
  refreshButton: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderColor: colors.line, borderRadius: 8, borderWidth: 1, height: 46, justifyContent: 'center', width: 46 },
  list: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  listHeader: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: spacing.md },
  listTitle: { color: colors.soft, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  listCount: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  row: { alignItems: 'flex-start', borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 94, padding: spacing.md },
  rowIcon: { alignItems: 'center', backgroundColor: colors.amberSoft, borderRadius: 8, height: 40, justifyContent: 'center', marginRight: spacing.sm, width: 40 },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitleLine: { alignItems: 'baseline', flexDirection: 'row', gap: spacing.sm },
  rowTitle: { color: colors.text, flex: 1, fontSize: 15, fontWeight: '800' },
  rowTime: { color: colors.muted, fontSize: 11 },
  rowAccount: { color: colors.amber, fontSize: 10, fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },
  rowPreview: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 5 },
  statePanel: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 8, borderWidth: 1, gap: 8, marginTop: 8, padding: 28 },
  stateTitle: { color: colors.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  stateCopy: { color: colors.muted, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  retryButton: { backgroundColor: colors.text, borderRadius: 7, marginTop: 6, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: colors.canvas, fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.72 },
});
