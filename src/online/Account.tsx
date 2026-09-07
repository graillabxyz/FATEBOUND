import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "./client";
export function Account({
  children,
  requireDeveloper = false,
}: {
  children?: ReactNode;
  requireDeveloper?: boolean;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false),
    [signedIn, setSignedIn] = useState(false),
    [developer, setDeveloper] = useState(false);
  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    let live = true;
    async function refresh() {
      const { data } = await supabase!.auth.getUser();
      if (!live) return;
      setSignedIn(!!data.user);
      setEmail(data.user?.email ?? "");
      if (data.user) {
        const result = await supabase!
          .from("developer_members")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();
        if (live) setDeveloper(!!result.data);
      } else setDeveloper(false);
      if (live) setReady(true);
    }
    void refresh();
    const { data } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => void refresh(), 0);
    });
    return () => {
      live = false;
      data.subscription.unsubscribe();
    };
  }, []);
  async function authenticate(signup: boolean) {
    setBusy(true);
    setStatus("");
    try {
      const result = signup
        ? await supabase!.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin + "/account" },
          })
        : await supabase!.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (signup && !result.data.session)
        setStatus("Check your email to confirm your account, then sign in.");
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (requireDeveloper && signedIn && developer) return <>{children}</>;
  return (
    <section className="cloud-account">
      <h1>OMNIPATH</h1>
      <h2>{requireDeveloper ? "Developer sign-in" : "Your account"}</h2>
      {!supabase ? (
        <p>Cloud accounts are not configured in this build.</p>
      ) : !ready ? (
        <p>Connecting…</p>
      ) : signedIn ? (
        <>
          <p>Signed in as {email}.</p>
          {requireDeveloper && !developer && (
            <p>This account does not have developer access.</p>
          )}
          {developer && <a href="/metrics">Open metrics dashboard</a>}
          <button onClick={() => void supabase!.auth.signOut()}>
            Sign out
          </button>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void authenticate(false);
          }}
        >
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setStatus("");
              const { error } = await supabase!.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: window.location.origin + "/account" },
              });
              if (error) {
                setStatus(error.message);
                setBusy(false);
              }
            }}
          >
            Continue with Google
          </button>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button disabled={busy} type="submit">
            {busy ? "Connecting…" : "Sign in"}
          </button>
          {!requireDeveloper && (
            <button
              type="button"
              disabled={busy || !email || password.length < 8}
              onClick={() => void authenticate(true)}
            >
              Create account
            </button>
          )}
          {requireDeveloper && <a href="/account">Create an account</a>}
        </form>
      )}
      {status && <p role="status">{status}</p>}
      <a href="/game">Return to game</a>
    </section>
  );
}
