"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { cms, type Testimonial } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminTestimonialsView() {
  const { adminTestimonials, setAdminTestimonials } = useAppStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState({ name: "", role: "", rating: 5, text: "", avatar: "" });

  useEffect(() => {
    cms.testimonials().then((data) => { setAdminTestimonials(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const openNew = () => { setEditing(null); setForm({ name: "", role: "", rating: 5, text: "", avatar: "" }); setDialogOpen(true); };
  const openEdit = (t: Testimonial) => { setEditing(t); setForm({ name: t.name, role: t.role, rating: t.rating, text: t.text, avatar: t.avatar }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.text) { toast({ title: "Error", description: "Name and text are required", variant: "destructive" }); return; }
    if (editing) {
      setAdminTestimonials(adminTestimonials.map((t) => t.id === editing.id ? { ...t, ...form } : t));
      toast({ title: "Success", description: "Testimonial updated" });
    } else {
      setAdminTestimonials([...adminTestimonials, { id: `T-${Date.now()}`, ...form }]);
      toast({ title: "Success", description: "Testimonial created" });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => { setAdminTestimonials(adminTestimonials.filter((t) => t.id !== id)); toast({ title: "Deleted" }); };

  if (loading) return <div className="grid sm:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Testimonials</h2><p className="text-sm text-muted-foreground">Manage client testimonials</p></div>
        <Button size="sm" className="gap-1.5" onClick={openNew}><Plus className="size-3.5" /> Add</Button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {adminTestimonials.map((t) => (
          <Card key={t.id} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(t)}><Pencil className="size-3" /></Button>
                  <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => handleDelete(t.id)}><Trash2 className="size-3" /></Button>
                </div>
              </div>
              <div className="flex gap-0.5 mb-2">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="size-3 fill-amber-400 text-amber-400" />)}</div>
              <p className="text-sm text-muted-foreground line-clamp-3">{t.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Role</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Rating</Label>
              <div className="flex gap-1">{[1,2,3,4,5].map((r) => (
                <button key={r} onClick={() => setForm({ ...form, rating: r })}>
                  <Star className={`size-5 ${r <= form.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                </button>
              ))}</div>
            </div>
            <div className="space-y-1.5"><Label>Testimonial Text</Label><Textarea rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}