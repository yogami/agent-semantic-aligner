import { IVocabularyRepository } from '../../lib/semantic-aligner/domain/ports/IVocabularyRepository';
import {
    VocabularyMapping,
    CreateMappingInput,
} from '../../lib/semantic-aligner/domain/entities/VocabularyMapping';

/**
 * Mock implementation of the VocabularyRepository for testing.
 */
export class MockVocabularyRepository implements IVocabularyRepository {
    private mappings: VocabularyMapping[] = [];

    async findBySourceTerm(
        sourceVocab: string,
        targetVocab: string,
        sourceTerm: string
    ): Promise<VocabularyMapping | null> {
        return this.mappings.find(
            (m) =>
                m.sourceVocab === sourceVocab &&
                m.targetVocab === targetVocab &&
                m.sourceTerm === sourceTerm
        ) || null;
    }

    async findAllByVocabs(
        sourceVocab: string,
        targetVocab: string
    ): Promise<VocabularyMapping[]> {
        return this.mappings.filter(
            (m) => m.sourceVocab === sourceVocab && m.targetVocab === targetVocab
        );
    }

    async create(input: CreateMappingInput): Promise<VocabularyMapping> {
        const mapping: VocabularyMapping = {
            id: Math.random().toString(36).substring(7),
            sourceVocab: input.sourceVocab,
            targetVocab: input.targetVocab,
            sourceTerm: input.sourceTerm,
            targetTerm: input.targetTerm,
            confidence: input.confidence ?? 0.0,
            usageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.mappings.push(mapping);
        return mapping;
    }

    async incrementUsage(id: string): Promise<VocabularyMapping> {
        const mapping = this.mappings.find((m) => m.id === id);
        if (!mapping) throw new Error('Mapping not found');
        mapping.usageCount++;
        return mapping;
    }

    async delete(id: string): Promise<void> {
        this.mappings = this.mappings.filter((m) => m.id !== id);
    }
}
