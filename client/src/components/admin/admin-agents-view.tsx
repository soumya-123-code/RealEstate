"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { cms, type Agent } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Star, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminAgentsView() {
  const { adminAgents, setAdminAgents } = useAppStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [form, setForm] = useState({ name: "", license: "", specializations: "", experience: 1, rating: 4.5, phone: "", email: "", photo: "" });

  useEffect(() => {
    cms.agents().then((data) => { setAdminAgents(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const openNew = () => { setEditing(null); setForm({ name: "", license: "", specializations: "", experience: 1, rating: 4.5, phone: "", email: "", photo: "" }); setDialogOpen(true); };
  const openEdit = (a: Agent) => { setEditing(a); setForm({ name: a.name, license: a.license, specializations: a.specializations.join(", "), experience: a.experience, rating: a.rating, phone: a.phone, email: a.email, photo: a.photo }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name) { toast({ title: "Error", description: "Name required", variant: "destructive" }); return; }
    const agent: Agent = { ...form, id: editing?.id || `A-${Date.now()}`, specializations: form.specializations.split(",").map((s) => s.trim()).filter(Boolean) };
    if (editing) {
      setAdminAgents(adminAgents.map((a) => a.id === editing.id ? agent : a));
      toast({ title: "Success", description: "Agent updated" });
    } else {
      setAdminAgents([...adminAgents, agent]);
      toast({ title: "Success", description: "Agent added" });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => { setAdminAgents(adminAgents.filter((a) => a.id !== id)); toast({ title: "Deleted" }); };

  if (loading) return <div className="grid sm:grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Agents</h2><p className="text-sm text-muted-foreground">Manage property agents</p></div>
        <Button size="sm" className="gap-1.5" onClick={openNew}><Plus className="size-3.5" /> Add Agent</Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {adminAgents.map((agent) => (
          <Card key={agent.id} className="border-0 shadow-sm group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {agent.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{agent.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium">{agent.rating}</span>
                      <span className="text-xs text-muted-foreground">({agent.experience}y exp)</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(agent)}><Pencil className="size-3" /></Button>
                  <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => handleDelete(agent.id)}><Trash2 className="size-3" /></Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {agent.specializations.map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
              </div>
              <div className="text-xs text-muted-foreground mb-1">License: {agent.license}</div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Phone className="size-3" />{agent.phone}</span>
                <span className="flex items-center gap-1"><Mail className="size-3" />{agent.email}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Agent" : "Add Agent"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>License</Label><Input value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Experience (years)</Label><Input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: parseInt(e.target.value) || 1 })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Specializations (comma-separated)</Label><Input value={form.specializations} onChange={(e) => setForm({ ...form, specializations: e.target.value })} placeholder="Residential, Commercial" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Rating</Label><Input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) || 0 })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>{editing ? "Update" : "Add"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}