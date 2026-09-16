/**
 * ragService.ts — Placeholder for Phase 2
 *
 * In Phase 2 this module will implement Retrieval-Augmented Generation (RAG):
 * - Load and index the knowledge-base documents
 * - Accept a query and retrieve relevant passages
 * - Return retrieved context to the AI model
 *
 * Phase 1: Returns empty results (not used).
 */

export interface RetrievedPassage {
  source: string
  content: string
  relevanceScore: number
}

/**
 * Retrieve relevant knowledge-base passages for a given query.
 * Phase 1: stub — returns empty array.
 */
export async function retrievePassages(
  _query: string,
  _topK = 3,
): Promise<RetrievedPassage[]> {
  return []
}
