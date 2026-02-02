import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db';
import { PrismaVocabularyRepository } from '@/infrastructure/repositories/PrismaVocabularyRepository';
import { OpenAITranslationService } from '@/infrastructure/services/OpenAITranslationService';
import { TranslateMessage } from '@/lib/semantic-aligner/application/usecases/TranslateMessage';
import { TranslationRequest } from '@/lib/semantic-aligner/domain/entities/VocabularyMapping';
import { zkSemanticProofGenerator } from '@/infrastructure/services/ZKSemanticProofGenerator';

interface ExtendedTranslationRequest extends TranslationRequest {
    zkProof?: {
        enabled: boolean;
        distanceThreshold?: number;
    };
}

import { MockVocabularyRepository } from '@/infrastructure/repositories/MockVocabularyRepository';

// ... imports

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as ExtendedTranslationRequest;

        if (!body.message || !body.sourceVocab || !body.targetVocab) {
            return NextResponse.json(
                { error: 'Missing required fields: message, sourceVocab, targetVocab' },
                { status: 400 }
            );
        }

        const vocabularyRepo = process.env.MOCK_DB === 'true'
            ? new MockVocabularyRepository()
            : new PrismaVocabularyRepository(prisma);

        const translationService = process.env.MOCK_LLM === 'true'
            ? {
                // Mock term extraction - finds known medical/business terms
                extractTerms: async (message: string, _vocab: string): Promise<string[]> => {
                    const knownTerms = ['hypertension', 'tachycardia', 'refund', 'customer', 'request'];
                    const foundTerms = knownTerms.filter(term => message.toLowerCase().includes(term));
                    // If no known terms found, extract first noun-like word for general translation
                    if (foundTerms.length === 0) {
                        const words = message.split(/\s+/).filter(w => w.length > 4);
                        return words.length > 0 ? [words[0].toLowerCase()] : [];
                    }
                    return foundTerms;
                },
                // Mock term translation with domain-aware confidence
                translateTerm: async (term: string, sourceVocab: string, targetVocab: string, _context: string) => {
                    const mockMappings: Record<string, string> = {
                        'hypertension': 'high blood pressure',
                        'tachycardia': 'fast heart rate',
                        'refund': 'reversal',
                        'customer': 'patient',
                        'request': 'inquiry',
                    };
                    // Domain mismatch detection - return low confidence for incompatible domains
                    const incompatiblePairs = [
                        ['physics', 'cooking'],
                        ['quantum', 'culinary'],
                    ];
                    const isIncompatible = incompatiblePairs.some(
                        ([a, b]) => (sourceVocab.includes(a) && targetVocab.includes(b)) ||
                            (sourceVocab.includes(b) && targetVocab.includes(a))
                    );
                    return {
                        translatedTerm: mockMappings[term.toLowerCase()] || term,
                        confidence: isIncompatible ? 0.3 : 0.95, // Low confidence for domain mismatch
                    };
                },
            } as any
            : new OpenAITranslationService();

        const translateUseCase = new TranslateMessage(vocabularyRepo, translationService);

        const result = await translateUseCase.execute(body);

        // If ZK proof requested, generate it
        if (body.zkProof?.enabled) {
            const zkProof = await zkSemanticProofGenerator.generateProof({
                sourceMessage: body.message,
                translatedMessage: result.translatedMessage,
                sourceVocab: body.sourceVocab,
                targetVocab: body.targetVocab,
                confidence: result.overallConfidence,
                distanceThreshold: body.zkProof.distanceThreshold ?? 0.3,
            });

            return NextResponse.json({
                ...result,
                zkProof,
            });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json(
            { error: 'Translation failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
