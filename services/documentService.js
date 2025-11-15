import fs from "fs/promises";
import path from "path";
import cohere from "../config/cohereClient.js"; // Import our singleton client

// ============================================================================
// CONFIGURATION AND STATE
// ============================================================================

// File path for storing pre-computed embeddings
const EMBEDDINGS_FILE = path.join(
  process.cwd(),
  "embeddings",
  "embeddings.json"
);

// Global cache for documents with embeddings
let cachedDocuments = [];
let embeddingsComputedAt = null;
let isInitializing = false;

// ============================================================================
// EMBEDDING PROCESSING FUNCTIONS
// ============================================================================

/**
 * Utility function to pause execution for rate limiting
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Load and categorize culinary documents from JSON files
 */
async function loadDocuments() {
  console.log("[DocumentService] Loading documents from JSON files...");
  const documentNames = [
    "recipes.json",
    "techniques_Tips.json",
    "nutrition_Advice.json",
    "ingredient_Substitutions.json",
    "food_Safety.json",
    "equipment_Usage.json",
    "cooking_Advice.json",
  ];

  const files = documentNames.map((file) =>
    path.join(process.cwd(), "documents", file)
  );

  const documents = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(file, "utf-8");
      const json = JSON.parse(content);
      const category = path.basename(file, ".json"); // 'recipes', 'techniques_Tips', etc.

      json.forEach((item, idx) => {
        documents.push({
          id: `${category}_${idx + 1}`,
          data: {
            title: item.prompt,
            snippet: item.response,
            category: category,
          },
        });
      });
    } catch (err) {
      console.error(`[DocumentService] Error reading ${file}:`, err.message);
    }
  }

  console.log(
    `[DocumentService] Loaded ${documents.length} documents across all categories`
  );

  const categoryCount = documents.reduce((acc, doc) => {
    acc[doc.data.category] = (acc[doc.data.category] || 0) + 1;
    return acc;
  }, {});

  console.log(
    "[DocumentService] Document breakdown by category:",
    categoryCount
  );
  return documents;
}

/**
 * Generate embeddings for documents in batches
 */
async function embedDocumentsInBatches(documents, batchSize = 96) {
  const allEmbeddings = [];

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    console.log(
      `[DocumentService] Embedding batch ${i / batchSize + 1} of ${Math.ceil(
        documents.length / batchSize
      )}...`
    );

    try {
      const response = await cohere.embed({
        texts: batch.map((doc) => `${doc.data.title}. ${doc.data.snippet}`),
        model: process.env.COHERE_EMBED_MODEL || "embed-multilingual-v3.0",
        input_type: "search_document",
      });

      allEmbeddings.push(...response.embeddings);
    } catch (error) {
      console.error(
        `[DocumentService] Error embedding batch ${i / batchSize + 1}:`,
        error.message
      );
      // Decide if you want to stop or continue. For now, we'll just log and continue.
    }

    if (i + batchSize < documents.length) {
      await sleep(2000); // Rate limiting
    }
  }
  return allEmbeddings;
}

/**
 * Save computed embeddings to file.
 * This function ALSO creates the 'embeddings' directory if it's missing.
 */
async function saveEmbeddingsToFile(documents) {
  try {
    // *** THIS IS THE LOGIC YOU ASKED FOR ***
    // This line ensures the 'embeddings' directory exists.
    // { recursive: true } means it won't error if the folder already exists.
    const embeddingsDir = path.dirname(EMBEDDINGS_FILE);
    await fs.mkdir(embeddingsDir, { recursive: true });

    const embeddingsData = documents.map((doc) => ({
      id: doc.id,
      title: doc.data.title,
      snippet: doc.data.snippet,
      category: doc.data.category,
      embedding: doc.embedding,
      computedAt: new Date().toISOString(),
    }));

    // *** THIS IS THE OTHER PART YOU ASKED FOR ***
    // This line will create 'embeddings.json' if it's missing,
    // or overwrite it if it's already there.
    await fs.writeFile(
      EMBEDDINGS_FILE,
      JSON.stringify(embeddingsData, null, 2),
      "utf-8"
    );

    embeddingsComputedAt = new Date();
    console.log(`[DocumentService] Embeddings saved to ${EMBEDDINGS_FILE}`);
  } catch (error) {
    console.error(
      `[DocumentService] CRITICAL: Failed to save embeddings file:`,
      error
    );
  }
}

