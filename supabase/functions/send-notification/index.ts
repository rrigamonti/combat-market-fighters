import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "application_submitted" | "application_approved" | "application_rejected" | "changes_approved" | "changes_rejected";
  fighterEmail: string;
  fighterName: string;
  storefrontUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, fighterEmail, fighterName, storefrontUrl }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to ${fighterEmail}`);

    let subject = "";
    let html = "";

    switch (type) {
      case "application_submitted":
        subject = "Application Received - Combat Market";
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #FF1900; margin-bottom: 24px;">Welcome to Combat Market, ${fighterName}!</h1>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Thank you for submitting your fighter application. We're excited to have you interested in joining Combat Market!
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Our team will review your application and get back to you within 24-48 hours. We'll send you another email once your application has been processed.
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              In the meantime, you can log in to your dashboard to check your application status.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
            <p style="color: #888; font-size: 14px;">
              The Combat Market Team
            </p>
          </div>
        `;
        break;

      case "application_approved":
        subject = "You're Approved! 🎉 - Combat Market";
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #FF1900; margin-bottom: 24px;">Congratulations, ${fighterName}!</h1>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Great news! Your fighter application has been <strong>approved</strong>. Welcome to Combat Market!
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Your personal storefront is now live. Share your link with your fans and start earning royalties on every purchase they make.
            </p>
            ${storefrontUrl ? `
              <div style="margin: 32px 0; padding: 20px; background: #f5f5f5; border-radius: 8px;">
                <p style="color: #333; font-size: 14px; margin-bottom: 8px;">Your storefront URL:</p>
                <a href="${storefrontUrl}" style="color: #FF1900; font-size: 18px; font-weight: bold; text-decoration: none;">${storefrontUrl}</a>
              </div>
            ` : ""}
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Log in to your dashboard to see your storefront, track analytics, and manage your profile.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
            <p style="color: #888; font-size: 14px;">
              The Combat Market Team
            </p>
          </div>
        `;
        break;

      case "application_rejected":
        subject = "Application Update - Combat Market";
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; margin-bottom: 24px;">Application Update</h1>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Hi ${fighterName},
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Thank you for your interest in Combat Market. After reviewing your application, we're unable to approve it at this time.
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              This could be due to incomplete information or verification requirements. If you believe this was a mistake, please reach out to our support team.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
            <p style="color: #888; font-size: 14px;">
              The Combat Market Team
            </p>
          </div>
        `;
        break;

      case "changes_approved":
        subject = "Profile Changes Approved - Combat Market";
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #FF1900; margin-bottom: 24px;">Changes Approved!</h1>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Hi ${fighterName},
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Good news! Your requested profile changes have been reviewed and approved. Your storefront has been updated with the new information.
            </p>
            ${storefrontUrl ? `
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                <a href="${storefrontUrl}" style="color: #FF1900; text-decoration: none;">View your updated storefront →</a>
              </p>
            ` : ""}
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
            <p style="color: #888; font-size: 14px;">
              The Combat Market Team
            </p>
          </div>
        `;
        break;

      case "changes_rejected":
        subject = "Profile Changes Update - Combat Market";
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; margin-bottom: 24px;">Profile Changes Update</h1>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Hi ${fighterName},
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Your requested profile changes have been reviewed but were not approved at this time. Your profile remains unchanged.
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              If you have questions about this decision, please contact our support team.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
            <p style="color: #888; font-size: 14px;">
              The Combat Market Team
            </p>
          </div>
        `;
        break;

      default:
        throw new Error("Invalid email type");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Combat Market <onboarding@resend.dev>",
        to: [fighterEmail],
        subject,
        html,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
