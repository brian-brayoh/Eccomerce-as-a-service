"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function signInAction(email: string, password: string, callbackUrl: string) {
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    // NEXT_REDIRECT errors are thrown by signIn on success — rethrow those
    throw error;
  }
}
