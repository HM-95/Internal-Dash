import OpenAI from 'openai'

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 1536
const MAX_RETRIES = 2 // Reduced from 3
const RETRY_DELAY = 500 // Reduced from 1000ms

// Initialize OpenAI client (will be created when needed)
let openaiClient: OpenAI | null = null

/**
 * Get or create OpenAI client
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required for embeddings')
    }
    openaiClient = new OpenAI({
      apiKey: OPENAI_API_KEY,
    })
  }
  return openaiClient
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate a zero vector of specified dimensions
 */
function createZeroVector(dimensions: number = EMBEDDING_DIMENSIONS): number[] {
  return new Array(dimensions).fill(0)
}

/**
 * Embed a single text using OpenAI's text-embedding-3-small model
 * @param text - The text to embed
 * @returns Promise<number[]> - The embedding vector (1536 dimensions)
 */
export async function embedText(text: string): Promise<number[]> {
  // Handle empty/null input
  if (!text || text.trim().length === 0) {
    return createZeroVector()
  }

  const openai = getOpenAIClient()
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text.trim(),
        encoding_format: 'float',
      })

      const embedding = response.data[0].embedding

      // Validate embedding dimensions
      if (embedding.length !== EMBEDDING_DIMENSIONS) {
        console.warn(`Warning: Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${embedding.length}`)
        // Pad or truncate to correct dimensions
        if (embedding.length < EMBEDDING_DIMENSIONS) {
          return [...embedding, ...createZeroVector(EMBEDDING_DIMENSIONS - embedding.length)]
        } else {
          return embedding.slice(0, EMBEDDING_DIMENSIONS)
        }
      }

      return embedding

    } catch (error: any) {
      lastError = error
      
      // Check if it's a rate limit error
      if (error?.status === 429) {
        console.warn(`Rate limit hit on attempt ${attempt}/${MAX_RETRIES}, retrying in ${RETRY_DELAY * attempt}ms...`)
        await sleep(RETRY_DELAY * attempt) // Exponential backoff
        continue
      }

      // Check if it's a server error (5xx)
      if (error?.status >= 500 && error?.status < 600) {
        console.warn(`Server error on attempt ${attempt}/${MAX_RETRIES}, retrying in ${RETRY_DELAY}ms...`)
        await sleep(RETRY_DELAY)
        continue
      }

      // For other errors, don't retry
      console.error('OpenAI embedding error:', error)
      break
    }
  }

  console.error(`Failed to embed text after ${MAX_RETRIES} attempts:`, lastError)
  return createZeroVector()
}

/**
 * Embed multiple texts in batch using OpenAI's text-embedding-3-small model
 * @param texts - Array of texts to embed
 * @returns Promise<number[][]> - Array of embedding vectors (each 1536 dimensions)
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    return []
  }

  const openai = getOpenAIClient()

  // Filter out empty texts and create mapping
  const validTexts: string[] = []
  const textIndices: number[] = []
  
  texts.forEach((text, index) => {
    if (text && text.trim().length > 0) {
      validTexts.push(text.trim())
      textIndices.push(index)
    }
  })

  if (validTexts.length === 0) {
    return texts.map(() => createZeroVector())
  }

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: validTexts,
        encoding_format: 'float',
      })

      const embeddings = response.data.map(item => item.embedding)

      // Validate all embeddings have correct dimensions
      const validatedEmbeddings = embeddings.map(embedding => {
        if (embedding.length !== EMBEDDING_DIMENSIONS) {
          console.warn(`Warning: Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${embedding.length}`)
          // Pad or truncate to correct dimensions
          if (embedding.length < EMBEDDING_DIMENSIONS) {
            return [...embedding, ...createZeroVector(EMBEDDING_DIMENSIONS - embedding.length)]
          } else {
            return embedding.slice(0, EMBEDDING_DIMENSIONS)
          }
        }
        return embedding
      })

      // Map back to original array, filling empty texts with zero vectors
      const result: number[][] = new Array(texts.length).fill(null).map(() => createZeroVector())
      textIndices.forEach((originalIndex, validIndex) => {
        result[originalIndex] = validatedEmbeddings[validIndex]
      })

      return result

    } catch (error: any) {
      lastError = error
      
      // Check if it's a rate limit error
      if (error?.status === 429) {
        console.warn(`Rate limit hit on batch attempt ${attempt}/${MAX_RETRIES}, retrying in ${RETRY_DELAY * attempt}ms...`)
        await sleep(RETRY_DELAY * attempt) // Exponential backoff
        continue
      }

      // Check if it's a server error (5xx)
      if (error?.status >= 500 && error?.status < 600) {
        console.warn(`Server error on batch attempt ${attempt}/${MAX_RETRIES}, retrying in ${RETRY_DELAY}ms...`)
        await sleep(RETRY_DELAY)
        continue
      }

      // For other errors, don't retry
      console.error('OpenAI batch embedding error:', error)
      break
    }
  }

  console.error(`Failed to embed batch after ${MAX_RETRIES} attempts:`, lastError)
  return texts.map(() => createZeroVector())
}

/**
 * Generate embeddings for creator data
 * @param creator - Creator data object
 * @returns Promise<{
 *   bio_embedding: number[],
 *   hashtags_embedding: number[],
 *   recent_content_embedding: number[]
 * }>
 */
