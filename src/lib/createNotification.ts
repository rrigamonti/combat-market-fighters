import { supabase } from "@/integrations/supabase/client";

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    title: params.title,
    message: params.message,
    type: params.type,
    link: params.link || null,
  });
  if (error) {
    console.error("Failed to create notification:", error);
  }
}

/** Helper to notify a fighter by their fighter record ID (looks up user_id) */
export async function notifyFighter(
  fighterId: string,
  title: string,
  message: string,
  type: string,
  link?: string
) {
  const { data: fighter } = await supabase
    .from("fighters")
    .select("user_id")
    .eq("id", fighterId)
    .single();
  if (fighter?.user_id) {
    await createNotification({ userId: fighter.user_id, title, message, type, link });
  }
}

/** Notify all users with a merchant role for a given merchant_id */
export async function notifyMerchant(
  merchantId: string,
  title: string,
  message: string,
  type: string,
  link?: string
) {
  const { data: roles } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("merchant_id", merchantId)
    .eq("role", "merchant");
  if (roles) {
    for (const role of roles) {
      await createNotification({ userId: role.user_id, title, message, type, link });
    }
  }
}
