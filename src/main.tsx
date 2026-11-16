import { StrictMode, useEffect, useRef, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import { ConvexReactClient, useConvex, useConvexAuth } from "convex/react";
import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { startCrossing } from "./crossing.js";
import { startStars } from "./stars.js";
import "./styles.css";

startStars();

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

const Emb = ({ id }: { id: string }) => (
  <svg className="emb" aria-hidden="true"><use href={`#e-${id}`} /></svg>
);

function Splash() {
  return <div className="splash"><Emb id="seal" />Opening your journal…</div>;
}

/** Signed in: load the member's journal, then hand over to the app. */
function Running() {
  const client = useConvex();
  const { signOut } = useAuthActions();
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const [journal, reminder, mirrorEnabled, plusInfo] = await Promise.all([
          client.query(api.journal.get, {}),
          client.query(api.reminders.mine, {}),
          client.query(api.mirror.enabled, {}),
          client.query(api.billing.status, {}),
        ]);
        document.getElementById("appShell")!.hidden = false;
        const leave = () => window.location.replace(window.location.pathname);
        startCrossing({
          journal: journal?.data ?? null,
          email: journal?.email ?? "",
          reminder,
          mirrorEnabled,
          plusInfo,
          getPlus: () => client.query(api.billing.status, {}),
          checkout: (plan: "monthly" | "yearly") => client.action(api.billing.checkout, { plan }),
          portal: () => client.action(api.billing.portal, {}),
          confirmCheckout: (sessionId: string) => client.action(api.billing.confirm, { sessionId }),
          adminStats: () => client.query(api.admin.stats, {}),
          save: (data: string) => client.mutation(api.journal.save, { data }),
          setReminder: (email: string, slot: "morning" | "evening", consent: string) =>
            client.mutation(api.reminders.set, { email, slot, consent }),
          stopReminder: () => client.mutation(api.reminders.stop, {}),
          mirrorPattern: (p: Record<string, string>) => client.action(api.mirror.pattern, { p }),
          mirrorWeek: (patterns: string, days: string) => client.action(api.mirror.week, { patterns, days }),
          mirrorYear: (a: { goal: string; identity: string; why: string; season: string; milestone: string; week: string; recent: string }) =>
            client.action(api.mirror.year, a),
          deleteAccount: async () => {
            await client.mutation(api.journal.deleteAccount, { confirm: "DELETE" });
            await signOut().catch(() => {});
            leave();
          },
          signOut: async () => { await signOut(); leave(); },
        });
      } catch {
        setError("We couldn’t open your journal. Check your connection, then refresh the page.");
      }
    })();
  }, [client, signOut]);

  return error ? <div className="gate"><p className="err" role="alert">{error}</p></div> : null;
}

type Mode = "signIn" | "signUp" | "forgot" | "reset";

function friendly(mode: Mode, e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  const data = (e as { data?: unknown })?.data;
  if (typeof data === "string") return data;
  if (/already exists/i.test(msg)) return "There’s already an account with that email. Sign in instead, or reset your password.";
  if (mode === "signIn") return "That email and password don’t match. Check them, or reset your password.";
  if (mode === "signUp") return "We couldn’t create your account. Check your email address and use a password of at least 8 characters.";
  if (mode === "forgot") return "We couldn’t send a code to that address. Check it and try again.";
  return "That code didn’t work, or it has run out. Ask for a new one.";
}

