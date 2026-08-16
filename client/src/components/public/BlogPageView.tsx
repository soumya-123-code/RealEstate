"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { cms } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Search, Calendar, User, ArrowLeft, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { BlogPost } from "@/lib/api";

export function BlogPageView() {
  const {
    blogPosts, setBlogPosts, selectedBlogPost, setSelectedBlogPost,
    selectedBlogSlug, setSelectedBlogSlug, setCurrentPage,
  } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    cms.blog.list().then((data) => { setBlogPosts(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedBlogSlug) {
      const post = blogPosts.find((b) => b.slug === selectedBlogSlug);
      if (post) setSelectedBlogPost(post);
    }
  }, [selectedBlogSlug, blogPosts]);

  const categories = ["All", ...Array.from(new Set(blogPosts.map((b) => b.category)))];
  const filtered = blogPosts.filter((b) => {
    const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || b.category === category;
    return matchSearch && matchCat && b.published;
  });

  const handlePostClick = (slug: string) => {
    setSelectedBlogSlug(slug);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setSelectedBlogSlug(null);
    setSelectedBlogPost(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Blog Post Detail View
  if (selectedBlogPost && selectedBlogSlug) {
    return (
      <div className="min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="size-4" /> Back to Blog
          </button>

          <Badge variant="secondary" className="mb-3">{selectedBlogPost.category}</Badge>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">{selectedBlogPost.title}</h1>

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="size-4" /> {selectedBlogPost.author}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4" /> {new Date(selectedBlogPost.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>

          <div className="aspect-[16/9] rounded-xl overflow-hidden bg-muted mt-6">
            <img
              src={selectedBlogPost.coverImage}
              alt={selectedBlogPost.title}
              className="size-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>

          <div className="mt-8 prose prose-sm max-w-none">
            <p className="text-base leading-relaxed text-muted-foreground">{selectedBlogPost.excerpt}</p>
            <Separator className="my-6" />
            <p className="text-sm leading-relaxed text-foreground/90">{selectedBlogPost.content}</p>
          </div>
        </div>
      </div>
    );
  }

  // Blog List View
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/90 to-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">Blog</Badge>
          <h1 className="text-3xl md:text-4xl font-bold">Real Estate Insights</h1>
          <p className="text-white/80 text-sm mt-3 max-w-xl mx-auto">
            Stay updated with market trends, buying tips, and the latest from Suretreaven.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              className="pl-10 h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  category === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="font-semibold">No articles found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((post) => (
              <Card
                key={post.id}
                className="group overflow-hidden cursor-pointer border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                onClick={() => handlePostClick(post.slug)}
              >
                <div className="aspect-[16/9] bg-muted overflow-hidden">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <CardContent className="p-4">
                  <Badge variant="secondary" className="text-[10px] mb-2">{post.category}</Badge>
                  <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <User className="size-3" /> {post.author.split(" ")[0]}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3" /> {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}