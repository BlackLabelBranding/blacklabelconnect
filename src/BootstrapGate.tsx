import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppShell } from './AppShell';
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

    let active = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setState({ status: 'signed-out', error: error.message });
      } else if (data.session) {
        void loadBootstrap();
      } else {
        setState({ status: 'signed-out' });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
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
              supabase.auth.startAutoRefresh();
            } else {
              supabase.auth.stopAutoRefresh();
            }
          });

    if (Platform.OS !== 'web' && AppState.currentState === 'active') {
      supabase.auth.startAutoRefresh();
    }

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
      appStateListener?.remove();
      if (Platform.OS !== 'web') supabase.auth.stopAutoRefresh();
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
                onPress: () => void supabase.auth.signOut(),
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

  const signIn = async () => {
    if (!supabase || busy) return;
    setBusy(true);
    setError(undefined);
    const result = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (result.error) setError(result.error.message);
    setBusy(false);
  };

  return (
    <SafeAreaView style={styles.canvas}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.center}
      >
        <View style={styles.signIn}>
          <Text style={styles.brand}>BLACK LABEL</Text>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.detail}>Use your Black Label Hub credentials.</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={email}
          />
          <TextInput
            autoCapitalize="none"
            autoComplete="current-password"
            onChangeText={setPassword}
            onSubmitEditing={() => void signIn()}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
            value={password}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            disabled={busy || !email.trim() || !password}
            onPress={() => void signIn()}
            style={({ pressed }) => [
              styles.primaryButton,
              (busy || !email.trim() || !password) && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            {busy ? <ActivityIndicator color={colors.canvas} /> : <Text style={styles.primaryButtonText}>Sign in</Text>}
          </Pressable>
        </View>
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
