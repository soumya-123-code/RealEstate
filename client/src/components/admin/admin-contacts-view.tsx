"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { cms, type ContactRequest } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Mail, Phone, Clock, User } from "lucide-react";

export function AdminContactsView() {
  const { adminContacts, setAdminContacts } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactRequest | null>(null);

  useEffect(() => {
    cms.contacts().then((data) => { setAdminContacts(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const markRead = (id: string) => {
    setAdminContacts(adminContacts.map((c) => c.id === id ? { ...c, read: true } : c));
  };

  if (loading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>;

  const unread = adminContacts.filter((c) => !c.read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Contact Requests</h2>
          <p className="text-sm text-muted-foreground">{unread > 0 ? `${unread} unread requests` : "All caught up"}</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => setAdminContacts(adminContacts.map((c) => ({ ...c, read: true })))}>
            Mark All Read
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {adminContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => { setSelected(contact); markRead(contact.id); }}
              className="w-full flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors text-left"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                {contact.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`font-medium text-sm ${!contact.read ? "text-foreground" : "text-muted-foreground"}`}>{contact.name}</span>
                  {!contact.read && <span className="size-2 rounded-full bg-primary shrink-0" />}
                </div>
                <p className="text-sm font-medium truncate">{contact.subject}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{contact.message}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] text-muted-foreground">{new Date(contact.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                <Eye className="size-3.5 text-muted-foreground/50 mx-auto mt-1" />
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.subject}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2"><User className="size-4 text-muted-foreground" /><span className="text-sm">{selected.name}</span></div>
                <div className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" /><span className="text-sm">{selected.email}</span></div>
                <div className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /><span className="text-sm">{selected.phone}</span></div>
                <div className="flex items-center gap-2"><Clock className="size-4 text-muted-foreground" /><span className="text-sm">{new Date(selected.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span></div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm leading-relaxed">{selected.message}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}