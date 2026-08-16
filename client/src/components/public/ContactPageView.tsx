"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { cms } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Phone, Mail, Clock, Send, MessageCircle, User,
  Building2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ContactPageView() {
  const { setCurrentPage, setAppMode, setCurrentView, setActiveConversationId, setChatMobileShowMessages } = useAppStore();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await cms.contact(form);
      toast({ title: "Success", description: "Your message has been sent. We'll get back to you soon!" });
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      toast({ title: "Error", description: "Failed to send message. Please try again.", variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handleOpenChat = () => {
    setAppMode("chat");
    setActiveConversationId("CONV001");
    setChatMobileShowMessages(false);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/90 to-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold">Contact Us</h1>
          <p className="text-white/80 text-sm mt-3 max-w-xl mx-auto">
            Have a question or need assistance? We&apos;re here to help you with all your real estate needs.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main */}
          <div className="flex-1 min-w-0">
            <Tabs defaultValue="form" className="w-full">
              <TabsList className="w-full grid grid-cols-2 mb-6">
                <TabsTrigger value="form" className="gap-2">
                  <Send className="size-4" /> Contact Form
                </TabsTrigger>
                <TabsTrigger value="chat" className="gap-2" onClick={handleOpenChat}>
                  <MessageCircle className="size-4" /> Live Chat
                </TabsTrigger>
              </TabsList>

              <TabsContent value="form">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Send us a Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name *</Label>
                          <Input id="name" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input id="email" type="email" placeholder="your@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input id="phone" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject</Label>
                          <Input id="subject" placeholder="Property inquiry" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea id="message" placeholder="Tell us about your requirements..." rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
                      </div>
                      <Button type="submit" className="w-full gap-2" disabled={submitting}>
                        <Send className="size-4" /> {submitting ? "Sending..." : "Send Message"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat">
                <Card className="border-0 shadow-sm p-8 text-center">
                  <MessageCircle className="size-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Start a Live Chat</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Our team is available to help you in real-time. Click below to start chatting with one of our agents.
                  </p>
                  <Button className="gap-2" onClick={handleOpenChat}>
                    <MessageCircle className="size-4" /> Open Chat
                  </Button>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80 shrink-0 space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-5">
                <h3 className="font-semibold text-sm">Contact Information</h3>
                {[
                  { icon: MapPin, label: "Address", value: "Plot No. 45, Saheed Nagar, Bhubaneswar, Odisha - 751007" },
                  { icon: Phone, label: "Phone", value: "+91 98765 43210" },
                  { icon: Mail, label: "Email", value: "info@greenvalley.in" },
                  { icon: Clock, label: "Working Hours", value: "Mon - Sat: 9:00 AM - 7:00 PM" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <item.icon className="size-4" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                      <div className="text-sm font-medium">{item.value}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-primary/5">
              <CardContent className="p-6 text-center">
                <Building2 className="size-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-sm mb-1">Visit Our Office</h3>
                <p className="text-xs text-muted-foreground">
                  Come meet us in person! Our office is in the heart of Bhubaneswar with easy parking access.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}