import Constants from 'expo-constants';

import { store } from '@/store';

import { supabase } from './supabase/client';

/**
 * Records a product event. Fire and forget: a failure never reaches the user.
 * Never put passwords, tokens or document contents in `props`.
 */
export function track(name: string, props: Record<string, string | number | boolean | null> = {}) {
  const userId = store.getState().session.userId;
  void supabase
    .from('analytics_events')
    .insert({ name, props, user_id: userId, app_version: Constants.expoConfig?.version ?? null })
    .then(() => undefined);
}
