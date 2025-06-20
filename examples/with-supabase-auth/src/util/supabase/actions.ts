import { action, query, redirect } from "@solidjs/router";
import { supabase } from "~/util/supabase/client";

/**
 * Get the user and redirect to the login page if the user is not found.
 * Suitable for protecting routes that require authentication.
 */
export const getProtectedUser = query(async () => {

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw new Error(error.message);
    if (!user) throw new Error("User not found");
    return user;
  } catch {
    await supabase.auth.signOut();
    return redirect("/sign-in");
  }
}, "protectedUser");

export const signUpAction = action(async (formData: FormData) => {

  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const origin = window.location.origin;

  if (!email || !password) {
    return new Error("Email and password are required");
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return new Error(error.message);
  } else {
    return "Thanks for signing up! Please check your email for a verification link."
  }
}, "signUpAction");

export const signInAction = action(async (formData: FormData) => {

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return new Error(error.message);
  }

  return redirect("/protected");
}, "signInAction");

export const forgotPasswordAction = action(async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const origin = window.location.origin;
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return new Error("Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/api/auth/callback?redirect_to=/reset-password`,
  });

  if (error) {
    return new Error("Could not reset password.")
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return "Check your email for a link to reset your password.";
}, "forgotPasswordAction");

export const resetPasswordAction = action(async (formData: FormData) => {

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return new Error("Password and confirm password are required");
  }

  if (password !== confirmPassword) {
    return new Error("Passwords do not match");
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return new Error(error.message);
  }

  return redirect("/protected");
}, "resetPasswordAction");

export const signOutAction = action(async () => {
  await supabase.auth.signOut();
  return redirect("/sign-in");
}, "signOutAction");