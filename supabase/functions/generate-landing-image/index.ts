import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type GenerateRequestBody = {
  prompt: string;
  imageType?: string;
  /** When true, the generated image is uploaded to storage and the response returns publicUrl. */
  upload?: boolean;
  /** Storage bucket name. Defaults to a public bucket so the URL can be downloaded into the repo. */
  bucket?: string;
  /** Storage object path, e.g. "landing/boxing-action.jpg" */
  filePath?: string;
  /** JPEG quality 1-100 (default 90) */
  jpegQuality?: number;
};

const DEFAULT_BUCKET = "fighter-heroes";

function decodeBase64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function imageUrlToBytes(imageUrl: string): Promise<{ mime: string; bytes: Uint8Array }> {
  if (imageUrl.startsWith("data:")) {
    const match = imageUrl.match(/^data:([^;]+);base64,(.*)$/s);
    if (!match) throw new Error("Unsupported data URL format");
    const mime = match[1];
    const base64 = match[2];
    return { mime, bytes: decodeBase64ToBytes(base64) };
  }

  // Fallback (should rarely happen): treat as remote URL and fetch bytes.
  const resp = await fetch(imageUrl);
  if (!resp.ok) throw new Error(`Failed to fetch image URL: ${resp.status}`);
  const mime = resp.headers.get("content-type") || "application/octet-stream";
  const buf = new Uint8Array(await resp.arrayBuffer());
  return { mime, bytes: buf };
}

async function convertToJpeg(bytes: Uint8Array, quality: number): Promise<Uint8Array> {
  const img = await Image.decode(bytes);
  // imagescript expects 1-100
  const q = Math.max(1, Math.min(100, quality));
  return img.encodeJPEG(q);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, imageType, upload, bucket, filePath, jpegQuality }: GenerateRequestBody = await req.json();
    
    console.log(`Generating ${imageType} image with prompt: ${prompt}`);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received successfully");
    
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data));
      throw new Error("No image generated");
    }

    // Optional: upload to storage (so we can download into the repo without returning huge base64)
    if (upload) {
      if (!filePath) throw new Error("filePath is required when upload=true");

      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!supabaseUrl || !supabaseServiceKey) throw new Error("Storage is not configured");

      const { bytes } = await imageUrlToBytes(imageUrl);
      const jpegBytes = await convertToJpeg(bytes, jpegQuality ?? 90);

      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const bucketName = bucket || DEFAULT_BUCKET;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, jpegBytes, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error(uploadError.message || "Failed to upload generated image");
      }

      const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      return new Response(
        JSON.stringify({
          publicUrl: publicData.publicUrl,
          imageType,
          success: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({
      imageUrl,
      imageType,
      success: true,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating image:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
