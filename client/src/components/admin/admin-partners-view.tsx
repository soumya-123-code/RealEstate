"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { cms, type Partner } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminPartnersView() {
  const { adminPartners, setAdminPartners } = useAppStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState({ name: "", logo: "", website: "" });

  useEffect(() => {
    cms.partners().then((data) => { setAdminPartners(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const openNew = () => { setEditing(null); setForm({ name: "", logo: "", website: "" }); setDialogOpen(true); };
  const openEdit = (p: Partner) => { setEditing(p); setForm({ name: p.name, logo: p.logo, website: p.website }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name) { toast({ title: "Error", description: "Name required", variant: "destructive" }); return; }
    if (editing) {
      setAdminPartners(adminPartners.map((p) => p.id === editing.id ? { ...p, ...form } : p));
      toast({ title: "Success", description: "Partner updated" });
    } else {
      setAdminPartners([...adminPartners, { id: `P-${Date.now()}`, ...form }]);
      toast({ title: "Success", description: "Partner added" });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => { setAdminPartners(adminPartners.filter((p) => p.id !== id)); toast({ title: "Deleted" }); };

  if (loading) return <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Partners</h2><p className="text-sm text-muted-foreground">Manage partner organizations</p></div>
        <Button size="sm" className="gap-1.5" onClick={openNew}><Plus className="size-3.5" /> Add Partner</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {adminPartners.map((partner) => (
          <Card key={partner.id} className="border-0 shadow-sm group text-center">
            <CardContent className="p-5">
              <div className="flex size-14 items-center justify-center rounded-xl bg-muted mx-auto mb-3">
                <span className="font-bold text-sm text-muted-foreground">{partner.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
              </div>
              <h3 className="font-semibold text-xs truncate">{partner.name}</h3>
              {partner.website && partner.website !== "#" && (
                <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary flex items-center justify-center gap-1 mt-1 hover:underline">
                  <ExternalLink className="size-2.5" /> Website
                </a>
              )}
              <div className="flex gap-1 justify-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="size-6" onClick={() => openEdit(partner)}><Pencil className="size-3" /></Button>
                <Button variant="ghost" size="icon" className="size-6 text-destructive" onClick={() => handleDelete(partner.id)}><Trash2 className="size-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Partner" : "Add Partner"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Logo URL</Label><Input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>{editing ? "Update" : "Add"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}