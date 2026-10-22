import type { Session } from '@supabase/supabase-js';
import { useEffect } from 'react';

import { supabase } from '@/services/supabase/client';
import { useAppDispatch } from '@/store/hooks';
import { sessionCleared, sessionEstablished } from '@/store/sessionSlice';

/**
 * Tells Redux whether someone is signed in. Call once, in the root navigator.
 * The role is 'student' for now: it comes from the user_roles table once the backend exists (M1).
 * Auth mutations never navigate. They only change the session and the root effect reacts.
 */
export function useSessionBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let active = true;
    const apply = (session: Session | null) => {
      if (!active) return;
      if (session) {
        dispatch(sessionEstablished({ userId: session.user.id, email: session.user.email ?? null, role: 'student' }));
      } else {
        dispatch(sessionCleared());
      }
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));
    // Only dispatch inside this callback. Calling other Supabase methods here can deadlock.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => apply(session));

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [dispatch]);
}
