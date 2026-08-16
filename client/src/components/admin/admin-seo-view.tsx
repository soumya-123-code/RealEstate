"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { cms, type SeoSettings } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Search, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminSeoView() {
  const { adminSeo, setAdminSeo } = useAppStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SeoSettings | null>(null);
  const [form, setForm] = useState({ page: "", metaTitle: "", metaDescription: "", keywords: "" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    cms.seo().then((data) => { setAdminSeo(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = adminSeo.filter((s) =>
    s.page.toLowerCase().includes(search.toLowerCase()) ||
    s.metaTitle.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (s: SeoSettings) => {
    setEditing(s);
    setForm({ page: s.page, metaTitle: s.metaTitle, metaDescription: s.metaDescription, keywords: s.keywords });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editing) return;
    setAdminSeo(adminSeo.map((s) => s.id === editing.id ? { ...s, ...form } : s));
    toast({ title: "Success", description: "SEO settings updated" });
    setDialogOpen(false);
  };

  if (loading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">SEO Settings</h2>
        <p className="text-sm text-muted-foreground">Manage meta tags for each page</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input placeholder="Search pages..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {filtered.map((seo) => (
            <div key={seo.id} className="flex items-start gap-4 p-4 border-b last:border-b-0">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                <Globe className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-sm">{seo.page}</h3>
                  <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => openEdit(seo)}>
                    <Pencil className="size-3" />
                  </Button>
                </div>
                <p className="text-sm text-foreground line-clamp-1">{seo.metaTitle}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{seo.metaDescription}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {seo.keywords.split(", ").slice(0, 3).map((kw) => (
                    <span key={kw} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{kw}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>SEO: {editing?.page}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Meta Title</Label><Input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Meta Description</Label><Textarea rows={3} value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Keywords (comma-separated)</Label><Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}