import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { firecrawlApi, ScrapedProduct, ImportFeedOptions } from '@/lib/api/firecrawl';
import { Upload, Link, Loader2, FileText, CheckCircle, XCircle } from 'lucide-react';
import { ProductFeedMapper, ColumnMapping } from './ProductFeedMapper';

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductScraped?: (product: ScrapedProduct) => void;
  onImportComplete?: () => void;
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
}: ProductImportDialogProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'scrape'>('feed');
  
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

  const resetState = () => {
    setFeedContent('');
    setColumnMapping(null);
    setImportResult(null);
    setScrapeUrl('');
    setScrapedProduct(null);
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

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'feed' | 'scrape')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Feed
            </TabsTrigger>
            <TabsTrigger value="scrape" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Scrape URL
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
