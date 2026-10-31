import { useLocalSearchParams } from 'expo-router';

import { ResourceDetailScreen } from '@/features/resources/screens/ResourceDetailScreen';

export default function ResourceRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ResourceDetailScreen id={id} />;
}
