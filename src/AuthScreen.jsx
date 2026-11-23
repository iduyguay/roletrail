import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "./auth.js";

const errorMessages = {
  "auth/email-already-in-use":
    "There’s already an account with this email. Try signing in instead.",
  "auth/invalid-credential":
    "That email and password combination doesn’t match.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/weak-password": "Use a password with at least 6 characters.",
  "auth/popup-closed-by-user": "The sign-in window closed before finishing.",
  "auth/too-many-requests": "Too many attempts. Wait a little, then try again.",
};

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

export default function AuthScreen() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (issue) {
      setError(
        errorMessages[issue.code] || "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setError("");
    setBusy(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (issue) {
      setError(
        errorMessages[issue.code] ||
          "Google sign-in did not finish. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <a href="#home" className="brand auth-brand">
          <BrandMark />
          <span>roletrail</span>
        </a>
        <div className="auth-story-content">
          <span className="eyebrow">A steadier way forward</span>
          <h1>
            Good work
            <br />
            starts with <em>good work.</em>
          </h1>
          <p>
            Keep every possibility in view, and make your next move with a
            little more clarity.
          </p>
          <div className="auth-quote">
            <span>“</span>
            <p>
              The right role is rarely found in one sitting. It’s found by
              staying open, and staying with it.
            </p>
            <small>YOUR SEARCH, IN MOTION</small>
          </div>
        </div>
        <span className="auth-story-footer">
          A thoughtful place for the in-between.
        </span>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <span className="eyebrow">YOUR CAREER, YOUR PACE</span>
          <h2>
            {mode === "signin" ? "Welcome back." : "Start your next chapter."}
          </h2>
          <p className="auth-subtitle">
            {mode === "signin"
              ? "Sign in to pick up where you left off."
              : "Create an account and give your search some shape."}
          </p>
          <button
            className="google-button"
            type="button"
            onClick={signInWithGoogle}
            disabled={busy}
          >
            <span className="google-g">G</span>Continue with Google
          </button>
          <div className="auth-divider">
            <span />
            or use your email
            <span />
          </div>
          <form className="auth-form" onSubmit={submit}>
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                minLength="6"
                required
              />
            </label>
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="button button-primary auth-submit"
              type="submit"
              disabled={busy}
            >
              {busy
                ? "One moment…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>
          <p className="auth-switch">
            {mode === "signin"
              ? "New to Roletrail?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError("");
              }}
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
        <span className="auth-legal">
          By continuing, you agree to keep your search yours.
        </span>
      </section>
    </main>
  );
}
