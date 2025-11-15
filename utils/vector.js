/**
 * Contains utility functions for vector mathematics,
 * specifically for a RAG (Retrieval-Augmented Generation) system.
 */

/**
 * Calculate cosine similarity between two vectors
 *
 * @param {number[]} vecA - First vector (embedding)
 * @param {number[]} vecB - Second vector (embedding)
 * @returns {number} Similarity score between -1 and 1
 */
export function cosineSimilarity(vecA, vecB) {
  // Calculate dot product: sum of element-wise multiplication
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);

  // Calculate magnitude (length) of vector A: √(sum of squares)
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));

  // Calculate magnitude (length) of vector B: √(sum of squares)
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  // Handle potential division by zero
  if (magA === 0 || magB === 0) {
    return 0;
  }

  // Return cosine similarity
  return dotProduct / (magA * magB);
}

/**
 * Find the top K most similar documents to a query embedding
 *
 * @param {number[]} queryEmbedding - Vector embedding of user's query
 * @param {Object[]} documents - Array of document objects with embeddings
 * @param {number} k - Number of top documents to return (default: 8)
 * @returns {Object[]} Top K most similar documents
 */
export function getTopKDocuments(queryEmbedding, documents, k = 8) {
  // Calculate similarity score for each document
  const similarities = documents.map((doc) => ({
    doc,
    score: cosineSimilarity(queryEmbedding, doc.embedding),
  }));

  // Sort by similarity score in descending order (most similar first)
  similarities.sort((a, b) => b.score - a.score);

  // Return top K documents (without similarity scores)
  return similarities.slice(0, k).map((item) => item.doc);
}
