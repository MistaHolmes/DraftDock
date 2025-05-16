"use server"

import { supabaseAdmin } from "@/lib/supabase"

const API_VERSION = "2024-04" // Update this to the latest Shopify API version

async function getShopifyCredentials(email: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("shopify_domain, shopify_admin_api_token, shopify_theme_id")
    .eq("email", email)
    .single()

  if (error) {
    console.error("Error fetching Shopify credentials:", error)
    throw new Error("Failed to fetch Shopify credentials")
  }
  return data
}

export async function updateShopifyIndexJson(email: string, content: string) {
  try {
    const credentials = await getShopifyCredentials(email)
    if (!credentials.shopify_domain || !credentials.shopify_admin_api_token || !credentials.shopify_theme_id) {
      throw new Error("❌ Missing Shopify credentials.")
    }

    // Process the content to extract necessary information
    const processedContent = processContent(content)

    const newIndexJson = {
      sections: {
        image_banner: {
          type: "image-banner",
          blocks: {
            heading: {
              type: "heading",
              settings: {
                heading: processedContent.hero_headline,
                heading_size: "h1",
              },
            },
            text: {
              type: "text",
              settings: {
                text: processedContent.hero_subheading,
                text_style: "body",
              },
            },
            buttons: {
              type: "buttons",
              settings: {
                button_label_1: "",
                button_link_1: "",
                button_style_secondary_1: false,
                button_label_2: "BUY NOW",
                button_link_2: "",
                button_style_secondary_2: false,
              },
            },
          },
          block_order: ["heading", "text", "buttons"],
          settings: {
            image_overlay_opacity: 40,
            image_height: "medium",
            desktop_content_position: "middle-center",
            show_text_box: false,
            desktop_content_alignment: "center",
            color_scheme: "scheme-4",
            image_behavior: "none",
            mobile_content_alignment: "center",
            stack_images_on_mobile: false,
            show_text_below: false,
          },
        },
        featured_product: {
          type: "featured-product",
          blocks: {
            title: {
              type: "title",
              settings: {
                heading_size: "h1",
              },
            },
            price: {
              type: "price",
              settings: {},
            },
            buy_buttons: {
              type: "buy_buttons",
              settings: {
                show_dynamic_checkout: true,
                show_gift_card_recipient: true,
              },
            },
            text: {
              type: "text",
              settings: {
                text: "",
                text_style: "uppercase",
              },
            },
          },
          block_order: ["title", "price", "buy_buttons", "text"],
          settings: {
            product: "",
            color_scheme: "",
            secondary_background: false,
            media_size: "medium",
            constrain_to_viewport: true,
            media_fit: "cover",
            media_position: "right",
            image_zoom: "lightbox",
            hide_variants: false,
            enable_video_looping: false,
            padding_top: 36,
            padding_bottom: 36,
          },
        },
        multicolumn: {
          type: "multicolumn",
          blocks: {
            column1: {
              type: "column",
              settings: {
                title: processedContent.benefit_headline1,
                text: `<p>${processedContent.benefit_text1}</p>`,
                link_label: "",
                link: "",
              },
            },
            column2: {
              type: "column",
              settings: {
                title: processedContent.benefit_headline2,
                text: `<p>${processedContent.benefit_text2}</p>`,
                link_label: "",
                link: "",
              },
            },
            column3: {
              type: "column",
              settings: {
                title: processedContent.benefit_headline3,
                text: `<p>${processedContent.benefit_text3}</p>`,
                link_label: "",
                link: "",
              },
            },
          },
          block_order: ["column1", "column2", "column3"],
          settings: {
            title: "",
            heading_size: "h1",
            image_width: "full",
            image_ratio: "adapt",
            columns_desktop: 3,
            column_alignment: "left",
            background_style: "primary",
            button_label: "",
            button_link: "",
            color_scheme: "",
            columns_mobile: "1",
            swipe_on_mobile: false,
            padding_top: 36,
            padding_bottom: 36,
          },
        },
        image_with_text: {
          type: "image-with-text",
          blocks: {
            heading: {
              type: "heading",
              settings: {
                heading: processedContent.image_with_text_headline,
                heading_size: "h1",
              },
            },
            text: {
              type: "text",
              settings: {
                text: `<p>${processedContent.image_with_text_text}</p>`,
                text_style: "body",
              },
            },
            button: {
              type: "button",
              settings: {
                button_label: "LEARN MORE",
                button_link: "",
                button_style_secondary: false,
              },
            },
          },
          block_order: ["heading", "text", "button"],
          settings: {
            height: "adapt",
            desktop_image_width: "medium",
            layout: "image_first",
            desktop_content_position: "top",
            desktop_content_alignment: "left",
            content_layout: "no-overlap",
            section_color_scheme: "",
            color_scheme: "",
            image_behavior: "none",
            mobile_content_alignment: "left",
            padding_top: 36,
            padding_bottom: 36,
          },
        },
        rich_text: {
          type: "rich-text",
          blocks: {
            heading: {
              type: "heading",
              settings: {
                heading: processedContent.rich_text_headline,
                heading_size: "h1",
              },
            },
            text: {
              type: "text",
              settings: {
                text: `<p>${processedContent.rich_text_text}</p>`,
              },
            },
            button: {
              type: "button",
              settings: {
                button_label: "BUY NOW",
                button_link: "",
                button_style_secondary: false,
                button_label_2: "",
                button_link_2: "",
                button_style_secondary_2: false,
              },
            },
          },
          block_order: ["heading", "text", "button"],
          settings: {
            desktop_content_position: "center",
            content_alignment: "center",
            color_scheme: "",
            full_width: true,
            padding_top: 40,
            padding_bottom: 52,
          },
        },
      },
      order: ["image_banner", "featured_product", "multicolumn", "image_with_text", "rich_text"],
    }

    const url = `https://${credentials.shopify_domain}/admin/api/${API_VERSION}/themes/${credentials.shopify_theme_id}/assets.json`

    const updateResponse = await fetch(url, {
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": credentials.shopify_admin_api_token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        asset: {
          key: "templates/index.json",
          value: JSON.stringify(newIndexJson, null, 2),
        },
      }),
    })

    if (!updateResponse.ok) {
      throw new Error(`❌ Failed to update index.json: ${updateResponse.status}`)
    }

    return {
      success: true,
      message: "index.json updated successfully with correct section types",
      finalJson: newIndexJson,
    }
  } catch (error) {
    console.error("❌ Error updating index.json:", error)
    return { success: false, message: error instanceof Error ? error.message : "An unexpected error occurred" }
  }
}

