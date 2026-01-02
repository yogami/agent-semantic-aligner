/**
 * VocabularyMapping Entity
 * Represents a mapping between terms in different vocabularies/ontologies.
 */
export interface VocabularyMapping {
    id: string;
    sourceVocab: string;
    targetVocab: string;
    sourceTerm: string;
    targetTerm: string;
    confidence: number;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateMappingInput {
    sourceVocab: string;
    targetVocab: string;
    sourceTerm: string;
    targetTerm: string;
    confidence?: number;
}

export interface TranslationRequest {
    message: string;
    sourceVocab: string;
    targetVocab: string;
}

export interface TranslationResult {
    originalMessage: string;
    translatedMessage: string;
    mappingsUsed: VocabularyMapping[];
    newMappingsCreated: VocabularyMapping[];
    overallConfidence: number;
    zkProof?: {
        proof: string;
        publicSignals: string[];
        semanticDistanceValid: boolean;
        sourceHash: string;
        targetHash: string;
        proofSizeBytes: number;
    };
}
