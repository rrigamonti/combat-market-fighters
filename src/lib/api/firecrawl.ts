import { supabase } from '@/integrations/supabase/client';

type FirecrawlResponse<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

export interface ScrapedProduct {
  name: string | null;
  price: string | null;
  description: string | null;
  image_url: string | null;
  brand: string | null;
  external_url: string;
}

export interface ScrapeProductResponse {
  success: boolean;
  data?: ScrapedProduct;
  raw?: {
    markdown?: string;
    metadata?: Record<string, unknown>;
  };
  error?: string;
}

export interface ImportFeedOptions {
  content: string;
  format: 'csv' | 'xml';
  mapping: {
    name: number;
    brand?: number;
    price: number;
    external_url: number;
    image_url?: number;
    category?: number;
    short_description?: number;
    network_product_id?: number;
  };
  affiliate_network: string;
  delimiter?: string;
  skip_header?: boolean;
}

export interface ImportFeedResult {
  success: boolean;
  total_products: number;
  imported_count: number;
  failed_count: number;
  errors: string[];
  error?: string;
}

export interface FmtcSyncOptions {
  limit?: number;
  keywords?: string[];
  categories?: string[];
  merchants?: string[];
}

export interface FmtcSyncResult {
  success: boolean;
  total_fetched?: number;
  unique_count?: number;
  combat_sports_count?: number;
  imported_count: number;
  failed_count: number;
  errors: string[];
  error?: string;
}

export const firecrawlApi = {
  /**
   * Scrape a product page and extract structured product data
   */
  async scrapeProduct(url: string): Promise<ScrapeProductResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape-product', {
      body: { url },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  /**
   * Import products from a CSV or XML feed
   */
  async importFeed(options: ImportFeedOptions): Promise<ImportFeedResult> {
    const { data, error } = await supabase.functions.invoke('import-product-feed', {
      body: options,
    });

    if (error) {
      return { 
        success: false, 
        error: error.message,
        total_products: 0,
        imported_count: 0,
        failed_count: 0,
        errors: [],
      };
    }
    return data;
  },

  /**
   * Sync products from FMTC affiliate network aggregator
   */
  async syncFmtcProducts(options?: FmtcSyncOptions): Promise<FmtcSyncResult> {
    const { data, error } = await supabase.functions.invoke('sync-fmtc-products', {
      body: options || {},
    });

    if (error) {
      return { 
        success: false, 
        error: error.message,
        imported_count: 0,
        failed_count: 0,
        errors: [],
      };
    }
    return data;
  },
};
