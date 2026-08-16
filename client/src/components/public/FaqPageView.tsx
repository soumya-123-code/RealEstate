"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { cms } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, HelpCircle, ArrowRight, MessageCircle } from "lucide-react";
import type { FAQ } from "@/lib/api";

export function FaqPageView() {
  const { faqs, setFaqs, faqSearch, setFaqSearch, faqCategory, setFaqCategory, setCurrentPage } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cms.faqs().then((data) => { setFaqs(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const categories = ["All", ...Array.from(new Set(faqs.map((f) => f.category)))];

  const filteredFaqs = faqs.filter((f) => {
    const matchSearch = f.question.toLowerCase().includes(faqSearch.toLowerCase()) || f.answer.toLowerCase().includes(faqSearch.toLowerCase());
    const matchCat = faqCategory === "All" || f.category === faqCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/90 to-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">FAQ</Badge>
          <h1 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h1>
          <p className="text-white/80 text-sm mt-3 max-w-xl mx-auto">
            Find answers to common questions about buying, selling, and renting properties.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            className="h-11 pl-10"
            value={faqSearch}
            onChange={(e) => setFaqSearch(e.target.value)}
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFaqCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                faqCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="size-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-semibold">No questions found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try a different search or category</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {filteredFaqs.map((faq, i) => (
              <AccordionItem key={faq.id} value={faq.id} className="border-0 shadow-sm rounded-lg px-1 data-[state=open]:shadow-md transition-shadow">
                <AccordionTrigger className="text-sm font-medium text-left hover:no-underline py-4">
                  <span className="flex items-start gap-3">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pl-9 text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                  {faq.category && (
                    <Badge variant="secondary" className="mt-3 text-[10px]">{faq.category}</Badge>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {/* CTA */}
        <div className="mt-12 bg-primary/5 rounded-xl p-8 text-center">
          <MessageCircle className="size-10 text-primary mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-2">Still have questions?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Our team is ready to help. Contact us for personalized assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => setCurrentPage("contact")} className="gap-2">
              Contact Us <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setCurrentPage("list")}>
              Browse Properties
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}