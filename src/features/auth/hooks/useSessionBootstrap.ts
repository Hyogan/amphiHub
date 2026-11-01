import type { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { rolesApi } from "@/services/api/rolesApi";
import { supabase } from "@/services/supabase/client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  roleResolved,
  sessionCleared,
  sessionEstablished,
} from "@/store/sessionSlice";

import { highestRole } from "../utils/role";

/**
 * Tells Redux whether someone is signed in, then which role they hold. Call once, in the root navigator.
 * Until the role arrives (or if it cannot be read) the user is a student. Hiding moderator screens is UX only:
 * the database decides what a role may do.
 * Auth mutations never navigate. They only change the session and the root effect reacts.
 */
export function useSessionBootstrap() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.session.userId);

  useEffect(() => {
    let active = true;
    const apply = (session: Session | null) => {
      if (!active) return;
      if (session) {
        dispatch(
          sessionEstablished({
            userId: session.user.id,
            email: session.user.email ?? null,
            role: "student",
          }),
        );
      } else {
        dispatch(sessionCleared());
      }
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));
    // Only dispatch inside this callback. Calling other Supabase methods here can deadlock.
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      apply(session),
    );

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [dispatch]);

  const roles = useQuery({
    queryKey: ["auth", "roles", userId ?? ""],
    queryFn: async () => highestRole(await rolesApi.listMine(userId as string)),
    enabled: Boolean(userId),
  });

  useEffect(() => {
    if (roles.data) dispatch(roleResolved(roles.data));
  }, [roles.data, dispatch]);
}
