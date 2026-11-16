import { View, Text, StyleSheet } from 'react-native';
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

export function LoginBranding() {
  return (
    <View style={styles.brandWrap}>
      <View style={styles.divisions}>
        <View style={styles.division}>
          <Svg width="100%" height="52" viewBox="0 0 180 58">
            <Path d="M5 4 H174 L151 29 L174 54 H5Z" fill="#050506" stroke="#E7E7E9" strokeWidth="1.3" />
            <TextSvgFallback />
          </Svg>
          <Text style={styles.divisionMain}>BLACK LABEL</Text>
          <Text style={styles.divisionSub}>EXECUTIVE BRANDING</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.division}>
          <View style={styles.entertainmentLine}>
            <Text style={styles.entertainmentMain}>BLACK</Text>
            <Svg width="15" height="36" viewBox="0 0 22 49"><Polygon points="17,0 4,24 13,24 3,49 21,18 12,18" fill={gold}/></Svg>
            <Text style={styles.entertainmentMain}>LABEL</Text>
          </View>
          <Text style={styles.entertainmentSub}>ENTERTAINMENT</Text>
        </View>
      </View>
      <View style={styles.emblem}>
        <Svg width="96" height="96" viewBox="0 0 100 100">
          <Defs><LinearGradient id="metal" x1="0" x2="1" y1="0" y2="1"><Stop offset="0" stopColor="#FFFFFF"/><Stop offset=".45" stopColor="#8F96A3"/><Stop offset=".72" stopColor="#F8F8F8"/><Stop offset="1" stopColor="#858A96"/></LinearGradient></Defs>
          <Rect x="4" y="4" width="92" height="92" rx="23" fill="#090A0D" stroke="#B9892E" strokeWidth="1.6" />
          <Path d="M20 27 H50 Q79 27 77 43 Q76 52 64 54 Q83 57 78 72 Q74 84 50 84 H20 L31 73 H50 Q64 73 64 65 Q64 58 51 58 H29 L39 47 H50 Q63 47 63 41 Q63 35 50 35 H28Z" fill="url(#metal)" />
          <Polygon points="59,33 44,56 54,56 44,76 69,49 57,49" fill="#F0BC46" />
          <Path d="M8 70 Q49 20 93 50" fill="none" stroke="#DCA13C" strokeWidth="2.1" opacity=".85" />
        </Svg>
      </View>
      <Text style={styles.blackLabel}>B L A C K   L A B E L</Text>
      <Text style={styles.connect}>CONNECT</Text>
      <View style={styles.rule} />
    </View>
  );
}

// The source branding mark is the supplied flag-style BLACK LABEL logo.
// Text is layered above its outline to keep it sharp and accessible on mobile.
function TextSvgFallback() { return null; }

const styles = StyleSheet.create({
  brandWrap: { alignItems: 'center', marginBottom: 20 },
  divisions: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center', marginBottom: 21 },
  division: { flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: 0 },
  divisionMain: { position: 'absolute', top: 14, color: '#F4F4F5', fontSize: 11, letterSpacing: 1.0, fontWeight: '700' },
  divisionSub: { color: '#F4F4F5', fontSize: 8, letterSpacing: 1.35, fontWeight: '700', marginTop: 2 },
  divider: { height: 40, width: 1, backgroundColor: '#C18A2A', marginHorizontal: 12 },
  entertainmentLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  entertainmentMain: { color: gold, fontSize: 13, fontWeight: '900', letterSpacing: .5 },
  entertainmentSub: { color: gold, fontSize: 8, letterSpacing: 2.5, fontWeight: '700', marginTop: -2 },
  emblem: { width: 105, height: 105, alignItems: 'center', justifyContent: 'center', borderRadius: 23, shadowColor: '#E7AB3B', shadowOpacity: .5, shadowRadius: 20, marginBottom: 12, elevation: 8 },
  blackLabel: { fontSize: 12, color: '#DDDDE3', fontWeight: '800', letterSpacing: 1.7 },
  connect: { color: '#F7F8FA', fontSize: 37, letterSpacing: 3, fontWeight: '900', fontStyle: 'italic', lineHeight: 45 },
  rule: { width: '75%', height: 2, backgroundColor: '#D7A237', marginTop: 4, opacity: .85 },
});
