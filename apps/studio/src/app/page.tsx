import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AuthPanel } from "@/components/auth-panel";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const sessionSummary = session
    ? {
        user: {
          name: session.user.name ?? null,
          email: session.user.email,
          image: session.user.image ?? null,
        },
      }
    : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.22),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(120,113,108,0.16),_transparent_28%),linear-gradient(180deg,_#f8f4ef_0%,_#f2ece4_55%,_#e8dfd3_100%)] px-6 py-10 text-stone-950 sm:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="max-w-2xl">
          <p className="inline-flex items-center rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-stone-700 backdrop-blur">
            Monorepo foundation
          </p>
          <h1 className="mt-8 text-5xl font-semibold tracking-tight sm:text-6xl">
            Google auth, Resend email, and Prisma are now wired together.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600">
            This Next app now shares auth state, database persistence, and transactional
            email infrastructure with the rest of the workspace through reusable packages.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-black/10 bg-white/80 p-5 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.28em] text-stone-500">
                Auth
              </div>
              <div className="mt-3 text-base font-medium text-stone-950">
                Better Auth + Google OAuth
              </div>
            </div>
            <div className="rounded-3xl border border-black/10 bg-white/80 p-5 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.28em] text-stone-500">
                Database
              </div>
              <div className="mt-3 text-base font-medium text-stone-950">
                Prisma + PostgreSQL
              </div>
            </div>
            <div className="rounded-3xl border border-black/10 bg-white/80 p-5 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.28em] text-stone-500">
                Email
              </div>
              <div className="mt-3 text-base font-medium text-stone-950">
                Resend delivery log
              </div>
            </div>
          </div>
        </section>

        <div className="lg:pt-8">
          <AuthPanel session={sessionSummary} />
        </div>
      </div>
    </main>
  );
}
