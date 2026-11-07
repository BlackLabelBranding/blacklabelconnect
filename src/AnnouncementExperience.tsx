import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from './lib/supabase';
import { colors, spacing } from './theme';
import { EmployeeNotificationOptIn } from './EmployeeNotificationOptIn';

type Announcement = { id: string; broadcastId: string; title: string; body: string; createdAt: string; readAt: string | null };
export function AnnouncementExperience({ onBack }: { onBack: () => void }) {
 const [items,setItems] = useState<Announcement[]>([]);
 const [loading,setLoading] = useState(true);
 const [error,setError] = useState<string | null>(null);
 const refresh = useCallback(async () => {
   setLoading(true); setError(null);
   if (!supabase) {
     setItems([]);
     setError('Connect is not configured. Check the Supabase environment settings.');
     setLoading(false);
     return;
   }
   const {data,error:failure}=await supabase.rpc('connect_my_broadcast_announcements');
   if(failure) { setItems([]); setError(failure.message); }
   else setItems(Array.isArray(data) ? data as Announcement[] : []);
   setLoading(false);
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 return <ScrollView style={styles.root} contentContainerStyle={styles.content}>
  <Pressable accessibilityRole="button" accessibilityLabel="Back to inbox" onPress={onBack}><Text style={styles.back}>‹ Back to Inbox</Text></Pressable>
  <Text style={styles.kicker}>BLACK LABEL COMMUNICATIONS</Text><Text style={styles.heading}>Employee announcements</Text>
  <Text style={styles.description}>Company announcements are available here even when push notifications are turned off.</Text>
  <EmployeeNotificationOptIn/>
  <Pressable accessibilityRole="button" accessibilityLabel="Refresh announcements" onPress={()=>void refresh()}><Text style={styles.back}>Refresh announcements</Text></Pressable>
  {loading ? <ActivityIndicator color={colors.amber}/> : error ? <Text style={styles.error}>{error}</Text> : items.length === 0 ? <Text style={styles.description}>No announcements yet.</Text> : items.map(item=><View key={item.id} style={styles.card}>
   <Text style={styles.title}>{item.title}</Text><Text style={styles.description}>{item.body}</Text>
   <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}{item.readAt ? ' · Read' : ' · Unread'}</Text>
  </View>)}
 </ScrollView>;
}
const styles=StyleSheet.create({root:{flex:1},content:{padding:spacing.md,paddingBottom:spacing.xl,gap:spacing.md},back:{color:colors.amber,fontSize:14},kicker:{color:colors.amber,fontSize:10,fontWeight:'800'},heading:{color:colors.text,fontSize:26,fontWeight:'800'},description:{color:colors.muted,fontSize:13,lineHeight:19},error:{color:colors.red,fontSize:13},card:{borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,borderRadius:10,padding:spacing.md,gap:spacing.sm},title:{color:colors.text,fontWeight:'800',fontSize:16},meta:{color:colors.amber,fontSize:11}});
