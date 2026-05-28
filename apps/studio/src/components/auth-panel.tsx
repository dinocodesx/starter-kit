"use client";

import { authClient } from "../lib/auth-client";
import { useState } from "react";

interface SessionUser {
  name: string | null;
  email: string;
  image?: string | null;
}

interface SessionLike {
  user: SessionUser;
}

interface AuthPanelProps {
  session: SessionLike | null;
}

export function AuthPanel({ session }: AuthPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signInWithGoogle() {
    setError(null);
    setIsSigningIn(true);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
        newUserCallbackURL: "/",
      });
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Unable to start Google sign-in.",
      );
      setIsSigningIn(false);
    }
  }

  async function signOut() {
    setError(null);
    setIsSigningOut(true);

    try {
      await authClient.signOut();
      window.location.assign("/");
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "Unable to sign out right now.",
      );
      setIsSigningOut(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-black/10 bg-white/90 p-8 shadow-[0_20px_80px_rgba(36,28,20,0.12)] backdrop-blur">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-700">
            Shared auth stack
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
            {session ? "You are signed in." : "Google sign-in is ready."}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600">
            Better Auth, Prisma, and Resend are now connected through the shared
            packages in this monorepo.
          </p>
        </div>
        <div className="hidden h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-200 via-orange-200 to-stone-100 md:block" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-stone-500">
            Session
          </div>
          <div className="mt-2 text-sm text-stone-900">
            {session ? session.user.email : "No active session"}
          </div>
          {session?.user.name ? (
            <div className="mt-1 text-sm text-stone-500">{session.user.name}</div>
          ) : null}
        </div>
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-stone-500">
            Email delivery
          </div>
          <div className="mt-2 text-sm text-stone-900">
            Resend-backed delivery logs are stored in Prisma.
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {session ? (
          <button
            type="button"
            onClick={signOut}
            disabled={isSigningOut}
            className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        ) : (
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={isSigningIn}
            className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigningIn ? "Redirecting..." : "Continue with Google"}
          </button>
        )}
        <a
          href="mailto:onboarding@resend.dev"
          className="rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-900 transition hover:border-stone-400 hover:bg-stone-100"
        >
          Email service check
        </a>
      </div>

      {error ? (
        <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
