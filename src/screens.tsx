import { useEffect, useState } from 'react';
import { Image, Pressable, ActivityIndicator, Switch, TextInput, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './lib/supabase';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bell, BriefcaseBusiness, Clock3, MapPin, ShieldCheck } from 'lucide-react-native';

import { CalendarExperience } from './CalendarExperience';
import { InboxExperience } from './InboxExperience';
import { ListRow, SectionHeader } from './components';
import type { MobileBootstrap } from './contracts/bootstrap';
import { TalentWorkScreen } from './TalentWorkScreen';
import { colors, spacing } from './theme';

const Screen = ({ children }: { children: React.ReactNode }) => (
  <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
    {children}
  </ScrollView>
);

export function HomeScreen({ bootstrap }: { bootstrap: MobileBootstrap }) {
  const firstName = bootstrap.user.displayName.split(/\s+/)[0] || 'there';
  const today = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', weekday: 'long', month: 'long', day: 'numeric',
  }).format(new Date());
  return (
    <Screen>
      <View style={styles.greeting}>
        <Text style={styles.kicker}>{today.toUpperCase()} · CENTRAL TIME</Text>
        <Text style={styles.title}>Welcome, {firstName}.</Text>
        <Text style={styles.subtitle}>Your Black Label workspace is ready.</Text>
      </View>
      <SectionHeader title="Your workspace" />
      <Text style={styles.pageSubtitle}>Open Calendar to see your scheduled events, Work for assignments, or Inbox for messages and invitations. Only information available to your account will appear.</Text>
    </Screen>
  );
}

export function InboxScreen() {
  return <InboxExperience />;
}

export function CalendarScreen() {
  return <CalendarExperience />;
}

export function WorkScreen({ bootstrap }: { bootstrap: MobileBootstrap }) {
  return <TalentWorkScreen bootstrap={bootstrap} />;
}

