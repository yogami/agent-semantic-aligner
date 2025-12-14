import { IVocabularyRepository } from '../../domain/interfaces/IVocabularyRepository';
import { ITranslationService } from '../../domain/interfaces/ITranslationService';
import {
    TranslationRequest,
    TranslationResult,
    VocabularyMapping,
} from '../../domain/entities/VocabularyMapping';

/**
 * TranslateMessage Use Case
 * Orchestrates the translation of a message from one vocabulary to another.
 */
export class TranslateMessage {
    constructor(
        private readonly vocabularyRepo: IVocabularyRepository,
        private readonly translationService: ITranslationService
    ) { }

    async execute(request: TranslationRequest): Promise<TranslationResult> {
        const { message, sourceVocab, targetVocab } = request;

        // 1. Extract terms from the message
        const terms = await this.translationService.extractTerms(message, sourceVocab);

        const mappingsUsed: VocabularyMapping[] = [];
        const newMappingsCreated: VocabularyMapping[] = [];
        let translatedMessage = message;

        // 2. For each term, find or create a mapping
        for (const term of terms) {
            // Check if we have an existing mapping
            let mapping = await this.vocabularyRepo.findBySourceTerm(
                sourceVocab,
                targetVocab,
                term
            );

            if (mapping) {
                // Use existing mapping and increment usage
                await this.vocabularyRepo.incrementUsage(mapping.id);
                mappingsUsed.push(mapping);
            } else {
                // Create new mapping using LLM
                const result = await this.translationService.translateTerm(
                    term,
                    sourceVocab,
                    targetVocab,
                    message
                );

                mapping = await this.vocabularyRepo.create({
                    sourceVocab,
                    targetVocab,
                    sourceTerm: term,
                    targetTerm: result.translatedTerm,
                    confidence: result.confidence,
                });

                newMappingsCreated.push(mapping);
            }

            // Replace term in message
            translatedMessage = translatedMessage.replace(
                new RegExp(`\\b${term}\\b`, 'gi'),
                mapping.targetTerm
            );
        }

        // 3. Calculate overall confidence
        const allMappings = [...mappingsUsed, ...newMappingsCreated];
        const overallConfidence =
            allMappings.length > 0
                ? allMappings.reduce((sum, m) => sum + m.confidence, 0) / allMappings.length
                : 1.0;

        return {
            originalMessage: message,
            translatedMessage,
            mappingsUsed,
            newMappingsCreated,
            overallConfidence,
        };
    }
}
