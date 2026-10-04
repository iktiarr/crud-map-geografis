/**
 * AI Route Assistant Client Helper (Module 5)
 * Secure client-to-server bridge for asking AI about route problems,
 * detour questions, road connection troubleshooting, and optimization.
 */

export interface RouteAssistantContext {
  waypointsCount: number;
  waypointsSample?: { name?: string; lat: number; lng: number }[];
  connectionMode: string;
  travelMode?: string;
  totalDistanceKm?: number;
  totalDurationMin?: number;
  streetNames?: string[];
  issueDescription?: string;
}

export interface AiRouteAction {
  type: "set_mode" | "reverse" | "connect_all_nearest" | "set_marker" | "remove_last" | string;
  param?: string;
  label: string;
}

export interface AskAiResponse {
  success: boolean;
  reply?: string;
  modelUsed?: string;
  error?: string;
  actions?: AiRouteAction[];
}

/**
 * Parsing tag [ACTION:type:param:label] dari teks jawaban AI
 */
export function parseAiActions(reply: string): { cleanText: string; actions: AiRouteAction[] } {
  const actions: AiRouteAction[] = [];
  const actionRegex = /\[ACTION:([a-zA-Z0-9_]+)(?::([a-zA-Z0-9_]+))?:([^\]]+)\]/g;

  const cleanText = reply
    .replace(actionRegex, (_, type, param, label) => {
      actions.push({ type, param: param || undefined, label: label.trim() });
      return "";
    })
    .trim();

  return { cleanText, actions };
}

export async function askAiRouteAssistant(
  message: string,
  context?: RouteAssistantContext
): Promise<AskAiResponse> {
  try {
    const res = await fetch("/api/ai-route-assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, context }),
    });

    const data = await res.json();
    if (data.success && data.reply) {
      const { cleanText, actions } = parseAiActions(data.reply);
      return {
        ...data,
        reply: cleanText,
        actions,
      };
    }
    return data;
  } catch (err) {
    console.error("Gagal menghubungi asisten AI:", err);
    return {
      success: false,
      error: "Gagal terhubung ke server asisten AI. Periksa koneksi jaringan Anda.",
    };
  }
}
