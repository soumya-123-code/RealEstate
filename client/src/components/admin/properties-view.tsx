"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/lib/store";
import { properties as mockProperties, type Property, type PropertyStatus } from "@/lib/mock-data";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Eye,
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  ImageIcon,
} from "lucide-react";

const statusVariant: Record<PropertyStatus, "default" | "secondary" | "destructive" | "outline"> = {
  available: "default",
  booked: "secondary",
  sold: "destructive",
  "under-construction": "outline",
};

const statusLabel: Record<PropertyStatus, string> = {
  available: "Available",
  booked: "Booked",
  sold: "Sold",
  "under-construction": "Under Construction",
};

export function PropertiesView() {
  const { propertySearch, setPropertySearch, propertyStatusFilter, setPropertyStatusFilter } = useAppStore();
  const [addOpen, setAddOpen] = useState(false);
  const [viewProperty, setViewProperty] = useState<Property | null>(null);

  const filtered = mockProperties.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(propertySearch.toLowerCase()) ||
      p.location.toLowerCase().includes(propertySearch.toLowerCase()) ||
      p.city.toLowerCase().includes(propertySearch.toLowerCase());
    const matchStatus =
      propertyStatusFilter === "all" || p.status === propertyStatusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Properties</h1>
          <p className="text-sm text-muted-foreground">
            Manage your property listings ({filtered.length} of {mockProperties.length})
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" /> Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar">
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
              <DialogDescription>
                Fill in the details to list a new property.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Property Title</Label>
                <Input id="title" placeholder="e.g. 3BHK Premium Apartment" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="plot">Plot</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="penthouse">Penthouse</SelectItem>
                      <SelectItem value="independent-house">Independent House</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select defaultValue="available">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="under-construction">Under Construction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (INR)</Label>
                  <Input id="price" type="number" placeholder="4500000" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="area">Area (sq ft)</Label>
                  <Input id="area" type="number" placeholder="1650" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="Patia, Bhubaneswar" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input id="bedrooms" type="number" placeholder="3" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input id="bathrooms" type="number" placeholder="2" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="floor">Floor</Label>
                  <Input id="floor" placeholder="5th Floor" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Description</Label>
                <Input id="desc" placeholder="Brief property description..." />
              </div>
              <div className="grid gap-2">
                <Label>Property Images</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                  <ImageIcon className="size-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setAddOpen(false)}>Save Property</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, location, city..."
                className="pl-8 h-9"
                value={propertySearch}
                onChange={(e) => setPropertySearch(e.target.value)}
              />
            </div>
            <Select value={propertyStatusFilter} onValueChange={setPropertyStatusFilter}>
              <SelectTrigger className="w-full sm:w-44 h-9">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="under-construction">Under Construction</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((property) => (
          <Card key={property.id} className="overflow-hidden group hover:shadow-md transition-shadow">
            <div className="relative aspect-video bg-muted overflow-hidden">
              <img
                src={property.image}
                alt={property.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute top-2 left-2">
                <Badge variant={statusVariant[property.status]}>
                  {statusLabel[property.status]}
                </Badge>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="size-8 bg-white/90 hover:bg-white">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setViewProperty(property)}>
                      <Eye className="mr-2 size-4" /> View
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 size-4" /> Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="absolute bottom-2 left-2 text-white text-xs font-medium">
                {property.type.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-sm leading-tight line-clamp-1">
                  {property.title}
                </h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" />
                  {property.location}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {property.bedrooms > 0 && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="size-3" /> {property.bedrooms} Bed
                  </span>
                )}
                {property.bathrooms > 0 && (
                  <span className="flex items-center gap-1">
                    <Bath className="size-3" /> {property.bathrooms} Bath
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Ruler className="size-3" /> {property.area} sqft
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-lg font-bold text-primary">
                  ₹{property.pricePerUnit}
                </span>
                <Badge variant="outline" className="text-xs capitalize">
                  {property.type.replace("-", " ")}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Property Dialog */}
      <Dialog open={!!viewProperty} onOpenChange={() => setViewProperty(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
          {viewProperty && (
            <>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={viewProperty.image}
                  alt={viewProperty.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl">{viewProperty.title}</DialogTitle>
                    <DialogDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="size-3" /> {viewProperty.location}, {viewProperty.city}
                    </DialogDescription>
                  </div>
                  <Badge variant={statusVariant[viewProperty.status]}>
                    {statusLabel[viewProperty.status]}
                  </Badge>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-primary">₹{viewProperty.pricePerUnit}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Price</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{viewProperty.area}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Sq Ft</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{viewProperty.bedrooms}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Bedrooms</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{viewProperty.bathrooms}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Bathrooms</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{viewProperty.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {viewProperty.amenities.map((a) => (
                    <Badge key={a} variant="secondary" className="text-xs">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}