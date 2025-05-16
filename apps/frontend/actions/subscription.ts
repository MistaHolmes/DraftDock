"use server"

import { stripe } from "@/lib/stripe"
import { supabaseAdmin } from "@/lib/supabase"

if (!process.env.STRIPE_PRO_PRICE_ID || !process.env.STRIPE_PREMIUM_PRICE_ID) {
  throw new Error("Missing Stripe price IDs in environment variables")
}

const PLAN_PRICES = {
  pro: process.env.STRIPE_PRO_PRICE_ID,
  premium: process.env.STRIPE_PREMIUM_PRICE_ID,
}

export async function createSubscription(email: string, plan: "pro" | "premium") {
  try {
    // Get the user from the database
    const { data: user } = await supabaseAdmin.from("users").select("stripe_customer_id").eq("email", email).single()

    let customerId = user?.stripe_customer_id

    // If user doesn't have a Stripe customer ID, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          supabaseUserId: email, // Using email as the identifier
        },
      })
      customerId = customer.id

      // Save the customer ID to the user record
      await supabaseAdmin.from("users").update({ stripe_customer_id: customerId }).eq("email", email)
    }

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: PLAN_PRICES[plan] }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        plan,
      },
    })

    // Update the user record with subscription details
    await supabaseAdmin
      .from("users")
      .update({
        stripe_subscription_id: subscription.id,
        stripe_subscription_item_id: subscription.items.data[0].id,
        subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        subscription_status: subscription.status,
        updated_at: new Date().toISOString(),
      })
      .eq("email", email)

    // @ts-ignore - The expanded types are not properly typed
    const clientSecret = subscription.latest_invoice.payment_intent.client_secret

    return {
      subscriptionId: subscription.id,
      clientSecret,
    }
  } catch (error) {
    console.error("Error creating subscription:", error)
    throw new Error("Failed to create subscription")
  }
}
