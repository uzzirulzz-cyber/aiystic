"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

import { AuthScreen } from "@/components/mystic/auth-screen";
import { Workspace } from "@/components/mystic/workspace";
import { AdminPanel } from "@/components/mystic/admin-panel";
import { LandingHero } from "@/components/mystic/landing-hero";
import { Toaster } from "@/components/ui/toaster";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "USER";
  status: string;
  avatarUrl?: string | null;
  createdAt?: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"landing" | "auth" | "workspace" | "admin">("landing");

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setView("workspace");
      } else {
        setUser(null);
        setView("landing");
      }
    } catch {
      setUser(null);
      setView("landing");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleAuthSuccess = (user: User) => {
    setUser(user);
    setView("workspace");
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setView("landing");
  };

  const handleNavigate = (target: "workspace" | "admin" | "landing" | "auth") => {
    setView(target);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <Sparkles className="w-12 h-12 text-mystic-blue" style={{ color: "var(--mystic-blue)" }} />
            <motion.div
              className="absolute inset-0 blur-xl"
              style={{ background: "radial-gradient(circle, var(--mystic-blue) 0%, transparent 70%)" }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Initializing Mystic AI…</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {view === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LandingHero
              onGetStarted={() => setView("auth")}
              onSignIn={() => setView("auth")}
            />
          </motion.div>
        )}

        {view === "auth" && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AuthScreen onSuccess={handleAuthSuccess} onBack={() => setView("landing")} />
          </motion.div>
        )}

        {view === "workspace" && user && (
          <motion.div
            key="workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Workspace
              user={user}
              onLogout={handleLogout}
              onNavigate={handleNavigate}
            />
          </motion.div>
        )}

        {view === "admin" && user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
          <motion.div
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AdminPanel
              user={user}
              onLogout={handleLogout}
              onNavigate={handleNavigate}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster />
    </>
  );
}
