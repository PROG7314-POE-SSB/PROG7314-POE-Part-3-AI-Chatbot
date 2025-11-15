// ============================================================================
// IMPORTS AND DEPENDENCIES
// ============================================================================
import "dotenv/config"; // Load environment variables at the very top
import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chatRoutes.js";
import monitoringRoutes from "./routes/monitoringRoutes.js";
import { initializeDocuments } from "./services/documentService.js";

// ============================================================================
// SERVER SETUP AND CONFIGURATION
// ============================================================================

// Initialize Express app
const app = express();

// Set global server start time
// We use app.set() to make this available to all routes (e.g., in monitoringRoutes)
app.set("serverStartTime", new Date());

// Middleware setup
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON request bodies

// ============================================================================
// REGISTER API ROUTES
// ============================================================================

console.log("[Server] Registering API routes...");
app.use("/", chatRoutes); // Handles POST /prompt
app.use("/", monitoringRoutes); // Handles GET /health and GET /stats
console.log("[Server] API routes registered.");

// ============================================================================
// VERCEL SERVERLESS EXPORT
// ============================================================================

// This block ensures document initialization runs for serverless deployments
if (process.env.NODE_ENV === "production") {
  console.log("[Server] Running in Vercel (production) environment.");
  // For Vercel, we initialize documents immediately.
  // We don't await this, allowing Vercel to handle the cold start
  // while the knowledge base loads in the background.
  initializeDocuments().catch((err) => {
    console.error("[Server] Vercel initialization failed:", err);
  });
}

// Export the app for Vercel's serverless environment
export default app;

// ============================================================================
// LOCAL DEVELOPMENT SERVER
// ============================================================================

// This logic only runs when you start the server locally (e.g., "node server.js")
// It will be ignored by Vercel.
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;

  const startLocalServer = async () => {
    console.log("[Server] Running in local (development) environment.");

    // Wait for the knowledge base to be fully loaded BEFORE accepting requests.
    console.log(
      "📚 [Server] Initializing knowledge base... (This may take a moment on first run)"
    );
    await initializeDocuments();
    console.log("✅ [Server] Knowledge base ready.");

    // Start listening for requests
    app.listen(PORT, () => {
      console.log("\n💡 Endpoints available:");
      console.log(`   POST http://localhost:${PORT}/prompt`);
      console.log(`   GET  http://localhost:${PORT}/health`);
      console.log(`   GET  http://localhost:${PORT}/stats`);
      console.log(
        `\n🍳 CulinaryGPT Server listening on http://localhost:${PORT}`
      );
    });
  };

  startLocalServer().catch((err) => {
    console.error("[Server] Failed to start local server:", err);
    process.exit(1);
  });
}
