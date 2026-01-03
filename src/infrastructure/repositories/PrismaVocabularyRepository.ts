import { PrismaClient } from '@prisma/client';
import { IVocabularyRepository } from '../../lib/semantic-aligner/domain/ports/IVocabularyRepository';
import {
    VocabularyMapping,
    CreateMappingInput,
} from '../../lib/semantic-aligner/domain/entities/VocabularyMapping';

/**
 * Prisma implementation of the VocabularyRepository.
 */
export class PrismaVocabularyRepository implements IVocabularyRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findBySourceTerm(
        sourceVocab: string,
        targetVocab: string,
        sourceTerm: string
    ): Promise<VocabularyMapping | null> {
        return this.prisma.vocabularyMapping.findUnique({
            where: {
                sourceVocab_targetVocab_sourceTerm: {
                    sourceVocab,
                    targetVocab,
                    sourceTerm,
                },
            },
        });
    }

    async findAllByVocabs(
        sourceVocab: string,
        targetVocab: string
    ): Promise<VocabularyMapping[]> {
        return this.prisma.vocabularyMapping.findMany({
            where: { sourceVocab, targetVocab },
            orderBy: { usageCount: 'desc' },
        });
    }

    async create(input: CreateMappingInput): Promise<VocabularyMapping> {
        return this.prisma.vocabularyMapping.create({
            data: {
                sourceVocab: input.sourceVocab,
                targetVocab: input.targetVocab,
                sourceTerm: input.sourceTerm,
                targetTerm: input.targetTerm,
                confidence: input.confidence ?? 0.0,
            },
        });
    }

    async incrementUsage(id: string): Promise<VocabularyMapping> {
        return this.prisma.vocabularyMapping.update({
            where: { id },
            data: { usageCount: { increment: 1 } },
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.vocabularyMapping.delete({ where: { id } });
    }
}
