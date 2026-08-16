"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { propertiesApi, type PropertyFilters } from "@/lib/api";
import { PropertyCard } from "./PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  Building2, Home, Grid3X3, ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Property } from "@/lib/mock-data";

const statusTabs = ["All", "Available", "Booked", "Sold", "Under Construction"];

export function PropertiesListView() {
  const { properties, setProperties, selectedPropertyId, setSelectedPropertyId, setCurrentPage, propertyFilters, setPropertyFilters } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const res = await propertiesApi.list({
          search: propertyFilters.search || undefined,
          city: propertyFilters.city || undefined,
          type: propertyFilters.type || undefined,
          status: propertyFilters.status || undefined,
          sort: propertyFilters.sort || "newest",
          minBeds: propertyFilters.minBeds ? parseInt(propertyFilters.minBeds) : undefined,
          minBaths: propertyFilters.minBaths ? parseInt(propertyFilters.minBaths) : undefined,
          minArea: propertyFilters.minArea ? parseInt(propertyFilters.minArea) : undefined,
          maxArea: propertyFilters.maxArea ? parseInt(propertyFilters.maxArea) : undefined,
          minPrice: propertyFilters.minPrice ? parseInt(propertyFilters.minPrice) * 100000 : undefined,
          maxPrice: propertyFilters.maxPrice ? parseInt(propertyFilters.maxPrice) * 100000 : undefined,
          page: propertyFilters.page,
          limit: 9,
        });
        if (!cancelled) {
          setProperties(res.data);
          setPropertyFilters({ total: res.total, totalPages: res.totalPages });
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProperties();
    return () => { cancelled = true; };
  }, [propertyFilters.search, propertyFilters.city, propertyFilters.type, propertyFilters.status, propertyFilters.minBeds, propertyFilters.minBaths, propertyFilters.minArea, propertyFilters.maxArea, propertyFilters.minPrice, propertyFilters.maxPrice, propertyFilters.sort, propertyFilters.page, setProperties, setPropertyFilters]);

  const handlePropertyClick = (id: string) => {
    setSelectedPropertyId(id);
    setCurrentPage("single");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setPropertyFilters({ search: "", city: "", type: "", status: "", minPrice: "", maxPrice: "", minBeds: "", minBaths: "", minArea: "", maxArea: "", sort: "newest", page: 1 });
  };

  const statusFilterMap: Record<string, string> = { All: "", Available: "available", Booked: "booked", Sold: "sold", "Under Construction": "under-construction" };
  const [activeStatus, setActiveStatus] = useState("All");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl md:text-3xl font-bold">Browse Properties</h1>
          <p className="text-sm text-muted-foreground mt-1">Find your perfect property from our curated listings</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className={cn(
            "lg:w-72 shrink-0 space-y-4",
            propertyFilters.showFilters ? "block" : "hidden lg:block"
          )}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Filters</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={clearFilters}>Clear All</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                    <Input placeholder="Title, location..." className="h-9 text-sm pl-8" value={propertyFilters.search} onChange={(e) => setPropertyFilters({ search: e.target.value, page: 1 })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">City</label>
                  <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={propertyFilters.city} onChange={(e) => setPropertyFilters({ city: e.target.value, page: 1 })}>
                    <option value="">All Cities</option>
                    <option value="Bhubaneswar">Bhubaneswar</option>
                    <option value="Cuttack">Cuttack</option>
                    <option value="Rourkela">Rourkela</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type</label>
                  <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={propertyFilters.type} onChange={(e) => setPropertyFilters({ type: e.target.value, page: 1 })}>
                    <option value="">All Types</option>
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="plot">Plot</option>
                    <option value="commercial">Commercial</option>
                    <option value="penthouse">Penthouse</option>
                    <option value="independent-house">Independent House</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Min Beds</label>
                  <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={propertyFilters.minBeds} onChange={(e) => setPropertyFilters({ minBeds: e.target.value, page: 1 })}>
                    <option value="">Any</option>
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sort By</label>
                  <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={propertyFilters.sort} onChange={(e) => setPropertyFilters({ sort: e.target.value, page: 1 })}>
                    <option value="newest">Newest First</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="area-desc">Largest Area</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Status Tabs + Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {statusTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setActiveStatus(tab); setPropertyFilters({ status: statusFilterMap[tab], page: 1 }); }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                      activeStatus === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden gap-1.5"
                  onClick={() => setPropertyFilters({ showFilters: !propertyFilters.showFilters })}
                >
                  <SlidersHorizontal className="size-3.5" /> Filters
                </Button>
                <span className="text-xs text-muted-foreground">{propertyFilters.total} properties</span>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-16">
                <Building2 className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-semibold">No properties found</h3>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {properties.map((p) => (
                    <PropertyCard key={p.id} property={p} onClick={() => handlePropertyClick(p.id)} />
                  ))}
                </div>

                {/* Pagination */}
                {propertyFilters.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button variant="outline" size="icon" className="size-8" disabled={propertyFilters.page <= 1} onClick={() => setPropertyFilters({ page: propertyFilters.page - 1 })}>
                      <ChevronLeft className="size-4" />
                    </Button>
                    {Array.from({ length: propertyFilters.totalPages }).map((_, i) => (
                      <Button key={i} variant={propertyFilters.page === i + 1 ? "default" : "outline"} size="icon" className="size-8" onClick={() => setPropertyFilters({ page: i + 1 })}>
                        {i + 1}
                      </Button>
                    ))}
                    <Button variant="outline" size="icon" className="size-8" disabled={propertyFilters.page >= propertyFilters.totalPages} onClick={() => setPropertyFilters({ page: propertyFilters.page + 1 })}>
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}