/**
 * Load pre-computed embeddings from file.
 * Gracefully handles the file not existing.
 */
async function loadEmbeddingsFromFile() {
  try {
    const content = await fs.readFile(EMBEDDINGS_FILE, "utf-8");
    const embeddingsData = JSON.parse(content);

    if (embeddingsData.length > 0 && embeddingsData[0].computedAt) {
      embeddingsComputedAt = new Date(embeddingsData[0].computedAt);
    }

    console.log(
      `[DocumentService] Loaded ${embeddingsData.length} embeddings from ${EMBEDDINGS_FILE}`
    );

    return embeddingsData.map((item) => ({
      id: item.id,
      data: {
        title: item.title,
        snippet: item.snippet,
        category: item.category || "general",
      },
      embedding: item.embedding,
    }));
  } catch (err) {
    // *** THIS IS THE LOGIC THAT HANDLES a .gitignored file ***
    // If the file doesn't exist, it hits this 'catch' block and returns null.
    // This correctly triggers the main 'initializeDocuments' function to
    // compute new embeddings.
    console.warn(
      `[DocumentService] No existing embeddings file found at ${EMBEDDINGS_FILE}.`
    );
    console.warn(
      `[DocumentService] This is normal if running for the first time. A new file will be computed.`
    );
    return null;
  }
}

// ============================================================================
// PUBLIC EXPORTS
// ============================================================================

/**
 * Main orchestrator function to initialize the document knowledge base.
 */
export async function initializeDocuments() {
  // Prevent multiple simultaneous initializations
  if (isInitializing) {
    console.log(
      "[DocumentService] Initialization already in progress, waiting..."
    );
    while (isInitializing) {
      await sleep(1000); // Wait for the first initialization to complete
    }
    return;
  }

  if (cachedDocuments.length > 0) {
    console.log("[DocumentService] Documents already initialized. Skipping.");
    return;
  }

  isInitializing = true;
  console.log("[DocumentService] Initializing knowledge base...");

  try {
    let documents = await loadEmbeddingsFromFile();

    if (!documents) {
      console.log(
        "[DocumentService] Computing embeddings for the first time..."
      );
      documents = await loadDocuments();

      if (documents.length === 0) {
        console.error(
          "[DocumentService] No documents found in /documents folder. Halting embedding."
        );
        isInitializing = false;
        return;
      }

      console.log("[DocumentService] Embedding documents...");
      const allEmbeddings = await embedDocumentsInBatches(documents);

      allEmbeddings.forEach((embedding, i) => {
        documents[i].embedding = embedding;
      });

      await saveEmbeddingsToFile(documents);
      console.log("[DocumentService] Embeddings computed and saved.");
    } else {
      console.log(
        "[DocumentService] Successfully loaded cached embeddings from file."
      );
    }

    cachedDocuments = documents; // Cache the final list
    console.log(
      `[DocumentService] Knowledge base ready. ${cachedDocuments.length} documents loaded.`
    );
  } catch (error) {
    console.error(
      "[DocumentService] CRITICAL error during document initialization:",
      error
    );
  } finally {
    isInitializing = false;
  }
}

/**
 * Safely gets the cached documents.
 * @returns {Array<Object>} The array of initialized documents.
 */
export function getInitializedDocuments() {
  return cachedDocuments;
}

/**
 * Safely gets the timestamp of when embeddings were computed.
 * @returns {Date | null} The Date object or null.
 */
export function getEmbeddingsComputedAt() {
  return embeddingsComputedAt;
}

/**
 * Safely gets the total count of loaded documents.
 * @returns {number} The number of documents.
 */
export function getDocumentCount() {
  return cachedDocuments.length;
}
