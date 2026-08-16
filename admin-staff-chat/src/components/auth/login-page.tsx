"use client";

import { useState } from "react";
import { useChatStore } from "@/lib/store";
import { authApi, setToken, setUser, clearAuth } from "@/lib/api";
import { MessageSquare, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";

export function LoginPage() {
  const { setAuth } = useChatStore();
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordLogin, setIsPasswordLogin] = useState(false);
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setLoading(true);
    setError("");

    try {
      if (isPasswordLogin) {
        // Password-based login for admin/staff
        const res = await authApi.login(identifier, password);
        handleLoginSuccess(res);
      } else {
        // OTP-based login
        if (step === "input") {
          // Request OTP
          await authApi.login(identifier);
          setStep("otp");
        } else {
          // Verify OTP
          if (otp.length < 4) {
            setError("Enter a valid OTP");
            return;
          }
          const res = await authApi.verifyOtp(identifier, otp);
          handleLoginSuccess(res);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (res: { user: { id: number; username: string; email: string; role: string; avatar?: string; isActive: boolean; phone?: string }; token: string }) => {
    const user = res.user;
    // Only allow ADMIN and STAFF roles
    if (user.role !== "ADMIN" && user.role !== "STAFF") {
      setError("Access denied. Only admin and staff can use this app.");
      return;
    }
    if (!user.isActive) {
      setError("Your account is deactivated. Contact admin.");
      return;
    }
    setToken(res.token);
    setUser(user);
    setAuth(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role as "ADMIN" | "STAFF",
        isActive: user.isActive,
      },
      res.token
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 25px 25px, white 2px, transparent 0)",
          backgroundSize: "50px 50px"
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-600/30">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Staff Chat</h1>
          <p className="text-slate-400 mt-1 text-sm">Admin & Staff Communication Hub</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">
              {step === "otp" ? "Verify OTP" : "Sign In"}
            </h2>
            {step === "otp" && (
              <button
                onClick={() => { setStep("input"); setOtp(""); setError(""); }}
                className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
          </div>

          {/* Tab Toggle */}
          <div className="flex mb-5 bg-white/5 rounded-xl p-1">
            <button
              onClick={() => { setIsPasswordLogin(false); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                !isPasswordLogin
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              OTP Login
            </button>
            <button
              onClick={() => { setIsPasswordLogin(true); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                isPasswordLogin
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Password
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Identifier */}
            {step === "input" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  {isPasswordLogin ? "Email or Username" : "Email or Phone"}
                </label>
                <input
                  type={isPasswordLogin ? "text" : "text"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={isPasswordLogin ? "admin@greenvalley.com" : "Email or +91 phone number"}
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                  autoComplete="username"
                />
              </div>
            )}

            {/* Password (if password login) */}
            {isPasswordLogin && step === "input" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 pr-10 text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* OTP Input */}
            {step === "otp" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Enter OTP sent to {identifier}
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 4-6 digit OTP"
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm tracking-widest text-center text-lg"
                  maxLength={6}
                  autoFocus
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || (!isPasswordLogin && step === "input" ? !identifier.trim() : !identifier.trim())}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : step === "otp" ? (
                "Verify & Login"
              ) : isPasswordLogin ? (
                "Sign In"
              ) : (
                "Send OTP"
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-xs mt-5">
            Green Valley Properties &bull; Staff Communication
          </p>
        </div>
      </div>
    </div>
  );
}