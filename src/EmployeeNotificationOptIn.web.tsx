import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { supabase } from './lib/supabase';
import { colors, spacing } from './theme';
type Announcement = { id: string; title: string; body: string };
export function EmployeeNotificationOptIn() {
 const [permission,setPermission]=useState(typeof Notification==='undefined'?'unsupported':Notification.permission);
 const [enabled,setEnabled]=useState(false);
 const seen=useRef<Set<string> | null>(null);
 const poll=useCallback(async()=>{
  if (!supabase) return;
  const {data,error}=await supabase.rpc('connect_my_broadcast_announcements');
  if(error||!Array.isArray(data))return;
  const current=data as Announcement[];
  if(seen.current===null){seen.current=new Set(current.map(item=>item.id));return;}
  for(const item of current){
   if(seen.current.has(item.id))continue;
   seen.current.add(item.id);
   if(typeof Notification!=='undefined'&&Notification.permission==='granted'&&document.visibilityState==='visible')new Notification(item.title,{body:item.body,tag:'connect-'+item.id});
  }
 },[]);
 useEffect(()=>{
  if(!enabled||permission!=='granted'||!supabase)return;
  void poll();
  const onVisibility=()=>{if(document.visibilityState==='visible')void poll();};
  document.addEventListener('visibilitychange',onVisibility);
  const timer=setInterval(()=>{void poll();},30000);
  return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',onVisibility);};
 },[enabled,permission,poll]);
 const activate=async()=>{
  if(typeof Notification==='undefined'||!supabase)return;
  const next=await Notification.requestPermission();
  setPermission(next);
  if(next==='granted'){seen.current=null;setEnabled(true);}
 };
 return <View style={{padding:spacing.sm,gap:spacing.sm,borderColor:colors.line,borderWidth:1,borderRadius:8}}>
  <Text style={{color:colors.text,fontWeight:'700'}}>Desktop alerts</Text>
  <Text style={{color:colors.muted,fontSize:12}}>Optional notifications while Connect is open. Background alerts require a separate push service.</Text>
  {enabled?<Text style={{color:colors.green}}>Foreground alerts active for this session</Text>:<Pressable accessibilityRole="button" disabled={permission==='unsupported'||permission==='denied'} onPress={()=>void activate()}><Text style={{color:colors.amber}}>{permission==='denied'?'Allow notifications in browser settings':permission==='unsupported'?'Not supported by this browser':'Enable desktop alerts'}</Text></Pressable>}
 </View>;
}
