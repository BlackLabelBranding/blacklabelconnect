import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  RefreshControl,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ArrowLeft,
  Ellipsis,
  SquarePen,
  Phone,
  Search,
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
import { TeamChatExperience, rpc, type Peer, type Group, type Thread } from './TeamChatExperience';
import { supabase } from './lib/supabase';

type CrmContact = { id: number; full_name: string | null; company_name: string | null; email: string | null; phone: string | null; avatar_url: string | null };
type ChatRow = { key: string; name: string; preview: string; at: string | null; unread: number | null; kind: 'direct' | 'group' | 'external'; photo?: string | null; peer?: Peer; group?: Group; external?: EmployeeInboxConversation };
function Avatar({ row }: { row: ChatRow }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [row.photo]);
  const initials = row.name.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  return <View style={[styles.chatAvatar, row.kind === 'group' && { backgroundColor: '#302817' }, row.kind === 'external' && { backgroundColor: '#253746' }]}>
    {row.photo && !failed ? <Image source={{uri:row.photo}} onError={() => setFailed(true)} style={styles.chatPhoto}/> : row.kind === 'group' ? <UsersRound color={colors.amber} size={24}/> : <Text style={[styles.avatarInitials,row.kind === 'external' && {color:'#99c9ed'}]}>{initials}</Text>}
  </View>;
}
function chatTime(at: string | null) {
  if (!at) return '';
  const date = new Date(at), now = new Date();
  if (!Number.isFinite(date.getTime())) return '';
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
  const yesterday = new Date(now); yesterday.setDate(now.getDate()-1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return formatInboxTimestamp(at);
}
function ChatItem({row,onPress}:{row:ChatRow;onPress:()=>void}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={'Open '+row.name} onPress={onPress} style={({pressed})=>[styles.chatRow,pressed&&styles.pressed]}>
    <Avatar row={row}/>
    <View style={styles.chatCopy}>
      <View style={styles.rowTitleLine}><Text numberOfLines={1} style={styles.chatName}>{row.name}</Text><Text style={[styles.rowTime,!!row.unread&&{color:colors.amber}]}>{chatTime(row.at)}</Text></View>
      <View style={styles.chatPreviewLine}>{row.kind==='external'?<Smartphone size={13} color="#99c9ed"/>:null}<Text numberOfLines={1} style={styles.chatPreview}>{row.preview}</Text>{!!row.unread&&<View style={styles.unreadBadge}><Text style={styles.unreadText}>{row.unread>99?'99+':row.unread}</Text></View>}</View>
    </View>
  </Pressable>;
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
  const [inbox,setInbox]=useState<EmployeeInbox|null>(null);
  const [peers,setPeers]=useState<Peer[]>([]);
  const [threads,setThreads]=useState<Thread[]>([]);
  const [groups,setGroups]=useState<Group[]>([]);
  const [groupLatest,setGroupLatest]=useState<Record<string,{body:string;created_at:string;sender_name:string}>>({});
  const [photos,setPhotos]=useState<Record<string,string>>({});
  const [selected,setSelected]=useState<ChatRow|null>(null);
  const [filter,setFilter]=useState<'All'|'Internal'|'External'|'Unread'>('All');
  const [search,setSearch]=useState('');
  const [compose,setCompose]=useState(false);
  const [composeMode,setComposeMode]=useState<'Internal'|'External'>('Internal');
  const [crm,setCrm]=useState<CrmContact[]>([]);
  const [crmBusy,setCrmBusy]=useState(false);
  const [crmError,setCrmError]=useState('');
  const [crmPage,setCrmPage]=useState(0);
  const [crmMore,setCrmMore]=useState(false);
  const [contact,setContact]=useState<CrmContact|null>(null);
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    if(!compose||composeMode!=='External'||!supabase)return;
    const client=supabase;
    let active=true;
    setCrmBusy(true);setCrmError('');
    if(crmPage===0)setCrm([]);
    const timer=setTimeout(()=>{void (async()=>{
      try{
        const term=search.trim().replace(/[^\p{L}\p{N}\s@.+_-]/gu,' ').trim().slice(0,100);
        let q=client.from('contacts').select('id,full_name,company_name,email,phone,avatar_url').order('full_name',{ascending:true,nullsFirst:false}).order('id').range(crmPage*50,crmPage*50+49);
        if(term){const pattern='%'+term+'%';q=q.or(['full_name','company_name','email','phone'].map(field=>field+'.ilike.'+pattern).join(','));}
        const {data,error}=await q;
        if(!active)return;
        if(error)throw error;
        const result=(data??[]) as CrmContact[];
        setCrm(previous=>crmPage===0?result:[...previous,...result.filter(c=>!previous.some(p=>p.id===c.id))]);
        setCrmMore(result.length===50);
      }catch{if(active){setCrmError('Unable to load CRM contacts. Check your access and try again.');setCrmMore(false);}}
      finally{if(active)setCrmBusy(false);}
    })();},250);
    return()=>{active=false;clearTimeout(timer);};
  },[compose,composeMode,search,crmPage,retry]);
  const dial=(target:CrmContact)=>{
    const raw=target.phone?.trim()??'';
    const digits=raw.replace(/[^0-9]/g,'');
    if(!digits)return;
    const number=(raw.startsWith('+')?'+':'')+digits;
    setCrmError('');
    void Linking.openURL('tel:'+number).catch(()=>setCrmError('Unable to open your device calling app. You can copy the phone number from the contact details.'));
  };
  const [showTools,setShowTools]=useState(false);
  const [tool,setTool]=useState<'announcements'|'approvals'|'broadcasts'|null>(null);
  const [errors,setErrors]=useState<string[]>([]);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const inFlight=useRef(false);
  const load=useCallback(async(refresh=false)=>{
    if(inFlight.current)return;
    inFlight.current=true;
    if(refresh)setRefreshing(true);
    try {
      const [external,directory,direct,groupList]=await Promise.allSettled([fetchEmployeeInbox(),rpc<Peer[]>('connect_messageable_employees'),rpc<Thread[]>('connect_my_direct_threads'),rpc<Group[]>('connect_my_groups')]);
      const failures:string[]=[];
      if(external.status==='fulfilled')setInbox(external.value);else failures.push('External messages unavailable.');
      if(directory.status==='fulfilled')setPeers(directory.value);else failures.push('Team directory unavailable.');
      if(direct.status==='fulfilled')setThreads(direct.value);else failures.push('Direct messages unavailable.');
      if(groupList.status==='fulfilled'){
        setGroups(groupList.value);
        const latest=await Promise.allSettled(groupList.value.map(async g=>({id:g.id,messages:await rpc<Array<{body:string;created_at:string;sender_name:string}>>('connect_group_messages',{p_thread:g.id,p_limit:1})})));
        setGroupLatest(previous=>{const next={...previous};for(const result of latest){if(result.status==='fulfilled'){const m=result.value.messages[0];if(m)next[result.value.id]=m;else delete next[result.value.id];}}return next;});
      }else failures.push('Groups unavailable.');
      const ids=Array.from(new Set([...(directory.status==='fulfilled'?directory.value.map(p=>p.user_id):[]),...(direct.status==='fulfilled'?direct.value.map(t=>t.peer_id):[])]));
      if(supabase&&ids.length){
        const {data}=await supabase.from('team_members').select('user_id,avatar_url').in('user_id',ids);
        if(data)setPhotos(Object.fromEntries(data.filter(p=>p.user_id&&p.avatar_url).map(p=>[p.user_id,p.avatar_url])));
      }
      setErrors(failures);
    }catch{setErrors(['Unable to refresh messages. Pull down to retry.']);}
    finally{inFlight.current=false;setLoading(false);setRefreshing(false);}
  },[]);
  useEffect(()=>{void load();const timer=setInterval(()=>void load(),15000);return()=>clearInterval(timer);},[load]);
  const back=()=>{setSelected(null);setCompose(false);void load();};
  if(tool==='approvals')return <ManagerBroadcastExperience onBack={()=>setTool(null)}/>;
  if(tool==='announcements')return <AnnouncementExperience onBack={()=>setTool(null)}/>;
  if(tool==='broadcasts')return <BroadcastExperience onBack={()=>setTool(null)}/>;
  if(contact){
    const name=contact.full_name||contact.company_name||'CRM contact';
    const row:ChatRow={key:'crm:'+contact.id,name,preview:contact.company_name??'',at:null,unread:null,kind:'external',photo:contact.avatar_url};
    return <View style={styles.container}><View style={styles.nativeHeader}><Pressable accessibilityLabel="Back to contacts" style={styles.circleAction} onPress={()=>{setContact(null);setCrmError('');}}><ArrowLeft color={colors.text} size={23}/></Pressable><Avatar row={row}/><Text style={styles.nativeTitle}>{name}</Text>{!!contact.company_name&&<Text style={styles.chatPreview}>{contact.company_name}</Text>}
    {contact.phone?<Text selectable style={styles.chatName} onPress={()=>dial(contact)}>{contact.phone}</Text>:<Text style={styles.loadNotice}>No phone number on file.</Text>}
    {contact.email?<Text selectable style={styles.chatPreview}>{contact.email}</Text>:null}
    {!!contact.phone&&<Pressable accessibilityLabel="Call contact" style={styles.filterPill} onPress={()=>dial(contact)}><Text style={styles.filterLabel}>Call</Text></Pressable>}
    {crmError?<Text style={styles.loadNotice}>{crmError}</Text>:null}
    <Text style={styles.loadNotice}>External business SMS sending is not enabled yet.</Text></View></View>;
  }
  if(selected?.external)return <ThreadExperience conversation={selected.external} onBack={back}/>;
  if(selected)return <TeamChatExperience key={selected.key} initialPeer={selected.peer} initialGroup={selected.group} onBack={back}/>;
  const rows:ChatRow[]=[
    ...threads.map(t=>({key:'direct:'+t.id,name:t.peer_name,preview:t.last_body||'No messages yet',at:t.last_at,unread:null,kind:'direct' as const,photo:photos[t.peer_id],peer:{user_id:t.peer_id,name:t.peer_name}})),
    ...groups.map(g=>({key:'group:'+g.id,name:g.name,preview:groupLatest[g.id]?groupLatest[g.id].sender_name+': '+groupLatest[g.id].body:'No messages yet',at:groupLatest[g.id]?.created_at??null,unread:null,kind:'group' as const,group:g})),
    ...(inbox?.conversations??[]).map(c=>({key:'external:'+c.id,name:titleForConversation(c),preview:c.latestMessage?.body.trim()||'No messages yet',at:c.lastMessageAt??c.latestMessage?.createdAt??null,unread:c.unreadCount,kind:'external' as const,external:c}))
  ];
  const query=search.trim().toLowerCase();
  const matches=(r:ChatRow)=>!query||(r.name+' '+r.preview).toLowerCase().includes(query);
  const visible=rows.filter(r=>matches(r)&&(filter==='All'||(filter==='Internal'&&r.kind!=='external')||(filter==='External'&&r.kind==='external')||(filter==='Unread'&&!!r.unread))).sort((a,b)=>(Date.parse(b.at??'')||0)-(Date.parse(a.at??'')||0));
  const directory:ChatRow[]=peers.map(p=>({key:'peer:'+p.user_id,name:p.name,preview:'Internal message',at:null,unread:null,kind:'direct',photo:photos[p.user_id],peer:p}));
  return <View style={styles.container}>
    <View style={styles.nativeHeader}>
      <View style={styles.nativeActions}>
        <Pressable accessibilityLabel={compose?'Back to messages':'Messaging tools'} style={styles.circleAction} onPress={()=>compose?(setCompose(false),setSearch('')):setShowTools(v=>!v)}>{compose?<ArrowLeft color={colors.text} size={23}/>:<Ellipsis color={colors.text} size={24}/>}</Pressable>
        {!compose&&<Pressable accessibilityLabel="New message" style={styles.composeAction} onPress={()=>{setCompose(true);setComposeMode('Internal');setCrmPage(0);setSearch('');setShowTools(false);}}><SquarePen color="#090909" size={22}/></Pressable>}
      </View>
      <Text style={styles.nativeTitle}>{compose?'New message':'Messages'}</Text>
      {compose&&<View style={styles.nativeFilters}>{(['Internal','External'] as const).map(label=><Pressable key={label} accessibilityRole="tab" accessibilityState={{selected:composeMode===label}} style={[styles.filterPill,{flex:1,alignItems:'center'},composeMode===label&&styles.filterActive]} onPress={()=>{setComposeMode(label);setSearch('');setCrmPage(0);setCrmError('');}}><Text style={[styles.filterLabel,composeMode===label&&{color:'#090909'}]}>{label}</Text></Pressable>)}</View>}
      <View style={styles.nativeSearch}><Search color={colors.muted} size={19}/><TextInput accessibilityLabel={compose?'Search contacts':'Search messages'} value={search} onChangeText={value=>{setSearch(value);setCrmPage(0);}} autoCapitalize="none" placeholder={compose?(composeMode==='External'?'Search CRM contacts':'Search team members'):'Search messages'} placeholderTextColor={colors.muted} style={styles.nativeSearchInput}/></View>
      {!compose&&<View style={styles.nativeFilters}>{(['All','Internal','External','Unread'] as const).map(label=><Pressable key={label} accessibilityRole="tab" accessibilityState={{selected:filter===label}} style={[styles.filterPill,filter===label&&styles.filterActive]} onPress={()=>setFilter(label)}><Text style={[styles.filterLabel,filter===label&&{color:'#090909'}]}>{label}</Text></Pressable>)}</View>}
      {showTools&&!compose&&<View style={styles.menu}>{([['announcements','Announcements'],['approvals','Manager approvals'],['broadcasts','Employee broadcasts']] as const).map(([id,label])=><Pressable key={id} style={styles.menuItem} onPress={()=>{setShowTools(false);setTool(id);}}><Text style={styles.chatName}>{label}</Text></Pressable>)}</View>}
    </View>
    <ScrollView style={{flex:1}} contentContainerStyle={styles.nativeList} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>void load(true)} tintColor={colors.amber}/>}>
      {errors.map(e=><Text key={e} style={styles.loadNotice}>{e}</Text>)}
      {loading?<ActivityIndicator color={colors.amber} style={{marginTop:24}}/>:compose&&composeMode==='External'?<><Text style={styles.loadNotice}>CRM CONTACTS</Text>{crm.map(c=>{const row:ChatRow={key:'crm:'+c.id,name:c.full_name||c.company_name||'CRM contact',preview:[c.company_name,c.phone,c.email].filter(Boolean).join(' · '),at:null,unread:null,kind:'external',photo:c.avatar_url};return <View key={row.key} style={{flexDirection:'row',alignItems:'center'}}><View style={{flex:1,minWidth:0}}><ChatItem row={row} onPress={()=>setContact(c)}/></View>{c.phone?<Pressable accessibilityLabel={'Call '+row.name} style={styles.circleAction} onPress={()=>dial(c)}><Phone color={colors.amber} size={19}/></Pressable>:null}</View>;})}{crmBusy?<ActivityIndicator color={colors.amber}/>:null}{crmError?<><Text style={styles.loadNotice}>{crmError}</Text><Pressable onPress={()=>{setCrmPage(0);setRetry(r=>r+1);}}><Text style={styles.filterLabel}>Try again</Text></Pressable></>:null}{!crmBusy&&!crmError&&!crm.length?<Text style={styles.loadNotice}>No accessible CRM contacts match your search.</Text>:null}{crmMore&&!crmBusy?<Pressable style={styles.filterPill} onPress={()=>setCrmPage(p=>p+1)}><Text style={styles.filterLabel}>Load more contacts</Text></Pressable>:null}</>:compose?<>{directory.filter(matches).map(r=><ChatItem key={r.key} row={r} onPress={()=>setSelected(r)}/>)}{!directory.filter(matches).length&&<Text style={styles.loadNotice}>No matching teammates.</Text>}<Text style={styles.loadNotice}>Select External to search CRM contacts.</Text></>:<>{visible.map(r=><ChatItem key={r.key} row={r} onPress={()=>setSelected(r)}/>)}{!visible.length&&<Text style={styles.loadNotice}>{query?'No matching conversations.':'No conversations here yet.'}</Text>}{filter==='Unread'&&<Text style={styles.loadNotice}>Unread counts are currently available for external SMS only.</Text>}</>}
    </ScrollView>
    
  </View>;
}

