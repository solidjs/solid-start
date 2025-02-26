import { action, CustomResponse, query, redirect } from "@solidjs/router";
import { supabase } from "~/util/supabase/client";

/**
 * Redirects to a specified path with a message as a query parameter.
 * Used by the auth actions to redirect with a message, consumed in 'form-message.tsx'.
 */
function encodedRedirect(
  type: "error" | "success" | "message",
  path: string,
  message: string,
): CustomResponse<never> {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

/**
 * Get the user and redirect to the login page if the user is not found.
 * Suitable for protecting routes that require authentication.
 */
export const getProtectedUser = query(async () => {
  "use client";
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
  "use client";
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
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link.",
    );
  }
}, "signUpAction");

export const signInAction = action(async (formData: FormData) => {
  "use client";
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/protected");
}, "signInAction");

export const forgotPasswordAction = action(async (formData: FormData) => {
  "use client";
  const email = formData.get("email")?.toString();
  const origin = window.location.origin;
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/api/auth/callback?redirect_to=/reset-password`,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
}, "forgotPasswordAction");

export const resetPasswordAction = action(async (formData: FormData) => {
  "use client";
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Password update failed",
    );
  }

  return encodedRedirect("success", "/protected", "Password updated");
}, "resetPasswordAction");

export const signOutAction = action(async () => {
  "use client";
  await supabase.auth.signOut();
  return redirect("/sign-in");
}, "signOutAction");