function SignIn() {
  const { signIn } = useAuthActions();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => { document.getElementById("appShell")!.hidden = true; }, []);
  const go = (m: Mode) => { setMode(m); setError(""); setNote(""); };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!convexUrl) { setError("This app isn’t connected to its database yet (VITE_CONVEX_URL is missing)."); return; }
    const form = new FormData(e.currentTarget);
    if (mode === "signUp" && !form.get("consent")) {
      setError("Please tick the box to agree, so we can store your journal for you.");
      return;
    }
    form.delete("consent");
    const em = String(form.get("email") || email).trim().toLowerCase();
    setEmail(em);
    setBusy(true); setError(""); setNote("");
    try {
      if (mode === "signIn" || mode === "signUp") {
        form.set("email", em);
        form.set("flow", mode);
        await signIn("password", form);
      } else if (mode === "forgot") {
        await signIn("password", { email: em, flow: "reset" });
        setMode("reset");
        setNote(`We’ve emailed a code to ${em}. It works for 20 minutes.`);
      } else {
        await signIn("password", { email: em, code: String(form.get("code") || "").trim(), newPassword: String(form.get("newPassword") || ""), flow: "reset-verification" });
      }
    } catch (err) {
      setError(friendly(mode, err));
    } finally {
      setBusy(false);
    }
  }

  const title = { signIn: "Welcome back", signUp: "Begin your crossing", forgot: "Reset your password", reset: "Choose a new password" }[mode];
  const button = { signIn: "Sign in", signUp: "Create my account", forgot: "Email me a code", reset: "Save new password" }[mode];

  return (
    <div className="gate">
      {mode === "signUp" || mode === "signIn" ? (
        <div className="gate-intro">
          <p className="eyebrow">An accountability practice from Indigo Estate</p>
          <ul className="gate-points">
            <li><Emb id="narrow" /><span><b>Name the pattern</b> you keep repeating, and trace it to the belief and the voice beneath it.</span></li>
            <li><Emb id="tent" /><span><b>Walk forty held days</b> through the wilderness, with daily check-ins, waymarks and a quest.</span></li>
            <li><Emb id="crown" /><span><b>Release it.</b> Your journal is private to you; nobody at Indigo Estate reads it.</span></li>
          </ul>
        </div>
      ) : null}
      <div className="gate-card">
        <h2>{title}</h2>
        {note ? <p className="ok" role="status">{note}</p> : null}
        <form onSubmit={submit} noValidate>
          {mode === "signUp" ? (
            <div><label className="lbl" htmlFor="name">Your first name</label>
              <input type="text" id="name" name="name" autoComplete="given-name" placeholder="So we can greet you" /></div>
          ) : null}
          {mode !== "reset" ? (
            <div><label className="lbl" htmlFor="email">Email</label>
              <input type="email" id="email" name="email" autoComplete="email" required defaultValue={email} placeholder="you@example.com" /></div>
          ) : null}
          {mode === "signIn" || mode === "signUp" ? (
            <div><label className="lbl" htmlFor="password">Password</label>
              <input type="password" id="password" name="password" autoComplete={mode === "signUp" ? "new-password" : "current-password"} required minLength={8} placeholder={mode === "signUp" ? "At least 8 characters" : ""} /></div>
          ) : null}
          {mode === "reset" ? (
            <>
              <div><label className="lbl" htmlFor="code">Code from your email</label>
                <input type="text" id="code" name="code" inputMode="numeric" autoComplete="one-time-code" required placeholder="8 digits" /></div>
              <div><label className="lbl" htmlFor="newPassword">New password</label>
                <input type="password" id="newPassword" name="newPassword" autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" /></div>
            </>
          ) : null}
          {mode === "signUp" ? (
            <label className="check" htmlFor="consent">
              <input type="checkbox" id="consent" name="consent" />
              <span>I&rsquo;m 18 or over, and I agree that Indigo Estate (Life and Soul Place Ltd) stores what I write, which may include personal details about my health, beliefs and family, so I can use the app. I can download or delete it at any time. <a href="/privacy.html" target="_blank" rel="noopener">Privacy notice</a></span>
            </label>
          ) : null}
          {error ? <p className="err" role="alert">{error}</p> : null}
          <button className="btn gold" type="submit" disabled={busy}>{busy ? "One moment…" : button}</button>
        </form>
        <div className="gate-switch">
          {mode === "signIn" ? <>
            <button className="btn text" type="button" onClick={() => go("signUp")}>New here? Create an account</button>
            <button className="btn text" type="button" onClick={() => go("forgot")}>Forgot password?</button>
          </> : <button className="btn text" type="button" onClick={() => go("signIn")}>Back to sign in</button>}
        </div>
      </div>
    </div>
  );
}

function Gate() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  if (isLoading) return <Splash />;
  return isAuthenticated ? <Running /> : <SignIn />;
}

const root = createRoot(document.getElementById("gate")!);
if (!convexUrl) {
  root.render(<div className="gate"><div className="gate-card"><h2>Almost there</h2><p>This copy of The Crossing isn’t connected to its database yet. Set <code>VITE_CONVEX_URL</code> and rebuild.</p></div></div>);
} else {
  const convex = new ConvexReactClient(convexUrl);
  root.render(
    <StrictMode>
      <ConvexAuthProvider client={convex}>
        <Gate />
      </ConvexAuthProvider>
    </StrictMode>,
  );
}

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(() => {}); });
}
