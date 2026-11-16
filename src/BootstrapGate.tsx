import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppShell } from './AppShell';
import { LoginAtmosphere, LoginBranding } from './components/LoginBranding';
import { BLACK_LABEL_ACCOUNT_PORTAL_URL } from './auth/config';
import type { MobileBootstrap } from './contracts/bootstrap';
import { supabase, supabaseConfigError } from './lib/supabase';
import { fetchMobileBootstrap } from './services/mobileBootstrap';
import { colors, spacing } from './theme';

type StartupState =
  | { status: 'loading' }
  | { status: 'signed-out'; error?: string }
  | { status: 'ready'; bootstrap: MobileBootstrap }
  | { status: 'error'; message: string };

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong while starting the app.';
}

export function BootstrapGate() {
  const [state, setState] = useState<StartupState>({ status: 'loading' });

  const loadBootstrap = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      setState({ status: 'ready', bootstrap: await fetchMobileBootstrap() });
    } catch (error) {
      setState({ status: 'error', message: messageFor(error) });
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setState({ status: 'error', message: supabaseConfigError ?? 'Supabase is not configured.' });
      return;
    }

    const client = supabase;
    let active = true;
    void client.auth.getSession().then(async ({ data, error }) => {
      if (!active) return;
      if (error) {
        setState({ status: 'signed-out', error: error.message });
      } else if (data.session) {
        const userResult = await client.auth.getUser();
        if (!active) return;
        if (userResult.error || !userResult.data.user) {
          setState({ status: 'signed-out', error: 'Your Black Label session has expired. Sign in again.' });
        } else {
          void loadBootstrap();
        }
      } else {
        setState({ status: 'signed-out' });
      }
    });

    const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'SIGNED_OUT' || !session) {
        setState({ status: 'signed-out' });
      } else if (event === 'SIGNED_IN') {
        setTimeout(() => void loadBootstrap(), 0);
      }
    });

    const appStateListener =
      Platform.OS === 'web'
        ? null
        : AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
              client.auth.startAutoRefresh();
            } else {
              client.auth.stopAutoRefresh();
            }
          });

    if (Platform.OS !== 'web' && AppState.currentState === 'active') {
      client.auth.startAutoRefresh();
    }

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
      appStateListener?.remove();
      if (Platform.OS !== 'web') client.auth.stopAutoRefresh();
    };
  }, [loadBootstrap]);

  if (state.status === 'loading') {
    return <CenteredMessage busy title="Loading Black Label" detail="Resolving your authorized workspace." />;
  }

  if (state.status === 'signed-out') {
    return <SignInScreen initialError={state.error} />;
  }

  if (state.status === 'error') {
    return (
      <CenteredMessage
        title="Unable to start"
        detail={state.message}
        action={supabase ? { label: 'Try again', onPress: loadBootstrap } : undefined}
        secondaryAction={
          supabase
            ? {
                label: 'Sign out',
                onPress: () => void supabase?.auth.signOut(),
              }
            : undefined
        }
      />
    );
  }

  return (
    <AppShell
      bootstrap={state.bootstrap}
      onSignOut={() => {
        if (supabase) void supabase.auth.signOut();
      }}
    />
  );
}

function SignInScreen({ initialError }: { initialError?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);

  const submit = async () => {
    if (!supabase || busy) return;
    setBusy(true);
    setError(undefined);
    const result = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (result.error) setError(result.error.message);

    setBusy(false);
  };

  const openPasswordRecovery = async () => {
    setError(undefined);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.assign(BLACK_LABEL_ACCOUNT_PORTAL_URL);
        return;
      }

      await Linking.openURL(BLACK_LABEL_ACCOUNT_PORTAL_URL);
    } catch {
      setError('Unable to open My Black Label. Visit myblacklabel.app to reset your password.');
    }
  };

  return (
    <SafeAreaView style={styles.canvas}>
      <LoginAtmosphere />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.loginFill}>
        <ScrollView
          contentContainerStyle={styles.loginScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.loginCard}>
            <LoginBranding />
            <Text style={styles.loginHeading}>Sign In</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor="#8F94A0"
              style={styles.loginInput}
              value={email}
              accessibilityLabel="Email address"
            />
            <TextInput
              autoCapitalize="none"
              autoComplete="current-password"
              onChangeText={setPassword}
              onSubmitEditing={() => void submit()}
              placeholder="Password"
              placeholderTextColor="#8F94A0"
              secureTextEntry
              style={styles.loginInput}
              value={password}
              accessibilityLabel="Password"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              disabled={busy || !email.trim() || !password}
              onPress={() => void submit()}
              style={({ pressed }) => [
                styles.loginButton,
                (busy || !email.trim() || !password) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              {busy ? <ActivityIndicator color="#08090C" /> : <Text style={styles.loginButtonText}>Sign In  →</Text>}
            </Pressable>
            <Pressable onPress={() => void openPasswordRecovery()} style={styles.secondaryButton}>
              <Text style={styles.loginRecovery}>Forgot password?</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CenteredMessage({
  title,
  detail,
  busy = false,
  action,
  secondaryAction,
}: {
  title: string;
  detail: string;
  busy?: boolean;
  action?: { label: string; onPress: () => void };
  secondaryAction?: { label: string; onPress: () => void };
}) {
  return (
    <SafeAreaView style={styles.canvas}>
      <View style={styles.center}>
        {busy ? <ActivityIndicator color={colors.amber} size="large" /> : null}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.detail}>{detail}</Text>
        {action ? (
          <Pressable onPress={action.onPress} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{action.label}</Text>
          </Pressable>
        ) : null}
        {secondaryAction ? (
          <Pressable onPress={secondaryAction.onPress} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>{secondaryAction.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginFill: { flex: 1 },
  loginScroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 24 },
  loginCard: { width: '100%', maxWidth: 440, alignSelf: 'center', paddingHorizontal: 8, paddingVertical: 20 },
  loginHeading: { color: '#FFFFFF', fontSize: 31, fontWeight: '900', textAlign: 'center', marginTop: 4, marginBottom: 24 },
  loginInput: { color: '#FFFFFF', backgroundColor: 'rgba(11,13,18,0.92)', borderWidth: 1.5, borderColor: '#C99A3E', borderRadius: 17, minHeight: 57, fontSize: 16, paddingHorizontal: 18, marginBottom: 12 },
  loginButton: { backgroundColor: '#F4C343', borderRadius: 17, minHeight: 58, alignItems: 'center', justifyContent: 'center', marginTop: 10, borderWidth: 1, borderColor: '#FFE28C' },
  loginButtonText: { color: '#08090C', fontSize: 19, fontWeight: '900' },
  loginRecovery: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  canvas: { backgroundColor: colors.canvas, flex: 1 },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.xl },
  signIn: { maxWidth: 420, width: '100%' },
  brand: { color: colors.amber, fontSize: 12, fontWeight: '900', marginBottom: spacing.xl },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: spacing.md, textAlign: 'center' },
  detail: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: spacing.lg, marginTop: spacing.sm, textAlign: 'center' },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 7,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  error: { color: '#F08B82', fontSize: 13, lineHeight: 18, marginBottom: spacing.sm },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: 7,
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: { color: colors.canvas, fontSize: 14, fontWeight: '900' },
  secondaryButton: { alignItems: 'center', minHeight: 44, padding: spacing.md },
  secondaryButtonText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  buttonDisabled: { opacity: 0.45 },
  buttonPressed: { opacity: 0.75 },
});
