"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Upload,
  Globe,
  Phone,
  Mail,
  MapPin,
  Clock,
  Save,
} from "lucide-react";

export function SettingsView() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage company information and application preferences
        </p>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Company Logo</Label>
            <div className="flex items-center gap-4">
              <div className="flex size-20 items-center justify-center rounded-xl bg-primary/10 border-2 border-dashed border-primary/30">
                <Building2 className="size-8 text-primary" />
              </div>
              <div className="space-y-1.5">
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="size-3.5" /> Upload Logo
                </Button>
                <p className="text-xs text-muted-foreground">
                  PNG or SVG, max 2MB. Recommended 200x200px.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Company Name</Label>
              <Input defaultValue="Suretreaven" />
            </div>
            <div className="grid gap-2">
              <Label>Registration No.</Label>
              <Input defaultValue="GR-OD-2023-0456" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>GST Number</Label>
              <Input defaultValue="21AABCG1234F1Z5" />
            </div>
            <div className="grid gap-2">
              <Label>PAN Number</Label>
              <Input defaultValue="AABCG1234F" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Company Address</Label>
            <Textarea
              defaultValue="Plot No. 45, Saheed Nagar, Bhubaneswar, Odisha - 751007"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="size-4 text-primary" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Primary Phone</Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input defaultValue="+91 674 234 5678" className="pl-8" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>WhatsApp Number</Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input defaultValue="+91 98765 43210" className="pl-8" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input defaultValue="info@greenvalley.in" className="pl-8" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Website</Label>
              <div className="relative">
                <Globe className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input defaultValue="www.greenvalley.in" className="pl-8" />
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Office Hours</Label>
            <div className="relative">
              <Clock className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input defaultValue="Mon - Sat: 9:00 AM - 6:00 PM" className="pl-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            Operational Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Default City</Label>
              <Select defaultValue="bhubaneswar">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bhubaneswar">Bhubaneswar</SelectItem>
                  <SelectItem value="cuttack">Cuttack</SelectItem>
                  <SelectItem value="rourkela">Rourkela</SelectItem>
                  <SelectItem value="puri">Puri</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Currency</Label>
              <Select defaultValue="inr">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inr">INR (Indian Rupee)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Price Display Unit</Label>
              <Select defaultValue="lakh">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lakh">Lakh</SelectItem>
                  <SelectItem value="cr">Crore</SelectItem>
                  <SelectItem value="actual">Actual Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Area Unit</Label>
              <Select defaultValue="sqft">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqft">Sq. Ft.</SelectItem>
                  <SelectItem value="sqm">Sq. M.</SelectItem>
                  <SelectItem value="gunta">Gunta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline">Cancel</Button>
        <Button className="gap-2">
          <Save className="size-4" /> Save Changes
        </Button>
      </div>
    </div>
  );
}