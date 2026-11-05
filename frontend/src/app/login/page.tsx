"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { Loading } from "@/components/ui";
import { IconLogo, IconLock } from "@/components/icons";

export default function LoginPage() {
  const { user, loading, login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register(username, email, password);
      }
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loading label="Loading…" />
      </div>
    );
  }
  if (user) return null;

  const passwordType = showPassword ? "text" : "password";
  const passwordIsLongEnough = password.length >= 8;

  return (
    <main className="auth-page">
      <div className="auth-backdrop auth-backdrop-one" />
      <div className="auth-backdrop auth-backdrop-two" />
      <div className="auth-frame">
        <section className="auth-showcase">
          <div className="auth-brand">
            <div className="auth-brand-mark">
              <IconLogo width={22} height={22} />
            </div>
            <span>threadline</span>
            <span className="auth-brand-divider" />
            <span className="auth-brand-caption">BEHAVIOURAL SOC</span>
          </div>

          <div className="auth-showcase-copy">
            <p className="auth-eyebrow">
              <span className="auth-pulse" />
              SIGNAL OVER NOISE
            </p>
            <h2>
              See the story
              <br />
              <span>behind every</span>
              <br />
              sign-in.
            </h2>
            <p className="auth-showcase-description">
              A clearer picture of identity risk, built from the small signals
              that matter.
            </p>
          </div>

          <div className="auth-showcase-foot">
            <span>01 — 03</span>
            <span>Every login tells a story.</span>
            <span className="auth-foot-line" />
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-mobile-brand">
            <div className="auth-brand-mark">
              <IconLogo width={20} height={20} />
            </div>
            <span>threadline</span>
          </div>
          <div className="auth-form-content">
            <div className="auth-form-heading">
              <p className="auth-form-kicker">YOUR SECURITY WORKSPACE</p>
              <h1>{mode === "login" ? "Welcome back." : "Make it yours."}</h1>
              <p>
                {mode === "login"
                  ? "Sign in to pick up where you left off."
                  : "Create an account to start exploring."}
              </p>
            </div>

            <div className="auth-mode-switch" role="tablist" aria-label="Account action">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  id={`${m}-tab`}
                  aria-controls="auth-form"
                  aria-selected={mode === m}
                  onClick={() => {
                    setMode(m);
                    setError(null);
                    setConfirmPassword("");
                  }}
                  className={mode === m ? "auth-mode-active" : ""}
                >
                  {m === "login" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <form id="auth-form" onSubmit={submit} className="auth-fields">
              <div className="auth-field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                  autoComplete="username"
                  required
                />
              </div>
              {mode === "register" && (
                <div className="auth-field">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>
              )}
              <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="password">Password</label>
                  {mode === "login" && <span>SECURE ACCESS</span>}
                </div>
                <div className="auth-password-wrap">
                  <input
                    id="password"
                    type={passwordType}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    minLength={mode === "register" ? 8 : undefined}
                    required
                    aria-describedby={
                      mode === "register" ? "password-requirement" : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="auth-show-password"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {mode === "register" && (
                  <>
                    <p
                      id="password-requirement"
                      className={`auth-hint ${
                        passwordIsLongEnough ? "auth-hint-valid" : ""
                      }`}
                    >
                      {passwordIsLongEnough ? "✓ " : "• "}At least 8 characters
                    </p>
                    <label className="auth-confirm-label" htmlFor="confirm-password">
                      Confirm password
                    </label>
                    <input
                      id="confirm-password"
                      type={passwordType}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      aria-invalid={
                        confirmPassword.length > 0 &&
                        confirmPassword !== password
                      }
                    />
                    {confirmPassword.length > 0 && (
                      <p
                        className={`auth-hint ${
                          confirmPassword === password
                            ? "auth-hint-valid"
                            : "auth-hint-error"
                        }`}
                        aria-live="polite"
                      >
                        {confirmPassword === password
                          ? "Passwords match."
                          : "Passwords do not match."}
                      </p>
                    )}
                  </>
                )}
              </div>

              {error && (
                <div className="auth-error" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="auth-submit"
              >
                <span>
                {busy
                  ? "One moment…"
                  : mode === "login"
                    ? "Enter your workspace"
                    : "Create my account"}
                </span>
                <span aria-hidden="true">↗</span>
              </button>
            </form>

            <p className="auth-privacy">
              <IconLock width={13} height={13} />
              Your session is encrypted and private.
            </p>
          </div>
          <footer className="auth-form-footer">
            <span>THREADLINE SECURITY</span>
            <span>BUILT FOR THE SIGNALS THAT MATTER</span>
          </footer>
        </section>
      </div>
    </main>
  );
}
