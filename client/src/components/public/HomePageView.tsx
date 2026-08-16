"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/store";
import { cms, propertiesApi } from "@/lib/api";
import { PropertyCard } from "./PropertyCard";
import type { Property } from "@/lib/mock-data";
import type { Service, Testimonial } from "@/lib/api";
import {
  Search, Building2, TrendingUp, KeyRound, Scale,
  Users, MapPin, Calendar, Star, ArrowRight, ChevronLeft, ChevronRight,
  Shield, Award, HeadphonesIcon, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const whyChooseUs = [
  { icon: Shield, title: "RERA Certified", desc: "All our properties are RERA registered ensuring complete transparency and legal compliance." },
  { icon: Award, title: "12+ Years Experience", desc: "Over a decade of trusted service helping families find their dream homes across Odisha." },
  { icon: HeadphonesIcon, title: "24/7 Support", desc: "Our dedicated support team is always available to assist you at every step of your journey." },
  { icon: Clock, title: "Quick Processing", desc: "Streamlined processes from property search to registration, saving you time and effort." },
];

export function HomePageView() {
  const { setCurrentPage, setSelectedPropertyId, setFeaturedProperties, featuredProperties, homeData, setHomeData } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchSaleType, setSearchSaleType] = useState("");
  const [testimIdx, setTestimIdx] = useState(0);

  useEffect(() => {
    cms.homepage().then((data) => {
      setHomeData(data);
      setFeaturedProperties(data.featuredProperties);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handlePropertyClick = (id: string) => {
    setSelectedPropertyId(id);
    setCurrentPage("single");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = () => {
    const filters: Record<string, string> = {};
    if (searchCity) filters.city = searchCity;
    if (searchType) filters.type = searchType;
    useAppStore.getState().setPropertyFilters(filters);
    setCurrentPage("list");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const testimonialList = homeData?.testimonials || [];
  useEffect(() => {
    if (testimonialList.length === 0) return;
    const timer = setInterval(() => {
      setTestimIdx((i) => (i + 1) % testimonialList.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonialList.length]);

  if (loading) return <HomePageSkeleton />;

  const stats = homeData?.stats || { properties: 10, customers: 500, cities: 5, years: 12 };
  const services = homeData?.services || [];

  const serviceIcons: Record<string, React.ElementType> = { Building2, TrendingUp, KeyRound, Scale };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/90 via-primary to-primary/80 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/properties/prop8.jpg')] bg-cover bg-center" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-white/20 text-white border-white/30 hover:bg-white/20">
              #1 Real Estate Platform in Odisha
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Find Your Dream Property in Odisha
            </h1>
            <p className="text-white/80 text-sm md:text-base mb-8 max-w-xl mx-auto">
              Discover premium apartments, villas, plots, and commercial spaces across Bhubaneswar, Cuttack, and beyond.
            </p>

            {/* Search Bar */}
            <div className="bg-white rounded-xl p-2 shadow-xl flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <select
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-lg bg-muted/50 text-sm text-foreground border-0 outline-none appearance-none cursor-pointer"
                >
                  <option value="">Select City</option>
                  <option value="Bhubaneswar">Bhubaneswar</option>
                  <option value="Cuttack">Cuttack</option>
                  <option value="Rourkela">Rourkela</option>
                  <option value="Puri">Puri</option>
                </select>
              </div>
              <div className="flex-1 relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-lg bg-muted/50 text-sm text-foreground border-0 outline-none appearance-none cursor-pointer"
                >
                  <option value="">Property Type</option>
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="plot">Plot</option>
                  <option value="commercial">Commercial</option>
                  <option value="penthouse">Penthouse</option>
                  <option value="independent-house">Independent House</option>
                </select>
              </div>
              <Button onClick={handleSearch} className="h-11 px-6 gap-2">
                <Search className="size-4" /> Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-8 z-10 max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Building2, value: stats.properties, label: "Properties Listed" },
            { icon: Users, value: stats.customers, label: "Happy Customers" },
            { icon: MapPin, value: stats.cities, label: "Cities Covered" },
            { icon: Calendar, value: stats.years, label: "Years of Trust" },
          ].map((s) => (
            <Card key={s.label} className="border-0 shadow-md text-center p-4">
              <s.icon className="size-5 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">{s.value.toLocaleString()}+</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured Properties */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Featured Properties</h2>
            <p className="text-sm text-muted-foreground mt-1">Handpicked properties just for you</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setCurrentPage("list")}>
            View All <ArrowRight className="size-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredProperties.map((p) => (
            <PropertyCard key={p.id} property={p} onClick={() => handlePropertyClick(p.id)} />
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-muted/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold">Why Choose Suretreaven?</h2>
            <p className="text-sm text-muted-foreground mt-1">We make property transactions simple and transparent</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {whyChooseUs.map((item) => (
              <Card key={item.title} className="border-0 shadow-sm hover:shadow-md transition-shadow p-6 text-center group">
                <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <item.icon className="size-6" />
                </div>
                <h3 className="font-semibold text-sm mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold">What Our Clients Say</h2>
          <p className="text-sm text-muted-foreground mt-1">Trusted by hundreds of happy homeowners</p>
        </div>
        {testimonialList.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="relative bg-card border rounded-xl p-8 text-center shadow-sm">
              <div className="flex justify-center gap-0.5 mb-4">
                {Array.from({ length: testimonialList[testimIdx].rating }).map((_, i) => (
                  <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 mb-6 italic">
                &ldquo;{testimonialList[testimIdx].text}&rdquo;
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {testimonialList[testimIdx].name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm">{testimonialList[testimIdx].name}</div>
                  <div className="text-xs text-muted-foreground">{testimonialList[testimIdx].role}</div>
                </div>
              </div>
              <div className="flex justify-center gap-2 mt-6">
                {testimonialList.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTestimIdx(i)}
                    className={cn("size-2 rounded-full transition-colors", i === testimIdx ? "bg-primary" : "bg-muted-foreground/20")}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Find Your Dream Home?</h2>
          <p className="text-primary-foreground/80 text-sm mb-6 max-w-lg mx-auto">
            Let our expert agents guide you to the perfect property. Schedule a free consultation today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" variant="secondary" onClick={() => setCurrentPage("contact")} className="gap-2">
              Contact Us <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setCurrentPage("list")}>
              Browse Properties
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function HomePageSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="bg-primary h-80 md:h-96" />
      <div className="max-w-5xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}