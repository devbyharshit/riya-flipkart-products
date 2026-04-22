import React, { useState, useMemo, useEffect } from "react";
import { Heart, Search, Filter, ExternalLink, Trash2, ShoppingBag, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import RAW from "./data.js";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

const TYPE_MAP = {
  "SOC":"Socks","TOP":"Top","TSH":"T-Shirt","TRO":"Trouser","DRE":"Dress",
  "SCF":"Scarf","SWS":"Sweatshirt","SWL":"Sweatshirt","SWT":"Sweatshirt",
  "CAP":"Cap","MFL":"Muffler","JCK":"Jacket","LEG":"Leggings",
  "LGG":"Leggings","JEA":"Jeans","SKI":"Skirt","AZT":"Co-ord Set",
  "BRA":"Bra Top","PAN":"Panties","LIN":"Lingerie","SPW":"Sportswear",
  "PON":"Poncho","STO":"Stockings","TML":"Thermal","BBO":"Baby Doll",
  "NST":"Night Suit","NDN":"Dress","HAR":"Harem Pants","TKP":"Track Pants","STK":"Top",
  "TGT":"Co-ord Set","CSP":"Sportswear","ABQ":"Hijab","HKF":"Hankies",
  "CRG":"Cargo Pants","BBP":"Top","BPP":"Bra Petals","BPC":"Bra Tape",
  "BRS":"Bra Strap","RUG":"Shrug","HRP":"Harem Pants",
  "SHT":"Shirt","JEG":"Jegging","LWM":"Thermal","BRE":"Bra"
};

function getType(id) {
  const prefix = id.slice(0,3).toUpperCase();
  return TYPE_MAP[prefix] || "Western Wear";
}

const PRICE_BUCKETS = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under ₹100", min: 0, max: 100 },
  { label: "₹100–₹250", min: 100, max: 250 },
  { label: "₹250–₹350", min: 250, max: 350 },
  { label: "₹350–₹500", min: 350, max: 500 },
];

const CATEGORY_LABELS = { C: "Core", G: "Growth" };

const PRODUCTS = RAW.map(([id, price, cat, imgUrl]) => ({
  id, price, cat, imgUrl,
  type: getType(id),
  url: `https://www.flipkart.com/product/p/itm?pid=${id}`,
}));

const GARMENT_TYPES = [...new Set(PRODUCTS.map(p => p.type))].sort();

const ITEM_GROUPS = {
  "Tops": ["Top", "T-Shirt", "Shirt", "Poncho", "Shrug"],
  "Bottoms": ["Trouser", "Jeans", "Pants", "Capri", "Shorts", "Skirt", "Leggings", "Jegging", "Harem Pants", "Track Pants", "Cargo Pants"],
  "Dresses & Sets": ["Dress", "Maxi Dress", "Co-ord Set", "Night Suit"],
  "Innerwear & Sleepwear": ["Bra", "Bra Top", "Panties", "Lingerie", "Baby Doll"],
  "Winterwear": ["Sweatshirt", "Jacket", "Thermal", "Muffler"],
  "Accessories": ["Socks", "Stockings", "Cap", "Hijab", "Scarf", "Hankies", "Bra Petals", "Bra Tape", "Bra Strap"],
  "Activewear": ["Sportswear"]
};

const GROUPED_GARMENTS = Object.entries(ITEM_GROUPS).map(([group, types]) => ({
  group,
  items: GARMENT_TYPES.filter(t => types.includes(t))
})).filter(g => g.items.length > 0);

const mappedTypes = new Set(Object.values(ITEM_GROUPS).flat());
const otherTypes = GARMENT_TYPES.filter(t => !mappedTypes.has(t));
if (otherTypes.length > 0) {
  GROUPED_GARMENTS.push({ group: "Other", items: otherTypes });
}

// --- Flipkart Images ---

function ProductImage({ pid, fallback, className }) {
  const p = PRODUCTS.find(x => x.id === pid);
  const imgUrl = p?.imgUrl;
  
  if (!imgUrl || imgUrl.includes('046495cc')) return <>{fallback}</>;
  
  return <img src={imgUrl} alt={pid} className={`w-full h-full object-cover object-center mix-blend-multiply scale-[1.15] ${className || ""}`} />;
}

