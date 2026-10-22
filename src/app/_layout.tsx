import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from "@expo-google-fonts/nunito";
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { AppProviders } from "@/core/providers/AppProviders";
import { useSessionBootstrap } from "@/features/auth/hooks/useSessionBootstrap";
import "@/i18n";
import { CelebrationManager } from "@/shared/celebration/CelebrationManager";
import { ToastManager } from "@/shared/toast/ToastManager";
import { useAppSelector } from "@/store/hooks";

SplashScreen.preventAutoHideAsync();

/**
 * Redirects are reactive and live here. Auth and onboarding code only change state.
 * Guests may browse: there is no "must be signed in" redirect. Actions that need an account
 * (download, save, contribute) ask for sign-in when the user taps them.
 */
function RootNavigator() {
  useSessionBootstrap();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const sessionStatus = useAppSelector((state) => state.session.status);
  const onboardingSeen = useAppSelector(
    (state) => state.preferences.onboardingSeen,
  );

  // Keep the splash up until we know whether a session exists.
  useEffect(() => {
    if (sessionStatus !== "loading") SplashScreen.hideAsync();
  }, [sessionStatus]);

  useEffect(() => {
    if (!navigationState?.key || sessionStatus === "loading") return;
    const group = segments[0] as string | undefined;
    if (!onboardingSeen) {
      if (group !== "(onboarding)") router.replace("/(onboarding)");
      return;
    }
    if (
      group === "(onboarding)" ||
      (sessionStatus === "signedIn" && group === "(auth)")
    ) {
      router.replace("/(tabs)");
    }
  }, [navigationState?.key, sessionStatus, onboardingSeen, segments, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  // If the fonts fail we still start, with the system font, rather than a blank screen.
  if (!loaded && !error) return null;

  return (
    <AppProviders>
      <StatusBar style="auto" />
      <RootNavigator />
      <ToastManager />
      <CelebrationManager />
    </AppProviders>
  );
}
