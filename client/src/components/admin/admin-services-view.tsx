"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { cms, type Service } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Building2, TrendingUp, KeyRound, Scale } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const iconMap: Record<string, React.ElementType> = { Building2, TrendingUp, KeyRound, Scale };

export function AdminServicesView() {
  const { adminServices, setAdminServices } = useAppStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ icon: "Building2", title: "", description: "", image: "", order: 1 });

  useEffect(() => {
    cms.services().then((data) => { setAdminServices(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const openNew = () => { setEditing(null); setForm({ icon: "Building2", title: "", description: "", image: "", order: adminServices.length + 1 }); setDialogOpen(true); };
  const openEdit = (s: Service) => { setEditing(s); setForm({ icon: s.icon, title: s.title, description: s.description, image: s.image, order: s.order }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.title) { toast({ title: "Error", description: "Title required", variant: "destructive" }); return; }
    if (editing) {
      setAdminServices(adminServices.map((s) => s.id === editing.id ? { ...s, ...form } : s));
      toast({ title: "Success", description: "Service updated" });
    } else {
      setAdminServices([...adminServices, { id: `S-${Date.now()}`, ...form }]);
      toast({ title: "Success", description: "Service created" });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => { setAdminServices(adminServices.filter((s) => s.id !== id)); toast({ title: "Deleted" }); };

  if (loading) return <div className="grid sm:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Services</h2><p className="text-sm text-muted-foreground">Manage your services</p></div>
        <Button size="sm" className="gap-1.5" onClick={openNew}><Plus className="size-3.5" /> Add Service</Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {adminServices.map((service) => {
          const IconComp = iconMap[service.icon] || Building2;
          return (
            <Card key={service.id} className="border-0 shadow-sm group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <IconComp className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{service.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
                      <span className="text-[10px] text-muted-foreground mt-2 block">Order: {service.order}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(service)}><Pencil className="size-3" /></Button>
                    <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => handleDelete(service.id)}><Trash2 className="size-3" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Service" : "Add Service"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Order</Label><Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Icon</Label>
              <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
                <option value="Building2">Building</option>
                <option value="TrendingUp">Trending Up</option>
                <option value="KeyRound">Key</option>
                <option value="Scale">Scale</option>
              </select>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Image URL</Label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}