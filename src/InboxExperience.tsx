import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ArrowLeft,
  ChevronRight,
  Inbox as InboxIcon,
  MessageSquare,
  UsersRound,
  Smartphone,
  RefreshCw,
  Send,
} from 'lucide-react-native';

import type {
  EmployeeInbox,
  EmployeeInboxConversation,
  EmployeeInboxThread,
  EmployeeInboxThreadMessage,
} from './contracts/inbox';
import {
  formatInboxTimestamp,
  formatThreadTimestamp,
  isOutboundMessage,
  titleForConversation,
} from './inbox';
import { fetchEmployeeInbox, fetchEmployeeInboxThread } from './services/employeeInbox';
import { colors, spacing } from './theme';
import { BroadcastExperience } from './BroadcastExperience';
import { AnnouncementExperience } from './AnnouncementExperience';
import { ManagerBroadcastExperience } from './ManagerBroadcastExperience';
import { TeamChatExperience } from './TeamChatExperience';

function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: EmployeeInboxConversation;
  onPress: () => void;
}) {
  const timestamp = conversation.lastMessageAt ?? conversation.latestMessage?.createdAt ?? null;
  const preview = conversation.latestMessage?.body.trim() || 'No messages yet.';

  return (
    <Pressable
      accessibilityLabel={'Open conversation with ' + conversation.clientName}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowIcon}>
        <MessageSquare color={colors.amber} size={19} strokeWidth={1.8} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.channelEyebrow}>EXTERNAL SMS HISTORY</Text>
        <View style={styles.rowTitleLine}>
          <Text numberOfLines={1} style={styles.rowTitle}>{titleForConversation(conversation)}</Text>
          <Text style={styles.rowTime}>{formatInboxTimestamp(timestamp)}</Text>
        </View>
        <Text numberOfLines={2} style={styles.rowPreview}>{preview}</Text>
      </View>
      <View style={styles.rowEnd}>
        {conversation.unreadCount > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </Text>
          </View>
        ) : null}
        <ChevronRight color={colors.muted} size={18} />
      </View>
    </Pressable>
  );
}

function MessageBubble({
  message,
  clientName,
}: {
  message: EmployeeInboxThreadMessage;
  clientName: string;
}) {
  const outbound = isOutboundMessage(message);
  const sender = message.senderName?.trim() || (outbound ? 'Black Label' : clientName);
  const timestamp = formatThreadTimestamp(message.createdAt);

  return (
    <View style={[styles.messageWrap, outbound && styles.messageWrapOutbound]}>
      <Text style={[styles.messageSender, outbound && styles.messageSenderOutbound]}>{sender}</Text>
      <View style={[styles.messageBubble, outbound ? styles.messageOutbound : styles.messageInbound]}>
        <Text style={styles.messageBody}>{message.body}</Text>
        {message.mediaCount > 0 ? (
          <Text style={styles.messageMedia}>
            {message.mediaCount} {message.mediaCount === 1 ? 'attachment' : 'attachments'}
          </Text>
        ) : null}
      </View>
      {timestamp ? (
        <Text style={[styles.messageTime, outbound && styles.messageTimeOutbound]}>{timestamp}</Text>
      ) : null}
    </View>
  );
}

