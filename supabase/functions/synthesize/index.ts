import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert educational content synthesizer. You receive extracted text from student notes (from PDFs, images, presentations, documents).

CRITICAL RULES:
- You MUST base ALL output EXCLUSIVELY on the content provided in the uploaded files. 
- Do NOT add any information, facts, definitions, or explanations that are not present or directly implied in the source material.
- Do NOT hallucinate or fabricate content. If the source material is thin, produce shorter output rather than inventing details.
- If you cannot extract meaningful text from a file, say so explicitly in the master_notes.

Your job:
1. Merge overlapping content from multiple sources into comprehensive master notes.
2. Identify and highlight common keywords and concepts found IN THE SOURCES.
3. Detect and correct factual mistakes ONLY when clearly wrong based on the source context.
4. Remove irrelevant content and fluff.
5. Create a concise summary with key formulas/metrics FROM THE SOURCES.
6. Generate flashcards (question on front, answer on back) based ONLY on source content.
7. Generate quiz questions with 4 options, marking the correct answer index (0-3), difficulty (easy/medium/tricky), and common errors students make — all derived from the uploaded material.

You MUST respond using the suggest_study_materials tool.`;

// Helper to encode ArrayBuffer to base64 (Deno compatible)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { files, sessionId } = body;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(
        JSON.stringify({ error: "No files provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (files.length > 10) {
      return new Response(
        JSON.stringify({ error: "Maximum 10 files allowed." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin Supabase client to download files from storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Download files from storage and convert to base64
    const parts: any[] = [];

    for (const file of files) {
      if (!file.name || !file.path) {
        return new Response(
          JSON.stringify({ error: `File entry missing name or path.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Downloading file: ${file.name} from path: ${file.path}`);

      const { data: fileData, error: downloadError } = await adminClient.storage
        .from("processing-uploads")
        .download(file.path);

      if (downloadError || !fileData) {
        console.error(`Download error for ${file.name}:`, downloadError);
        return new Response(
          JSON.stringify({ error: `Failed to download "${file.name}".` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const buffer = await fileData.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      console.log(`File ${file.name}: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`);

      const nameLower = file.name.toLowerCase();
      const isImage = file.type?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(nameLower);
      const isPdf = file.type === "application/pdf" || nameLower.endsWith(".pdf");
      const isBinaryDoc = /\.(pptx|docx|xlsx)$/i.test(nameLower);

      if (isImage) {
        const mimeType = file.type || (nameLower.endsWith(".png") ? "image/png" : "image/jpeg");
        parts.push({ type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } });
        parts.push({ type: "text", text: `[Image file: ${file.name} - Extract ALL text, handwriting, diagrams, and formulas.]` });
      } else if (isPdf) {
        parts.push({ type: "image_url", image_url: { url: `data:application/pdf;base64,${base64}` } });
        parts.push({ type: "text", text: `[PDF file: ${file.name} - Extract and use ALL text and content from this PDF.]` });
      } else if (isBinaryDoc) {
        const mimeMap: Record<string, string> = {
          ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        };
        const ext = nameLower.substring(nameLower.lastIndexOf("."));
        const mimeType = file.type || mimeMap[ext] || "application/octet-stream";
        parts.push({ type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } });
        parts.push({ type: "text", text: `[Document: ${file.name} - Extract ALL content.]` });
      } else {
        let textContent: string;
        try { textContent = atob(base64); } catch { textContent = base64; }
        if (textContent.length > 80000) {
          textContent = textContent.substring(0, 80000) + "\n\n[Content truncated...]";
        }
        parts.push({ type: "text", text: `--- FILE: ${file.name} ---\n${textContent}\n--- END FILE ---` });
      }
    }

    // Cleanup uploaded files from storage after reading
    if (sessionId) {
      try {
        const filePaths = files.map((f: any) => f.path);
        await adminClient.storage.from("processing-uploads").remove(filePaths);
        console.log("Cleaned up storage files");
      } catch (e) {
        console.warn("Storage cleanup failed:", e);
      }
    }

    parts.push({
      type: "text",
      text: "Synthesize ONLY the content from the above uploaded files into study materials. Do NOT add any external information. Use the suggest_study_materials tool to return structured results.",
    });

    console.log(`Processing ${files.length} files, total parts: ${parts.length}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: parts },
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_study_materials",
            description: "Return synthesized study materials.",
            parameters: {
              type: "object",
              properties: {
                master_notes: { type: "string", description: "Comprehensive merged notes in Markdown format." },
                summary: { type: "string", description: "TL;DR summary in Markdown." },
                flashcards: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { front: { type: "string" }, back: { type: "string" } },
                    required: ["front", "back"],
                    additionalProperties: false,
                  },
                  description: "10-20 flashcards",
                },
                quiz: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      options: { type: "array", items: { type: "string" } },
                      correct: { type: "number" },
                      difficulty: { type: "string", enum: ["easy", "medium", "tricky"] },
                      common_error: { type: "string" },
                    },
                    required: ["question", "options", "correct", "difficulty"],
                    additionalProperties: false,
                  },
                  description: "8-15 quiz questions",
                },
              },
              required: ["master_notes", "summary", "flashcards", "quiz"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_study_materials" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: `AI processing failed (${response.status}).` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const rawText = await response.text();
    console.log("AI response received, length:", rawText.length);

    let aiResult: any;
    try {
      aiResult = JSON.parse(rawText);
    } catch {
      console.error("Failed to parse AI response:", rawText.substring(0, 500));
      return new Response(JSON.stringify({ error: "AI returned an invalid response. Try with a smaller file." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(aiResult).substring(0, 500));
      return new Response(JSON.stringify({ error: "AI did not return structured results." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let studyMaterials: any;
    try {
      studyMaterials = JSON.parse(toolCall.function.arguments);
    } catch {
      return new Response(JSON.stringify({ error: "Failed to parse AI response." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!studyMaterials.master_notes || !studyMaterials.flashcards || !studyMaterials.quiz) {
      return new Response(JSON.stringify({ error: "AI returned incomplete results." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`Success: ${studyMaterials.flashcards.length} flashcards, ${studyMaterials.quiz.length} quiz questions`);

    return new Response(JSON.stringify(studyMaterials), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Synthesize error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
