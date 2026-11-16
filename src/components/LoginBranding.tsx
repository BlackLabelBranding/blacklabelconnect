import { View, Text, Image, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Path, Rect, Circle, G, Line, Polygon } from 'react-native-svg';

const gold = '#E8B83F';

export function LoginAtmosphere() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 390 850" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="back" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#10131C" /><Stop offset=".52" stopColor="#050507" /><Stop offset="1" stopColor="#110E0A" />
          </LinearGradient>
          <LinearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#C07A13" stopOpacity="0" /><Stop offset=".5" stopColor="#F6CE67" stopOpacity=".7" /><Stop offset="1" stopColor="#E7A62D" stopOpacity="0" />
          </LinearGradient>
          <RadialGradient id="stage" cx=".5" cy="1" rx=".75" ry=".35">
            <Stop offset="0" stopColor="#E3A136" stopOpacity=".65" />
            <Stop offset=".45" stopColor="#8B5116" stopOpacity=".14" />
            <Stop offset="1" stopColor="#040506" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="390" height="850" fill="url(#back)" />
        <Path d="M-95 280 L65 -45 L99 -45 L-62 328Z" fill="#2A2623" opacity=".62" />
        <Path d="M-55 310 L88 -40" stroke="#C88C25" strokeWidth="4" opacity=".9" />
        <Path d="M420 80 L340 225 L390 235 L470 95Z" fill="#242022" />
        <Path d="M410 98 L350 217" stroke="#EFAC32" strokeWidth="3" opacity=".8" />
        <Path d="M-40 628 L120 880 L169 880 L-4 614Z" fill="#231C14" opacity=".4" />
        <Path d="M-28 628 L135 875" stroke="#BD761B" strokeWidth="3" opacity=".75" />
        <Path d="M435 595 L260 873 L300 873 L462 643Z" fill="#241D14" opacity=".4" />
        <Path d="M423 598 L275 866" stroke="#D29425" strokeWidth="3" opacity=".8" />
        <Rect y="610" width="390" height="240" fill="url(#stage)" />
        <G opacity=".45">
          <Path d="M10 805 L40 707 L45 707 L78 805 M315 805 L346 707 L350 707 L380 805" fill="none" stroke="#B47B25" strokeWidth="2" />
          <Line x1="19" y1="776" x2="70" y2="776" stroke="#D1A04D" />
          <Line x1="320" y1="776" x2="374" y2="776" stroke="#D1A04D" />
          <Path d="M145 801 L145 765 L250 765 L250 801" fill="none" stroke="#AD792F" strokeWidth="2" />
          <Line x1="150" y1="769" x2="243" y2="769" stroke="#EFB44B" strokeWidth="5" opacity=".5" />
          <Path d="M37 735 L176 836 M352 735 L212 836" stroke="url(#beam)" strokeWidth="25" opacity=".38" />
        </G>
        <Path d="M0 841 Q16 796 30 829 Q42 787 54 826 Q70 803 80 834 Q99 790 108 827 Q130 806 138 839 Q151 800 166 834 Q185 795 201 836 Q214 803 230 833 Q254 799 265 835 Q282 801 295 830 Q317 801 326 837 Q345 804 354 828 Q378 801 390 837 L390 850 L0 850Z" fill="#020203" />
        <Circle cx="44" cy="718" r="3" fill="#EFC56D" opacity=".8" />
        <Circle cx="350" cy="725" r="3" fill="#EFC56D" opacity=".8" />
      </Svg>
    </View>
  );
}

// Original brand assets supplied by Black Label, hosted in its public Supabase Logos bucket.
// Use the actual artwork rather than recreating either trademark with SVG/text.
const LOGOS_BASE = 'https://xopcttkrmjvwdddawdaa.supabase.co/storage/v1/object/public/Logos/';
const brandingLogo = { uri: LOGOS_BASE + 'blacklabellogoog.png' };
const entertainmentLogo = { uri: LOGOS_BASE + 'Black%20label%20entertainment%20logo%20(1).png' };
const connectIcon = { uri: LOGOS_BASE + '804FCE9F-FD54-4694-9682-9CFC158C53A1.png' };

export function LoginBranding() {
  return (
    <View style={styles.brandWrap}>
      <View style={styles.divisions}>
        <View style={styles.division}>
          <View style={styles.logoViewport}>
            <Image source={brandingLogo} resizeMode="contain" style={styles.brandingImage} accessibilityLabel="Black Label Executive Branding" />
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.division}>
          <View style={styles.logoViewport}>
            <Image source={entertainmentLogo} resizeMode="contain" style={styles.entertainmentImage} accessibilityLabel="Black Label Entertainment" />
          </View>
        </View>
      </View>
      <View style={styles.emblem}>
        <Image source={connectIcon} resizeMode="contain" style={styles.connectIcon} accessibilityLabel="Black Label Connect" />
      </View>
      <Text style={styles.blackLabel}>B L A C K   L A B E L</Text>
      <Text style={styles.connect}>CONNECT</Text>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  brandWrap: { alignItems: 'center', marginBottom: 20 },
  divisions: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center', marginBottom: 21 },
  division: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', height: 86 },
  // Both original source files are square with generous black space around the actual logo.
  // Center a 160px square within an 86px-high viewport: the complete wordmarks fit
  // at iPhone widths without cutting off their left/right edges or second lines.
  logoViewport: { width: '100%', height: 86, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  brandingImage: { width: 160, height: 160 },
  divider: { height: 48, width: 1, backgroundColor: '#C18A2A', marginHorizontal: 9 },
  entertainmentImage: { width: 160, height: 160 },
  emblem: { width: 105, height: 105, alignItems: 'center', justifyContent: 'center', borderRadius: 23, shadowColor: '#E7AB3B', shadowOpacity: .5, shadowRadius: 20, marginBottom: 12, elevation: 8 },
  connectIcon: { width: 96, height: 96, borderRadius: 23 },
  blackLabel: { fontSize: 12, color: '#DDDDE3', fontWeight: '800', letterSpacing: 1.7 },
  connect: { color: '#F7F8FA', fontSize: 37, letterSpacing: 3, fontWeight: '900', fontStyle: 'italic', lineHeight: 45 },
  rule: { width: '75%', height: 2, backgroundColor: '#D7A237', marginTop: 4, opacity: .85 },
});
