import express from "express";
import cohere from "../config/cohereClient.js";
import { getInitializedDocuments } from "../services/documentService.js";
import { getTopKDocuments } from "../utils/vector.js";

const router = express.Router();

// ============================================================================
// PREAMBLE DEFINITIONS (System Prompts)
// ============================================================================

/**
 * Preamble for general culinary questions (Standard RAG).
 */
const GENERAL_PREAMBLE = `You are CulinaryGPT, a comprehensive culinary AI assistant with expertise across all aspects of cooking, food, and kitchen management. You have access to extensive knowledge covering:

COOKING & RECIPES: Traditional and modern recipes, cooking techniques, flavor combinations, and meal planning
INGREDIENT SUBSTITUTIONS: Creative alternatives for dietary restrictions, allergies, and missing ingredients
NUTRITION & HEALTH: Dietary guidance, nutritional information, healthy eating tips, and special dietary needs
KITCHEN EQUIPMENT: Proper use, maintenance, and selection of cookware, appliances, and tools
FOOD SAFETY: Storage guidelines, temperature requirements, spoilage detection, and safe food handling
CULINARY TECHNIQUES: Professional methods adapted for home cooks, troubleshooting, and skill development

RESPONSE GUIDELINES:
• Answer using the provided documents whenever possible - they contain expert-verified information.
• If documents don't cover the topic, use your general culinary knowledge but stay within food/cooking domains.
• Provide practical, actionable advice.
• Include safety warnings when relevant.
• Use clear, friendly language.
• If asked about non-culinary topics, politely redirect to food/cooking questions.`;

/**
 * Preamble for recipe-specific questions (Hybrid-RAG).
 * This tells the AI how to use both the recipe and the general knowledge.
 */
const HYBRID_PREAMBLE = `You are CulinaryGPT, a helpful AI assistant.
Your PRIMARY goal is to answer a user's question about a specific recipe they are looking at.

HOW TO ANSWER:
1.  **Prioritize the Recipe:** The user has provided a specific recipe. This is your main source of truth. Your answer MUST be based on this recipe.
2.  **Use General Knowledge:** You have also been given general knowledge documents (like cooking techniques, food safety, or substitutions).
3.  **Combine:** Use the general knowledge *only* to help explain or add detail to the recipe. For example, if the user asks "how do I 'sear' the chicken in step 2?", you should use the recipe context to confirm step 2 involves searing, and the general knowledge document to explain *what searing is*.
4.  **Be Direct:** Answer the user's question directly. If they ask for a substitution, provide one from your knowledge base that works for the recipe.`;

// ============================================================================
// CHAT ENDPOINT (POST /prompt)
// ============================================================================

router.post("/prompt", async (req, res) => {
  const { prompt, recipeContext } = req.body;
  let serverResponse; // To hold the final response from Cohere

  // --- 1. Validation ---
  if (!prompt) {
    console.warn("[API] POST /prompt - Failed (400): No prompt provided.");
    return res.status(400).json({ error: "Prompt is required" });
  }

  const documents = getInitializedDocuments();
  if (!documents || documents.length === 0) {
    console.error(
      "[API] POST /prompt - Failed (503): Knowledge base is not initialized."
    );
    return res
      .status(503)
      .json({ error: "Server is initializing, please try again." });
  }

  try {
    // --- 2. Embed the User's Query ---
    // We do this for both cases, as RAG is always needed for general knowledge
    console.log(
      `[API] POST /prompt - Embedding user query: "${prompt.substring(
        0,
        40
      )}..."`
    );
    const embedResponse = await cohere.embed({
      texts: [prompt],
      model: "embed-multilingual-v3.0",
      input_type: "search_query",
    });
    const queryEmbedding = embedResponse.embeddings[0];

    // --- 3. Get Top K General Knowledge Documents ---
    const topKDocs = getTopKDocuments(queryEmbedding, documents, 5); // Get top 5 general docs

    let chatDocuments = [];
    let preamble = "";

    // --- 4. Hybrid Logic ---
    if (recipeContext) {
      // --- HYBRID-RAG PATH (Recipe + General Knowledge) ---
      console.log(
        "[API] POST /prompt - Using HYBRID-RAG (Recipe + General) logic."
      );
      preamble = HYBRID_PREAMBLE;

      // Add the specific recipe as the FIRST document
      chatDocuments.push({
        id: "recipe_context",
        text: `This is the user's main recipe: ${recipeContext}`,
      });

      // Add the general knowledge documents
      topKDocs.forEach((doc) => {
        chatDocuments.push({
          id: doc.id,
          text: `${doc.data.title}. ${doc.data.snippet}`,
        });
      });
    } else {
      // --- STANDARD-RAG PATH (General Knowledge Only) ---
      console.log("[API] POST /prompt - Using STANDARD-RAG (General) logic.");
      preamble = GENERAL_PREAMBLE;

      // Add only the general knowledge documents
      topKDocs.forEach((doc) => {
        chatDocuments.push({
          id: doc.id,
          text: `${doc.data.title}. ${doc.data.snippet}`,
        });
      });
    }

    // --- 5. Call Cohere Chat API ---
    console.log(
      `[API] POST /prompt - Sending ${chatDocuments.length} documents to Cohere.`
    );
    serverResponse = await cohere.chat({
      model: "command-r-plus",
      message: prompt,
      documents: chatDocuments,
      preamble: preamble,
      temperature: 0.3,
    });

    // --- 6. Send Response ---
    console.log("[API] POST /prompt - Success (200): Response generated.");
    res.json({
      text: serverResponse.text,
      citations: serverResponse.citations ?? [],
      documentsUsed: chatDocuments.length,
    });
  } catch (err) {
    console.error("[API] POST /prompt - Failed (500):", err);
    res.status(500).json({
      error: "Error communicating with Cohere API",
      details: err.message,
    });
  }
});

export default router;
