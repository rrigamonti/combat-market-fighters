import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Loader2, Upload, CheckCircle, XCircle, Search, ExternalLink, Radar, ShoppingBag, Globe } from "lucide-react";

interface SovrnMerchant {
  id: string;
  merchant_id: number;
  name: string;
  domain: string | null;
  category: string | null;
  commission_rate: number | null;
  conversion_rate: number | null;
  avg_order_value: number | null;
  enabled: boolean;
  last_synced_at: string | null;
  metadata: any;
}

export default function AdminSovrn() {
  const [activeTab, setActiveTab] = useState("merchants");
  const [merchants, setMerchants] = useState<SovrnMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [enabledFilter, setEnabledFilter] = useState("all");

  // Import state
  const [importUrls, setImportUrls] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Performance state
  const [perfStartDate, setPerfStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [perfEndDate, setPerfEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [perfData, setPerfData] = useState<any>(null);
  const [loadingPerf, setLoadingPerf] = useState(false);

  // Discover state - Product Recommendation (primary)
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [discoverCategory, setDiscoverCategory] = useState("");
  const [discoveredProducts, setDiscoveredProducts] = useState<Array<{
    name: string; brand: string | null; price: number | string | null;
    image_url: string | null; url: string | null; merchant: string | null;
    category: string | null; description: string | null; upc: string | null;
  }>>([]);
  const [selectedProductIndexes, setSelectedProductIndexes] = useState<Set<number>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isProductImporting, setIsProductImporting] = useState(false);

  // Discover state - Firecrawl site crawl (secondary)
  const [discoverMode, setDiscoverMode] = useState<"search" | "crawl">("search");
  const [discoverMerchantId, setDiscoverMerchantId] = useState("");
  const [discoverSearch, setDiscoverSearch] = useState("");
  const [discoveredUrls, setDiscoveredUrls] = useState<string[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverFilter, setDiscoverFilter] = useState("");
  const [isDiscoverImporting, setIsDiscoverImporting] = useState(false);

  useEffect(() => {
    fetchMerchants();
  }, []);

  async function fetchMerchants() {
    setLoading(true);
    const { data, error } = await (supabase
      .from("sovrn_merchants" as any)
      .select("*")
      .order("name") as any);
    if (error) {
      console.error("Error fetching merchants:", error);
      toast({ title: "Error", description: "Failed to load merchants", variant: "destructive" });
    } else {
      setMerchants(data || []);
    }
    setLoading(false);
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const result = await firecrawlApi.syncSovrnMerchants();
      if (result.success) {
        toast({
          title: "Sync complete",
          description: `${result.upserted_count || 0} merchants synced`,
        });
        fetchMerchants();
      } else {
        toast({ title: "Sync failed", description: result.error || "Unknown error", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Sync error", description: err instanceof Error ? err.message : "Unknown", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  }

  async function toggleMerchant(id: string, enabled: boolean) {
    const { error } = await (supabase
      .from("sovrn_merchants" as any)
      .update({ enabled })
      .eq("id", id) as any);
    if (error) {
      toast({ title: "Error", description: "Failed to update merchant", variant: "destructive" });
    } else {
      setMerchants((prev) =>
        prev.map((m) => (m.id === id ? { ...m, enabled } : m))
      );
    }
  }

  async function handleImport() {
    const urls = importUrls.split("\n").map((u) => u.trim()).filter(Boolean);
    if (urls.length === 0) {
      toast({ title: "No URLs", description: "Paste at least one product URL", variant: "destructive" });
      return;
    }
    setIsImporting(true);
    setImportResult(null);
    try {
      const result = await firecrawlApi.syncSovrnProducts({ urls });
      setImportResult(result);
      if (result.success && result.imported_count > 0) {
        toast({ title: "Import complete", description: `Imported ${result.imported_count} products` });
      } else if (result.success) {
        toast({ title: "No products imported", description: "Check if merchants are enabled" });
      } else {
        toast({ title: "Import failed", description: result.error || "Unknown error", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Import error", description: err instanceof Error ? err.message : "Unknown", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  }

  async function fetchPerformance() {
    setLoadingPerf(true);
    try {
      const result = await firecrawlApi.fetchSovrnReport({
        mode: "merchants",
        startDate: perfStartDate,
        endDate: perfEndDate,
      });
      setPerfData(result);
      if (!result.success) {
        toast({ title: "Error", description: result.error || "Failed to fetch performance data", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Unknown", variant: "destructive" });
    } finally {
      setLoadingPerf(false);
    }
  }

  // Get unique categories
  const categories = Array.from(new Set(merchants.map((m) => m.category).filter(Boolean))) as string[];

  // Filter merchants
  const filteredMerchants = merchants.filter((m) => {
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) && !(m.domain || "").toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
    if (enabledFilter === "enabled" && !m.enabled) return false;
    if (enabledFilter === "disabled" && m.enabled) return false;
    return true;
  });

  const enabledCount = merchants.filter((m) => m.enabled).length;
  const enabledMerchantsWithDomain = merchants.filter((m) => m.enabled && m.domain);

  // Product URL pattern filter
  const productPatterns = ['/product', '/shop/', '/p/', '/item/', '/dp/', '/buy/', '/collections/', '/products/'];
  function isProductUrl(url: string): boolean {
    const lower = url.toLowerCase();
    return productPatterns.some((p) => lower.includes(p));
  }

  // Product Recommendation API search
  async function handleProductSearch() {
    if (!discoverQuery.trim()) {
      toast({ title: "Enter a search", description: "Type a product search query", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    setDiscoveredProducts([]);
    setSelectedProductIndexes(new Set());
    try {
      const result = await firecrawlApi.searchSovrnProducts({
        query: discoverQuery,
        category: discoverCategory || undefined,
        limit: 30,
      });
      if (result.success && result.products) {
        setDiscoveredProducts(result.products);
        toast({ title: "Search complete", description: `Found ${result.products.length} products` });
      } else {
        toast({ title: "Search failed", description: result.error || "No products returned", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Search error", description: err instanceof Error ? err.message : "Unknown", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  }

  async function handleProductImport() {
    const selected = Array.from(selectedProductIndexes).map((i) => discoveredProducts[i]).filter((p) => p.url);
    if (selected.length === 0) return;
    setIsProductImporting(true);
    try {
      const result = await firecrawlApi.importSovrnProducts(
        selected.map((p) => ({
          name: p.name,
          brand: p.brand || undefined,
          price: p.price || undefined,
          image_url: p.image_url || undefined,
          url: p.url!,
          category: p.category || undefined,
          description: p.description || undefined,
          upc: p.upc || undefined,
        }))
      );
      if (result.success) {
        toast({ title: "Import complete", description: `Imported ${result.imported_count} products` });
        setSelectedProductIndexes(new Set());
      } else {
        toast({ title: "Import failed", description: result.error || "Unknown error", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Import error", description: err instanceof Error ? err.message : "Unknown", variant: "destructive" });
    } finally {
      setIsProductImporting(false);
    }
  }

  async function handleDiscover() {
    const merchant = merchants.find((m) => m.id === discoverMerchantId);
    if (!merchant?.domain) {
      toast({ title: "No domain", description: "Select a merchant with a domain", variant: "destructive" });
      return;
    }
    setIsDiscovering(true);
    setDiscoveredUrls([]);
    setSelectedUrls(new Set());
    try {
      const result = await firecrawlApi.mapSite(merchant.domain, {
        search: discoverSearch || undefined,
        limit: 5000,
      });
      if (result.success && result.links) {
        const productUrls = result.links.filter(isProductUrl);
        setDiscoveredUrls(productUrls);
        toast({ title: "Discovery complete", description: `Found ${productUrls.length} product URLs (from ${result.links.length} total)` });
      } else {
        toast({ title: "Discovery failed", description: result.error || "No URLs returned", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Discovery error", description: err instanceof Error ? err.message : "Unknown", variant: "destructive" });
    } finally {
      setIsDiscovering(false);
    }
  }

  async function handleDiscoverImport() {
    const urls = Array.from(selectedUrls);
    if (urls.length === 0) return;
    setIsDiscoverImporting(true);
    try {
      const result = await firecrawlApi.syncSovrnProducts({ urls });
      if (result.success) {
        toast({ title: "Import complete", description: `Imported ${result.imported_count} products` });
        setSelectedUrls(new Set());
      } else {
        toast({ title: "Import failed", description: result.error || "Unknown error", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Import error", description: err instanceof Error ? err.message : "Unknown", variant: "destructive" });
    } finally {
      setIsDiscoverImporting(false);
    }
  }

  const filteredDiscoveredUrls = discoverFilter
    ? discoveredUrls.filter((u) => u.toLowerCase().includes(discoverFilter.toLowerCase()))
    : discoveredUrls;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sovrn Commerce</h1>
            <p className="text-muted-foreground mt-1">
              Manage merchants, import products, and view performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{merchants.length} merchants</Badge>
            <Badge variant="default">{enabledCount} enabled</Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="merchants">Merchants</TabsTrigger>
            <TabsTrigger value="import">Import Products</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* ── Merchants Tab ── */}
          <TabsContent value="merchants" className="space-y-4 mt-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search merchants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={enabledFilter} onValueChange={setEnabledFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSync} disabled={syncing} variant="outline">
                {syncing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sync Merchants
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMerchants.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {merchants.length === 0 ? (
                  <div>
                    <p className="mb-2">No merchants found.</p>
                    <p className="text-sm">Click "Sync Merchants" to fetch your approved merchants from Sovrn.</p>
                  </div>
                ) : (
                  <p>No merchants match your filters.</p>
                )}
              </div>
            ) : (
              <div className="border rounded-lg overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Conv. Rate</TableHead>
                      <TableHead className="text-right">Avg Order</TableHead>
                      <TableHead className="text-center">Enabled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMerchants.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell>
                          {m.domain ? (
                            <a
                              href={`https://${m.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1 text-sm"
                            >
                              {m.domain}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {m.category ? (
                            <Badge variant="secondary">{m.category}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {m.commission_rate != null ? `${Number(m.commission_rate).toFixed(1)}%` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {m.conversion_rate != null ? `${Number(m.conversion_rate).toFixed(2)}%` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {m.avg_order_value != null ? `$${Number(m.avg_order_value).toFixed(0)}` : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={m.enabled}
                            onCheckedChange={(checked) => toggleMerchant(m.id, checked)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Showing {filteredMerchants.length} of {merchants.length} merchants
            </p>
          </TabsContent>

          {/* ── Import Products Tab ── */}
          <TabsContent value="import" className="space-y-4 mt-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-medium mb-2">Import Products by URL</h4>
              <p className="text-sm text-muted-foreground">
                Paste product URLs (one per line). Each URL will be checked against
                your enabled merchants and imported via Sovrn's Price Comparison API.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Product URLs (one per line)</Label>
              <Textarea
                value={importUrls}
                onChange={(e) => setImportUrls(e.target.value)}
                placeholder={"https://www.amazon.com/product-1\nhttps://www.everlast.com/product-2\nhttps://www.titleboxing.com/product-3"}
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                {importUrls.split("\n").filter((u) => u.trim()).length} URLs entered
              </p>
            </div>

            {isImporting && (
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="font-medium">Importing products...</span>
                </div>
                <Progress value={undefined} className="h-2" />
              </div>
            )}

            {importResult && !isImporting && (
              <div className={`p-4 rounded-lg border ${importResult.success ? "bg-primary/10 border-primary/20" : "bg-destructive/10 border-destructive/20"}`}>
                <div className="flex items-center gap-2 mb-2">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-medium">
                    {importResult.success ? "Import Complete" : "Import Failed"}
                  </span>
                </div>
                {importResult.success && (
                  <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground mb-2">
                    <p>Imported: {importResult.imported_count}</p>
                    <p>Skipped: {importResult.skipped_count || 0}</p>
                    <p>Failed: {importResult.failed_count}</p>
                  </div>
                )}
                {importResult.error && (
                  <p className="text-sm text-destructive">{importResult.error}</p>
                )}
                {importResult.results?.length > 0 && (
                  <div className="mt-2 text-xs max-h-40 overflow-y-auto space-y-1">
                    {importResult.results.map((r: any, i: number) => (
                      <p key={i} className={r.status === "imported" ? "text-primary" : r.status === "skipped" ? "text-muted-foreground" : "text-destructive"}>
                        • {r.status}: {r.name || r.url}{r.error ? ` (${r.error})` : ""}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={isImporting || !importUrls.trim()}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import from URLs
                </>
              )}
            </Button>
          </TabsContent>

          {/* ── Discover Tab ── */}
          <TabsContent value="discover" className="space-y-4 mt-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={discoverMode === "search" ? "default" : "outline"}
                size="sm"
                onClick={() => setDiscoverMode("search")}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                Product Search
              </Button>
              <Button
                variant={discoverMode === "crawl" ? "default" : "outline"}
                size="sm"
                onClick={() => setDiscoverMode("crawl")}
              >
                <Globe className="mr-2 h-4 w-4" />
                Site Crawl
              </Button>
            </div>

            {/* ── Product Recommendation Search (Primary) ── */}
            {discoverMode === "search" && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-muted/50">
                  <h4 className="font-medium mb-2">Search Sovrn Product Catalog</h4>
                  <p className="text-sm text-muted-foreground">
                    Search Sovrn's 200M+ product catalog using AI-powered recommendations.
                    Products are pre-affiliated and ready to import.
                  </p>
                </div>

                <div className="flex items-end gap-4 flex-wrap">
                  <div className="flex-1 min-w-[250px]">
                    <Label className="text-xs mb-1 block">Search products</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g. boxing gloves, MMA shorts, heavy bag..."
                        value={discoverQuery}
                        onChange={(e) => setDiscoverQuery(e.target.value)}
                        className="pl-10"
                        onKeyDown={(e) => e.key === "Enter" && handleProductSearch()}
                      />
                    </div>
                  </div>
                  <div className="w-[180px]">
                    <Label className="text-xs mb-1 block">Category (optional)</Label>
                    <Input
                      placeholder="e.g. Boxing, MMA"
                      value={discoverCategory}
                      onChange={(e) => setDiscoverCategory(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleProductSearch} disabled={isSearching || !discoverQuery.trim()}>
                    {isSearching ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                </div>

                {discoveredProducts.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Found {discoveredProducts.length} products</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (selectedProductIndexes.size === discoveredProducts.length) {
                            setSelectedProductIndexes(new Set());
                          } else {
                            setSelectedProductIndexes(new Set(discoveredProducts.map((_, i) => i)));
                          }
                        }}
                      >
                        {selectedProductIndexes.size === discoveredProducts.length && discoveredProducts.length > 0
                          ? "Deselect All"
                          : "Select All"}
                      </Button>
                    </div>

                    <ScrollArea className="h-[450px] border rounded-lg">
                      <div className="space-y-2 p-2">
                        {discoveredProducts.map((product, idx) => (
                          <label
                            key={idx}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer border border-transparent hover:border-border"
                          >
                            <Checkbox
                              checked={selectedProductIndexes.has(idx)}
                              onCheckedChange={(checked) => {
                                const next = new Set(selectedProductIndexes);
                                if (checked) next.add(idx);
                                else next.delete(idx);
                                setSelectedProductIndexes(next);
                              }}
                              className="mt-1"
                            />
                            {product.image_url && (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-16 h-16 object-contain rounded border bg-white shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                {product.brand && <Badge variant="secondary" className="text-xs">{product.brand}</Badge>}
                                {product.merchant && product.merchant !== product.brand && (
                                  <span>via {product.merchant}</span>
                                )}
                                {product.price && (
                                  <span className="font-medium text-foreground">
                                    {typeof product.price === "number" ? `$${product.price.toFixed(2)}` : product.price}
                                  </span>
                                )}
                              </div>
                              {product.url && (
                                <a
                                  href={product.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline truncate block mt-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {product.url}
                                </a>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </ScrollArea>

                    <Button
                      onClick={handleProductImport}
                      disabled={selectedProductIndexes.size === 0 || isProductImporting}
                      className="w-full"
                    >
                      {isProductImporting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Import Selected ({selectedProductIndexes.size})
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {discoveredProducts.length === 0 && !isSearching && (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>Search for products to discover items from Sovrn's catalog.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Site Crawl (Secondary / Fallback) ── */}
            {discoverMode === "crawl" && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-muted/50">
                  <h4 className="font-medium mb-2">Crawl Merchant Website</h4>
                  <p className="text-sm text-muted-foreground">
                    Crawl an enabled merchant's website to find product URLs. Use this when you want to discover products
                    directly from a specific store.
                  </p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-xs mb-1 block">Merchant</Label>
                    <Select value={discoverMerchantId} onValueChange={setDiscoverMerchantId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a merchant..." />
                      </SelectTrigger>
                      <SelectContent>
                        {enabledMerchantsWithDomain.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name} ({m.domain})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-[220px]">
                    <Label className="text-xs mb-1 block">Search keyword (optional)</Label>
                    <Input
                      placeholder="e.g. boxing gloves"
                      value={discoverSearch}
                      onChange={(e) => setDiscoverSearch(e.target.value)}
                    />
                  </div>
                  <div className="pt-5">
                    <Button onClick={handleDiscover} disabled={isDiscovering || !discoverMerchantId}>
                      {isDiscovering ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Radar className="mr-2 h-4 w-4" />
                      )}
                      {isDiscovering ? "Crawling..." : "Crawl Site"}
                    </Button>
                  </div>
                </div>

                {discoveredUrls.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Found {discoveredUrls.length} product URLs</Badge>
                      <div className="flex items-center gap-3">
                        <div className="relative w-[220px]">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Filter URLs..."
                            value={discoverFilter}
                            onChange={(e) => setDiscoverFilter(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (selectedUrls.size === filteredDiscoveredUrls.length) {
                              setSelectedUrls(new Set());
                            } else {
                              setSelectedUrls(new Set(filteredDiscoveredUrls));
                            }
                          }}
                        >
                          {selectedUrls.size === filteredDiscoveredUrls.length && filteredDiscoveredUrls.length > 0
                            ? "Deselect All"
                            : "Select All"}
                        </Button>
                      </div>
                    </div>

                    <ScrollArea className="h-[400px] border rounded-lg p-2">
                      <div className="space-y-1">
                        {filteredDiscoveredUrls.map((url) => (
                          <label
                            key={url}
                            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm"
                          >
                            <Checkbox
                              checked={selectedUrls.has(url)}
                              onCheckedChange={(checked) => {
                                const next = new Set(selectedUrls);
                                if (checked) next.add(url);
                                else next.delete(url);
                                setSelectedUrls(next);
                              }}
                            />
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline truncate flex-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {url}
                            </a>
                            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                          </label>
                        ))}
                      </div>
                    </ScrollArea>

                    <Button
                      onClick={handleDiscoverImport}
                      disabled={selectedUrls.size === 0 || isDiscoverImporting}
                      className="w-full"
                    >
                      {isDiscoverImporting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Import Selected ({selectedUrls.size})
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {discoveredUrls.length === 0 && !isDiscovering && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Radar className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>Select a merchant and click "Crawl Site" to find product URLs.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── Performance Tab ── */}
          <TabsContent value="performance" className="space-y-4 mt-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="space-y-1">
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={perfStartDate}
                  onChange={(e) => setPerfStartDate(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End Date</Label>
                <Input
                  type="date"
                  value={perfEndDate}
                  onChange={(e) => setPerfEndDate(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              <div className="pt-5">
                <Button onClick={fetchPerformance} disabled={loadingPerf} variant="outline">
                  {loadingPerf ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Fetch Report
                </Button>
              </div>
            </div>

            {loadingPerf && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {perfData && !loadingPerf && (
              perfData.success ? (
                <div className="space-y-4">
                  <Badge variant="outline">{perfData.total_merchants || 0} merchants in report</Badge>
                  {perfData.merchants && perfData.merchants.length > 0 ? (
                    <div className="border rounded-lg overflow-auto max-h-[500px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Merchant</TableHead>
                            <TableHead className="text-right">Clicks</TableHead>
                            <TableHead className="text-right">Conversions</TableHead>
                            <TableHead className="text-right">Earnings</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {perfData.merchants.map((m: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{m.merchantName || m.name || "Unknown"}</TableCell>
                              <TableCell className="text-right">{m.clicks || m.totalClicks || 0}</TableCell>
                              <TableCell className="text-right">{m.conversions || m.totalConversions || 0}</TableCell>
                              <TableCell className="text-right">
                                ${Number(m.earnings || m.totalEarnings || m.commission || 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No performance data for this date range.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-lg border bg-destructive/10 border-destructive/20">
                  <p className="text-sm text-destructive">{perfData.error || "Failed to fetch performance data"}</p>
                </div>
              )
            )}

            {!perfData && !loadingPerf && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Select a date range and click "Fetch Report" to view merchant performance.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