export function MoreScreen({
  bootstrap,
  onSignOut,
  pushStatus,
  pushError,
}: {
  bootstrap: MobileBootstrap;
  onSignOut: () => void;
  pushStatus: 'unsupported'|'checking'|'registered'|'denied'|'error';
  pushError: string | null;
}) {
  const [section, setSection] = useState<'main' | 'notifications' | 'files' | 'clock'>('main');
  const [prefs, setPrefs] = useState({ email_enabled: true, sms_enabled: false, push_enabled: true, high_priority_only: false });
  const [prefsBusy, setPrefsBusy] = useState(false);
  const [clockBusy, setClockBusy] = useState(false);
  const [punches, setPunches] = useState<Array<{ id: string; clock_in: string; clock_out: string | null }>>([]);
  const [files, setFiles] = useState<Array<{ name: string; id?: string }>>([]);
  const [fileBusy, setFileBusy] = useState(false);
  const [toolError, setToolError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase!.from('team_members').select('avatar_url').eq('user_id', bootstrap.user.id).maybeSingle();
      if (active) setPhoto(data?.avatar_url ?? null);
    })();
    return () => { active = false; };
  }, [bootstrap.user.id]);
  async function changePhoto() {
    if (!supabase || photoBusy) return;
    setPhotoError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setPhotoError('Photo library permission is required to change your photo.'); return; }
    const selected = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.75, base64: true });
    if (selected.canceled || !selected.assets[0]) return;
    const asset = selected.assets[0];
    if (!asset.base64) { setPhotoError('Unable to read the selected image.'); return; }
    setPhotoBusy(true);
    try {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      const cleaned = asset.base64.replace(/[^A-Za-z0-9+/]/g, '');
      const bytes = new Uint8Array(Math.floor(cleaned.length * 3 / 4));
      let count = 0, buffer = 0, bits = 0;
      for (const char of cleaned) { const digit = alphabet.indexOf(char); if (digit < 0) continue; buffer = (buffer << 6) | digit; bits += 6; if (bits >= 8) { bits -= 8; bytes[count++] = (buffer >> bits) & 255; } }
      const path = `${bootstrap.user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('team-members').upload(path, bytes.slice(0, count), { contentType: 'image/jpeg', upsert: false });
      if (uploadError) throw uploadError;
      const url = supabase.storage.from('team-members').getPublicUrl(path).data.publicUrl;
      const { error: saveError } = await supabase.rpc('mobile_update_own_employee_photo', { p_photo_url: url });
      if (saveError) throw saveError;
      setPhoto(url);
    } catch (err) { setPhotoError(err instanceof Error ? err.message : 'Photo could not be saved.'); }
    finally { setPhotoBusy(false); }
  }
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void (async () => {
      const [settings, shifts, stored] = await Promise.all([
        supabase.from('notification_preferences').select('email_enabled,sms_enabled,push_enabled,high_priority_only').eq('user_id',bootstrap.user.id).maybeSingle(),
        supabase.from('time_punches').select('id,clock_in,clock_out').eq('user_id',bootstrap.user.id).order('clock_in',{ascending:false}).limit(20),
        supabase.storage.from('connect-employee-files').list(bootstrap.user.id,{limit:100,sortBy:{column:'name',order:'asc'}})
      ]);
      if (!active) return;
      if (settings.data) setPrefs({email_enabled:settings.data.email_enabled ?? true,sms_enabled:settings.data.sms_enabled ?? false,push_enabled:settings.data.push_enabled ?? true,high_priority_only:settings.data.high_priority_only ?? false});
      if (shifts.data) setPunches(shifts.data);
      if (stored.data) setFiles(stored.data.filter(x=>!!x.name));
    })();
    return () => { active = false; };
  },[bootstrap.user.id]);
  async function savePreference(key: keyof typeof prefs, value: boolean) {
    if (!supabase || prefsBusy) return;
    const previous = prefs; setPrefs({...prefs,[key]:value});setPrefsBusy(true);setToolError(null);
    const {error} = await supabase.from('notification_preferences').upsert({user_id:bootstrap.user.id,[key]:value},{onConflict:'user_id'});
    if(error){setPrefs(previous);setToolError(error.message);}
    setPrefsBusy(false);
  }
  async function punch(action:'in'|'out') {
    if(!supabase || clockBusy)return;
    setClockBusy(true);setToolError(null);
    const {error}=await supabase.rpc('mobile_clock_action',{p_action:action});
    if(error)setToolError(error.message);
    else {
      const {data, error:loadError}=await supabase.from('time_punches').select('id,clock_in,clock_out').eq('user_id',bootstrap.user.id).order('clock_in',{ascending:false}).limit(20);
      if(loadError)setToolError(loadError.message);
      else setPunches(data??[]);
    }
    setClockBusy(false);
  }
  async function uploadEmployeeFile() {
    if(!supabase || fileBusy)return;
    setToolError(null);
    const result=await DocumentPicker.getDocumentAsync({type:['application/pdf','image/jpeg','image/png','text/plain'],copyToCacheDirectory:true});
    if(result.canceled||!result.assets[0])return;
    const asset=result.assets[0];
    if(asset.size && asset.size>10485760){setToolError('File must be 10 MB or smaller.');return;}
    setFileBusy(true);
    try{
      let bytes:Uint8Array;
      if(Platform.OS==='web'){
        const response=await fetch(asset.uri);bytes=new Uint8Array(await response.arrayBuffer());
      }else{
        const encoded=await FileSystem.readAsStringAsync(asset.uri,{encoding:FileSystem.EncodingType.Base64});
        const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        const cleaned=encoded.replace(/[^A-Za-z0-9+/]/g,'');
        const out=new Uint8Array(Math.floor(cleaned.length*3/4));let count=0,buffer=0,bits=0;
        for(const char of cleaned){const digit=alphabet.indexOf(char);buffer=(buffer<<6)|digit;bits+=6;if(bits>=8){bits-=8;out[count++]=(buffer>>bits)&255;}}
        bytes=out.slice(0,count);
      }
      const safe=asset.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,100);
      const path=`${bootstrap.user.id}/${Date.now()}_${safe}`;
      const {error}=await supabase.storage.from('connect-employee-files').upload(path,bytes,{contentType:asset.mimeType??'application/octet-stream',upsert:false});
      if(error)throw error;
      const {data, error:listingError}=await supabase.storage.from('connect-employee-files').list(bootstrap.user.id,{limit:100});
      if(listingError)throw listingError;
      setFiles(data??[]);
    }catch(error){setToolError(error instanceof Error?error.message:'Upload failed.');}
    finally{setFileBusy(false);}
  }
  async function openEmployeeFile(name:string){
    if(!supabase)return;
    setToolError(null);
    const {data,error}=await supabase.storage.from('connect-employee-files').createSignedUrl(`${bootstrap.user.id}/${name}`,60);
    if(error||!data?.signedUrl){setToolError(error?.message??'Unable to open file.');return;}
    const {Linking}=await import('react-native');
    await Linking.openURL(data.signedUrl);
  }
  const activePunch=punches.find(p=>!p.clock_out);
  if(section!=='main')return (
    <Screen>
      <Pressable onPress={()=>{setSection('main');setToolError(null);}} style={{paddingTop:24,paddingBottom:16}}><Text style={{color:colors.amber,fontWeight:'700'}}>‹ Back to More</Text></Pressable>
      <Text style={styles.title}>{section==='notifications'?'Notification Settings':section==='files'?'My Files':'Time Clock'}</Text>
      {toolError?<Text style={{color:colors.amber,marginVertical:12}}>{toolError}</Text>:null}
      {section==='notifications'?<>
        <Text style={styles.pageSubtitle}>Choose which channels can notify you. Push delivery also requires device registration and permission.</Text>
        {([
          ['email_enabled','Email notifications'],
          ['push_enabled','Push notifications'],
          ['sms_enabled','SMS notifications'],
          ['high_priority_only','High priority only']
        ] as const).map(([key,label])=><View key={key} style={[styles.accessLine,{justifyContent:'space-between'}]}><Text style={styles.accessText}>{label}</Text><Switch value={prefs[key]} disabled={prefsBusy} onValueChange={v=>void savePreference(key,v)}/></View>)}
      </>:null}
      {section==='clock'?<>
        <Text style={styles.pageSubtitle}>{activePunch?'Clocked in since '+new Date(activePunch.clock_in).toLocaleString('en-US',{timeZone:'America/Chicago'}):'You are currently clocked out.'}</Text>
        <Pressable disabled={clockBusy} onPress={()=>void punch(activePunch?'out':'in')} style={{backgroundColor:colors.amber,padding:16,borderRadius:12,marginTop:18,alignItems:'center'}}><Text style={{fontWeight:'800',color:colors.canvas}}>{clockBusy?'Saving…':activePunch?'Clock out':'Clock in'}</Text></Pressable>
        <SectionHeader title="Recent punches" />
        {punches.map(p=><View key={p.id} style={styles.accessLine}><Text style={styles.accessText}>{new Date(p.clock_in).toLocaleString('en-US',{timeZone:'America/Chicago'})} — {p.clock_out?new Date(p.clock_out).toLocaleString('en-US',{timeZone:'America/Chicago'}):'Active'}</Text></View>)}
      </>:null}
      {section==='files'?<>
        <Text style={styles.pageSubtitle}>Your private employee files. Upload PDF, JPG, PNG or TXT (up to 10 MB). Only your account can access these uploads.</Text>
        <Pressable disabled={fileBusy} onPress={()=>void uploadEmployeeFile()} style={{backgroundColor:colors.amber,padding:16,borderRadius:12,marginTop:18,alignItems:'center'}}><Text style={{fontWeight:'800',color:colors.canvas}}>{fileBusy?'Uploading…':'Upload a file'}</Text></Pressable>
        <SectionHeader title="Your uploads" />
        {files.length===0?<Text style={styles.pageSubtitle}>No files uploaded yet.</Text>:files.map(file=><ListRow key={file.name} title={file.name} detail="Tap to open securely" onPress={()=>void openEmployeeFile(file.name)}/>)}
      </>:null}
    </Screen>
  );
  return (
    <Screen>
      <View style={styles.profile}>
        <Pressable onPress={() => void changePhoto()} accessibilityRole="button" accessibilityLabel="Change employee profile photo" style={styles.profileAvatar}>
          {photo ? <Image source={{ uri: photo }} style={{ width: 56, height: 56, borderRadius: 28 }} /> : <Text style={styles.profileInitials}>{bootstrap.user.initials}</Text>}
          {photoBusy ? <ActivityIndicator color={colors.amber} style={{ position: 'absolute' }} /> : null}
        </Pressable>
        <View style={styles.profileCopy}>
          <Text style={styles.profileName}>{bootstrap.user.displayName}</Text>
          <Text style={styles.profileRole}>{bootstrap.activePersona} · {bootstrap.activeAccount.name}</Text>
        </View>
      </View>
      <Text style={styles.pageSubtitle}>Tap your photo to change it. Your employee photo is shared with Black Label Hub.</Text>
      {photoError ? <Text style={{ color: colors.amber, marginTop: 10 }}>{photoError}</Text> : null}
      <SectionHeader title="Tools" />
      <ListRow title="Time clock" detail="Clock in, clock out and review your punches" onPress={()=>setSection('clock')} />
      <ListRow title="Files" detail="Upload and access your private employee documents" onPress={()=>setSection('files')} />
      <ListRow title="Notification settings" detail="Email, SMS, push and priority preferences" onPress={()=>setSection('notifications')} />
      <SectionHeader title="Access" />
      <View style={styles.accessLine}><ShieldCheck color={colors.green} size={20} /><Text style={styles.accessText}>Permissions issued by Black Label Hub</Text></View>
      <View style={styles.accessLine}><Bell color={colors.amber} size={20} /><Text style={styles.accessText}>Push device: {pushStatus === 'registered' ? 'registered' : pushStatus === 'checking' ? 'checking registration' : pushStatus === 'unsupported' ? 'native app required' : pushStatus === 'denied' ? 'permission or preference disabled' : 'registration failed'}</Text></View>
      {pushError ? <Text style={{color:colors.amber}}>{pushError}</Text> : null}
      <View style={styles.accessLine}><BriefcaseBusiness color={colors.muted} size={20} /><Text style={styles.accessText}>{bootstrap.memberships.length} workspace memberships</Text></View>

      <View style={styles.accessLine}><MapPin color={colors.muted} size={20} /><Text style={styles.accessText}>Central time</Text></View>
      <SectionHeader title="Session" />
      <ListRow title="Sign out" detail={bootstrap.user.displayName} onPress={onSignOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 42, paddingHorizontal: spacing.lg },
  greeting: { paddingBottom: spacing.lg, paddingTop: spacing.xl },
  kicker: { color: colors.amber, fontSize: 11, fontWeight: '800', marginBottom: 10 },
  title: { color: colors.text, fontSize: 28, fontWeight: '700', letterSpacing: 0 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 7 },
  statusStrip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  statusLabel: { color: colors.muted, fontSize: 9, fontWeight: '700', marginBottom: 6 },
  statusValue: { color: colors.text, fontSize: 13, fontWeight: '600' },
  statusRule: { backgroundColor: colors.line, height: 32, width: StyleSheet.hairlineWidth },
  pageTitle: { color: colors.text, fontSize: 28, fontWeight: '700', marginTop: spacing.xl },
  pageSubtitle: { color: colors.muted, fontSize: 14, marginTop: 6 },
  dateRail: { flexDirection: 'row', gap: 7, marginTop: spacing.lg },
  date: { alignItems: 'center', borderColor: colors.line, borderRadius: 7, borderWidth: 1, flex: 1, paddingVertical: 13 },
  dateActive: { backgroundColor: colors.text, borderColor: colors.text },
  dateText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  dateTextActive: { color: colors.canvas },
  profile: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.xl },
  profileAvatar: { alignItems: 'center', backgroundColor: colors.text, borderRadius: 28, height: 56, justifyContent: 'center', width: 56 },
  profileInitials: { color: colors.canvas, fontSize: 17, fontWeight: '800' },
  profileCopy: { marginLeft: 14 },
  profileName: { color: colors.text, fontSize: 21, fontWeight: '700' },
  profileRole: { color: colors.muted, fontSize: 13, marginTop: 4, textTransform: 'capitalize' },
  accessLine: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, minHeight: 52 },
  accessText: { color: colors.text, flex: 1, fontSize: 13 },
});
