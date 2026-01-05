import { supabase } from "@/integrations/supabase/client";

type NotificationType = 
  | "application_submitted" 
  | "application_approved" 
  | "application_rejected" 
  | "changes_approved" 
  | "changes_rejected";

interface SendNotificationParams {
  type: NotificationType;
  fighterEmail: string;
  fighterName: string;
  storefrontUrl?: string;
}

export async function sendNotification(params: SendNotificationParams): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("send-notification", {
      body: params,
    });

    if (error) {
      console.error("Error sending notification:", error);
      return false;
    }

    console.log("Notification sent:", data);
    return true;
  } catch (error) {
    console.error("Error invoking notification function:", error);
    return false;
  }
}
