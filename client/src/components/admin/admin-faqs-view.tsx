"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { cms, type FAQ } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminFaqsView() {
  const { adminFaqs, setAdminFaqs } = useAppStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [form, setForm] = useState({ question: "", answer: "", category: "General" });

  useEffect(() => {
    cms.faqs().then((data) => { setAdminFaqs(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const openNew = () => { setEditing(null); setForm({ question: "", answer: "", category: "General" }); setDialogOpen(true); };
  const openEdit = (f: FAQ) => { setEditing(f); setForm({ question: f.question, answer: f.answer, category: f.category }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.question || !form.answer) { toast({ title: "Error", description: "Question and answer are required", variant: "destructive" }); return; }
    if (editing) {
      setAdminFaqs(adminFaqs.map((f) => f.id === editing.id ? { ...f, ...form } : f));
      toast({ title: "Success", description: "FAQ updated" });
    } else {
      setAdminFaqs([...adminFaqs, { id: `F-${Date.now()}`, ...form }]);
      toast({ title: "Success", description: "FAQ created" });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => { setAdminFaqs(adminFaqs.filter((f) => f.id !== id)); toast({ title: "Deleted" }); };

  if (loading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">FAQs</h2><p className="text-sm text-muted-foreground">Manage frequently asked questions</p></div>
        <Button size="sm" className="gap-1.5" onClick={openNew}><Plus className="size-3.5" /> Add FAQ</Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {adminFaqs.map((faq, i) => (
            <div key={faq.id} className="flex items-start gap-3 p-4 border-b last:border-b-0">
              <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm truncate">{faq.question}</p>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{faq.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{faq.answer}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(faq)}><Pencil className="size-3" /></Button>
                <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => handleDelete(faq.id)}><Trash2 className="size-3" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit FAQ" : "Add FAQ"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Question</Label><Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Answer</Label><Textarea rows={4} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Category</Label>
              <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {["General", "Buying", "Selling", "Finance", "Legal", "Services"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}