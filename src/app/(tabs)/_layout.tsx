import { Tabs } from 'expo-router';

import { Dock } from '@/shared/components/Dock';
import { useThemeColors } from '@/shared/hooks/theme';

export default function TabsLayout() {
  const colors = useThemeColors();
  return (
    <Tabs
      tabBar={() => <Dock />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background.primary } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
