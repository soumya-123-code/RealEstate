"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { cms, type Banner } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Image, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminBannersView() {
  const { adminBanners, setAdminBanners } = useAppStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({ title: "", image: "", order: 1, active: true, link: "" });

  useEffect(() => {
    cms.banners().then((data) => { setAdminBanners(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const openNew = () => { setEditing(null); setForm({ title: "", image: "", order: adminBanners.length + 1, active: true, link: "" }); setDialogOpen(true); };
  const openEdit = (b: Banner) => { setEditing(b); setForm({ title: b.title, image: b.image, order: b.order, active: b.active, link: b.link || "" }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.title) { toast({ title: "Error", description: "Title is required", variant: "destructive" }); return; }
    if (editing) {
      setAdminBanners(adminBanners.map((b) => b.id === editing.id ? { ...b, ...form } : b));
      toast({ title: "Success", description: "Banner updated" });
    } else {
      setAdminBanners([...adminBanners, { id: `BN-${Date.now()}`, ...form }]);
      toast({ title: "Success", description: "Banner created" });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setAdminBanners(adminBanners.filter((b) => b.id !== id));
    toast({ title: "Deleted", description: "Banner removed" });
  };

  const toggleActive = (id: string) => {
    setAdminBanners(adminBanners.map((b) => b.id === id ? { ...b, active: !b.active } : b));
  };

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Banners</h2><p className="text-sm text-muted-foreground">Manage homepage banner slides</p></div>
        <Button size="sm" className="gap-1.5" onClick={openNew}><Plus className="size-3.5" /> Add Banner</Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {adminBanners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell className="text-xs text-muted-foreground">{banner.order}</TableCell>
                  <TableCell>
                    <div className="w-16 h-10 rounded bg-muted overflow-hidden">
                      <img src={banner.image} alt="" className="size-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{banner.title}</TableCell>
                  <TableCell className="text-sm">{banner.order}</TableCell>
                  <TableCell>
                    <Switch checked={banner.active} onCheckedChange={() => toggleActive(banner.id)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(banner)}><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleDelete(banner.id)}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Banner" : "Add Banner"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Image URL</Label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
            <div className="space-y-2"><Label>Link (optional)</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} /></div>
            <div className="space-y-2"><Label>Order</Label><Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /><Label>Active</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}