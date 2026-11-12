import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { MobileBootstrap } from './contracts/bootstrap';
import { supabase } from './lib/supabase';
import { colors, spacing } from './theme';

type Task = { id:number; title:string; description:string|null; status:string|null; priority:string|null; due_date:string|null; department:string|null };
type Gig = { id:string; title:string|null; starts_at:string|null; location_name:string|null; city:string|null; state:string|null; assignment_status:string|null; contract_status:string|null; pay_status:string|null; call_time:string|null; pay_rate:number|null; pay_currency:string|null };
type Invitation = { id:string; title:string|null; starts_at:string|null; location_name:string|null; city:string|null; state:string|null; status:string; expires_at:string|null };
type WorkData = { tasks:Task[]; gigs:Gig[]; invitations:Invitation[] };
const EMPTY: WorkData = { tasks:[], gigs:[], invitations:[] };
const dateText=(value:string|null)=>value?new Date(value).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'Date not set';
const locationText=(item:{location_name:string|null;city:string|null;state:string|null})=>[item.location_name,item.city,item.state].filter(Boolean).join(', ')||'Location not set';

export function TalentWorkScreen({ bootstrap }: { bootstrap: MobileBootstrap }) {
 const [data,setData]=useState<WorkData>(EMPTY);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState<string|null>(null);
 const [responding,setResponding]=useState<string|null>(null);
 const [notice,setNotice]=useState<string|null>(null);
 const load=useCallback(async()=>{
  if(!supabase){setError('Connect is not configured.');setLoading(false);return;}
  setLoading(true);setError(null);
  const result=await supabase.rpc('mobile_employee_work');
  if(result.error){setError('Could not load your work. Please retry.');}
  else {
   const value=result.data as Partial<WorkData>|null;
   setData({tasks:Array.isArray(value?.tasks)?value.tasks:[],gigs:Array.isArray(value?.gigs)?value.gigs:[],invitations:Array.isArray(value?.invitations)?value.invitations:[]});
  }
  setLoading(false);
 },[bootstrap.user.id]);
 useEffect(()=>{void load();},[load]);
 const respond=async(id:string,status:'interested'|'declined')=>{
  if(!supabase||responding)return;
  setResponding(id);setError(null);setNotice(null);
  const result=await supabase.rpc('mobile_respond_to_invitation',{p_invitation_id:id,p_response:status});
  if(result.error){setError('Your response could not be saved. Please retry.');}
  else {setNotice(status==='interested'?'Interest sent to staffing. This is not a confirmed booking.':'Invitation declined.');await load();}
  setResponding(null);
 };
 const openTasks=data.tasks.filter(t=>!['completed','done','cancelled','canceled'].includes((t.status||'').toLowerCase()));
 return <ScrollView contentContainerStyle={styles.screen}>
  <Text style={styles.kicker}>BLACK LABEL CONNECT</Text>
  <Text style={styles.title}>Work</Text>
  <Text style={styles.muted}>Your real tasks, invitations, and confirmed assignments from Black Label Hub.</Text>
  <Pressable onPress={()=>void load()} disabled={loading} style={styles.refresh}><Text style={styles.link}>{loading?'Loading…':'Refresh work'}</Text></Pressable>
  {loading?<ActivityIndicator color={colors.amber}/>:null}
  {error?<Text style={styles.error}>{error}</Text>:null}
  {notice?<Text style={styles.notice}>{notice}</Text>:null}
  {!loading&&!error?<View>
   <Text style={styles.section}>My tasks ({openTasks.length})</Text>
   {openTasks.length===0?<Text style={styles.empty}>No open tasks assigned to you.</Text>:openTasks.map(task=><View key={task.id} style={styles.card}>
    <Text style={styles.cardTitle}>{task.title}</Text>
    <Text style={styles.meta}>{task.status||'Not started'} · {task.priority||'Normal priority'} · Due {task.due_date||'not set'}</Text>
    {task.description?<Text style={styles.detail}>{task.description}</Text>:null}
   </View>)}
   <Text style={styles.section}>My gigs ({data.gigs.length})</Text>
   {data.gigs.length===0?<Text style={styles.empty}>No gigs currently assigned to you.</Text>:data.gigs.map(gig=><View key={gig.id} style={styles.card}>
    <Text style={styles.cardTitle}>{gig.title||'Work assignment'}</Text>
    <Text style={styles.meta}>{dateText(gig.starts_at)} · {locationText(gig)}</Text>
    <Text style={styles.detail}>Assignment: {gig.assignment_status||'Pending'} · Contract: {gig.contract_status||'Not recorded'} · Pay: {gig.pay_status||'Not recorded'}</Text>
    {gig.call_time?<Text style={styles.meta}>Call time: {gig.call_time}</Text>:null}
   </View>)}
   <Text style={styles.section}>My invitations ({data.invitations.length})</Text>
   {data.invitations.length===0?<Text style={styles.empty}>No invitations assigned to you.</Text>:data.invitations.map(inv=><View key={inv.id} style={styles.card}>
    <Text style={styles.cardTitle}>{inv.title||'Work opportunity'}</Text>
    <Text style={styles.meta}>{dateText(inv.starts_at)} · {locationText(inv)}</Text>
    <Text style={styles.detail}>Status: {inv.status}</Text>
    {['sent','viewed','interested'].includes(inv.status)&&(!inv.expires_at||new Date(inv.expires_at)>new Date())?<View style={styles.actions}>
     <Pressable disabled={responding===inv.id} onPress={()=>void respond(inv.id,'interested')} style={styles.primary}><Text style={styles.primaryText}>{responding===inv.id?'Saving…':'Interested'}</Text></Pressable>
     <Pressable disabled={responding===inv.id} onPress={()=>void respond(inv.id,'declined')} style={styles.secondary}><Text style={styles.link}>Decline</Text></Pressable>
    </View>:null}
   </View>)}
  </View>:null}
 </ScrollView>;
}
const styles=StyleSheet.create({
 screen:{paddingHorizontal:spacing.md,paddingBottom:48},
 kicker:{color:colors.amber,fontSize:10,fontWeight:'800',marginTop:spacing.lg},
 title:{color:colors.text,fontSize:30,fontWeight:'800',marginTop:5},
 muted:{color:colors.muted,fontSize:13,marginTop:8,lineHeight:19},
 refresh:{paddingVertical:16,alignSelf:'flex-start'},
 link:{color:colors.amber,fontSize:12,fontWeight:'700'},
 section:{color:colors.text,fontSize:19,fontWeight:'800',marginTop:23,marginBottom:12},
 card:{backgroundColor:colors.surface,borderColor:colors.line,borderWidth:1,borderRadius:8,padding:14,marginBottom:10},
 cardTitle:{color:colors.text,fontSize:16,fontWeight:'800'},
 meta:{color:colors.muted,fontSize:12,marginTop:8},
 detail:{color:colors.soft,fontSize:12,lineHeight:19,marginTop:8},
 empty:{color:colors.muted,fontSize:13,paddingVertical:10},
 error:{color:'#ff8b8b',fontSize:13,marginVertical:10},
 notice:{color:colors.green,fontSize:13,marginVertical:10},
 actions:{flexDirection:'row',gap:10,marginTop:14},
 primary:{backgroundColor:colors.amber,padding:12,borderRadius:7,flex:1,alignItems:'center'},
 primaryText:{color:colors.canvas,fontWeight:'800',fontSize:12},
 secondary:{borderColor:colors.line,borderWidth:1,padding:12,borderRadius:7,flex:1,alignItems:'center'}
});
