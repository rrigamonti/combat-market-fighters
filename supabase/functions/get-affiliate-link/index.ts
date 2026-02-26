import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AffiliateRequest {
  product_id?: string;
  url: string;
  affiliate_network?: string;
  network_product_id?: string;
  fighter_handle?: string;
}

function buildSovrnUrl(url: string, fighterHandle?: string): string {
  const apiKey = Deno.env.get('SOVRN_API_KEY');
  if (!apiKey) throw new Error('SOVRN_API_KEY is not configured');

  const params = new URLSearchParams({ key: apiKey, u: url });
  if (fighterHandle) params.set('cuid', fighterHandle);
  return `https://redirect.viglink.com?${params.toString()}`;
}

function buildAwinUrl(url: string, networkProductId: string | undefined, fighterHandle?: string): string {
  const publisherId = Deno.env.get('AWIN_PUBLISHER_ID');
  if (!publisherId) throw new Error('AWIN_PUBLISHER_ID is not configured');

  const params = new URLSearchParams({
    awinaffid: publisherId,
    p: encodeURIComponent(url),
    ued: url,
  });
  if (networkProductId) params.set('awinmid', networkProductId);
  if (fighterHandle) params.set('clickref', fighterHandle);
  return `https://www.awin1.com/cread.php?${params.toString()}`;
}

function buildRakutenUrl(url: string, networkProductId: string | undefined, fighterHandle?: string): string {
  const siteId = Deno.env.get('RAKUTEN_SITE_ID');
  if (!siteId) throw new Error('RAKUTEN_SITE_ID is not configured');

  const params = new URLSearchParams({
    id: siteId,
    murl: encodeURIComponent(url),
  });
  if (networkProductId) params.set('mid', networkProductId);
  if (fighterHandle) params.set('u1', fighterHandle);
  return `https://click.linksynergy.com/deeplink?${params.toString()}`;
}

function buildImpactUrl(url: string, fighterHandle?: string): string {
  const accountSid = Deno.env.get('IMPACT_ACCOUNT_SID');
  const mediaId = Deno.env.get('IMPACT_MEDIA_ID');
  if (!accountSid || !mediaId) throw new Error('IMPACT_ACCOUNT_SID and IMPACT_MEDIA_ID are not configured');

  const params = new URLSearchParams({ url });
  if (fighterHandle) params.set('subId1', fighterHandle);
  return `https://app.impact.com/ad/click/${accountSid}/${mediaId}?${params.toString()}`;
}

function buildCJUrl(url: string, fighterHandle?: string): string {
  const websiteId = Deno.env.get('CJ_WEBSITE_ID');
  if (!websiteId) throw new Error('CJ_WEBSITE_ID is not configured');

  const encodedUrl = encodeURIComponent(url);
  const params = new URLSearchParams();
  if (fighterHandle) params.set('sid', fighterHandle);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return `https://www.anrdoezrs.net/links/${websiteId}/type/dlg/${encodedUrl}${suffix}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: AffiliateRequest = await req.json();
    const { url, fighter_handle } = body;

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'url is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let network = body.affiliate_network || null;
    let networkProductId = body.network_product_id || undefined;

    // If product_id provided, look up network info from DB
    if (body.product_id && !network) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: product } = await supabase
        .from('products')
        .select('affiliate_network, network_product_id')
        .eq('id', body.product_id)
        .single();

      if (product) {
        network = product.affiliate_network;
        networkProductId = product.network_product_id || undefined;
      }
    }

    let affiliateUrl: string;

    switch (network?.toLowerCase()) {
      case 'awin':
        affiliateUrl = buildAwinUrl(url, networkProductId, fighter_handle);
        break;
      case 'rakuten':
        affiliateUrl = buildRakutenUrl(url, networkProductId, fighter_handle);
        break;
      case 'impact':
        affiliateUrl = buildImpactUrl(url, fighter_handle);
        break;
      case 'cj':
      case 'cj affiliate':
        affiliateUrl = buildCJUrl(url, fighter_handle);
        break;
      case 'sovrn':
      default:
        affiliateUrl = buildSovrnUrl(url, fighter_handle);
        break;
    }

    return new Response(
      JSON.stringify({ affiliate_url: affiliateUrl, network: network || 'sovrn' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Affiliate link error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