function ThreadExperience({
  conversation,
  onBack,
}: {
  conversation: EmployeeInboxConversation;
  onBack: () => void;
}) {
  const [thread, setThread] = useState<EmployeeInboxThread | null>(null);
  const [draft, setDraft] = useState('');
  const threadScrollRef = useRef<ScrollView>(null);
  const initialScrollPending = useRef(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      setThread(await fetchEmployeeInboxThread(conversation.id));
    } catch (caught) {
      setThread(null);
      setError(caught instanceof Error ? caught.message : 'Conversation could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [conversation.id]);

  useEffect(() => {
    initialScrollPending.current = true;
    void load();
    const interval = setInterval(() => {
      void load(true);
    }, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.threadHeader}>
        <Pressable
          accessibilityLabel="Back to inbox"
          onPress={onBack}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <ArrowLeft color={colors.text} size={22} />
        </Pressable>
        <View style={styles.threadHeaderCopy}>
          <Text numberOfLines={1} style={styles.threadTitle}>{conversation.clientName}</Text>
          <Text style={styles.threadStatus}>EXTERNAL SMS HISTORY · {conversation.status}</Text>
        </View>
        <Pressable
          accessibilityLabel="Refresh conversation"
          disabled={refreshing}
          onPress={() => void load(true)}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          {refreshing ? <ActivityIndicator color={colors.text} /> : <RefreshCw color={colors.text} size={19} />}
        </Pressable>
      </View>

      <ScrollView
        ref={threadScrollRef}
        onContentSizeChange={() => {
          if (initialScrollPending.current && !loading && thread?.messages.length) {
            threadScrollRef.current?.scrollToEnd({ animated: false });
            initialScrollPending.current = false;
          }
        }}
        contentContainerStyle={styles.threadContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <StatePanel busy title="Loading conversation" detail="Retrieving recent message history." />
        ) : error ? (
          <StatePanel
            title="Conversation unavailable"
            detail={error}
            action={{ label: 'Try again', onPress: () => void load() }}
          />
        ) : thread?.messages.length ? (
          thread.messages.map((message) => (
            <MessageBubble
              clientName={thread.conversation.clientName}
              key={message.id}
              message={message}
            />
          ))
        ) : (
          <StatePanel title="No messages yet" detail="This conversation has no message history." />
        )}
      </ScrollView>
      <View style={styles.composer}>
        <TextInput
          accessibilityLabel="Message draft"
          multiline
          maxLength={1600}
          onChangeText={setDraft}
          placeholder="Write a reply…"
          placeholderTextColor={colors.muted}
          style={styles.composerInput}
          value={draft}
        />
        <Pressable
          accessibilityLabel="Send reply unavailable until secure messaging is connected"
          accessibilityState={{ disabled: true }}
          disabled
          style={styles.composerSendDisabled}
        >
          <Send color={colors.muted} size={19} />
        </Pressable>
      </View>
      <Text style={styles.composerNotice}>External SMS history · Sending is disabled. Drafts are not sent or saved.</Text>
    </View>
  );
}

function StatePanel({
  title,
  detail,
  busy = false,
  action,
}: {
  title: string;
  detail: string;
  busy?: boolean;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.statePanel}>
      {busy ? <ActivityIndicator color={colors.amber} /> : <InboxIcon color={colors.muted} size={28} />}
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateCopy}>{detail}</Text>
      {action ? (
        <Pressable onPress={action.onPress} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
          <Text style={styles.retryText}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function InboxExperience() {
  const [inbox, setInbox] = useState<EmployeeInbox | null>(null);
  const [selected, setSelected] = useState<EmployeeInboxConversation | null>(null);
  const [showBroadcasts, setShowBroadcasts] = useState(false);
  const [channel, setChannel] = useState<'team' | 'sms'>('team');
  const [showTeamChat, setShowTeamChat] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showManagerApprovals, setShowManagerApprovals] = useState(false);
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
    const interval = setInterval(() => {
      void load(true);
    }, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  if (showTeamChat) return <TeamChatExperience onBack={() => setShowTeamChat(false)} />;
  if (showManagerApprovals) return <ManagerBroadcastExperience onBack={() => setShowManagerApprovals(false)} />;
  if (showAnnouncements) return <AnnouncementExperience onBack={() => setShowAnnouncements(false)} />;
  if (showBroadcasts) return <BroadcastExperience onBack={() => setShowBroadcasts(false)} />;

  if (selected) {
    return <ThreadExperience conversation={selected} onBack={() => setSelected(null)} />;
  }

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

        <View style={styles.channelTabs}>
          <Pressable onPress={() => setChannel('team')} accessibilityRole="tab" accessibilityState={{ selected: channel === 'team' }} style={[styles.channelTab, channel === 'team' && styles.channelTabActive]}>
            <UsersRound color={channel === 'team' ? colors.canvas : colors.soft} size={17} />
            <Text style={[styles.channelTabText, channel === 'team' && styles.channelTabTextActive]}>Team</Text>
          </Pressable>
          <Pressable onPress={() => setChannel('sms')} accessibilityRole="tab" accessibilityState={{ selected: channel === 'sms' }} style={[styles.channelTab, channel === 'sms' && styles.channelTabActive]}>
            <Smartphone color={channel === 'sms' ? colors.canvas : colors.soft} size={17} />
            <Text style={[styles.channelTabText, channel === 'sms' && styles.channelTabTextActive]}>SMS · External</Text>
          </Pressable>
        </View>
        {channel === 'team' ? (
          <View style={styles.teamHero}>
            <View style={styles.teamHeroIcon}><UsersRound color={colors.amber} size={26} /></View>
            <Text style={styles.teamHeroTitle}>Your team, one conversation away.</Text>
            <Text style={styles.teamHeroCopy}>Message coworkers inside Black Label Connect. No phone numbers or SMS needed.</Text>
            <Pressable onPress={() => setShowTeamChat(true)} style={styles.teamHeroAction}>
              <Text style={styles.teamHeroActionText}>Open team conversations</Text>
              <ChevronRight color={colors.canvas} size={18} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.smsIntro}>
            <Smartphone color={colors.amber} size={20} />
            <View style={{ flex: 1 }}>
              <Text style={styles.smsIntroTitle}>Outside the team?</Text>
              <Text style={styles.smsIntroCopy}>Use SMS for clients, vendors and other contacts who aren't on Connect. SMS history is currently view-only.</Text>
            </View>
          </View>
        )}
        {channel === "team" ? <Pressable accessibilityLabel="Toggle messaging tools" onPress={() => setShowTools((value) => !value)} style={styles.toolsToggle}>
          <Text style={styles.toolsToggleText}>Announcements and manager tools {showTools ? "−" : "+"}</Text>
        </Pressable> : null}
        {showTools && channel === "team" ? <>
        <Pressable accessibilityLabel="Open manager broadcast approvals" onPress={() => setShowManagerApprovals(true)} style={styles.broadcastEntry}>
          <Text style={styles.broadcastEntryTitle}>Manager approvals</Text>
          <Text style={styles.broadcastEntrySubtitle}>Review and publish employee announcements ›</Text>
        </Pressable>

        <Pressable accessibilityLabel="Open employee announcements" onPress={() => setShowAnnouncements(true)} style={styles.broadcastEntry}>
          <Text style={styles.broadcastEntryTitle}>Employee announcements</Text>
          <Text style={styles.broadcastEntrySubtitle}>Read internal company updates ›</Text>
        </Pressable>

        <Pressable accessibilityLabel="Open employee broadcast drafts" onPress={() => setShowBroadcasts(true)} style={styles.broadcastEntry}>
          <Text style={styles.broadcastEntryTitle}>Employee broadcasts</Text>
          <Text style={styles.broadcastEntrySubtitle}>Create announcements and manage campaign drafts ›</Text>
        </Pressable>

        </> : null}
        {channel === "team" ? null : loading ? (
          <StatePanel busy title="Loading your inbox" detail="Pulling your authorized conversations." />
        ) : error ? (
          <StatePanel
            title="Inbox unavailable"
            detail={error}
            action={{ label: 'Try again', onPress: () => void load() }}
          />
        ) : inbox?.conversations.length ? (
          <View style={styles.list}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>External SMS conversations</Text>
              <Text style={styles.listCount}>{inbox.conversations.length}</Text>
            </View>
            {inbox.conversations.map((conversation) => (
              <ConversationRow
                conversation={conversation}
                key={conversation.id}
                onPress={() => setSelected(conversation)}
              />
            ))}
          </View>
        ) : (
          <StatePanel title="Your inbox is clear" detail="No external SMS conversations are available right now." />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minWidth: 0, width: '100%', overflow: 'hidden' },
  content: { paddingBottom: spacing.xl, paddingHorizontal: spacing.md, width: '100%' },
  channelTabs: { flexDirection: 'row', backgroundColor: colors.surfaceRaised, borderColor: colors.line, borderWidth: 1, borderRadius: 12, padding: 5, gap: 5, marginBottom: spacing.md },
  channelTab: { flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 9 },
  channelTabActive: { backgroundColor: colors.text },
  channelTabText: { color: colors.soft, fontSize: 13, fontWeight: '800' },
  channelTabTextActive: { color: colors.canvas },
  teamHero: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 14, padding: 22, gap: 12 },
  teamHeroIcon: { backgroundColor: colors.amberSoft, borderRadius: 12, width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  teamHeroTitle: { color: colors.text, fontSize: 21, fontWeight: '800' },
  teamHeroCopy: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  teamHeroAction: { backgroundColor: colors.text, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  teamHeroActionText: { color: colors.canvas, fontSize: 13, fontWeight: '800' },
  smsIntro: { flexDirection: 'row', gap: 12, borderColor: colors.line, borderWidth: 1, borderRadius: 12, backgroundColor: colors.surface, padding: 16, marginBottom: spacing.md },
  smsIntroTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  smsIntroCopy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  toolsToggle: { padding: spacing.md, marginBottom: spacing.sm },
  toolsToggleText: { color: colors.soft, fontSize: 12, fontWeight: '700' },
  pageHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: spacing.lg, paddingTop: spacing.lg },
  pageCopy: { flex: 1, minWidth: 0 },
  kicker: { color: colors.amber, fontSize: 10, fontWeight: '800' },
  pageTitle: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: 4 },
  refreshButton: { alignItems: 'center', backgroundColor: colors.surfaceRaised, borderColor: colors.line, borderRadius: 8, borderWidth: 1, height: 46, justifyContent: 'center', width: 46 },
  list: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  listHeader: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: spacing.md },
  listTitle: { color: colors.soft, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  listCount: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  row: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 94, padding: spacing.md },
  rowIcon: { alignItems: 'center', backgroundColor: colors.amberSoft, borderRadius: 8, height: 40, justifyContent: 'center', marginRight: spacing.sm, width: 40 },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitleLine: { alignItems: 'baseline', flexDirection: 'row', gap: spacing.sm },
  rowTitle: { color: colors.text, flex: 1, fontSize: 15, fontWeight: '800' },
  rowTime: { color: colors.muted, fontSize: 11 },
  channelEyebrow: { color: colors.amber, fontSize: 9, fontWeight: '800', marginBottom: 3 },
  rowPreview: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 5 },
  rowEnd: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginLeft: spacing.sm },
  unreadBadge: { alignItems: 'center', backgroundColor: colors.amber, borderRadius: 9, justifyContent: 'center', minHeight: 18, minWidth: 18, paddingHorizontal: 5 },
  unreadText: { color: colors.canvas, fontSize: 9, fontWeight: '900' },
  statePanel: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 8, borderWidth: 1, gap: 8, marginTop: 8, padding: 28 },
  stateTitle: { color: colors.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  stateCopy: { color: colors.muted, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  retryButton: { backgroundColor: colors.text, borderRadius: 7, marginTop: 6, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: colors.canvas, fontSize: 12, fontWeight: '800' },
  composer: { alignItems: 'flex-end', borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: spacing.md, paddingTop: 10 },
  composerInput: { backgroundColor: colors.surfaceRaised, borderColor: colors.line, borderRadius: 12, borderWidth: 1, color: colors.text, flex: 1, fontSize: 14, maxHeight: 120, minHeight: 44, paddingHorizontal: 12, paddingVertical: 10 },
  composerSendDisabled: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, height: 44, justifyContent: 'center', opacity: 0.55, width: 44 },
  composerNotice: { color: colors.muted, fontSize: 10, paddingBottom: 10, paddingHorizontal: spacing.md, paddingTop: 5 },
  threadHeader: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 68, paddingHorizontal: spacing.sm },
  iconButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  threadHeaderCopy: { flex: 1, minWidth: 0, paddingHorizontal: spacing.xs },
  threadTitle: { color: colors.text, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  threadStatus: { color: colors.muted, fontSize: 10, marginTop: 3, textAlign: 'center', textTransform: 'uppercase' },
  threadContent: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xl, width: '100%' },
  messageWrap: { alignSelf: 'flex-start', maxWidth: '84%', minWidth: 0, flexShrink: 1 },
  messageWrapOutbound: { alignSelf: 'flex-end' },
  messageSender: { color: colors.muted, fontSize: 10, fontWeight: '700', marginBottom: 5, marginLeft: 4 },
  messageSenderOutbound: { marginLeft: 0, marginRight: 4, textAlign: 'right' },
  messageBubble: { borderRadius: 14, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, maxWidth: '100%', minWidth: 0 },
  messageInbound: { backgroundColor: colors.surfaceRaised, borderColor: colors.line, borderWidth: 1 },
  messageOutbound: { backgroundColor: colors.amberSoft, borderColor: colors.amber, borderWidth: 1 },
  messageBody: { color: colors.text, fontSize: 14, lineHeight: 20 },
  messageMedia: { color: colors.amber, fontSize: 10, fontWeight: '700', marginTop: 8 },
  messageTime: { color: colors.muted, fontSize: 9, marginLeft: 4, marginTop: 4 },
  messageTimeOutbound: { marginLeft: 0, marginRight: 4, textAlign: 'right' },
  broadcastEntry: { backgroundColor: colors.amberSoft, borderColor: colors.amber, borderWidth: 1, borderRadius: 8, padding: spacing.md, marginBottom: spacing.md, gap: 4 },
  broadcastEntryTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  broadcastEntrySubtitle: { color: colors.soft, fontSize: 12 },
  pressed: { opacity: 0.72 },
});
