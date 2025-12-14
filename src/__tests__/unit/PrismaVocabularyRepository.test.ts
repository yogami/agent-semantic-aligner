import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaVocabularyRepository } from '../../infrastructure/repositories/PrismaVocabularyRepository';
import { PrismaClient } from '@prisma/client';

describe('PrismaVocabularyRepository', () => {
    let mockPrisma: {
        vocabularyMapping: {
            findUnique: ReturnType<typeof vi.fn>;
            findMany: ReturnType<typeof vi.fn>;
            create: ReturnType<typeof vi.fn>;
            update: ReturnType<typeof vi.fn>;
            delete: ReturnType<typeof vi.fn>;
        };
    };
    let repository: PrismaVocabularyRepository;

    const mockMapping = {
        id: 'test-id',
        sourceVocab: 'medical-v1',
        targetVocab: 'consumer-health',
        sourceTerm: 'hypertension',
        targetTerm: 'high blood pressure',
        confidence: 0.95,
        usageCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        mockPrisma = {
            vocabularyMapping: {
                findUnique: vi.fn(),
                findMany: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
            },
        };
        repository = new PrismaVocabularyRepository(mockPrisma as unknown as PrismaClient);
    });

    describe('findBySourceTerm', () => {
        it('should find mapping by source term', async () => {
            mockPrisma.vocabularyMapping.findUnique.mockResolvedValue(mockMapping);

            const result = await repository.findBySourceTerm('medical-v1', 'consumer-health', 'hypertension');

            expect(result).toEqual(mockMapping);
            expect(mockPrisma.vocabularyMapping.findUnique).toHaveBeenCalledWith({
                where: {
                    sourceVocab_targetVocab_sourceTerm: {
                        sourceVocab: 'medical-v1',
                        targetVocab: 'consumer-health',
                        sourceTerm: 'hypertension',
                    },
                },
            });
        });

        it('should return null when mapping not found', async () => {
            mockPrisma.vocabularyMapping.findUnique.mockResolvedValue(null);

            const result = await repository.findBySourceTerm('medical-v1', 'consumer-health', 'unknown');

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a new mapping', async () => {
            mockPrisma.vocabularyMapping.create.mockResolvedValue(mockMapping);

            const result = await repository.create({
                sourceVocab: 'medical-v1',
                targetVocab: 'consumer-health',
                sourceTerm: 'hypertension',
                targetTerm: 'high blood pressure',
                confidence: 0.95,
            });

            expect(result).toEqual(mockMapping);
            expect(mockPrisma.vocabularyMapping.create).toHaveBeenCalled();
        });
    });

    describe('incrementUsage', () => {
        it('should increment usage count', async () => {
            mockPrisma.vocabularyMapping.update.mockResolvedValue({
                ...mockMapping,
                usageCount: 6,
            });

            const result = await repository.incrementUsage('test-id');

            expect(result.usageCount).toBe(6);
            expect(mockPrisma.vocabularyMapping.update).toHaveBeenCalledWith({
                where: { id: 'test-id' },
                data: { usageCount: { increment: 1 } },
            });
        });
    });

    describe('delete', () => {
        it('should delete a mapping', async () => {
            mockPrisma.vocabularyMapping.delete.mockResolvedValue(mockMapping);

            await repository.delete('test-id');

            expect(mockPrisma.vocabularyMapping.delete).toHaveBeenCalledWith({
                where: { id: 'test-id' },
            });
        });
    });
});
