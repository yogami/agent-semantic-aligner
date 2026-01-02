import { describe, it, expect, beforeEach } from 'vitest';
import { ZKSemanticProofGenerator } from '../../infrastructure/services/ZKSemanticProofGenerator';

describe('ZKSemanticProofGenerator', () => {
    let generator: ZKSemanticProofGenerator;

    beforeEach(() => {
        generator = new ZKSemanticProofGenerator();
    });

    describe('generateProof', () => {
        it('should generate valid proof when semantic distance is below threshold', async () => {
            const proof = await generator.generateProof({
                sourceMessage: 'The customer wants a refund.',
                translatedMessage: 'The patient requests a reversal.',
                sourceVocab: 'ecommerce',
                targetVocab: 'healthcare',
                confidence: 0.85, // High confidence = low distance
                distanceThreshold: 0.3, // 30% max distance
            });

            expect(proof.proof).toBeTruthy();
            expect(proof.publicSignals).toBeInstanceOf(Array);
            expect(proof.semanticDistanceValid).toBe(true);
            expect(proof.proofSizeBytes).toBeGreaterThan(0);
        });

        it('should generate invalid proof when semantic distance exceeds threshold', async () => {
            const proof = await generator.generateProof({
                sourceMessage: 'Quantum fluctuations in the void.',
                translatedMessage: 'Salt and pepper to taste.',
                sourceVocab: 'physics',
                targetVocab: 'cooking',
                confidence: 0.3, // Low confidence = high distance
                distanceThreshold: 0.5, // 50% max distance
            });

            // Distance = 1 - 0.3 = 0.7, which exceeds 0.5 threshold
            expect(proof.semanticDistanceValid).toBe(false);
        });

        it('should hash messages consistently', async () => {
            const proof1 = await generator.generateProof({
                sourceMessage: 'Same message',
                translatedMessage: 'Same translation',
                sourceVocab: 'a',
                targetVocab: 'b',
                confidence: 0.9,
                distanceThreshold: 0.3,
            });

            const proof2 = await generator.generateProof({
                sourceMessage: 'Same message',
                translatedMessage: 'Different translation',
                sourceVocab: 'a',
                targetVocab: 'b',
                confidence: 0.9,
                distanceThreshold: 0.3,
            });

            // Same source should have same sourceHash
            expect(proof1.sourceHash).toBe(proof2.sourceHash);
            // Different targets should have different targetHash
            expect(proof1.targetHash).not.toBe(proof2.targetHash);
        });
    });

    describe('verifyProof', () => {
        it('should verify a valid proof', async () => {
            const proof = await generator.generateProof({
                sourceMessage: 'Test source',
                translatedMessage: 'Test target',
                sourceVocab: 'a',
                targetVocab: 'b',
                confidence: 0.9,
                distanceThreshold: 0.3,
            });

            const result = await generator.verifyProof(proof);
            expect(result).toBe(true);
        });

        it('should reject an invalid proof', async () => {
            const proof = await generator.generateProof({
                sourceMessage: 'Test source',
                translatedMessage: 'Test target',
                sourceVocab: 'a',
                targetVocab: 'b',
                confidence: 0.4, // Low confidence
                distanceThreshold: 0.3, // Strict threshold
            });

            const result = await generator.verifyProof(proof);
            expect(result).toBe(false);
        });
    });
});
