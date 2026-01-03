import { describe, it, expect } from 'vitest';
import { TranslateMessage } from '../../src/lib/semantic-aligner/application/usecases/TranslateMessage';
import { IVocabularyRepository } from '../../src/lib/semantic-aligner/domain/ports/IVocabularyRepository';
import { ITranslationService } from '../../src/lib/semantic-aligner/domain/ports/ITranslationService';
import { VocabularyMapping } from '../../src/lib/semantic-aligner/domain/entities/VocabularyMapping';

describe('Semantic Aligner Characterization', () => {
    it('should properly orchestrate translation flow using repositories', async () => {
        // 1. Setup Mocks
        const mappings: VocabularyMapping[] = [];

        const mockRepo: IVocabularyRepository = {
            findBySourceTerm: async (sVocab, tVocab, term) =>
                mappings.find(m => m.sourceVocab === sVocab && m.targetVocab === tVocab && m.sourceTerm === term) || null,
            findAllByVocabs: async () => mappings,
            create: async (input) => {
                const newMap = { ...input, id: 'map-' + Math.random(), usageCount: 0, createdAt: new Date(), updatedAt: new Date() };
                mappings.push(newMap);
                return newMap;
            },
            incrementUsage: async (id) => {
                const m = mappings.find(x => x.id === id);
                if (m) m.usageCount++;
                return m!;
            },
            delete: async () => true
        };

        const mockService: ITranslationService = {
            extractTerms: async (msg) => {
                // Simple extraction mock: splits by space, returns 'cardiac' if present
                if (msg.includes('cardiac')) return ['cardiac'];
                return [];
            },
            translateTerm: async (term) => {
                if (term === 'cardiac') return { translatedTerm: 'heart', confidence: 0.95 };
                return { translatedTerm: term, confidence: 0.5 };
            }
        };

        const useCase = new TranslateMessage(mockRepo, mockService);

        // 2. Scenario A: First time translation (Create Mapping)
        const result1 = await useCase.execute({
            message: 'Patient has cardiac arrest',
            sourceVocab: 'medical',
            targetVocab: 'layman'
        });

        expect(result1.translatedMessage).toContain('heart');
        expect(result1.newMappingsCreated).toHaveLength(1);
        expect(mappings).toHaveLength(1);
        expect(mappings[0].sourceTerm).toBe('cardiac');
        expect(mappings[0].targetTerm).toBe('heart');

        // 3. Scenario B: Second time translation (Use Existing Mapping)
        const result2 = await useCase.execute({
            message: 'Another cardiac event',
            sourceVocab: 'medical',
            targetVocab: 'layman'
        });

        expect(result2.translatedMessage).toContain('heart');
        expect(result2.newMappingsCreated).toHaveLength(0);
        expect(result2.mappingsUsed).toHaveLength(1);

        // Characterization: Confirm existing logic increments usage
        expect(mappings[0].usageCount).toBe(1);
    });
});
