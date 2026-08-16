"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { cms, type BlogPost } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminBlogsView() {
  const { adminBlogs, setAdminBlogs } = useAppStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", content: "", coverImage: "", category: "Investment", author: "", published: true });

  useEffect(() => {
    cms.blog.list().then((data) => { setAdminBlogs(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", slug: "", excerpt: "", content: "", coverImage: "", category: "Investment", author: "", published: true });
    setDialogOpen(true);
  };
  const openEdit = (b: BlogPost) => {
    setEditing(b);
    setForm({ title: b.title, slug: b.slug, excerpt: b.excerpt, content: b.content, coverImage: b.coverImage, category: b.category, author: b.author, published: b.published });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title || !form.content) { toast({ title: "Error", description: "Title and content required", variant: "destructive" }); return; }
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (editing) {
      setAdminBlogs(adminBlogs.map((b) => b.id === editing.id ? { ...b, ...form, slug } : b));
      toast({ title: "Success", description: "Blog updated" });
    } else {
      setAdminBlogs([...adminBlogs, { id: `BL-${Date.now()}`, ...form, slug, publishedAt: new Date().toISOString().split("T")[0] }]);
      toast({ title: "Success", description: "Blog created" });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => { setAdminBlogs(adminBlogs.filter((b) => b.id !== id)); toast({ title: "Deleted" }); };
  const togglePublish = (id: string) => { setAdminBlogs(adminBlogs.map((b) => b.id === id ? { ...b, published: !b.published } : b)); };

  if (loading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Blog Posts</h2><p className="text-sm text-muted-foreground">Manage your blog content</p></div>
        <Button size="sm" className="gap-1.5" onClick={openNew}><Plus className="size-3.5" /> New Post</Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {adminBlogs.map((post) => (
            <div key={post.id} className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
              <div className="w-20 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
                <img src={post.coverImage} alt="" className="size-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-medium text-sm truncate">{post.title}</h3>
                  {!post.published && <Badge variant="outline" className="text-[10px] shrink-0">Draft</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-[10px]">{post.category}</Badge>
                  <span>{post.author}</span>
                  <span>{new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="size-8" onClick={() => togglePublish(post.id)}>
                  {post.published ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(post)}><Pencil className="size-3.5" /></Button>
                <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleDelete(post.id)}><Trash2 className="size-3.5" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Post" : "New Post"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Category</Label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {["Investment", "Finance", "Market Trends", "Home Tips", "Legal"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Slug (auto-generated)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Excerpt</Label><Textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Content</Label><Textarea rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Cover Image URL</Label><Input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Author</Label><Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} /><Label>Published</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>{editing ? "Update" : "Publish"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}