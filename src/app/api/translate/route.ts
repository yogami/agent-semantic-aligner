import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db';
import { PrismaVocabularyRepository } from '@/infrastructure/repositories/PrismaVocabularyRepository';
import { OpenAITranslationService } from '@/infrastructure/services/OpenAITranslationService';
import { TranslateMessage } from '@/application/usecases/TranslateMessage';
import { TranslationRequest } from '@/domain/entities/VocabularyMapping';
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

        const translationService = new OpenAITranslationService();
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
