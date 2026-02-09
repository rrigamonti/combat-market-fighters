import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { firecrawlApi, ScrapedProduct, ImportFeedOptions, FmtcSyncResult } from '@/lib/api/firecrawl';
import { Upload, Link, Loader2, FileText, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { ProductFeedMapper, ColumnMapping } from './ProductFeedMapper';
import { Progress } from '@/components/ui/progress';

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductScraped?: (product: ScrapedProduct) => void;
  onImportComplete?: () => void;
  defaultTab?: 'feed' | 'scrape' | 'fmtc' | 'sovrn';
}

const AFFILIATE_NETWORKS = [
  'ShareASale',
  'CJ Affiliate',
  'Impact',
  'Rakuten',
  'Awin',
  'AvantLink',
  'FlexOffers',
  'Pepperjam',
  'Other',
];

export function ProductImportDialog({
  open,
  onOpenChange,
  onProductScraped,
  onImportComplete,
  defaultTab = 'feed',
}: ProductImportDialogProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'scrape' | 'fmtc' | 'sovrn'>(defaultTab);
  
  // Feed import state
  const [feedContent, setFeedContent] = useState('');
  const [feedFormat, setFeedFormat] = useState<'csv' | 'xml'>('csv');
  const [affiliateNetwork, setAffiliateNetwork] = useState('');
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported: number;
    failed: number;
    errors: string[];
  } | null>(null);
  
  // URL scrape state
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedProduct, setScrapedProduct] = useState<ScrapedProduct | null>(null);

  // FMTC sync state
  const [fmtcLimit, setFmtcLimit] = useState('100');
  const [isSyncingFmtc, setIsSyncingFmtc] = useState(false);
  const [fmtcResult, setFmtcResult] = useState<FmtcSyncResult | null>(null);

  // Sovrn sync state
  const [sovrnLimit, setSovrnLimit] = useState('100');
  const [isSyncingSovrn, setIsSyncingSovrn] = useState(false);
  const [sovrnResult, setSovrnResult] = useState<FmtcSyncResult | null>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Auto-detect format from file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'xml') {
      setFeedFormat('xml');
    } else {
      setFeedFormat('csv');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFeedContent(content);
      setImportResult(null);
    };
    reader.readAsText(file);
  }, []);

  const handleImportFeed = async () => {
    if (!feedContent.trim()) {
      toast({ title: 'No content', description: 'Please upload a file or paste content', variant: 'destructive' });
      return;
    }

    if (!affiliateNetwork) {
      toast({ title: 'Missing network', description: 'Please select an affiliate network', variant: 'destructive' });
      return;
    }

    if (feedFormat === 'csv' && !columnMapping) {
      toast({ title: 'Mapping required', description: 'Please map the columns for CSV import', variant: 'destructive' });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const options: ImportFeedOptions = {
        content: feedContent,
        format: feedFormat,
        mapping: columnMapping || { name: 0, price: 1, external_url: 2 },
        affiliate_network: affiliateNetwork,
        skip_header: true,
      };

      const result = await firecrawlApi.importFeed(options);

      setImportResult({
        success: result.success,
        imported: result.imported_count,
        failed: result.failed_count,
        errors: result.errors,
      });

      if (result.success && result.imported_count > 0) {
        toast({ 
          title: 'Import complete', 
          description: `Successfully imported ${result.imported_count} products` 
        });
        onImportComplete?.();
      } else if (result.error) {
        toast({ title: 'Import failed', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ 
        title: 'Import failed', 
        description: error instanceof Error ? error.message : 'Unknown error', 
        variant: 'destructive' 
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleScrapeUrl = async () => {
    if (!scrapeUrl.trim()) {
      toast({ title: 'No URL', description: 'Please enter a product URL', variant: 'destructive' });
      return;
    }

    setIsScraping(true);
    setScrapedProduct(null);

    try {
      const result = await firecrawlApi.scrapeProduct(scrapeUrl);

      if (result.success && result.data) {
        setScrapedProduct(result.data);
        toast({ title: 'Product scraped', description: 'Review the extracted data below' });
      } else {
        toast({ 
          title: 'Scrape failed', 
          description: result.error || 'Could not extract product data', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ 
        title: 'Scrape failed', 
        description: error instanceof Error ? error.message : 'Unknown error', 
        variant: 'destructive' 
      });
    } finally {
      setIsScraping(false);
    }
  };

  const handleUseScrapedProduct = () => {
    if (scrapedProduct) {
      onProductScraped?.(scrapedProduct);
      onOpenChange(false);
      // Reset state
      setScrapeUrl('');
      setScrapedProduct(null);
    }
  };

  // FMTC sync handler
  const handleFmtcSync = async () => {
    setIsSyncingFmtc(true);
    setFmtcResult(null);

    try {
      const result = await firecrawlApi.syncFmtcProducts({
        limit: parseInt(fmtcLimit) || 100,
      });

      setFmtcResult(result);

      if (result.success && result.imported_count > 0) {
        toast({ 
          title: 'FMTC Sync Complete', 
          description: `Imported ${result.imported_count} combat sports products` 
        });
        onImportComplete?.();
      } else if (result.error) {
        toast({ title: 'Sync failed', description: result.error, variant: 'destructive' });
      } else if (result.imported_count === 0) {
        toast({ 
          title: 'No products imported', 
          description: 'No new combat sports products found in FMTC feed',
          variant: 'default' 
        });
      }
    } catch (error) {
      toast({ 
        title: 'Sync failed', 
        description: error instanceof Error ? error.message : 'Unknown error', 
        variant: 'destructive' 
      });
    } finally {
      setIsSyncingFmtc(false);
    }
  };

  const resetState = () => {
    setFeedContent('');
    setColumnMapping(null);
    setImportResult(null);
    setScrapeUrl('');
    setScrapedProduct(null);
    setFmtcResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetState();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Products</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'feed' | 'scrape' | 'fmtc')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="scrape" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Scrape
            </TabsTrigger>
            <TabsTrigger value="fmtc" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              FMTC
            </TabsTrigger>
            <TabsTrigger value="sovrn" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Sovrn
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-4 mt-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>Upload File (CSV or XML)</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".csv,.xml,.txt"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {/* Or paste content */}
            <div className="space-y-2">
              <Label>Or Paste Content</Label>
              <Textarea
                placeholder="Paste your CSV or XML content here..."
                value={feedContent}
                onChange={(e) => {
                  setFeedContent(e.target.value);
                  setImportResult(null);
                }}
                rows={6}
                className="font-mono text-xs"
              />
            </div>

            {/* Format Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={feedFormat} onValueChange={(v) => setFeedFormat(v as 'csv' | 'xml')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Affiliate Network *</Label>
                <Select value={affiliateNetwork} onValueChange={setAffiliateNetwork}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    {AFFILIATE_NETWORKS.map((network) => (
                      <SelectItem key={network} value={network}>
                        {network}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Column Mapper for CSV */}
            {feedFormat === 'csv' && feedContent && (
              <ProductFeedMapper
                content={feedContent}
                onMappingChange={setColumnMapping}
              />
            )}

            {/* Import Result */}
            {importResult && (
              <div className={`p-4 rounded-lg border ${importResult.success ? 'bg-primary/10 border-primary/20' : 'bg-destructive/10 border-destructive/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-medium">
                    {importResult.success ? 'Import Complete' : 'Import Failed'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {importResult.imported} imported, {importResult.failed} failed
                </p>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground max-h-32 overflow-y-auto">
                    {importResult.errors.slice(0, 5).map((err, i) => (
                      <p key={i}>• {err}</p>
                    ))}
                    {importResult.errors.length > 5 && (
                      <p>... and {importResult.errors.length - 5} more</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <Button 
              onClick={handleImportFeed} 
              disabled={isImporting || !feedContent.trim()}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Import Products
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="scrape" className="space-y-4 mt-4">
            {/* URL Input */}
            <div className="space-y-2">
              <Label>Product URL</Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://shop.example.com/product/boxing-gloves"
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleScrapeUrl} disabled={isScraping || !scrapeUrl.trim()}>
                  {isScraping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Scrape'
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a product page URL to extract product information automatically
              </p>
            </div>

            {/* Scraped Product Preview */}
            {scrapedProduct && (
              <div className="space-y-4 p-4 rounded-lg border bg-muted/50">
                <h4 className="font-medium">Extracted Product Data</h4>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{scrapedProduct.name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Brand:</span>
                    <p className="font-medium">{scrapedProduct.brand || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price:</span>
                    <p className="font-medium">{scrapedProduct.price || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">URL:</span>
                    <p className="font-medium truncate">{scrapedProduct.external_url}</p>
                  </div>
                </div>

                {scrapedProduct.image_url && (
                  <div>
                    <span className="text-sm text-muted-foreground">Image:</span>
                    <img 
                      src={scrapedProduct.image_url} 
                      alt="Product" 
                      className="mt-1 h-24 w-24 object-cover rounded border"
                    />
                  </div>
                )}

                {scrapedProduct.description && (
                  <div>
                    <span className="text-sm text-muted-foreground">Description:</span>
                    <p className="text-sm mt-1 line-clamp-3">{scrapedProduct.description}</p>
                  </div>
                )}

                <Button onClick={handleUseScrapedProduct} className="w-full">
                  Use This Data
                </Button>
              </div>
            )}
          </TabsContent>

          {/* FMTC Sync Tab */}
          <TabsContent value="fmtc" className="space-y-4 mt-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-medium mb-2">FMTC Product Sync</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Automatically import combat sports products from FMTC's aggregated affiliate network feeds. 
                Products from Boxing, MMA, Martial Arts, and related categories will be imported.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Maximum Products to Import</Label>
              <Select value={fmtcLimit} onValueChange={setFmtcLimit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 products</SelectItem>
                  <SelectItem value="100">100 products</SelectItem>
                  <SelectItem value="250">250 products</SelectItem>
                  <SelectItem value="500">500 products</SelectItem>
                  <SelectItem value="1000">1000 products</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Products are filtered for combat sports relevance before import
              </p>
            </div>

            {/* Sync in progress */}
            {isSyncingFmtc && (
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="font-medium">Syncing products from FMTC...</span>
                </div>
                <Progress value={undefined} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  This may take a minute. Fetching and filtering combat sports products...
                </p>
              </div>
            )}

            {/* FMTC Sync Result */}
            {fmtcResult && !isSyncingFmtc && (
              <div className={`p-4 rounded-lg border ${fmtcResult.success ? 'bg-primary/10 border-primary/20' : 'bg-destructive/10 border-destructive/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {fmtcResult.success ? (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-medium">
                    {fmtcResult.success ? 'Sync Complete' : 'Sync Failed'}
                  </span>
                </div>
                
                {fmtcResult.success && (
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                    {fmtcResult.total_fetched !== undefined && (
                      <p>Total fetched: {fmtcResult.total_fetched}</p>
                    )}
                    {fmtcResult.combat_sports_count !== undefined && (
                      <p>Combat sports: {fmtcResult.combat_sports_count}</p>
                    )}
                    <p>Imported: {fmtcResult.imported_count}</p>
                    <p>Failed: {fmtcResult.failed_count}</p>
                  </div>
                )}

                {fmtcResult.error && (
                  <p className="text-sm text-destructive">{fmtcResult.error}</p>
                )}
                
                {fmtcResult.errors && fmtcResult.errors.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground max-h-32 overflow-y-auto">
                    {fmtcResult.errors.slice(0, 5).map((err, i) => (
                      <p key={i}>• {err}</p>
                    ))}
                    {fmtcResult.errors.length > 5 && (
                      <p>... and {fmtcResult.errors.length - 5} more</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <Button 
              onClick={handleFmtcSync} 
              disabled={isSyncingFmtc}
              className="w-full"
            >
              {isSyncingFmtc ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync from FMTC
                </>
              )}
            </Button>
          </TabsContent>

          {/* Sovrn Sync Tab */}
          <TabsContent value="sovrn" className="space-y-4 mt-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-medium mb-2">Sovrn Commerce Product Sync</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Import combat sports products from Sovrn Commerce's Price Comparison API.
                Products are searched by combat sports keywords and filtered for relevance.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Maximum Products to Import</Label>
              <Select value={sovrnLimit} onValueChange={setSovrnLimit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 products</SelectItem>
                  <SelectItem value="100">100 products</SelectItem>
                  <SelectItem value="250">250 products</SelectItem>
                  <SelectItem value="500">500 products</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isSyncingSovrn && (
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="font-medium">Syncing products from Sovrn...</span>
                </div>
                <Progress value={undefined} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Searching Sovrn's product catalog for combat sports items...
                </p>
              </div>
            )}

            {sovrnResult && !isSyncingSovrn && (
              <div className={`p-4 rounded-lg border ${sovrnResult.success ? 'bg-primary/10 border-primary/20' : 'bg-destructive/10 border-destructive/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {sovrnResult.success ? (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-medium">
                    {sovrnResult.success ? 'Sync Complete' : 'Sync Failed'}
                  </span>
                </div>
                
                {sovrnResult.success && (
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                    {sovrnResult.total_fetched !== undefined && (
                      <p>Total fetched: {sovrnResult.total_fetched}</p>
                    )}
                    {sovrnResult.combat_sports_count !== undefined && (
                      <p>Combat sports: {sovrnResult.combat_sports_count}</p>
                    )}
                    <p>Imported: {sovrnResult.imported_count}</p>
                    <p>Failed: {sovrnResult.failed_count}</p>
                  </div>
                )}

                {sovrnResult.error && (
                  <p className="text-sm text-destructive">{sovrnResult.error}</p>
                )}
                
                {sovrnResult.errors && sovrnResult.errors.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground max-h-32 overflow-y-auto">
                    {sovrnResult.errors.slice(0, 5).map((err, i) => (
                      <p key={i}>• {err}</p>
                    ))}
                    {sovrnResult.errors.length > 5 && (
                      <p>... and {sovrnResult.errors.length - 5} more</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <Button 
              onClick={async () => {
                setIsSyncingSovrn(true);
                setSovrnResult(null);
                try {
                  const result = await firecrawlApi.syncSovrnProducts({
                    limit: parseInt(sovrnLimit) || 100,
                  });
                  setSovrnResult(result);
                  if (result.success && result.imported_count > 0) {
                    toast({ title: 'Sovrn sync complete', description: `Imported ${result.imported_count} products` });
                    onImportComplete?.();
                  } else if (result.success) {
                    toast({ title: 'No new products', description: 'No combat sports products found to import' });
                  } else {
                    toast({ title: 'Sync failed', description: result.error || 'Unknown error', variant: 'destructive' });
                  }
                } catch (err) {
                  toast({ title: 'Sync error', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
                } finally {
                  setIsSyncingSovrn(false);
                }
              }} 
              disabled={isSyncingSovrn}
              className="w-full"
            >
              {isSyncingSovrn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync from Sovrn
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
