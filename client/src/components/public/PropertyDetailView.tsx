"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { propertiesApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Bed, Bath, Maximize, MapPin, Calendar, Building2, Tag, Phone, Mail,
  MessageCircle, ArrowLeft, Share2, Heart, ChevronLeft, ChevronRight,
  CheckCircle2, Home, Layers, TagIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Property } from "@/lib/mock-data";

const statusColors: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700 border-emerald-200",
  booked: "bg-amber-100 text-amber-700 border-amber-200",
  sold: "bg-red-100 text-red-700 border-red-200",
  "under-construction": "bg-sky-100 text-sky-700 border-sky-200",
};

export function PropertyDetailView() {
  const { selectedPropertyId, selectedProperty, setSelectedProperty, setCurrentPage } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!selectedPropertyId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const p = await propertiesApi.detail(selectedPropertyId);
        if (!cancelled) {
          setSelectedProperty(p);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedPropertyId]);

  if (loading) return <DetailSkeleton />;
  if (!selectedProperty) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="font-semibold">Property not found</h3>
          <Button variant="outline" className="mt-3" onClick={() => setCurrentPage("list")}>Back to Properties</Button>
        </div>
      </div>
    );
  }

  const p = selectedProperty;
  const allImages = [p.image, ...Array.from({ length: 3 }).map((_, i) => p.image)]; // Simulate multiple images

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          onClick={() => setCurrentPage("list")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to Properties
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Image Gallery */}
            <div className="space-y-3">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-muted">
                <img
                  src={allImages[activeImage] || p.image}
                  alt={p.title}
                  className="size-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <Button size="icon" variant="secondary" className="size-9 rounded-full bg-white/90 backdrop-blur-sm" onClick={() => setLiked(!liked)}>
                    <Heart className={cn("size-4", liked ? "fill-red-500 text-red-500" : "")} />
                  </Button>
                  <Button size="icon" variant="secondary" className="size-9 rounded-full bg-white/90 backdrop-blur-sm">
                    <Share2 className="size-4" />
                  </Button>
                </div>
                <div className="absolute bottom-3 left-3">
                  <Badge variant="outline" className={cn("text-xs font-semibold backdrop-blur-sm bg-white/90", statusColors[p.status])}>
                    {p.status.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors",
                      activeImage === i ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt="" className="size-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold">{p.title}</h1>
                  <div className="flex items-center gap-1.5 text-muted-foreground mt-1.5">
                    <MapPin className="size-4 shrink-0" />
                    <span className="text-sm">{p.location}, {p.city}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold text-primary">₹{p.pricePerUnit}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">₹{(p.price).toLocaleString("en-IN")}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                <Calendar className="size-3" />
                Posted on {new Date(p.postedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Maximize, label: "Area", value: `${p.area.toLocaleString()} sqft` },
                { icon: Building2, label: "Type", value: p.type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) },
                { icon: TagIcon, label: "Sale Type", value: "Sale" },
                { icon: Home, label: "Status", value: p.status.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) },
              ].map((item) => (
                <Card key={item.label} className="border-0 shadow-sm p-3 text-center">
                  <item.icon className="size-4 text-primary mx-auto mb-1.5" />
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="text-sm font-semibold mt-0.5">{item.value}</div>
                </Card>
              ))}
            </div>

            {/* Description */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Description</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Amenities</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {p.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-primary shrink-0" />
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Property Features</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Bedrooms", value: p.bedrooms, icon: Bed },
                    { label: "Bathrooms", value: p.bathrooms, icon: Bath },
                    { label: "Area", value: `${p.area.toLocaleString()} sqft`, icon: Maximize },
                    { label: "Floor", value: p.floor, icon: Layers },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <f.icon className="size-5 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground">{f.label}</div>
                        <div className="text-sm font-semibold">{f.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 shrink-0 space-y-4">
            <Card className="border-0 shadow-md sticky top-20">
              <CardContent className="p-6 space-y-4">
                <div>
                  <div className="text-2xl font-bold text-primary">₹{p.pricePerUnit}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">₹{(p.price).toLocaleString("en-IN")}</div>
                </div>

                <Button className="w-full gap-2" size="lg" onClick={() => {
                  propertiesApi.whatsappBooking(p.id, "+919876543210", "User");
                }}>
                  <MessageCircle className="size-4" /> Book via WhatsApp
                </Button>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Phone className="size-4" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Call Us</div>
                      <div className="text-sm font-medium">+91 98765 43210</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Mail className="size-4" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Email</div>
                      <div className="text-sm font-medium">info@greenvalley.in</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <Card className="bg-primary/5 border-0 p-4">
                  <h4 className="text-sm font-semibold mb-2">Interested in this property?</h4>
                  <p className="text-xs text-muted-foreground">
                    Contact our agent to schedule a site visit or get more details about pricing and payment plans.
                  </p>
                </Card>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="aspect-[16/9] rounded-xl" />
      <Skeleton className="h-8 w-72" />
      <div className="grid grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      <Skeleton className="h-40 rounded-lg" />
    </div>
  );
}