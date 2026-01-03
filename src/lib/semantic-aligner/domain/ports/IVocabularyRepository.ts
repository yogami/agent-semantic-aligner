import { VocabularyMapping, CreateMappingInput } from '../entities/VocabularyMapping';

/**
 * Repository interface for vocabulary mapping persistence.
 * Infrastructure layer implements this interface.
 */
export interface IVocabularyRepository {
    findBySourceTerm(
        sourceVocab: string,
        targetVocab: string,
        sourceTerm: string
    ): Promise<VocabularyMapping | null>;

    findAllByVocabs(
        sourceVocab: string,
        targetVocab: string
    ): Promise<VocabularyMapping[]>;

    create(input: CreateMappingInput): Promise<VocabularyMapping>;

    incrementUsage(id: string): Promise<VocabularyMapping>;

    delete(id: string): Promise<void>;
}
