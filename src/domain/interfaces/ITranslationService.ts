/**
 * Translation service interface for LLM-based semantic translation.
 * Infrastructure layer implements this interface.
 */
export interface ITranslationService {
    /**
     * Translates a term from one vocabulary to another using LLM.
     * @returns The translated term and confidence score.
     */
    translateTerm(
        term: string,
        sourceVocab: string,
        targetVocab: string,
        context?: string
    ): Promise<{ translatedTerm: string; confidence: number }>;

    /**
     * Identifies terms in a message that may need translation.
     * @returns Array of terms found in the message.
     */
    extractTerms(message: string, vocabulary: string): Promise<string[]>;
}
