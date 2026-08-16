"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { cms, type TeamMember } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Linkedin, Twitter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminTeamView() {
  const { adminTeam, setAdminTeam } = useAppStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState({ name: "", designation: "", bio: "", photo: "", linkedin: "", twitter: "" });

  useEffect(() => {
    cms.team().then((data) => { setAdminTeam(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const openNew = () => { setEditing(null); setForm({ name: "", designation: "", bio: "", photo: "", linkedin: "", twitter: "" }); setDialogOpen(true); };
  const openEdit = (t: TeamMember) => { setEditing(t); setForm({ name: t.name, designation: t.designation, bio: t.bio, photo: t.photo, linkedin: t.socialLinks?.linkedin || "", twitter: t.socialLinks?.twitter || "" }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.designation) { toast({ title: "Error", description: "Name and designation required", variant: "destructive" }); return; }
    const socialLinks = { linkedin: form.linkedin || undefined, twitter: form.twitter || undefined };
    if (editing) {
      setAdminTeam(adminTeam.map((t) => t.id === editing.id ? { ...t, name: form.name, designation: form.designation, bio: form.bio, photo: form.photo, socialLinks } : t));
      toast({ title: "Success", description: "Team member updated" });
    } else {
      setAdminTeam([...adminTeam, { id: `TM-${Date.now()}`, name: form.name, designation: form.designation, bio: form.bio, photo: form.photo, socialLinks }]);
      toast({ title: "Success", description: "Team member added" });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => { setAdminTeam(adminTeam.filter((t) => t.id !== id)); toast({ title: "Deleted" }); };

  if (loading) return <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Team Members</h2><p className="text-sm text-muted-foreground">Manage your team</p></div>
        <Button size="sm" className="gap-1.5" onClick={openNew}><Plus className="size-3.5" /> Add Member</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminTeam.map((member) => (
          <Card key={member.id} className="border-0 shadow-sm overflow-hidden group">
            <div className="aspect-square bg-muted flex items-center justify-center relative">
              <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
                {member.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="icon" className="size-7" onClick={() => openEdit(member)}><Pencil className="size-3" /></Button>
                <Button variant="secondary" size="icon" className="size-7 text-destructive" onClick={() => handleDelete(member.id)}><Trash2 className="size-3" /></Button>
              </div>
            </div>
            <CardContent className="p-4 text-center">
              <h3 className="font-semibold text-sm">{member.name}</h3>
              <p className="text-xs text-primary">{member.designation}</p>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{member.bio}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Member" : "Add Member"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Designation</Label><Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Bio</Label><Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>LinkedIn URL</Label><Input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Twitter URL</Label><Input value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>{editing ? "Update" : "Add"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}