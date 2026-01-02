import { test, expect } from '@playwright/test';

/**
 * E2E Tests for ZK Semantic Translation Proofs
 * 
 * ATDD: Acceptance tests written FIRST, then implementation.
 * Tests the /api/translate endpoint with optional ZK proof of semantic match.
 */

test.describe('ZK Semantic Translation E2E', () => {
    const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3002';

    test.describe('POST /api/translate (with ZK proof)', () => {
        test('should translate message with ZK proof of semantic distance', async ({ request }) => {
            const response = await request.post(`${BASE_URL}/api/translate`, {
                data: {
                    message: 'The customer initiated a refund request.',
                    sourceVocab: 'ecommerce',
                    targetVocab: 'healthcare',
                    zkProof: {
                        enabled: true,
                        distanceThreshold: 0.3,
                    },
                },
            });

            expect(response.ok()).toBeTruthy();
            const result = await response.json();

            // Verify translation result
            expect(result.translatedMessage).toBeTruthy();
            expect(result.overallConfidence).toBeGreaterThan(0);

            // Verify ZK proof is attached
            expect(result.zkProof).toBeTruthy();
            expect(result.zkProof.proof).toBeTruthy();
            expect(result.zkProof.publicSignals).toBeInstanceOf(Array);
            expect(result.zkProof.semanticDistanceValid).toBe(true);
        });

        test('should reject translation when semantic distance exceeds threshold', async ({ request }) => {
            const response = await request.post(`${BASE_URL}/api/translate`, {
                data: {
                    message: 'Quantum entanglement is non-local.',
                    sourceVocab: 'physics',
                    targetVocab: 'cooking', // Very different domain
                    zkProof: {
                        enabled: true,
                        distanceThreshold: 0.05, // Very strict threshold
                    },
                },
            });

            // Should still return translation but zkProof.semanticDistanceValid = false
            expect(response.ok()).toBeTruthy();
            const result = await response.json();

            expect(result.zkProof).toBeTruthy();
            expect(result.zkProof.semanticDistanceValid).toBe(false);
        });

        test('should work without ZK proof when not requested', async ({ request }) => {
            const response = await request.post(`${BASE_URL}/api/translate`, {
                data: {
                    message: 'Standard translation request.',
                    sourceVocab: 'general',
                    targetVocab: 'technical',
                },
            });

            expect(response.ok()).toBeTruthy();
            const result = await response.json();

            expect(result.translatedMessage).toBeTruthy();
            expect(result.zkProof).toBeUndefined();
        });
    });
});