export async function generateCreatorEmbeddings(creator: any): Promise<{
  bio_embedding: number[]
  hashtags_embedding: number[]
  recent_content_embedding: number[]
}> {
  try {
    // Prepare text for embeddings
    const bio = creator.bio || ''
    const hashtags = Array.isArray(creator.hashtags) ? creator.hashtags.join(' ') : ''
    
    // Concatenate recent post captions (handle object structure)
    const recentCaptions = [
      creator.recent_post_1?.caption || '',
      creator.recent_post_2?.caption || '',
      creator.recent_post_3?.caption || ''
    ].filter(caption => caption && typeof caption === 'string' && caption.trim().length > 0).join(' ')

    // Generate embeddings in parallel
    const [bio_embedding, hashtags_embedding, recent_content_embedding] = await Promise.all([
      embedText(bio),
      embedText(hashtags),
      embedText(recentCaptions)
    ])

    return {
      bio_embedding,
      hashtags_embedding,
      recent_content_embedding
    }
  } catch (error) {
    console.error('Error generating creator embeddings:', error)
    const zeroVector = createZeroVector()
    return {
      bio_embedding: zeroVector,
      hashtags_embedding: zeroVector,
      recent_content_embedding: zeroVector
    }
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param vectorA - First vector
 * @param vectorB - Second vector
 * @returns number - Cosine similarity (-1 to 1)
 */
export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i]
    normA += vectorA[i] * vectorA[i]
    normB += vectorB[i] * vectorB[i]
  }

  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)

  if (normA === 0 || normB === 0) {
    return 0
  }

  return dotProduct / (normA * normB)
}

/**
 * Generate embedding for search query
 * @param query - Search query text
 * @returns Promise<number[]> - Query embedding vector
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  return embedText(query)
}

/**
 * Find similar creators using vector similarity
 * @param queryEmbedding - Query embedding vector
 * @param creators - Array of creators with embeddings
 * @param limit - Maximum number of results
 * @returns Array of creators sorted by similarity
 */
export function findSimilarCreators(
  queryEmbedding: number[],
  creators: Array<{ id: string; bio_embedding: number[]; hashtags_embedding: number[]; recent_content_embedding: number[] }>,
  limit: number = 10
): Array<{ id: string; similarity: number }> {
  const similarities = creators.map(creator => {
    // Calculate similarity using bio embedding (can be extended to use multiple embeddings)
    const similarity = cosineSimilarity(queryEmbedding, creator.bio_embedding)
    return { id: creator.id, similarity }
  })

  // Sort by similarity (descending) and return top results
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
} 