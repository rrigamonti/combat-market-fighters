import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SOVRN_API_KEY = Deno.env.get('SOVRN_API_KEY');
    if (!SOVRN_API_KEY) {
      throw new Error('SOVRN_API_KEY is not configured');
    }

    const { url, cuid } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'url is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const params = new URLSearchParams({
      key: SOVRN_API_KEY,
      u: url,
    });

    if (cuid) {
      params.set('cuid', cuid);
    }

    const affiliateUrl = `https://redirect.viglink.com?${params.toString()}`;

    return new Response(
      JSON.stringify({ affiliate_url: affiliateUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
