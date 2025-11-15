import express from "express";
import { getMemoryStats, getUptimeFormatted } from "../utils/monitoring.js";
import {
  getDocumentCount,
  getEmbeddingsComputedAt,
} from "../services/documentService.js";

const router = express.Router();

/**
 * Lightweight, reliable health check endpoint.
 * Provides basic status, uptime, memory, and knowledge base status.
 */
router.get("/health", (req, res) => {
  // This is the logging you wanted - clean and at the route level
  console.log("[API] GET /health - Health check requested.");

  const memory = getMemoryStats();
  // We'll get serverStartTime from the main server.js file via req.app.get()
  const uptime = getUptimeFormatted(req.app.get("serverStartTime"));
  const documentCount = getDocumentCount();

  const isHealthy = documentCount > 0;

  res.status(200).json({
    status: isHealthy ? "healthy" : "initializing",
    timestamp: new Date().toISOString(),
    uptime: uptime,
    memoryUsage: `${memory.heapUsed} MB / ${memory.heapTotal} MB`,
    knowledgeBase: {
      documentsLoaded: documentCount,
      status: isHealthy
        ? "Ready"
        : "Not ready, initialization in progress or failed.",
    },
  });
});

/**
 * Simplified statistics endpoint.
 * Provides basic information about the loaded knowledge base.
 */
router.get("/stats", (req, res) => {
  console.log("[API] GET /stats - Knowledge base stats requested.");

  const documentCount = getDocumentCount();
  const embeddingsDate = getEmbeddingsComputedAt();

  res.status(200).json({
    knowledgeBase: {
      totalDocuments: documentCount,
      embeddingsComputedAt: embeddingsDate
        ? embeddingsDate.toISOString()
        : null,
      model: "embed-multilingual-v3.0",
      inputType: "search_document",
    },
  });
});

export default router;
