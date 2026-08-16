"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { auth } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Landmark, Mail, Phone, User, ArrowRight, ArrowLeft, RefreshCw, Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function RegisterPageView() {
  const {
    registerStep, setRegisterStep, registerForm, setRegisterForm,
    registerOtp, setRegisterOtp,
    setIsAuthenticated, setCurrentUser, setToken, setCurrentPage,
  } = useAppStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.username || !registerForm.email || !registerForm.phone) {
      toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
      toast({ title: "Error", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await auth.preview(registerForm.email);
      setRegisterStep(2);
      setRegisterOtp("");
      setResendTimer(30);
      setTimeout(() => { if (otpRefs.current[0]) otpRefs.current[0]?.focus(); }, 100);
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (registerOtp.length !== 6) {
      toast({ title: "Error", description: "Please enter the 6-digit OTP.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await auth.register({ ...registerForm, otp: registerOtp });
      setCurrentUser(data.user);
      setToken(data.token);
      setIsAuthenticated(true);
      toast({ title: "Welcome!", description: "Account created successfully!" });
      setCurrentPage("home");
    } catch {
      toast({ title: "Error", description: "Invalid OTP. Please try again.", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleOtpInput = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^\d*$/.test(value)) return;
    const newOtp = registerOtp.split("");
    newOtp[index] = value;
    setRegisterOtp(newOtp.join(""));
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !registerOtp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="border-0 shadow-lg max-w-md w-full">
        <CardHeader className="text-center pb-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mx-auto mb-3">
            <Landmark className="size-6" />
          </div>
          <CardTitle className="text-xl">Create Account</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Join Suretreaven today</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className={cn("flex items-center gap-1.5", registerStep === 1 ? "text-primary" : "text-muted-foreground")}>
              <div className={cn("flex size-7 items-center justify-center rounded-full text-xs font-bold",
                registerStep === 1 ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
              )}>
                {registerStep > 1 ? <Check className="size-3.5" /> : "1"}
              </div>
              <span className="text-xs font-medium">Details</span>
            </div>
            <div className="h-px w-8 bg-border" />
            <div className={cn("flex items-center gap-1.5", registerStep === 2 ? "text-primary" : "text-muted-foreground")}>
              <div className={cn("flex size-7 items-center justify-center rounded-full text-xs font-bold",
                registerStep === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                2
              </div>
              <span className="text-xs font-medium">Verify</span>
            </div>
          </div>

          {/* Step 1: Details */}
          {registerStep === 1 && (
            <form onSubmit={handleStep1} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="username">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input id="username" placeholder="Your full name" className="pl-10 h-11" value={registerForm.username} onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })} autoFocus />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@example.com" className="pl-10 h-11" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input id="phone" placeholder="+91 XXXXX XXXXX" className="pl-10 h-11" value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} />
                </div>
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? "Sending OTP..." : "Continue"} <ArrowRight className="size-4" />
              </Button>
            </form>
          )}

          {/* Step 2: OTP */}
          {registerStep === 2 && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">We&apos;ve sent a verification OTP to</p>
                <p className="font-semibold mt-1">{registerForm.email}</p>
              </div>
              <div className="flex justify-center gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    className="w-11 h-12 text-center text-lg font-bold"
                    maxLength={1}
                    value={registerOtp[i] || ""}
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
              <Button className="w-full" onClick={handleVerifyOtp} disabled={registerOtp.length !== 6 || loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
              <Button variant="ghost" className="w-full gap-2" onClick={() => setRegisterStep(1)}>
                <ArrowLeft className="size-4" /> Back
              </Button>
            </div>
          )}

          {/* Login link */}
          <div className="text-center text-sm text-muted-foreground pt-2">
            Already have an account?{" "}
            <button onClick={() => { setCurrentPage("login"); setRegisterStep(1); setRegisterForm({ username: "", email: "", phone: "" }); }} className="text-primary font-medium hover:underline">
              Log in
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}