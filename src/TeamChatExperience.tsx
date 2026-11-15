import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ArrowLeft, Send } from 'lucide-react-native';
import { supabase } from './lib/supabase';
import { colors, spacing } from './theme';

type Peer = { user_id: string; name: string };
type Thread = { id: string; peer_id: string; peer_name: string; last_body: string | null; last_at: string | null };
type Group = { id: string; name: string; created_at: string };
type GroupMessage = { id: string; sender_id: string; sender_name: string; body: string; created_at: string };
type Message = { id: string; sender_id: string; body: string; created_at: string };
async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Messaging is not configured.');
  const { data, error } = await supabase.rpc(name, args ?? {});
  if (error) throw new Error(error.message);
  return data as T;
}
export function TeamChatExperience({ onBack, embedded = false }: { onBack: () => void; embedded?: boolean }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSelected] = useState<Peer | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selfId, setSelfId] = useState('');
  const scroll = useRef<ScrollView>(null);
  const load = useCallback(async () => {
    try {
      const [directory, list, groupList] = await Promise.all([
        rpc<Peer[]>('connect_messageable_employees'),
        rpc<Thread[]>('connect_my_direct_threads'),
        rpc<Group[]>('connect_my_groups'),
      ]);
      setPeers(directory); setThreads(list); setGroups(groupList); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load team chat.'); }
  }, []);
  useEffect(() => {
    void load();
    void supabase?.auth.getUser().then(({ data }) => setSelfId(data.user?.id ?? ''));
    const timer = setInterval(() => void load(), 15000);
    return () => clearInterval(timer);
  }, [load]);
  const query = search.trim().toLocaleLowerCase();
  const visibleGroups = groups.filter(g => g.name.toLocaleLowerCase().includes(query));
  const visibleThreads = threads.filter(t => `${t.peer_name} ${t.last_body ?? ''}`.toLocaleLowerCase().includes(query));
  const recentIds = new Set(threads.map(t => t.peer_id));
  const visiblePeers = peers.filter(p => !recentIds.has(p.user_id) && p.name.toLocaleLowerCase().includes(query));
  const activeThread = threads.find(t => t.peer_id === selected?.user_id);
  const loadMessages = useCallback(async () => {
    if (!activeThread) { setMessages([]); return; }
    try { setMessages(await rpc<Message[]>('connect_my_direct_messages', { p_thread: activeThread.id, p_limit: 100 })); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load messages.'); }
  }, [activeThread?.id]);
  useEffect(() => {
    void loadMessages();
    if (!selected) return;
    const timer = setInterval(() => void loadMessages(), 5000);
    return () => clearInterval(timer);
  }, [loadMessages, selected?.user_id]);
  const loadGroupMessages = useCallback(async () => {
    if (!selectedGroup) return;
    try { setGroupMessages(await rpc<GroupMessage[]>('connect_group_messages', { p_thread: selectedGroup.id, p_limit: 100 })); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load group messages.'); }
  }, [selectedGroup?.id]);
  useEffect(() => {
    void loadGroupMessages();
    if (!selectedGroup) return;
    const timer = setInterval(() => void loadGroupMessages(), 5000);
    return () => clearInterval(timer);
  }, [loadGroupMessages]);
  const sendGroup = async () => {
    if (!selectedGroup || !draft.trim() || busy) return;
    setBusy(true); setError('');
    try { await rpc<string>('connect_send_group_message', { p_thread: selectedGroup.id, p_body: draft.trim() }); setDraft(''); await loadGroupMessages(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Group message could not be sent.'); }
    finally { setBusy(false); }
  };
  const send = async () => {
    if (!selected || !draft.trim() || busy) return;
    setBusy(true); setError('');
    try {
      await rpc<string>('connect_send_direct_message', { p_recipient: selected.user_id, p_body: draft.trim() });
      setDraft('');
      await load();
      // First message creates the thread. Refreshing the thread list makes it available.
    } catch (e) { setError(e instanceof Error ? e.message : 'Message could not be sent.'); }
    finally { setBusy(false); }
  };
  return <View style={styles.root}>
    {(!embedded || selected || selectedGroup) ? <View style={styles.header}>
      <Pressable onPress={selectedGroup ? () => { setSelectedGroup(null); setDraft(''); } : selected ? () => setSelected(null) : onBack} accessibilityLabel="Back"><ArrowLeft color={colors.text} size={22}/></Pressable>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.title}>{selectedGroup ? selectedGroup.name : selected ? selected.name : 'Team messages'}</Text>
        <Text style={styles.channel}>INTERNAL ONLY · NOT SMS</Text>
      </View>
    </View> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {selectedGroup ? <>
      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={styles.messages} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
        {groupMessages.length ? groupMessages.map(m => <View key={m.id} style={[styles.bubble, m.sender_id === selfId && styles.mine]}>
          <Text style={styles.muted}>{m.sender_name}</Text><Text style={styles.body}>{m.body}</Text>
          <Text style={styles.time}>{new Date(m.created_at).toLocaleString()}</Text>
        </View>) : <Text style={styles.muted}>No messages in this group yet.</Text>}
      </ScrollView>
      <View style={styles.composer}>
        <TextInput multiline maxLength={4000} placeholder="Message group…" placeholderTextColor={colors.muted} style={styles.input} value={draft} onChangeText={setDraft}/>
        <Pressable onPress={() => void sendGroup()} disabled={busy || !draft.trim()} accessibilityLabel="Send group message">
          {busy ? <ActivityIndicator color={colors.amber}/> : <Send color={draft.trim() ? colors.amber : colors.muted} size={23}/>}
        </Pressable>
      </View>
    </> : selected ? <>
      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={styles.messages} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
        {messages.length ? messages.map(m => <View key={m.id} style={[styles.bubble, m.sender_id === selfId && styles.mine]}>
          <Text style={styles.body}>{m.body}</Text>
          <Text style={styles.time}>{new Date(m.created_at).toLocaleString()}</Text>
        </View>) : <Text style={styles.muted}>Start a private conversation with {selected.name}.</Text>}
      </ScrollView>
      <View style={styles.composer}>
        <TextInput multiline maxLength={4000} placeholder="Message your teammate…" placeholderTextColor={colors.muted} style={styles.input} value={draft} onChangeText={setDraft}/>
        <Pressable onPress={() => void send()} disabled={busy || !draft.trim()} accessibilityLabel="Send internal message">
          {busy ? <ActivityIndicator color={colors.amber}/> : <Send color={draft.trim() ? colors.amber : colors.muted} size={23}/>}
        </Pressable>
      </View>
    </> : <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
      <TextInput accessibilityLabel="Search team conversations" placeholder="Search people, groups, messages…" placeholderTextColor={colors.muted} value={search} onChangeText={setSearch} autoCapitalize="none" style={styles.searchInput}/>
      {visibleThreads.length > 0 ? <Text style={styles.section}>RECENT CONVERSATIONS</Text> : null}
      {visibleThreads.map(t => <Pressable key={t.id} accessibilityRole="button" accessibilityLabel={`Open conversation with ${t.peer_name}`} style={styles.conversationRow} onPress={() => {setSelectedGroup(null);setSelected({ user_id: t.peer_id, name: t.peer_name });setDraft('');}}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{t.peer_name.trim().split(/\s+/).slice(0,2).map(part => part[0]).join('').toUpperCase()}</Text></View>
        <View style={styles.rowMain}><View style={styles.rowTop}><Text numberOfLines={1} style={styles.name}>{t.peer_name}</Text><Text style={styles.previewTime}>{t.last_at ? new Date(t.last_at).toLocaleDateString(undefined,{month:'short',day:'numeric'}) : ''}</Text></View><Text numberOfLines={1} style={styles.preview}>{t.last_body || 'Start a conversation'}</Text></View>
      </Pressable>)}
      {visibleGroups.length > 0 ? <Text style={styles.section}>TEAM GROUPS</Text> : null}
      {visibleGroups.map(g => <Pressable key={g.id} accessibilityRole="button" accessibilityLabel={`Open group ${g.name}`} style={styles.conversationRow} onPress={() => { setSelected(null); setSelectedGroup(g); setDraft(''); }}>
        <View style={[styles.avatar,styles.groupAvatar]}><Text style={styles.avatarText}>#</Text></View><View style={styles.rowMain}><Text numberOfLines={1} style={styles.name}>{g.name}</Text><Text style={styles.preview}>Managed by Hub</Text></View>
      </Pressable>)}
      {visiblePeers.length > 0 ? <Text style={styles.section}>START A CONVERSATION</Text> : null}
      {visiblePeers.map(p => <Pressable key={p.user_id} accessibilityRole="button" accessibilityLabel={`Message ${p.name}`} style={styles.conversationRow} onPress={() => {setSelectedGroup(null);setSelected(p);setDraft('');}}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{p.name.trim().split(/\s+/).slice(0,2).map(part => part[0]).join('').toUpperCase()}</Text></View><View style={styles.rowMain}><Text numberOfLines={1} style={styles.name}>{p.name}</Text><Text style={styles.preview}>Send a message</Text></View>
      </Pressable>)}
      {!visibleGroups.length && !visibleThreads.length && !visiblePeers.length ? <View style={styles.empty}><Text style={styles.emptyTitle}>{query ? 'No matches found' : 'No conversations yet'}</Text><Text style={styles.muted}>{query ? 'Try another name or message keyword.' : 'Your Hub groups and available teammates will appear here.'}</Text></View> : null}
    </ScrollView>}
  </View>;
}
const styles = StyleSheet.create({
 root:{flex:1,minWidth:0,width:'100%'},header:{flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.md,borderBottomWidth:1,borderBottomColor:colors.line},
 title:{color:colors.text,fontWeight:'700',fontSize:18},channel:{color:colors.amber,fontSize:10,fontWeight:'800'},
 error:{color:'#ef7777',padding:spacing.md},list:{padding:spacing.md,paddingBottom:spacing.xl},
 section:{color:colors.amber,fontSize:11,fontWeight:'800',marginTop:spacing.lg,marginBottom:spacing.sm},
 searchInput:{borderColor:colors.line,borderWidth:1,backgroundColor:colors.surface,borderRadius:14,minHeight:48,paddingHorizontal:spacing.md,color:colors.text,fontSize:15,marginBottom:spacing.sm},
 conversationRow:{flexDirection:'row',alignItems:'center',gap:12,minHeight:75,paddingVertical:12,borderBottomWidth:1,borderBottomColor:colors.line},
 avatar:{width:48,height:48,borderRadius:24,backgroundColor:colors.surfaceRaised,alignItems:'center',justifyContent:'center'},
 groupAvatar:{backgroundColor:'#302817'},avatarText:{color:colors.amber,fontSize:16,fontWeight:'800'},
 rowMain:{flex:1,minWidth:0,gap:5},rowTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},
 preview:{color:colors.muted,fontSize:13},previewTime:{color:colors.muted,fontSize:11},
 empty:{paddingVertical:40,alignItems:'center',gap:8},emptyTitle:{color:colors.text,fontWeight:'700',fontSize:16},
 row:{padding:spacing.md,borderBottomWidth:1,borderBottomColor:colors.line,gap:4},
 name:{color:colors.text,fontWeight:'700',fontSize:15},muted:{color:colors.muted,fontSize:12},
 messages:{padding:spacing.md,gap:spacing.sm},bubble:{maxWidth:'83%',alignSelf:'flex-start',backgroundColor:colors.surface,borderRadius:16,padding:spacing.md},
 mine:{alignSelf:'flex-end',backgroundColor:colors.surfaceRaised},body:{color:colors.text,fontSize:15},time:{color:colors.muted,fontSize:10,marginTop:6},
 composer:{flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.md,borderTopWidth:1,borderTopColor:colors.line},
 input:{flex:1,minHeight:42,maxHeight:110,color:colors.text,fontSize:15}
});
