import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from './lib/supabase';
import { colors, spacing } from './theme';

type ReviewItem = { id: string; title: string; body: string; audience: string; channels: string[]; approvalStatus: string; publishedAt: string | null; createdAt: string };
export function ManagerBroadcastExperience({ onBack }: { onBack: () => void }) {
 const [items,setItems]=useState<ReviewItem[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState<string | null>(null);
 const [error,setError]=useState<string | null>(null);
 const [notice,setNotice]=useState<string | null>(null);
 const refresh=useCallback(async()=>{
  setLoading(true);setError(null);
  const {data,error:failure}=await supabase.rpc('connect_manager_broadcast_queue');
  if(failure)setError(failure.message);
  else setItems(Array.isArray(data)?data as ReviewItem[]:[]);
  setLoading(false);
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 const act=async(item:ReviewItem,action:'approve'|'reject'|'publish')=>{
  if(busy)return;
  setBusy(item.id);setError(null);setNotice(null);
  const result=action==='publish'
   ? await supabase.rpc('connect_publish_approved_broadcast',{p_broadcast_id:item.id})
   : await supabase.rpc('connect_review_broadcast',{p_broadcast_id:item.id,p_approve:action==='approve',p_note:null});
  if(result.error)setError(result.error.message);
  else {setNotice(action==='publish'?'Announcement published to the employee in-app queue. External push delivery is not enabled.':action==='approve'?'Broadcast approved. Publishing is a separate action.':'Broadcast rejected.');await refresh();}
  setBusy(null);
 };
 return <ScrollView style={styles.root} contentContainerStyle={styles.content}>
  <Pressable accessibilityRole="button" onPress={onBack}><Text style={styles.link}>‹ Back to inbox</Text></Pressable>
  <Text style={styles.heading}>Manager broadcast approvals</Text>
  <Text style={styles.sub}>Internal employee broadcasts only. Publishing creates in-app announcements and queues push jobs; it does not send SMS.</Text>
  <Pressable accessibilityRole="button" onPress={()=>void refresh()}><Text style={styles.link}>Refresh queue</Text></Pressable>
  {notice?<Text style={styles.success}>{notice}</Text>:null}
  {loading?<ActivityIndicator color={colors.amber}/>:error?<Text style={styles.error}>{error}</Text>:items.length===0?<Text style={styles.sub}>No employee broadcasts awaiting action.</Text>:items.map(item=><View key={item.id} style={styles.card}>
   <Text style={styles.title}>{item.title}</Text><Text style={styles.sub}>{item.body}</Text>
   <Text style={styles.meta}>{item.approvalStatus} · {item.channels.join(', ')}{item.publishedAt?' · Published':''}</Text>
   {item.approvalStatus==='pending_review'?<View style={styles.actions}>
    <Pressable accessibilityRole="button" disabled={busy!==null} onPress={()=>void act(item,'approve')} style={styles.button}><Text style={styles.buttonText}>Approve</Text></Pressable>
    <Pressable accessibilityRole="button" disabled={busy!==null} onPress={()=>void act(item,'reject')} style={styles.button}><Text style={styles.buttonText}>Reject</Text></Pressable>
   </View>:null}
   {item.approvalStatus==='approved'&&!item.publishedAt?<Pressable accessibilityRole="button" disabled={busy!==null} onPress={()=>void act(item,'publish')} style={styles.button}><Text style={styles.buttonText}>{busy===item.id?'Working...':'Publish employee announcement'}</Text></Pressable>:null}
  </View>)}
 </ScrollView>;
}
const styles=StyleSheet.create({root:{flex:1},content:{padding:spacing.md,paddingBottom:spacing.xl,gap:spacing.md},link:{color:colors.amber,fontSize:14},heading:{color:colors.text,fontSize:26,fontWeight:'800'},sub:{color:colors.muted,fontSize:13,lineHeight:19},error:{color:colors.red,fontSize:13},success:{color:colors.green,fontSize:13},card:{borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,borderRadius:10,padding:spacing.md,gap:spacing.sm},title:{color:colors.text,fontSize:16,fontWeight:'800'},meta:{color:colors.amber,fontSize:12},actions:{flexDirection:'row',gap:spacing.sm},button:{backgroundColor:colors.amber,padding:spacing.sm,borderRadius:8,alignItems:'center',flex:1},buttonText:{color:colors.canvas,fontWeight:'800'}});
