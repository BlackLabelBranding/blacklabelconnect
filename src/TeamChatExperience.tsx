import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ArrowLeft, Send } from 'lucide-react-native';
import { supabase } from './lib/supabase';
import { colors, spacing } from './theme';

type Peer = { user_id: string; name: string };
type Thread = { id: string; peer_id: string; peer_name: string; last_body: string | null; last_at: string | null };
type Message = { id: string; sender_id: string; body: string; created_at: string };
async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Messaging is not configured.');
  const { data, error } = await supabase.rpc(name, args ?? {});
  if (error) throw new Error(error.message);
  return data as T;
}
export function TeamChatExperience({ onBack }: { onBack: () => void }) {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSelected] = useState<Peer | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selfId, setSelfId] = useState('');
  const scroll = useRef<ScrollView>(null);
  const load = useCallback(async () => {
    try {
      const [directory, list] = await Promise.all([
        rpc<Peer[]>('connect_messageable_employees'),
        rpc<Thread[]>('connect_my_direct_threads'),
      ]);
      setPeers(directory); setThreads(list); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load team chat.'); }
  }, []);
  useEffect(() => {
    void load();
    void supabase?.auth.getUser().then(({ data }) => setSelfId(data.user?.id ?? ''));
    const timer = setInterval(() => void load(), 15000);
    return () => clearInterval(timer);
  }, [load]);
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
    <View style={styles.header}>
      <Pressable onPress={selected ? () => setSelected(null) : onBack} accessibilityLabel="Back"><ArrowLeft color={colors.text} size={22}/></Pressable>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.title}>{selected ? selected.name : 'Team messages'}</Text>
        <Text style={styles.channel}>INTERNAL ONLY · NOT SMS</Text>
      </View>
    </View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {selected ? <>
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
    </> : <ScrollView contentContainerStyle={styles.list}>
      <Text style={styles.section}>RECENT TEAM CONVERSATIONS</Text>
      {threads.map(t => <Pressable key={t.id} style={styles.row} onPress={() => setSelected({ user_id: t.peer_id, name: t.peer_name })}>
        <Text style={styles.name}>{t.peer_name}</Text><Text numberOfLines={1} style={styles.muted}>{t.last_body || 'No messages yet'}</Text>
      </Pressable>)}
      <Text style={styles.section}>START A CONVERSATION</Text>
      {peers.map(p => <Pressable key={p.user_id} style={styles.row} onPress={() => setSelected(p)}>
        <Text style={styles.name}>{p.name}</Text><Text style={styles.muted}>Internal team chat</Text>
      </Pressable>)}
    </ScrollView>}
  </View>;
}
const styles = StyleSheet.create({
 root:{flex:1,minWidth:0,width:'100%'},header:{flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.md,borderBottomWidth:1,borderBottomColor:colors.border},
 title:{color:colors.text,fontWeight:'700',fontSize:18},channel:{color:colors.amber,fontSize:10,fontWeight:'800'},
 error:{color:'#ef7777',padding:spacing.md},list:{padding:spacing.md,paddingBottom:spacing.xl},
 section:{color:colors.amber,fontSize:11,fontWeight:'800',marginTop:spacing.lg,marginBottom:spacing.sm},
 row:{padding:spacing.md,borderBottomWidth:1,borderBottomColor:colors.border,gap:4},
 name:{color:colors.text,fontWeight:'700',fontSize:15},muted:{color:colors.muted,fontSize:12},
 messages:{padding:spacing.md,gap:spacing.sm},bubble:{maxWidth:'83%',alignSelf:'flex-start',backgroundColor:colors.surface,borderRadius:16,padding:spacing.md},
 mine:{alignSelf:'flex-end',backgroundColor:colors.card},body:{color:colors.text,fontSize:15},time:{color:colors.muted,fontSize:10,marginTop:6},
 composer:{flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.md,borderTopWidth:1,borderTopColor:colors.border},
 input:{flex:1,minHeight:42,maxHeight:110,color:colors.text,fontSize:15}
});
