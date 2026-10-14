"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface AuthScreenProps {
  onSuccess: (user: {
    id: string;
    email: string;
    name: string | null;
    role: "SUPER_ADMIN" | "ADMIN" | "USER";
    status: string;
  }) => void;
  onBack: () => void;
}

export function AuthScreen({ onSuccess, onBack }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regEmail, setRegEmail] = useState("");
  const [regName, setRegName] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      toast.success(`Welcome back, ${data.user.name || data.user.email}!`);
      onSuccess(data.user);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, password: regPassword, name: regName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      toast.success(data.message || "Account created!");
      onSuccess(data.user);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = (provider: string) => {
    toast.info(`${provider} sign-in is coming soon. Use email for now.`);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(640px 420px at 50% -40px, rgba(79,108,255,0.16), transparent 70%), #060a14",
        fontFamily: "var(--font-manrope), sans-serif",
      }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: "#8691a8" }}
        onMouseOver={(e) => (e.currentTarget.style.color = "#dbe2f2")}
        onMouseOut={(e) => (e.currentTarget.style.color = "#8691a8")}
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[440px] flex flex-col items-center gap-7"
      >
        {/* Logo + heading */}
        <div className="flex flex-col items-center gap-[18px] text-center">
          <motion.div
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-[84px] h-[84px] rounded-full flex items-center justify-center relative"
            style={{
              background: "linear-gradient(135deg, #4f7dff, #8a6cf0)",
              boxShadow: "0 0 36px rgba(92,141,255,0.45)",
            }}
          >
            <Sparkles className="w-9 h-9 text-white" />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: "0 0 60px rgba(138,108,240,0.6)" }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </motion.div>

          <div className="flex flex-col gap-2">
            <h1
              className="m-0 font-extrabold leading-[1.2] tracking-[-0.01em]"
              style={{
                fontSize: "30px",
                background: "linear-gradient(90deg, #8fb0ff, #b79bf5)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Playbeat Digital
            </h1>
            <p
              className="m-0 leading-[1.5]"
              style={{
                fontSize: "14.5px",
                color: "#9aa6bf",
                maxWidth: "360px",
              }}
            >
              {mode === "login"
                ? "Sign in to access your Playbeat Digital workspace"
                : "Create your account to join the Mystic AI workspace"}
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="w-full flex flex-col gap-[22px] p-8 rounded-[18px]"
          style={{
            background: "#0b1220",
            border: "1px solid #1c2740",
            boxShadow: "0 24px 60px -24px rgba(0,0,0,0.55)",
          }}
        >
          {/* Secure access row */}
          <div className="flex items-center gap-[9px]">
            <Shield width={17} height={17} style={{ color: "#5c8dff" }} />
            <span
              className="font-semibold"
              style={{ fontSize: "14px", color: "#dbe2f2" }}
            >
              Secure access
            </span>
          </div>

          {/* Segmented tabs */}
          <div
            role="tablist"
            aria-label="Account access"
            className="flex gap-1 p-1 rounded-[11px]"
            style={{ background: "#0f1726", border: "1px solid #1c2740" }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => setMode("login")}
              className="flex-1 cursor-pointer rounded-[8px] py-[10px] font-bold transition-colors"
              style={{
                background: mode === "login" ? "#1a2436" : "transparent",
                color: mode === "login" ? "#f3f5fb" : "#8691a8",
                fontSize: "13.5px",
                border: "none",
                fontFamily: "inherit",
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              onClick={() => setMode("register")}
              className="flex-1 cursor-pointer rounded-[8px] py-[10px] font-bold transition-colors"
              style={{
                background: mode === "register" ? "#1a2436" : "transparent",
                color: mode === "register" ? "#f3f5fb" : "#8691a8",
                fontSize: "13.5px",
                border: "none",
                fontFamily: "inherit",
              }}
            >
              Create account
            </button>
          </div>

          {/* Social sign-in */}
          <div className="flex flex-col gap-[10px]">
            <button
              type="button"
              onClick={() => handleSocial("Google")}
              className="flex items-center justify-center gap-[10px] w-full py-[11px] rounded-[10px] font-bold cursor-pointer transition-transform hover:scale-[1.01]"
              style={{
                background: "#ffffff",
                border: "1px solid #ffffff",
                color: "#1f2430",
                fontFamily: "inherit",
                fontSize: "14px",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.68-3.88 2.68-6.62z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.95 10.7a5.4 5.4 0 0 1 0-3.4V4.97H.95a9 9 0 0 0 0 8.06l3-2.33z" />
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleSocial("Facebook")}
              className="flex items-center justify-center gap-[10px] w-full py-[11px] rounded-[10px] font-bold cursor-pointer transition-transform hover:scale-[1.01]"
              style={{
                background: "#1877F2",
                border: "1px solid #1877F2",
                color: "#ffffff",
                fontFamily: "inherit",
                fontSize: "14px",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#ffffff" d="M18 9a9 9 0 1 0-10.4 8.89v-6.29H5.3V9h2.3V6.98c0-2.27 1.35-3.53 3.43-3.53.99 0 2.03.18 2.03.18v2.23h-1.14c-1.13 0-1.48.7-1.48 1.42V9h2.52l-.4 2.6h-2.12v6.29A9.06 9.06 0 0 0 18 9z" />
                <path fill="#1877F2" d="M12.5 11.6 12.9 9h-2.52V7.28c0-.72.35-1.42 1.48-1.42h1.14V3.63s-1.04-.18-2.03-.18c-2.08 0-3.43 1.26-3.43 3.53V9H5.3v2.6h2.3v6.29a9.06 9.06 0 0 0 2.83 0V11.6z" />
              </svg>
              Continue with Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "#1c2740" }} />
            <span
              className="whitespace-nowrap"
              style={{ fontSize: "12px", color: "#6c7792" }}
            >
              or continue with email
            </span>
            <div className="flex-1 h-px" style={{ background: "#1c2740" }} />
          </div>

          {/* Forms */}
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-[18px]">
              <div className="flex flex-col gap-[7px]">
                <label
                  htmlFor="login-email"
                  className="font-semibold"
                  style={{ fontSize: "13px", color: "#c6cedf" }}
                >
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-[13px] py-[11px] rounded-[10px] outline-none transition-colors"
                  style={{
                    background: "#0f1726",
                    border: "1px solid #243049",
                    color: "#e7ecf7",
                    fontFamily: "inherit",
                    fontSize: "14px",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#5c8dff")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#243049")}
                />
              </div>
              <div className="flex flex-col gap-[7px]">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="font-semibold"
                    style={{ fontSize: "13px", color: "#c6cedf" }}
                  >
                    Password
                  </label>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toast.info("Password reset coming soon");
                    }}
                    className="font-semibold"
                    style={{ fontSize: "12.5px", color: "#8fb4ff" }}
                  >
                    Forgot?
                  </a>
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-[13px] py-[11px] rounded-[10px] outline-none transition-colors"
                  style={{
                    background: "#0f1726",
                    border: "1px solid #243049",
                    color: "#e7ecf7",
                    fontFamily: "inherit",
                    fontSize: "14px",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#5c8dff")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#243049")}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-[13px] rounded-[10px] cursor-pointer font-bold transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(90deg, #4f7dff, #8a6cf0)",
                  border: "none",
                  color: "#ffffff",
                  fontFamily: "inherit",
                  fontSize: "14.5px",
                  boxShadow: "0 14px 28px -14px rgba(79,125,255,0.55)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-[18px]">
              <div className="flex flex-col gap-[7px]">
                <label
                  htmlFor="reg-name"
                  className="font-semibold"
                  style={{ fontSize: "13px", color: "#c6cedf" }}
                >
                  Name (optional)
                </label>
                <input
                  id="reg-name"
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-[13px] py-[11px] rounded-[10px] outline-none transition-colors"
                  style={{
                    background: "#0f1726",
                    border: "1px solid #243049",
                    color: "#e7ecf7",
                    fontFamily: "inherit",
                    fontSize: "14px",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#5c8dff")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#243049")}
                />
              </div>
              <div className="flex flex-col gap-[7px]">
                <label
                  htmlFor="reg-email"
                  className="font-semibold"
                  style={{ fontSize: "13px", color: "#c6cedf" }}
                >
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-[13px] py-[11px] rounded-[10px] outline-none transition-colors"
                  style={{
                    background: "#0f1726",
                    border: "1px solid #243049",
                    color: "#e7ecf7",
                    fontFamily: "inherit",
                    fontSize: "14px",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#5c8dff")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#243049")}
                />
              </div>
              <div className="flex flex-col gap-[7px]">
                <label
                  htmlFor="reg-password"
                  className="font-semibold"
                  style={{ fontSize: "13px", color: "#c6cedf" }}
                >
                  Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-[13px] py-[11px] rounded-[10px] outline-none transition-colors"
                  style={{
                    background: "#0f1726",
                    border: "1px solid #243049",
                    color: "#e7ecf7",
                    fontFamily: "inherit",
                    fontSize: "14px",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#5c8dff")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#243049")}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-[13px] rounded-[10px] cursor-pointer font-bold transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(90deg, #4f7dff, #8a6cf0)",
                  border: "none",
                  color: "#ffffff",
                  fontFamily: "inherit",
                  fontSize: "14.5px",
                  boxShadow: "0 14px 28px -14px rgba(79,125,255,0.55)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create account"
                )}
              </button>
              <p
                className="text-center m-0"
                style={{ fontSize: "12px", color: "#5f6a84" }}
              >
                The first account becomes the Super Admin
              </p>
            </form>
          )}
        </div>

        <p
          className="m-0 text-center"
          style={{ fontSize: "12.5px", color: "#5f6a84" }}
        >
          By continuing you agree to the Terms and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
