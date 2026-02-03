import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ColumnMapping {
  name: number;
  brand?: number;
  price: number;
  external_url: number;
  image_url?: number;
  category?: number;
  short_description?: number;
  network_product_id?: number;
}

interface ImportRequest {
  content: string;
  format: 'csv' | 'xml';
  mapping: ColumnMapping;
  affiliate_network: string;
  delimiter?: string;
  skip_header?: boolean;
}

interface ImportResult {
  success: boolean;
  total_products: number;
  imported_count: number;
  failed_count: number;
  errors: string[];
}

function parseCSV(content: string, delimiter: string = ','): string[][] {
  const rows: string[][] = [];
  const lines = content.split(/\r?\n/);
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }
  
  return rows;
}

function parseXML(content: string): Record<string, string>[] {
  const products: Record<string, string>[] = [];
  
  // Simple XML parsing for product feeds
  // Match <product> or <item> elements
  const productPattern = /<(?:product|item)[^>]*>([\s\S]*?)<\/(?:product|item)>/gi;
  const fieldPattern = /<([a-zA-Z_][a-zA-Z0-9_]*)(?:\s[^>]*)?>([^<]*)<\/\1>/gi;
  
  let match;
  while ((match = productPattern.exec(content)) !== null) {
    const productXml = match[1];
    const product: Record<string, string> = {};
    
    let fieldMatch;
    while ((fieldMatch = fieldPattern.exec(productXml)) !== null) {
      const fieldName = fieldMatch[1].toLowerCase();
      const fieldValue = fieldMatch[2].trim();
      product[fieldName] = fieldValue;
    }
    
    if (Object.keys(product).length > 0) {
      products.push(product);
    }
    
    // Reset lastIndex for field pattern
    fieldPattern.lastIndex = 0;
  }
  
  return products;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { content, format, mapping, affiliate_network, delimiter = ',', skip_header = true } = await req.json() as ImportRequest;

    if (!content || !format || !mapping) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: content, format, mapping' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (mapping.name === undefined || mapping.price === undefined || mapping.external_url === undefined) {
      return new Response(
        JSON.stringify({ success: false, error: 'Mapping must include name, price, and external_url columns' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting ${format.toUpperCase()} import for ${affiliate_network}`);

    const result: ImportResult = {
      success: true,
      total_products: 0,
      imported_count: 0,
      failed_count: 0,
      errors: [],
    };

    let products: { 
      name: string; 
      brand: string; 
      price: string; 
      external_url: string; 
      slug: string;
      image_url?: string;
      category?: string;
      short_description?: string;
      network_product_id?: string;
    }[] = [];

    if (format === 'csv') {
      const rows = parseCSV(content, delimiter);
      const dataRows = skip_header ? rows.slice(1) : rows;
      
      result.total_products = dataRows.length;

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        try {
          const name = row[mapping.name]?.trim();
          const price = row[mapping.price]?.trim();
          const external_url = row[mapping.external_url]?.trim();

          if (!name || !price || !external_url) {
            result.failed_count++;
            result.errors.push(`Row ${i + 1}: Missing required field (name, price, or external_url)`);
            continue;
          }

          const product = {
            name,
            brand: mapping.brand !== undefined ? row[mapping.brand]?.trim() || 'Unknown' : 'Unknown',
            price,
            external_url,
            slug: generateSlug(name),
            image_url: mapping.image_url !== undefined ? row[mapping.image_url]?.trim() : undefined,
            category: mapping.category !== undefined ? row[mapping.category]?.trim() : undefined,
            short_description: mapping.short_description !== undefined ? row[mapping.short_description]?.trim() : undefined,
            network_product_id: mapping.network_product_id !== undefined ? row[mapping.network_product_id]?.trim() : undefined,
          };

          products.push(product);
        } catch (error) {
          result.failed_count++;
          result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
        }
      }
    } else if (format === 'xml') {
      const xmlProducts = parseXML(content);
      result.total_products = xmlProducts.length;

      // For XML, we need to map field names
      const xmlFieldMap: Record<number, string> = {};
      // Common XML field names for products
      const commonFields = ['name', 'title', 'product_name', 'brand', 'manufacturer', 'price', 'sale_price', 
        'url', 'link', 'product_url', 'image', 'image_url', 'image_link', 'category', 'product_type',
        'description', 'short_description', 'id', 'sku', 'product_id'];
      
      for (let i = 0; i < xmlProducts.length; i++) {
        const xmlProduct = xmlProducts[i];
        try {
          // Map common field names
          const name = xmlProduct.name || xmlProduct.title || xmlProduct.product_name;
          const brand = xmlProduct.brand || xmlProduct.manufacturer || 'Unknown';
          const price = xmlProduct.price || xmlProduct.sale_price;
          const external_url = xmlProduct.url || xmlProduct.link || xmlProduct.product_url;
          const image_url = xmlProduct.image || xmlProduct.image_url || xmlProduct.image_link;
          const category = xmlProduct.category || xmlProduct.product_type;
          const description = xmlProduct.description || xmlProduct.short_description;
          const network_product_id = xmlProduct.id || xmlProduct.sku || xmlProduct.product_id;

          if (!name || !price || !external_url) {
            result.failed_count++;
            result.errors.push(`Product ${i + 1}: Missing required field (name, price, or url)`);
            continue;
          }

          products.push({
            name,
            brand,
            price,
            external_url,
            slug: generateSlug(name),
            image_url,
            category,
            short_description: description,
            network_product_id,
          });
        } catch (error) {
          result.failed_count++;
          result.errors.push(`Product ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
        }
      }
    }

    console.log(`Parsed ${products.length} products, attempting to upsert`);

    // Upsert products in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      
      for (const product of batch) {
        try {
          // Check if product exists by network_product_id
          let existingProduct = null;
          if (product.network_product_id) {
            const { data } = await supabase
              .from('products')
              .select('id')
              .eq('network_product_id', product.network_product_id)
              .eq('affiliate_network', affiliate_network)
              .maybeSingle();
            existingProduct = data;
          }

          const productData = {
            name: product.name,
            brand: product.brand,
            price: product.price,
            external_url: product.external_url,
            slug: product.slug,
            image_url: product.image_url || null,
            category: product.category || null,
            short_description: product.short_description || null,
            source_type: 'feed',
            affiliate_network,
            network_product_id: product.network_product_id || null,
            last_synced_at: new Date().toISOString(),
            active: true,
          };

          if (existingProduct) {
            // Update existing product
            const { error } = await supabase
              .from('products')
              .update(productData)
              .eq('id', existingProduct.id);

            if (error) throw error;
          } else {
            // Ensure unique slug
            let uniqueSlug = product.slug;
            let slugCounter = 1;
            while (true) {
              const { data: existingSlug } = await supabase
                .from('products')
                .select('id')
                .eq('slug', uniqueSlug)
                .maybeSingle();

              if (!existingSlug) break;
              uniqueSlug = `${product.slug}-${slugCounter++}`;
            }
            productData.slug = uniqueSlug;

            // Insert new product
            const { error } = await supabase.from('products').insert(productData);
            if (error) throw error;
          }

          result.imported_count++;
        } catch (error) {
          result.failed_count++;
          result.errors.push(`${product.name}: ${error instanceof Error ? error.message : 'Insert error'}`);
        }
      }
    }

    console.log(`Import complete: ${result.imported_count} imported, ${result.failed_count} failed`);

    // Limit errors returned to prevent huge responses
    if (result.errors.length > 20) {
      result.errors = result.errors.slice(0, 20);
      result.errors.push(`... and ${result.failed_count - 20} more errors`);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error importing feed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to import feed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
