"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/lib/store";
import { leads as mockLeads, type LeadStage } from "@/lib/mock-data";
import { Search, Phone, Mail, Clock, ArrowRight, Plus } from "lucide-react";

const stages: LeadStage[] = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];

const stageConfig: Record<LeadStage, { label: string; color: string; bg: string }> = {
  new: { label: "New", color: "text-sky-700 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800" },
  contacted: { label: "Contacted", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800" },
  qualified: { label: "Qualified", color: "text-violet-700 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-950/60 border-violet-200 dark:border-violet-800" },
  proposal: { label: "Proposal", color: "text-pink-700 dark:text-pink-400", bg: "bg-pink-100 dark:bg-pink-950/60 border-pink-200 dark:border-pink-800" },
  negotiation: { label: "Negotiation", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800" },
  won: { label: "Won", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800" },
  lost: { label: "Lost", color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-950/60 border-red-200 dark:border-red-800" },
};

const sourceBadge: Record<string, string> = {
  Website: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
  Referral: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  JustDial: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  "Facebook Ads": "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  "Walk-in": "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400",
  MagicBricks: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
  "Google Ads": "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

export function LeadsView() {
  const { leadSearch, setLeadSearch } = useAppStore();

  const filtered = mockLeads.filter((l) => {
    const term = leadSearch.toLowerCase();
    return (
      l.name.toLowerCase().includes(term) ||
      l.email.toLowerCase().includes(term) ||
      l.propertyInterest.toLowerCase().includes(term) ||
      l.assignedTo.toLowerCase().includes(term)
    );
  });

  const leadsByStage = stages.reduce(
    (acc, stage) => {
      acc[stage] = filtered.filter((l) => l.stage === stage);
      return acc;
    },
    {} as Record<LeadStage, typeof mockLeads>
  );

  const totalLeads = mockLeads.length;
  const wonLeads = mockLeads.filter((l) => l.stage === "won").length;
  const winRate = Math.round((wonLeads / totalLeads) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage your sales leads ({filtered.length} total, {winRate}% win rate)
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="size-4" /> Add Lead
        </Button>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-2xl font-bold">{totalLeads}</p>
          <p className="text-xs text-muted-foreground">Total Leads</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-amber-600">{mockLeads.filter((l) => l.stage !== "won" && l.stage !== "lost").length}</p>
          <p className="text-xs text-muted-foreground">Active Leads</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-emerald-600">{wonLeads}</p>
          <p className="text-xs text-muted-foreground">Won</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-2xl font-bold">{winRate}%</p>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
          </div>
          <Progress value={winRate} className="mt-2 h-1.5" />
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search leads by name, email, property interest..."
          className="pl-8 h-9 max-w-md"
          value={leadSearch}
          onChange={(e) => setLeadSearch(e.target.value)}
        />
      </div>

      {/* Kanban Pipeline */}
      <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
        {stages.map((stage) => {
          const config = stageConfig[stage];
          const leads = leadsByStage[stage] || [];
          return (
            <div
              key={stage}
              className="min-w-[260px] max-w-[260px] flex-shrink-0"
            >
              <div className={`rounded-xl border p-3 ${config.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`size-2 rounded-full ${config.color.replace("text-", "bg-")}`} />
                    <span className={`text-xs font-semibold ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                    {leads.length}
                  </Badge>
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {leads.map((lead) => (
                    <Card key={lead.id} className="p-3 bg-white dark:bg-gray-950/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-sm">{lead.name}</h4>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            sourceBadge[lead.source] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {lead.source}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {lead.propertyInterest}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground">{lead.budget}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                          {lead.assignedTo}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" />
                          {lead.lastContact}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-1.5">
                        <Button variant="ghost" size="icon" className="size-7">
                          <Phone className="size-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7">
                          <Mail className="size-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7 ml-auto">
                          <ArrowRight className="size-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {leads.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No leads</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}