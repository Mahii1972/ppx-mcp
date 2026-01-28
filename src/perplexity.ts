/**
 * Perplexity API client using got-scraping for Cloudflare bypass.
 */

import { gotScraping } from "got-scraping";
import { randomUUID } from "crypto";

const SUPPORTED_BLOCK_USE_CASES = [
  "answer_modes", "media_items", "knowledge_cards", "inline_entity_cards",
  "place_widgets", "finance_widgets", "prediction_market_widgets", "sports_widgets",
  "flight_status_widgets", "shopping_widgets", "jobs_widgets", "search_result_widgets",
  "clarification_responses", "inline_images", "inline_assets", "placeholder_cards",
  "diff_blocks", "inline_knowledge_cards", "entity_group_v2", "refinement_filters",
  "canvas_mode", "maps_preview", "answer_tabs", "price_comparison_widgets", "preserve_latex"
];

export interface PerplexityResponse {
  answer: string | null;
  conversationUuid: string | null;
}

export class PerplexityClient {
  private cookieString: string;

  constructor(cookieString: string) {
    this.cookieString = cookieString;
  }

  async ask(query: string, model: string = "turbo"): Promise<PerplexityResponse> {
    const frontendUuid = randomUUID();

    const payload = {
      params: {
        attachments: [],
        language: "en-US",
        timezone: "America/New_York",
        search_focus: "internet",
        sources: ["web"],
        search_recency_filter: null,
        frontend_uuid: frontendUuid,
        mode: "concise",
        model_preference: model,
        is_related_query: false,
        is_sponsored: false,
        frontend_context_uuid: randomUUID(),
        prompt_source: "user",
        query_source: "home",
        is_incognito: false,
        local_search_enabled: false,
        use_schematized_api: true,
        send_back_text_in_streaming_api: false,
        supported_block_use_cases: SUPPORTED_BLOCK_USE_CASES,
        supported_features: ["browser_agent_permission_banner"],
        client_coordinates: null,
        mentions: [],
        skip_search_enabled: true,
        is_nav_suggestions_disabled: false,
        always_search_override: false,
        override_no_search: false,
        should_ask_for_mcp_tool_confirmation: true,
        browser_agent_allow_once_from_toggle: false,
        version: "2.18"
      },
      query_str: query
    };

    const response = await gotScraping({
      url: "https://www.perplexity.ai/rest/sse/perplexity_ask",
      method: "POST",
      headers: {
        "Accept": "text/event-stream",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/json",
        "Cookie": this.cookieString,
        "Referer": "https://www.perplexity.ai/",
        "Origin": "https://www.perplexity.ai",
        "X-Request-Id": frontendUuid,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
      },
      body: JSON.stringify(payload),
      useHeaderGenerator: true,
      headerGeneratorOptions: {
        browsers: [{ name: "firefox", minVersion: 120 }],
        devices: ["desktop"],
        operatingSystems: ["windows"],
      },
      timeout: { request: 120000 },
      throwHttpErrors: false,
    });

    if (response.statusCode === 403) {
      throw new Error("Access forbidden (403). Cookies may be expired.");
    }
    if (response.statusCode === 429) {
      throw new Error("Rate limit exceeded (429). Please wait.");
    }
    if (response.statusCode !== 200) {
      throw new Error(`HTTP ${response.statusCode}: ${response.body.substring(0, 200)}`);
    }

    return this.parseResponse(response.body);
  }

  private parseResponse(text: string): PerplexityResponse {
    let conversationUuid: string | null = null;
    const chunks: string[] = [];

    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        try {
          const data = JSON.parse(trimmed.substring(6));

          if (!conversationUuid && data.backend_uuid) {
            conversationUuid = data.backend_uuid;
          }

          // Extract answer from diff_block patches
          for (const block of data.blocks || []) {
            const diffBlock = block.diff_block;
            if (diffBlock?.field === "markdown_block") {
              for (const patch of diffBlock.patches || []) {
                const value = patch.value;
                // New format: chunks array with streaming text
                if (typeof value === "object" && value?.chunks) {
                  // Initial chunk with array
                  chunks.push(...value.chunks);
                } else if (typeof value === "string" && patch.path?.includes("/chunks/")) {
                  // Incremental chunk additions
                  chunks.push(value);
                }
                // Legacy format: answer field
                else if (typeof value === "object" && value?.answer) {
                  return { answer: value.answer, conversationUuid };
                } else if (typeof value === "string" && patch.path?.endsWith("/answer")) {
                  return { answer: value, conversationUuid };
                }
              }
            }
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    // Join all chunks to form the complete answer
    const answer = chunks.length > 0 ? chunks.join("") : null;
    return { answer, conversationUuid };
  }
}
