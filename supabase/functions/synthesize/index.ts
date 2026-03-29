import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert educational content synthesizer. You receive extracted text from student notes (from PDFs, images, presentations, documents).

Your job:
1. Merge overlapping content from multiple sources into comprehensive master notes.
2. Identify and highlight common keywords and concepts.
3. Detect and correct factual mistakes.
4. Fill conceptual gaps with brief, accurate explanations.
5. Remove irrelevant content and fluff.
6. Create a concise summary with key formulas/metrics.
7. Generate flashcards (question on front, answer on back).
8. Generate quiz questions with 4 options, marking the correct answer index (0-3), difficulty (easy/medium/tricky), and common errors students make.

IMPORTANT: Base ALL content strictly on the uploaded notes. Do not hallucinate or add information not present or directly implied by the source material. You may add brief clarifying context but always ground it in the source.

You MUST respond using the suggest_study_materials tool.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { files } = body;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(
        JSON.stringify({ error: "No files provided. Please upload at least one file." }),
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
      console.error("LOVABLE_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "AI service not configured. Please check Cloud settings." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and sanitize each file
    for (const file of files) {
      if (!file.name || typeof file.name !== "string") {
        return new Response(
          JSON.stringify({ error: "Each file must have a valid name." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!file.data || typeof file.data !== "string") {
        return new Response(
          JSON.stringify({ error: `File "${file.name}" has no data.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Sanitize filename to prevent injection
      file.name = file.name.replace(/[<>\"'&]/g, "");
    }

    // Build content parts for the AI message
    const parts: any[] = [];

    for (const file of files) {
      const isImage =
        file.type?.startsWith("image/") ||
        /\.(jpg|jpeg|png)$/i.test(file.name);

      if (isImage) {
        const mimeType =
          file.type ||
          (file.name.endsWith(".png") ? "image/png" : "image/jpeg");
        parts.push({
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${file.data}` },
        });
        parts.push({
          type: "text",
          text: `[Image file: ${file.name} - Please OCR and extract all text, handwriting, diagrams, and formulas from this image]`,
        });
      } else {
        let textContent: string;
        try {
          textContent = atob(file.data);
        } catch {
          textContent = file.data;
        }

        // Truncate very large documents (increased limit to 80k chars)
        if (textContent.length > 80000) {
          textContent =
            textContent.substring(0, 80000) +
            "\n\n[Content truncated for processing...]";
        }

        parts.push({
          type: "text",
          text: `--- FILE: ${file.name} ---\n${textContent}\n--- END FILE ---`,
        });
      }
    }

    parts.push({
      type: "text",
      text: "Please synthesize all the above notes into comprehensive study materials. Use the suggest_study_materials tool to return structured results.",
    });

    console.log(`Processing ${files.length} files, total parts: ${parts.length}`);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
          tools: [
            {
              type: "function",
              function: {
                name: "suggest_study_materials",
                description:
                  "Return synthesized study materials including notes, summary, flashcards, and quiz questions.",
                parameters: {
                  type: "object",
                  properties: {
                    master_notes: {
                      type: "string",
                      description:
                        "Comprehensive merged notes in Markdown format, organized by subtopic with headers. Use **bold** for key terms.",
                    },
                    summary: {
                      type: "string",
                      description:
                        "TL;DR summary in Markdown with key formulas, metrics, and important points.",
                    },
                    flashcards: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          front: {
                            type: "string",
                            description: "Question or term",
                          },
                          back: {
                            type: "string",
                            description: "Answer or definition",
                          },
                        },
                        required: ["front", "back"],
                        additionalProperties: false,
                      },
                      description: "10-20 flashcards covering key concepts",
                    },
                    quiz: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          question: { type: "string" },
                          options: {
                            type: "array",
                            items: { type: "string" },
                            description: "Exactly 4 answer options",
                          },
                          correct: {
                            type: "number",
                            description: "Index of correct answer (0-3)",
                          },
                          difficulty: {
                            type: "string",
                            enum: ["easy", "medium", "tricky"],
                          },
                          common_error: {
                            type: "string",
                            description:
                              "Common mistake students make on this topic",
                          },
                        },
                        required: [
                          "question",
                          "options",
                          "correct",
                          "difficulty",
                        ],
                        additionalProperties: false,
                      },
                      description:
                        "8-15 quiz questions with varying difficulty",
                    },
                  },
                  required: [
                    "master_notes",
                    "summary",
                    "flashcards",
                    "quiz",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "suggest_study_materials" },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error:
              "Rate limit exceeded. Please try again in a moment.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "AI credits exhausted. Please add funds in Settings → Workspace → Usage.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      return new Response(
        JSON.stringify({
          error: `AI processing failed (${response.status}). Please try again.`,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const aiResult = await response.json();
    console.log("AI response received, extracting tool call...");

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response:", JSON.stringify(aiResult).substring(0, 500));
      return new Response(
        JSON.stringify({
          error: "AI did not return structured results. Please try again.",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let studyMaterials: any;
    try {
      studyMaterials = JSON.parse(toolCall.function.arguments);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", parseErr);
      return new Response(
        JSON.stringify({
          error: "Failed to parse AI response. Please try again.",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate response structure
    if (!studyMaterials.master_notes || !studyMaterials.flashcards || !studyMaterials.quiz) {
      console.error("Incomplete AI response:", Object.keys(studyMaterials));
      return new Response(
        JSON.stringify({
          error: "AI returned incomplete results. Please try again with different notes.",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Success: ${studyMaterials.flashcards.length} flashcards, ${studyMaterials.quiz.length} quiz questions`);

    return new Response(JSON.stringify(studyMaterials), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Synthesize error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
