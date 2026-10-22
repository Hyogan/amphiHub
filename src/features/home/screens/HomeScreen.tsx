import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/shared/components/PlaceholderScreen';

export function HomeScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('tabs.home')} />;
}
