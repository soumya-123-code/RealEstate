"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { cms } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Award, HeadphonesIcon, Clock, Users, MapPin, Calendar,
  Building2, ArrowRight, Star, Handshake, Target, Eye,
} from "lucide-react";
import type { TeamMember, Partner, Service } from "@/lib/api";

const missionVision = [
  { icon: Target, title: "Our Mission", desc: "To simplify real estate transactions in Odisha by providing transparent, reliable, and customer-centric property services that build lasting trust." },
  { icon: Eye, title: "Our Vision", desc: "To become the most trusted and preferred real estate brand in Eastern India, setting new benchmarks in customer satisfaction and ethical business practices." },
];

const values = [
  { icon: Shield, label: "Transparency" },
  { icon: Handshake, label: "Integrity" },
  { icon: Award, label: "Excellence" },
  { icon: Users, label: "Customer First" },
];

export function AboutPageView() {
  const { teamMembers, setTeamMembers, partners, setPartners, setCurrentPage } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([cms.team(), cms.partners()]).then(([team, parts]) => {
      setTeamMembers(team);
      setPartners(parts);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const stats = { properties: 10, customers: 500, cities: 5, years: 12 };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/90 to-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">About Us</Badge>
          <h1 className="text-3xl md:text-4xl font-bold">About Suretreaven</h1>
          <p className="text-white/80 text-sm mt-3 max-w-xl mx-auto">
            Building trust, one home at a time. Your dedicated real estate partner in Odisha since 2014.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          {missionVision.map((item) => (
            <Card key={item.title} className="border-0 shadow-sm p-6 md:p-8">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <item.icon className="size-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-muted/50 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Building2, value: stats.properties, label: "Properties Listed" },
              { icon: Users, value: stats.customers, label: "Happy Customers" },
              { icon: MapPin, value: stats.cities, label: "Cities Covered" },
              { icon: Calendar, value: stats.years, label: "Years of Trust" },
            ].map((s) => (
              <Card key={s.label} className="border-0 shadow-sm text-center p-4">
                <s.icon className="size-5 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{s.value.toLocaleString()}+</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold">Our Core Values</h2>
          <p className="text-sm text-muted-foreground mt-1">Principles that guide everything we do</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {values.map((v) => (
            <Card key={v.label} className="border-0 shadow-sm p-5 text-center hover:shadow-md transition-shadow">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                <v.icon className="size-5" />
              </div>
              <h3 className="font-semibold text-sm">{v.label}</h3>
            </Card>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-muted/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold">Why Choose Us</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Shield, title: "RERA Certified", desc: "All properties verified and RERA registered." },
              { icon: Award, title: "12+ Years Experience", desc: "Trusted expertise in Odisha real estate." },
              { icon: HeadphonesIcon, title: "24/7 Support", desc: "Always available for your queries." },
              { icon: Clock, title: "Quick Processing", desc: "From search to registration, we handle it all." },
            ].map((item) => (
              <Card key={item.title} className="border-0 shadow-sm p-6 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <item.icon className="size-6" />
                </div>
                <h3 className="font-semibold text-sm mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold">Meet Our Team</h2>
          <p className="text-sm text-muted-foreground mt-1">The people behind your property success</p>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {teamMembers.map((member) => (
              <Card key={member.id} className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow text-center">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
                    {member.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm">{member.name}</h3>
                  <p className="text-xs text-primary mt-0.5">{member.designation}</p>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Partners */}
      {partners.length > 0 && (
        <section className="bg-muted/50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Our Partners</h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {partners.map((partner) => (
                <Card key={partner.id} className="border-0 shadow-sm px-6 py-4 hover:shadow-md transition-shadow">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                    {partner.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <span className="text-xs font-medium mt-2 block">{partner.name}</span>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">Let&apos;s Work Together</h2>
          <p className="text-primary-foreground/80 text-sm mb-6">Get in touch to discuss your property requirements</p>
          <Button size="lg" variant="secondary" className="gap-2" onClick={() => setCurrentPage("contact")}>
            Contact Us <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}