const styles = StyleSheet.create({
  nativeHeader:{paddingHorizontal:16,paddingTop:8,paddingBottom:8,gap:12},
  nativeActions:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  circleAction:{width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center',backgroundColor:'#222222'},
  composeAction:{width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center',backgroundColor:colors.amber},
  nativeTitle:{color:colors.text,fontSize:34,fontWeight:'800'},
  nativeSearch:{flexDirection:'row',alignItems:'center',gap:9,backgroundColor:'#222222',borderRadius:14,paddingHorizontal:12,minHeight:44},
  nativeSearchInput:{flex:1,color:colors.text,fontSize:16,minHeight:44},
  nativeFilters:{flexDirection:'row',gap:7,flexWrap:'wrap'},
  filterPill:{backgroundColor:'#222222',borderRadius:20,paddingHorizontal:14,paddingVertical:9},
  filterActive:{backgroundColor:colors.amber},
  filterLabel:{color:colors.text,fontSize:13,fontWeight:'600'},
  nativeList:{paddingHorizontal:16,paddingBottom:24},
  chatRow:{flexDirection:'row',alignItems:'center',gap:12,minHeight:72},
  chatAvatar:{width:50,height:50,borderRadius:25,backgroundColor:'#242424',alignItems:'center',justifyContent:'center',overflow:'hidden'},
  chatPhoto:{width:50,height:50,borderRadius:25},
  avatarInitials:{color:colors.amber,fontWeight:'700',fontSize:17},
  chatCopy:{flex:1,minWidth:0,minHeight:72,justifyContent:'center',gap:5,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'#292929'},
  chatName:{flexShrink:1,color:colors.text,fontSize:16,fontWeight:'700'},
  chatPreviewLine:{flexDirection:'row',gap:5,alignItems:'center'},
  chatPreview:{flex:1,color:colors.muted,fontSize:14},
  menu:{backgroundColor:'#222222',borderRadius:12,paddingHorizontal:14},
  menuItem:{paddingVertical:12},
  loadNotice:{color:colors.muted,fontSize:13,paddingVertical:14},

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
