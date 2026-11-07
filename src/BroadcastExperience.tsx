import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from './lib/supabase';
import { colors, spacing } from './theme';

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

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: requestError } = await supabase.rpc('connect_list_sms_broadcast_drafts');
    if (requestError) setError('Broadcast drafts are unavailable until the shared Hub migration is deployed. ' + requestError.message);
    else setDrafts(Array.isArray(data) ? data as BroadcastDraft[] : []);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const save = async () => {
    if (!title.trim() || !body.trim() || busy) return;
    setBusy(true);
    setSaved(false);
    setError(null);
    const { error: requestError } = await supabase.rpc('connect_create_sms_broadcast_draft', {
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
      <Text style={styles.heading}>SMS Broadcasts</Text>
      <Text style={styles.description}>Create shared Hub/Connect campaign drafts. Sending is locked until consent, STOP suppression and delivery permissions are verified.</Text>
      <View style={styles.panel}>
        <Text style={styles.label}>Campaign name</Text>
        <TextInput accessibilityLabel="Broadcast campaign name" maxLength={160} value={title} onChangeText={setTitle} placeholder="e.g. Upcoming concert" placeholderTextColor={colors.muted} style={styles.input}/>
        <Text style={styles.label}>SMS message</Text>
        <TextInput accessibilityLabel="Broadcast message" multiline maxLength={1600} value={body} onChangeText={setBody} placeholder="Write your announcement..." placeholderTextColor={colors.muted} style={[styles.input,styles.message]}/>
        <Text style={styles.counter}>{body.length} / 1600 characters</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Save broadcast draft" disabled={busy || !title.trim() || !body.trim()} onPress={() => void save()} style={[styles.button,(busy || !title.trim() || !body.trim()) && styles.disabled]}>
          <Text style={styles.buttonText}>{busy ? 'Saving...' : 'Save draft'}</Text>
        </Pressable>
        {saved ? <Text style={styles.success}>Draft saved to the shared Hub database.</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <Text style={styles.section}>Your broadcast drafts</Text>
      {loading ? <ActivityIndicator color={colors.amber}/> : drafts.length ? drafts.map(draft => (
        <View key={draft.id} style={styles.draft}>
          <Text style={styles.draftTitle}>{draft.title}</Text>
          <Text style={styles.description}>{draft.body}</Text>
          <Text style={styles.meta}>Draft · {draft.recipientCount} recipients · Sending disabled</Text>
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
  meta:{color:colors.amber,fontSize:11},
});
