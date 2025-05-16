"use server"

import { supabaseAdmin } from "@/lib/supabase"

async function getShopifyThemeId(domain: string, adminApiToken: string): Promise<string | null> {
  try {
    const response = await fetch(`https://${domain}/admin/api/2024-01/themes.json`, {
      headers: {
        "X-Shopify-Access-Token": adminApiToken,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch Shopify themes")
    }

    const data = await response.json()
    // Find the currently published/active theme
    const activeTheme = data.themes.find((theme: any) => theme.role === "main" && theme.processing === false)

    if (!activeTheme) {
      throw new Error("No active theme found")
    }

    return activeTheme.id.toString()
  } catch (error) {
    console.error("Error fetching Shopify theme ID:", error)
    return null
  }
}

export async function connectShopifyStore(
  email: string,
  shopDomain: string,
  adminApiToken: string,
  storefrontApiToken: string,
  apiKey: string,
  secretKey: string,
) {
  try {
    // Get the active theme ID
    const themeId = await getShopifyThemeId(shopDomain, adminApiToken)

    if (!themeId) {
      throw new Error("Could not fetch active theme ID")
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .update({
        shopify_domain: shopDomain,
        shopify_admin_api_token: adminApiToken,
        shopify_storefront_api_token: storefrontApiToken,
        shopify_theme_id: themeId, // Store the active theme ID
        shopify_api_key: apiKey,
        shopify_secret_key: secretKey,
        updated_at: new Date().toISOString(),
      })
      .eq("email", email)
      .select()

    if (error) throw error

    return {
      success: true,
      message: "Shopify store connected successfully",
      themeId,
    }
  } catch (error) {
    console.error("Error connecting Shopify store:", error)
    return { success: false, message: "Failed to connect Shopify store" }
  }
}

export async function getShopifyStoreInfo(email: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("shopify_domain, shopify_theme_id, shopify_api_key")
      .eq("email", email)
      .single()

    if (error) throw error

    return {
      success: true,
      shopifyDomain: data?.shopify_domain || null,
      shopifyThemeId: data?.shopify_theme_id || null,
      shopifyApiKey: data?.shopify_api_key || null,
    }
  } catch (error) {
    console.error("Error fetching Shopify store info:", error)
    return {
      success: false,
      shopifyDomain: null,
      shopifyThemeId: null,
      shopifyApiKey: null,
    }
  }
}

export async function removeShopifyStore(email: string) {
  try {
    const { error } = await supabaseAdmin
      .from("users")
      .update({
        shopify_domain: null,
        shopify_admin_api_token: null,
        shopify_storefront_api_token: null,
        shopify_theme_id: null,
        shopify_api_key: null,
        shopify_secret_key: null,
        updated_at: new Date().toISOString(),
      })
      .eq("email", email)

    if (error) throw error

    return { success: true, message: "Shopify store disconnected successfully" }
  } catch (error) {
    console.error("Error removing Shopify store:", error)
    return { success: false, message: "Failed to disconnect Shopify store" }
  }
}
