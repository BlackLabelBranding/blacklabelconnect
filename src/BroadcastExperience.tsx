import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from './lib/supabase';
import { colors, spacing } from './theme';

type AudienceGroup = { id: string; name: string; description: string | null; contactCount: number; phoneCount: number; eligibleToSend: number };
type AudiencePreview = { groupId: string; contacts: number; withPhone: number; verifiedSmsConsent: number; readyToSend: boolean; notice: string };

type BroadcastDraft = {
  id: string;
  title: string;
  body: string;
  status: string;
  createdAt: string;
  recipientCount: number;
};

export function BroadcastExperience({ onBack }: { onBack: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [drafts, setDrafts] = useState<BroadcastDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [channels, setChannels] = useState<string[]>(['push','inapp']);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [groups, setGroups] = useState<AudienceGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [groupError, setGroupError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!supabase) { setError('Messaging is not configured.'); setLoading(false); return; }
    const { data, error: requestError } = await supabase!.rpc('connect_list_sms_broadcast_drafts');
    if (requestError) setError('Broadcast drafts are unavailable until the shared Hub migration is deployed. ' + requestError.message);
    else setDrafts(Array.isArray(data) ? data as BroadcastDraft[] : []);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    if (!supabase) { setGroupError('Messaging is not configured.'); return; }
    let active = true;
    void supabase.rpc('connect_broadcast_crm_groups').then(({ data, error: requestError }) => {
      if (!active) return;
      if (requestError) setGroupError('CRM group preview requires the Hub audience migration. ' + requestError.message);
      else setGroups(Array.isArray(data) ? data as AudienceGroup[] : []);
    });
    return () => { active = false; };
  }, []);

  const chooseGroup = async (id: string) => {
    if (!supabase) { setGroupError('Messaging is not configured.'); return; }
    setSelectedGroup(id);
    setPreview(null);
    setGroupError(null);
    const { data, error: requestError } = await supabase!.rpc('connect_broadcast_crm_group_preview', { p_group_id: id });
    if (requestError) setGroupError(requestError.message);
    else setPreview(data as AudiencePreview);
  };

  const submitReview = async (id: string) => {
    if (!supabase || submitting || !channels.length) return;
    setSubmitting(id);
    setError(null);
    const { error: requestError } = await supabase!.rpc('connect_submit_broadcast_review', {
      p_broadcast_id: id, p_audience: 'employees', p_channels: channels.filter(channel => channel === 'push' || channel === 'inapp'),
    });
    if (requestError) setError(requestError.message);
    else await refresh();
    setSubmitting(null);
  };

  const toggleChannel = (channel: string) => {
    setChannels(current => current.includes(channel) ? current.filter(item => item !== channel) : [...current, channel]);
  };

  const save = async () => {
    if (!supabase || !title.trim() || !body.trim() || busy) return;
    setBusy(true);
    setSaved(false);
    setError(null);
    const { error: requestError } = await supabase!.rpc('connect_create_sms_broadcast_draft', {
      p_title: title.trim(),
      p_body: body.trim(),
    });
    if (requestError) setError(requestError.message);
    else {
      setTitle('');
      setBody('');
      setSaved(true);
      await refresh();
    }
    setBusy(false);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Pressable onPress={onBack} accessibilityLabel="Back to inbox"><Text style={styles.back}>‹ Back to Inbox</Text></Pressable>
      <Text style={styles.kicker}>BLACK LABEL COMMUNICATIONS</Text>
      <Text style={styles.heading}>Employee Announcements</Text>
      <Text style={styles.description}>Create employee-only announcements for manager approval. Customer messaging belongs in My Black Label; SMS is not enabled in Connect.</Text>
      <View style={styles.panel}>
        <Text style={styles.label}>Campaign name</Text>
        <TextInput accessibilityLabel="Broadcast campaign name" maxLength={160} value={title} onChangeText={setTitle} placeholder="e.g. Upcoming concert" placeholderTextColor={colors.muted} style={styles.input}/>
        <Text style={styles.label}>Announcement message</Text>
        <TextInput accessibilityLabel="Broadcast message" multiline maxLength={1600} value={body} onChangeText={setBody} placeholder="Write your announcement..." placeholderTextColor={colors.muted} style={[styles.input,styles.message]}/>
        <Text style={styles.counter}>{body.length} / 1600 characters</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Save broadcast draft" disabled={busy || !title.trim() || !body.trim()} onPress={() => void save()} style={[styles.button,(busy || !title.trim() || !body.trim()) && styles.disabled]}>
          <Text style={styles.buttonText}>{busy ? 'Saving...' : 'Save draft'}</Text>
        </Pressable>
        {saved ? <Text style={styles.success}>Draft saved to the shared Hub database.</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <Text style={styles.section}>Delivery configuration</Text>
      <Text style={styles.description}>All Connect announcements target employees only. Choose in-app announcements and/or push notifications.</Text>
      <View style={styles.panel}>
        <Text style={styles.label}>Audience</Text>

        <Text style={styles.label}>Channels</Text>
        {(['push','inapp'] as const).map(channel => (
          <Pressable key={channel} accessibilityRole="checkbox" accessibilityState={{checked:channels.includes(channel)}}
            onPress={() => toggleChannel(channel)} style={styles.option}>
            <Text style={styles.draftTitle}>{channels.includes(channel)?'☑':'☐'} {channel==='push'?'App push':channel==='inapp'?'In-app announcement':'SMS text'}</Text>
          </Pressable>
        ))}
        <Text style={styles.description}>Submitting a draft requests approval only. It does not deliver messages.</Text>
      </View>
      <Text style={styles.section}>Your broadcast drafts</Text>
      {loading ? <ActivityIndicator color={colors.amber}/> : drafts.length ? drafts.map(draft => (
        <View key={draft.id} style={styles.draft}>
          <Text style={styles.draftTitle}>{draft.title}</Text>
          <Text style={styles.description}>{draft.body}</Text>
          <Text style={styles.meta}>{draft.status} · {draft.recipientCount} recipients · Delivery follows manager approval and publishing</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={'Submit '+draft.title+' for manager review'} disabled={submitting!==null || !channels.length} onPress={() => void submitReview(draft.id)} style={[styles.button,(submitting!==null || !channels.length) && styles.disabled]}><Text style={styles.buttonText}>{submitting===draft.id?'Submitting...':'Request manager approval'}</Text></Pressable>
        </View>
      )) : <Text style={styles.description}>No saved broadcasts yet.</Text>}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  root: {flex:1}, content:{padding:spacing.md,paddingBottom:spacing.xl,gap:spacing.sm},
  back:{color:colors.amber,fontSize:14,marginBottom:spacing.md},
  kicker:{color:colors.amber,fontSize:10,fontWeight:'800'},
  heading:{color:colors.text,fontSize:28,fontWeight:'800'},
  description:{color:colors.muted,fontSize:13,lineHeight:19},
  panel:{backgroundColor:colors.surface,borderColor:colors.line,borderWidth:1,borderRadius:10,padding:spacing.md,gap:spacing.sm,marginTop:spacing.md},
  label:{color:colors.soft,fontWeight:'700',fontSize:12},
  input:{backgroundColor:colors.surfaceRaised,borderColor:colors.line,borderWidth:1,borderRadius:8,color:colors.text,fontSize:14,padding:spacing.sm,minHeight:44},
  message:{height:132,textAlignVertical:'top'},
  counter:{color:colors.muted,fontSize:11,textAlign:'right'},
  button:{backgroundColor:colors.amber,borderRadius:8,alignItems:'center',padding:spacing.md},
  buttonText:{color:colors.canvas,fontWeight:'800'},
  disabled:{opacity:0.4},
  success:{color:colors.green,fontSize:12},
  error:{color:colors.red,fontSize:12},
  section:{color:colors.soft,fontWeight:'800',fontSize:14,marginTop:spacing.lg},
  draft:{borderColor:colors.line,borderWidth:1,backgroundColor:colors.surface,borderRadius:8,padding:spacing.md,gap:spacing.sm},
  draftTitle:{color:colors.text,fontSize:15,fontWeight:'800'},
  selectedGroup:{borderColor:colors.amber},
  option:{backgroundColor:colors.surfaceRaised,borderColor:colors.line,borderWidth:1,borderRadius:8,padding:spacing.sm},
  meta:{color:colors.amber,fontSize:11},
});