export default function App() {
  const [catFilter, setCatFilter] = useState("all");
  const [priceIdx, setPriceIdx] = useState(0);
  const [typeFilter, setTypeFilter] = useState("all");
  const [picks, setPicks] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 40;

  const bucket = PRICE_BUCKETS[priceIdx];

  const filtered = useMemo(() => {
    return PRODUCTS.filter(p => {
      if (catFilter !== "all" && p.cat !== catFilter) return false;
      if (p.price < bucket.min || p.price > bucket.max) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (search && !p.id.toLowerCase().includes(search.toLowerCase()) && !p.type.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [catFilter, priceIdx, typeFilter, search]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  useEffect(() => { setPage(0); }, [catFilter, priceIdx, typeFilter, search]);

  const togglePick = (product) => {
    if (picks.find(p => p.id === product.id)) {
      setPicks(picks.filter(p => p.id !== product.id));
    } else {
      if (picks.length >= 3) return;
      setPicks([...picks, product]);
    }
  };

  const isPicked = (id) => picks.some(p => p.id === id);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background text-foreground font-sans relative flex flex-col overflow-x-hidden">
        {/* Unified Header & Filters */}
        <header className="sticky top-0 z-50 flex flex-col border-b border-border bg-background/80 backdrop-blur-xl shadow-sm">
          {/* Top row: Brand, Search, My Picks */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold tracking-tight">FK Picks Studio</h1>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Women Western Wear
                </p>
              </div>
            </div>

            <div className="flex-1 max-w-md mx-4">
              <div className="relative w-full group">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                <Input
                  placeholder="Search by FSN or Style..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-12 h-10 rounded-full bg-muted/50 border-border focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-muted transition-all"
                />
                <div className="absolute right-3 top-2.5 flex items-center pointer-events-none">
                  <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </div>
              </div>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" className="relative h-10 gap-2 rounded-full border border-border bg-secondary hover:bg-secondary/80 transition-all font-medium">
                  <Heart className={`h-4 w-4 transition-colors ${picks.length > 0 ? "fill-primary text-primary animate-pulse" : ""}`} />
                  <span className="hidden sm:inline">My Picks</span>
                  {picks.length > 0 && (
                    <Badge variant="destructive" className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]">
                      {picks.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-background border-l border-border flex flex-col h-full">
                <SheetHeader className="mb-6 shrink-0 text-left">
                  <SheetTitle className="flex items-center gap-2 text-xl">
                    <Heart className="h-5 w-5 text-destructive fill-destructive" />
                    Your Selected Picks
                  </SheetTitle>
                  <SheetDescription>
                    {picks.length === 0 
                      ? "You haven't selected any products yet. Tap the heart icon on up to 3 products to shortlist them here."
                      : `You have selected ${picks.length} out of 3 possible picks for your video.`}
                  </SheetDescription>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {picks.map(p => (
                    <Card key={p.id} className="overflow-hidden border-primary/20 bg-primary/5 transition-all">
                      <div className="flex items-center p-4 gap-4">
                        <div className="flex h-16 w-16 shrink-0 overflow-hidden items-center justify-center rounded-xl bg-white shadow-sm border border-border p-1">
                          <ProductImage pid={p.id} fallback={<ImageOff className="h-6 w-6 text-muted-foreground/40" />} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="font-semibold">{p.type}</div>
                          <div className="text-xs text-muted-foreground">{p.id}</div>
                          <div className="text-base font-bold text-foreground">₹{p.price}</div>
                        </div>
                      </div>
                      <CardFooter className="bg-background/50 p-3 flex gap-2">
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <a href={p.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 w-full">
                            View Details <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="destructive" size="sm" onClick={() => togglePick(p)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remove from picks</TooltipContent>
                        </Tooltip>
                      </CardFooter>
                    </Card>
                  ))}
                  
                  {picks.length > 0 && picks.length < 3 && (
                    <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-4 text-center text-sm text-muted-foreground">
                      You can add {3 - picks.length} more item{3 - picks.length > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
                {picks.length > 0 && (
                  <div className="pt-6 pb-2 mt-auto shrink-0">
                    <Button className="w-full h-12 rounded-xl text-md font-semibold">
                      Confirm Selection
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>

          {/* Filters row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-3 gap-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-medium text-muted-foreground hidden lg:inline-block mr-2">
                {filtered.length.toLocaleString()} items
              </span>
              
              <Tabs value={catFilter} onValueChange={setCatFilter} className="h-9">
                <TabsList className="h-9 rounded-full bg-muted border border-border p-1">
                  <TabsTrigger value="all" className="rounded-full px-4 text-xs">All</TabsTrigger>
                  <TabsTrigger value="C" className="rounded-full px-4 text-xs">Core</TabsTrigger>
                  <TabsTrigger value="G" className="rounded-full px-4 text-xs">Growth</TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-[160px] rounded-full bg-muted border border-border focus:ring-1 focus:ring-primary font-medium text-xs">
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-xl border-border max-h-[400px]">
                  <SelectItem value="all" className="font-bold">All Styles</SelectItem>
                  {GROUPED_GARMENTS.map(g => (
                    <SelectGroup key={g.group}>
                      <SelectLabel className="text-primary text-[10px] font-bold uppercase tracking-wider mt-2">{g.group}</SelectLabel>
                      {g.items.map(t => <SelectItem key={t} value={t} className="pl-6 text-sm">{t}</SelectItem>)}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Filter className="h-4 w-4 text-muted-foreground hidden xl:block mr-1" />
              <div className="flex items-center gap-1.5 p-1 rounded-full bg-muted border border-border">
                {PRICE_BUCKETS.map((b, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    onClick={() => setPriceIdx(i)}
                    className={`h-7 rounded-full text-xs transition-all px-3 ${
                      priceIdx === i 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {b.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Grid */}
        <main className="flex-1 px-6 py-8">
          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center animate-in fade-in zoom-in duration-300">
              <div className="rounded-full bg-muted p-6 mb-4 border border-border">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No products found</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                Try adjusting your filters or search query to find what you're looking for.
              </p>
              <Button variant="outline" className="mt-6 rounded-full border-border" onClick={() => {
                setSearch("");
                setCatFilter("all");
                setTypeFilter("all");
                setPriceIdx(0);
              }}>
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 relative z-10">
              {paginated.map((p, i) => {
                const picked = isPicked(p.id);
                const canPick = picks.length < 3 || picked;
                
                return (
                  <Card 
                    key={p.id} 
                    style={{ animationDelay: `${(i % 20) * 20}ms` }}
                    className={`group relative flex flex-col overflow-hidden transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-4 fill-mode-both ${
                      picked ? "border-primary ring-1 ring-primary bg-primary/5" : "bg-card"
                    }`}
                  >
                    {picked && (
                      <div className="absolute right-0 top-0 z-10 rounded-bl-xl bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground shadow-sm">
                        PICKED
                      </div>
                    )}
                    
                    <a href={p.url} target="_blank" rel="noreferrer" className="block cursor-pointer">
                      <CardHeader className="p-0 items-center justify-center aspect-[3/4] w-full bg-white relative overflow-hidden rounded-t-xl group/image">
                        <div className="absolute top-2 left-2 z-10">
                          <Badge variant={p.cat === "C" ? "outline" : "secondary"} className={`text-[9px] px-2 py-0.5 h-5 uppercase tracking-wider font-bold backdrop-blur-md ${p.cat === "C" ? "bg-background/80 text-foreground border-border" : "bg-foreground/80 text-background border-transparent"}`}>
                            {CATEGORY_LABELS[p.cat]}
                          </Badge>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ProductImage pid={p.id} className="transition-transform duration-500 group-hover/image:scale-[1.25]" fallback={
                            <div className="flex flex-col items-center justify-center w-full h-full text-slate-300">
                              <ImageOff className="h-10 w-10 mb-2 drop-shadow-sm transition-transform duration-500 group-hover/image:scale-110 group-hover/image:-rotate-3" />
                              <span className="text-[10px] font-semibold uppercase tracking-widest">{p.type}</span>
                            </div>
                          } />
                        </div>
                        
                        <div className="absolute bottom-2 right-2 z-20">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={picked ? "default" : "secondary"}
                                size="icon"
                                disabled={!canPick && !picked}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (canPick || picked) togglePick(p);
                                }}
                                className={`h-8 w-8 rounded-full shadow-md backdrop-blur-md transition-all ${
                                  picked 
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                                    : "bg-background/80 text-foreground border-border hover:bg-background hover:text-primary"
                                }`}
                              >
                                <Heart className={`h-4 w-4 ${picked ? "fill-current" : ""}`} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {!canPick ? "Max 3 picks allowed" : picked ? "Remove pick" : "Add to picks"}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </CardHeader>
                    </a>
                    
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <div className="text-xs font-mono text-muted-foreground truncate mb-1" title={p.id}>{p.id}</div>
                      <div className="text-sm font-semibold leading-snug text-foreground line-clamp-2 mb-2 flex-1 group-hover:text-primary transition-colors" title={p.type}>
                        {p.type}
                      </div>
                      <div className="text-lg font-bold text-foreground">₹{p.price}</div>
                    </CardContent>
                    
                    <CardFooter className="p-4 pt-0 gap-2">
                      <Button asChild variant="secondary" size="sm" className="w-full rounded-xl text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm">
                        <a href={p.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 w-full">
                          View Details <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-12 mb-8 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p-1))}
                className="rounded-full border-border h-9 px-4"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <div className="flex flex-col items-center">
                <span className="text-sm font-medium text-foreground">
                  Page {page+1} of {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                disabled={page >= totalPages-1}
                onClick={() => setPage(p => Math.min(totalPages-1, p+1))}
                className="rounded-full border-border h-9 px-4"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </main>

        {/* Floating Bottom Reminder (if sheet is closed but items picked) */}
        {picks.length > 0 && (
          <Sheet>
            <SheetTrigger asChild>
              <Button
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex animate-float items-center gap-3 rounded-full px-6 py-6 font-semibold shadow-md transition-all hover:scale-105 bg-primary text-primary-foreground"
                size="lg"
              >
                <Heart className="h-5 w-5 fill-current animate-pulse" />
                <div className="flex flex-col items-start leading-tight">
                  <span>{picks.length} pick{picks.length > 1 ? "s" : ""} selected</span>
                  {picks.length < 3 && <span className="text-[10px] opacity-80 font-medium">Tap to view &middot; {3-picks.length} more allowed</span>}
                </div>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md bg-background border-l border-border flex flex-col h-full">
              <SheetHeader className="mb-6 shrink-0 text-left">
                <SheetTitle className="flex items-center gap-2 text-xl">
                  <Heart className="h-5 w-5 text-destructive fill-destructive" />
                  Your Selected Picks
                </SheetTitle>
                <SheetDescription>
                  {`You have selected ${picks.length} out of 3 possible picks for your video.`}
                </SheetDescription>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {picks.map(p => (
                  <Card key={p.id} className="overflow-hidden border-primary/20 bg-primary/5 transition-all">
                    <div className="flex items-center p-4 gap-4">
                      <div className="flex h-16 w-16 overflow-hidden shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-border p-1">
                        <ProductImage pid={p.id} fallback={<ImageOff className="h-6 w-6 text-muted-foreground/40" />} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="font-semibold">{p.type}</div>
                        <div className="text-xs text-muted-foreground">{p.id}</div>
                        <div className="text-base font-bold text-foreground">₹{p.price}</div>
                      </div>
                    </div>
                    <CardFooter className="bg-background/50 p-3 flex gap-2">
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <a href={p.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 w-full">
                          View Details <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="destructive" size="sm" onClick={() => togglePick(p)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remove from picks</TooltipContent>
                      </Tooltip>
                    </CardFooter>
                  </Card>
                ))}
                
                {picks.length < 3 && (
                  <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-4 text-center text-sm text-muted-foreground">
                    You can add {3 - picks.length} more item{3 - picks.length > 1 ? "s" : ""}
                  </div>
                )}
              </div>
              
              {picks.length > 0 && (
                <div className="pt-6 pb-2 mt-auto shrink-0 border-t border-border">
                  <Button className="w-full h-12 rounded-xl text-md font-semibold">
                    Confirm Selection
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        )}
      </div>
    </TooltipProvider>
  );
}
