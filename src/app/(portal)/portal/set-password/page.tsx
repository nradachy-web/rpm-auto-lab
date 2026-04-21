"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { Lock, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

function strength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

export default function SetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const s = useMemo(() => strength(password), [password]);

  useEffect(() => {
    if (!token) setError("This link is missing a token. Please use the full link from your email.");
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setLoading(true);
    const res = await api.post<{ user: { role: string } }>("/api/auth/set-password", { token, password });
    setLoading(false);
    if (!res.ok) return setError(res.error || "Couldn't set your password.");
    router.push("/portal/dashboard");
  };

  const inputClass =
    "w-full pl-10 pr-4 py-3 bg-rpm-charcoal border border-rpm-gray rounded-lg text-rpm-white placeholder-rpm-silver focus:border-rpm-red focus:outline-none focus:ring-1 focus:ring-rpm-red/50 transition-colors";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="max-w-md mx-auto py-16 px-6"
    >
      <div className="bg-rpm-dark border border-rpm-gray rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-rpm-white mb-2">Set your password</h1>
        <p className="text-rpm-silver text-sm mb-6">
          Create a password for your RPM Auto Lab portal so you can log in anytime.
        </p>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-5 rounded-lg bg-rpm-red/10 border border-rpm-red/30 text-rpm-red text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-rpm-silver mb-2">New password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rpm-silver" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className={inputClass}
                placeholder="At least 8 characters"
              />
            </div>
            {password && (
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded ${i <= s ? "bg-rpm-red" : "bg-rpm-gray"}`} />
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-rpm-silver mb-2">Confirm password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rpm-silver" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className={inputClass}
                placeholder="Re-type your new password"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading || !token} className="w-full">
            {loading ? "Saving..." : "Set password & sign in"}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
