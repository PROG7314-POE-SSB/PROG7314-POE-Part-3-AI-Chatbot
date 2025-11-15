import "dotenv/config";
import { CohereClient } from "cohere-ai";

/**
 * Initializes and exports a singleton Cohere AI client.
 * This ensures we use the same client instance across the application.
 */

// Initialize Cohere AI client with API key from environment variables
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY, // Requires COHERE_API_KEY in .env file
});

export default cohere;
