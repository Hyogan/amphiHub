import { supabase } from "@/services/supabase/client";

import { AppAuthError } from "../utils/authErrors";

/** Raw in, raw out: thin wrappers over Supabase Auth. They throw on failure. */
export const authApi = {
  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.log(error);
      throw error;
    }
  },

  /** Returns whether the account still needs its e-mail code. */
  signUp: async (input: {
    email: string;
    password: string;
    displayName: string;
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { display_name: input.displayName } },
    });
    if (error) {
      console.log(error);
      throw error;
    }
    // When confirmation is on, Supabase hides an existing address by returning a user with no identities.
    if (data.user && data.user.identities && data.user.identities.length === 0)
      throw new AppAuthError("userExists");
    return { needsVerification: !data.session };
  },

  verifySignup: async (email: string, code: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "signup",
    });
    if (error) throw error;
  },

  resendSignupCode: async (email: string) => {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) throw error;
  },

  requestPasswordReset: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  /** Checks the e-mailed code (which signs the user in), then sets the new password. */
  completePasswordReset: async (
    email: string,
    code: string,
    password: string,
  ) => {
    const verified = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "recovery",
    });
    if (verified.error) throw verified.error;
    const updated = await supabase.auth.updateUser({ password });
    if (updated.error) throw updated.error;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};
