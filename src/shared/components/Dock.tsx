import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/shared/hooks/theme';
import { setDockHeight, setQuery } from '@/store/dockSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { Colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

import { Pressy } from './Pressy';

const TABS = [
  { path: '/', outline: 'home-outline', filled: 'home', label: 'tabs.home' },
  { path: '/explore', outline: 'compass-outline', filled: 'compass', label: 'tabs.explore' },
  { path: '/saved', outline: 'bookmark-outline', filled: 'bookmark', label: 'tabs.saved' },
  { path: '/profile', outline: 'person-outline', filled: 'person', label: 'tabs.profile' },
] as const;

const PILL_WIDTH = 60;

function activeIndexFor(pathname: string) {
  if (pathname.startsWith('/explore')) return 1;
  if (pathname.startsWith('/saved')) return 2;
  if (pathname.startsWith('/profile')) return 3;
  return 0;
}

/** The bottom dock: search is always in reach, tabs sit under it. Used as the custom tab bar. */
export function Dock() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const query = useAppSelector((state) => state.dock.query);
  const styles = createStyles(colors);

  const activeIndex = activeIndexFor(pathname);
  const rowWidth = useSharedValue(0);
  const position = useSharedValue(activeIndex);

  useEffect(() => {
    position.value = withSpring(activeIndex, { damping: 13, stiffness: 190 });
  }, [activeIndex, position]);

  // Toasts read the dock height so they sit above it. Reset when the dock leaves.
  useEffect(() => () => void dispatch(setDockHeight(0)), [dispatch]);

  const pillStyle = useAnimatedStyle(() => {
    const slot = rowWidth.value / TABS.length;
    return { transform: [{ translateX: position.value * slot + (slot - PILL_WIDTH) / 2 }] };
  });

  return (
    <View
      style={[styles.dock, { paddingBottom: insets.bottom + 8 }]}
      onLayout={(event) => dispatch(setDockHeight(Math.round(event.nativeEvent.layout.height)))}>
      <View style={styles.search}>
        <Ionicons name="search" size={21} color={colors.text.secondary} />
        <TextInput
          value={query}
          onChangeText={(text) => {
            dispatch(setQuery(text));
            if (text.length > 0 && activeIndex !== 1) router.navigate('/explore');
          }}
          style={styles.input}
          underlineColorAndroid="transparent"
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.text.secondary}
          cursorColor={colors.brand.primary}
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <Pressy label={t('search.clear')} onPress={() => dispatch(setQuery(''))} style={styles.clear}>
            <Ionicons name="close-circle" size={20} color={colors.icon.muted} />
          </Pressy>
        ) : null}
        <Pressy label={t('search.filters')} onPress={() => router.navigate('/explore')} style={styles.filter}>
          <Ionicons name="options-outline" size={21} color={colors.brand.onAccent} />
        </Pressy>
      </View>
      <View
        style={styles.nav}
        onLayout={(event) => {
          rowWidth.value = event.nativeEvent.layout.width;
        }}>
        <Animated.View style={[styles.pill, pillStyle]} />
        {TABS.map((tab, index) => {
          const active = index === activeIndex;
          return (
            <Pressy key={tab.path} onPress={() => router.navigate(tab.path)} depth={0.9} style={styles.item}>
              <View style={styles.iconBox}>
                <Ionicons
                  name={active ? tab.filled : tab.outline}
                  size={22}
                  color={active ? colors.brand.onAccent : colors.chrome.textMuted}
                />
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>{t(tab.label)}</Text>
            </Pressy>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    dock: {
      backgroundColor: colors.chrome.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 14,
      paddingHorizontal: 16,
      gap: 8,
    },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      height: 56,
      paddingLeft: 16,
      paddingRight: 6,
      borderRadius: 18,
      backgroundColor: colors.background.secondary,
    },
    input: { flex: 1, fontFamily: fonts.semibold, fontSize: 16, color: colors.text.primary, paddingVertical: 0 },
    clear: { width: 34, height: 40, alignItems: 'center', justifyContent: 'center' },
    filter: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.brand.accent, alignItems: 'center', justifyContent: 'center' },
    nav: { flexDirection: 'row' },
    pill: { position: 'absolute', top: 6, left: 0, width: PILL_WIDTH, height: 32, borderRadius: 16, backgroundColor: colors.brand.accent },
    item: { flex: 1, alignItems: 'center', gap: 2, paddingTop: 6 },
    iconBox: { width: PILL_WIDTH, height: 32, alignItems: 'center', justifyContent: 'center' },
    label: { fontFamily: fonts.bold, fontSize: 12, color: colors.chrome.textMuted },
    labelActive: { fontFamily: fonts.black, color: colors.chrome.text },
  });
