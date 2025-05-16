"use server"

import { supabaseAdmin } from "@/lib/supabase"

export async function cancelSubscription(email: string): Promise<{ success: boolean; message: string }> {
  try {
    // Update user's plan in database
    const { error } = await supabaseAdmin
      .from("users")
      .update({
        plan: "free",
        subscription_status: "canceled", // Ensure status is set to canceled
        stripe_subscription_id: null,
        subscription_period_end: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("email", email)

    if (error) {
      console.error("Error updating user:", error)
      throw new Error("Failed to update user information")
    }

    return {
      success: true,
      message: "Subscription successfully canceled",
    }
  } catch (error) {
    console.error("Error canceling subscription:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
