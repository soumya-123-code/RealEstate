"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Maximize, MapPin } from "lucide-react";
import type { Property, PropertyStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const statusColors: Record<PropertyStatus, string> = {
  available: "bg-emerald-100 text-emerald-700 border-emerald-200",
  booked: "bg-amber-100 text-amber-700 border-amber-200",
  sold: "bg-red-100 text-red-700 border-red-200",
  "under-construction": "bg-sky-100 text-sky-700 border-sky-200",
};

const typeLabels: Record<string, string> = {
  apartment: "Apartment",
  villa: "Villa",
  plot: "Plot",
  commercial: "Commercial",
  penthouse: "Penthouse",
  "independent-house": "Independent House",
};

interface PropertyCardProps {
  property: Property;
  onClick?: () => void;
}

export function PropertyCard({ property, onClick }: PropertyCardProps) {
  return (
    <Card
      className="group overflow-hidden cursor-pointer border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <div className="absolute inset-0 bg-muted">
          <img
            src={property.image}
            alt={property.title}
            className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge variant="outline" className={cn("text-[10px] font-semibold backdrop-blur-sm", statusColors[property.status])}>
            {property.status.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="text-[10px] font-medium backdrop-blur-sm bg-black/50 text-white border-0">
            {typeLabels[property.type] || property.type}
          </Badge>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <span className="text-white font-bold text-lg">₹{property.pricePerUnit}</span>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {property.title}
        </h3>
        <div className="flex items-center gap-1 mt-1.5 text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          <span className="text-xs truncate">{property.location}</span>
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t text-muted-foreground">
          {property.bedrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bed className="size-3.5" />
              <span className="text-xs">{property.bedrooms} Bed</span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bath className="size-3.5" />
              <span className="text-xs">{property.bathrooms} Bath</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Maximize className="size-3.5" />
            <span className="text-xs">{property.area.toLocaleString()} sqft</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}