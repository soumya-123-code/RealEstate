"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { auth } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Landmark, Mail, Phone, ArrowRight, ArrowLeft, RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function LoginPageView() {
  const {
    loginTab, setLoginTab, loginStep, setLoginStep,
    loginIdentifier, setLoginIdentifier, loginOtp, setLoginOtp,
    isAuthenticated, setIsAuthenticated, setCurrentUser, setToken,
    setCurrentPage, setAppMode, setCurrentView, currentUser,
  } = useAppStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{ exists: boolean; userType: string; maskedValue: string } | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  // If already logged in, redirect
  if (isAuthenticated && currentUser) {
    if (currentUser.role === "admin") {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="border-0 shadow-sm p-8 text-center max-w-sm w-full mx-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-4 text-2xl font-bold">
              {currentUser.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <h2 className="font-semibold text-lg">Welcome back, {currentUser.name.split(" ")[0]}!</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-4">You are already logged in.</p>
            <div className="space-y-2">
              <Button className="w-full gap-2" onClick={() => { setAppMode("admin"); setCurrentView("dashboard"); }}>
                <Landmark className="size-4" /> Go to Admin Panel
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setCurrentPage("home")}>
                Go to Homepage
              </Button>
            </div>
          </Card>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="border-0 shadow-sm p-8 text-center max-w-sm w-full mx-4">
          <h2 className="font-semibold text-lg">Welcome, {currentUser.name}!</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">You are already logged in.</p>
          <Button className="w-full" onClick={() => setCurrentPage("home")}>Go to Homepage</Button>
        </Card>
      </div>
    );
  }

  const handlePreview = async () => {
    if (!loginIdentifier) return;
    setLoading(true);
    try {
      const data = await auth.preview(loginIdentifier);
      setPreviewData(data);
      setLoginStep("preview");
    } catch {
      toast({ title: "Error", description: "Failed to verify. Please try again.", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleSendOtp = () => {
    setLoginStep("otp");
    setLoginOtp("");
    setResendTimer(30);
    setTimeout(() => { if (otpRefs.current[0]) otpRefs.current[0]?.focus(); }, 100);
  };

  const handleVerifyOtp = async () => {
    if (loginOtp.length !== 6) {
      toast({ title: "Error", description: "Please enter the 6-digit OTP.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await auth.login(loginIdentifier, loginOtp);
      setCurrentUser(data.user);
      setToken(data.token);
      setIsAuthenticated(true);
      toast({ title: "Welcome!", description: `Logged in as ${data.user.name}` });
      if (data.user.role === "admin") {
        setAppMode("admin");
        setCurrentView("dashboard");
      } else {
        setCurrentPage("home");
      }
    } catch {
      toast({ title: "Error", description: "Invalid OTP. Please try again.", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleOtpInput = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^\d*$/.test(value)) return;
    const newOtp = loginOtp.split("");
    newOtp[index] = value;
    const joined = newOtp.join("");
    setLoginOtp(joined);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !loginOtp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="border-0 shadow-lg max-w-md w-full">
        <CardHeader className="text-center pb-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mx-auto mb-3">
            <Landmark className="size-6" />
          </div>
          <CardTitle className="text-xl">Welcome Back</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Log in to your Suretreaven account</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tab Switcher */}
          <div className="flex rounded-lg bg-muted p-1">
            <button
              onClick={() => { setLoginTab("email"); setLoginStep("input"); setLoginIdentifier(""); }}
              className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors", loginTab === "email" ? "bg-background shadow-sm" : "text-muted-foreground")}
            >
              <Mail className="size-3.5" /> Email
            </button>
            <button
              onClick={() => { setLoginTab("phone"); setLoginStep("input"); setLoginIdentifier(""); }}
              className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors", loginTab === "phone" ? "bg-background shadow-sm" : "text-muted-foreground")}
            >
              <Phone className="size-3.5" /> Phone
            </button>
          </div>

          {/* Step 1: Input */}
          {loginStep === "input" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{loginTab === "email" ? "Email Address" : "Phone Number"}</Label>
                <div className="relative">
                  {loginTab === "email" ? (
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  ) : (
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  )}
                  <Input
                    placeholder={loginTab === "email" ? "you@example.com" : "+91 XXXXX XXXXX"}
                    className="pl-10 h-11"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePreview()}
                    autoFocus
                  />
                </div>
              </div>
              <Button className="w-full gap-2" onClick={handlePreview} disabled={!loginIdentifier || loading}>
                {loading ? "Verifying..." : "Continue"} <ArrowRight className="size-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Preview */}
          {loginStep === "preview" && previewData && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">We found an account</p>
                <p className="font-semibold mt-1">{previewData.maskedValue}</p>
                <Badge variant="secondary" className="mt-2 capitalize">{previewData.userType}</Badge>
              </div>
              <div className="space-y-2">
                <Button className="w-full" onClick={handleSendOtp}>Send OTP</Button>
                <Button variant="ghost" className="w-full gap-2" onClick={() => setLoginStep("input")}>
                  <ArrowLeft className="size-4" /> Change
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: OTP */}
          {loginStep === "otp" && (
            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Enter the 6-digit OTP sent to {previewData?.maskedValue || loginIdentifier}
              </p>
              <div className="flex justify-center gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    className="w-11 h-12 text-center text-lg font-bold"
                    maxLength={1}
                    value={loginOtp[i] || ""}
                    onChange={(e) => handleOtpInput(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <div className="text-center">
                {resendTimer > 0 ? (
                  <span className="text-xs text-muted-foreground">Resend OTP in {resendTimer}s</span>
                ) : (
                  <button onClick={() => setResendTimer(30)} className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto">
                    <RefreshCw className="size-3" /> Resend OTP
                  </button>
                )}
              </div>
              <Button className="w-full" onClick={handleVerifyOtp} disabled={loginOtp.length !== 6 || loading}>
                {loading ? "Verifying..." : "Verify & Login"}
              </Button>
              <Button variant="ghost" className="w-full gap-2" onClick={() => setLoginStep("preview")}>
                <ArrowLeft className="size-4" /> Back
              </Button>
            </div>
          )}

          {/* Register link */}
          <div className="text-center text-sm text-muted-foreground pt-2">
            Don&apos;t have an account?{" "}
            <button onClick={() => setCurrentPage("register")} className="text-primary font-medium hover:underline">
              Sign up
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}