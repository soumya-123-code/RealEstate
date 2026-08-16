"use client";

import { Landmark, Phone, Mail, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAppStore, type PublicPage } from "@/lib/store";

const quickLinks: { page: PublicPage; label: string }[] = [
  { page: "home", label: "Home" },
  { page: "list", label: "All Properties" },
  { page: "about", label: "About Us" },
  { page: "blog", label: "Blog" },
  { page: "faq", label: "FAQ" },
  { page: "contact", label: "Contact Us" },
];

const propertyTypes = ["Apartments", "Villas", "Plots", "Commercial", "Penthouses", "Independent Houses"];

export function PublicFooter() {
  const { setCurrentPage, setSelectedPropertyId, setSelectedBlogSlug } = useAppStore();

  const navigate = (page: PublicPage) => {
    setCurrentPage(page);
    setSelectedPropertyId(null);
    setSelectedBlogSlug(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-foreground text-background mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Landmark className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight leading-tight">Suretreaven</span>
                <span className="text-[10px] text-background/60 leading-tight">Realty</span>
              </div>
            </div>
            <p className="text-sm text-background/70 leading-relaxed">
              Your trusted partner in real estate across Odisha. Making property transactions transparent, simple, and rewarding since 2014.
            </p>
            <div className="flex gap-3">
              {["Facebook", "Twitter", "Instagram", "LinkedIn"].map((social) => (
                <button
                  key={social}
                  className="flex size-8 items-center justify-center rounded-lg bg-background/10 hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                >
                  {social[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.page}>
                  <button
                    onClick={() => navigate(link.page)}
                    className="text-sm text-background/70 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Property Types */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Property Types</h4>
            <ul className="space-y-2.5">
              {propertyTypes.map((type) => (
                <li key={type}>
                  <button
                    onClick={() => navigate("list")}
                    className="text-sm text-background/70 hover:text-primary transition-colors"
                  >
                    {type}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Contact Info</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin className="size-4 mt-0.5 text-primary shrink-0" />
                <span className="text-sm text-background/70">Plot No. 45, Saheed Nagar, Bhubaneswar, Odisha - 751007</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 text-primary shrink-0" />
                <span className="text-sm text-background/70">+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 text-primary shrink-0" />
                <span className="text-sm text-background/70">info@greenvalley.in</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-background/10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/50">
            &copy; {new Date().getFullYear()} Suretreaven. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-background/50">
            <button className="hover:text-background/80 transition-colors">Privacy Policy</button>
            <button className="hover:text-background/80 transition-colors">Terms of Service</button>
            <button className="hover:text-background/80 transition-colors">Sitemap</button>
          </div>
        </div>
      </div>
    </footer>
  );
}