function processContent(content: string) {
  // Extract relevant information from the content
  const headlineMatch = content.match(/<h2>(.*?)<\/h2>/)
  const subheadlineMatch = content.match(/<p>(.*?)<\/p>/)

  // Extract benefit headlines and texts
  const benefitsSection = content.match(/<div class="funnel-section benefits">([\s\S]*?)<\/div>/)
  const benefitHeadlines = benefitsSection ? benefitsSection[1].match(/<h3>(.*?)<\/h3>/g) : []
  const benefitTexts = benefitsSection ? benefitsSection[1].match(/<p>(.*?)<\/p>/g) : []

  const storyMatch = content.match(/<div class="funnel-section story">([\s\S]*?)<\/div>/)
  const offerMatch = content.match(/<div class="funnel-section offer">([\s\S]*?)<\/div>/)

  // Extract individual benefit headlines and texts
  const benefit_headline1 =
    benefitHeadlines && benefitHeadlines[0]
      ? benefitHeadlines[0].replace(/<\/?h3>/g, "").replace(/Benefit \d+:\s*/, "")
      : ""
  const benefit_headline2 =
    benefitHeadlines && benefitHeadlines[1]
      ? benefitHeadlines[1].replace(/<\/?h3>/g, "").replace(/Benefit \d+:\s*/, "")
      : ""
  const benefit_headline3 =
    benefitHeadlines && benefitHeadlines[2]
      ? benefitHeadlines[2].replace(/<\/?h3>/g, "").replace(/Benefit \d+:\s*/, "")
      : ""

  const benefit_text1 = benefitTexts && benefitTexts[0] ? benefitTexts[0].replace(/<\/?p>/g, "") : ""
  const benefit_text2 = benefitTexts && benefitTexts[1] ? benefitTexts[1].replace(/<\/?p>/g, "") : ""
  const benefit_text3 = benefitTexts && benefitTexts[2] ? benefitTexts[2].replace(/<\/?p>/g, "") : ""

  return {
    hero_headline: headlineMatch ? headlineMatch[1] : "",
    hero_subheading: subheadlineMatch ? subheadlineMatch[1] : "",
    benefit_headline1,
    benefit_text1,
    benefit_headline2,
    benefit_text2,
    benefit_headline3,
    benefit_text3,
    image_with_text_headline: storyMatch ? storyMatch[1].match(/<h2>(.*?)<\/h2>/)[1] : "",
    image_with_text_text: storyMatch ? storyMatch[1].replace(/<[^>]*>/g, "").trim() : "",
    rich_text_headline: offerMatch ? offerMatch[1].match(/<h2>(.*?)<\/h2>/)[1] : "",
    rich_text_text: offerMatch ? offerMatch[1].replace(/<[^>]*>/g, "").trim() : "",
  }
}
