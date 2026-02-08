# ATF Compliance Mapping — Agent Semantic Aligner

## Service Overview

Agent Semantic Aligner provides vocabulary translation middleware for multi-agent systems. It resolves ontology gaps between agents operating in different domains, enabling secure cross-domain communication without semantic misinterpretation.

## ATF Element Mapping

### Element 4: Segmentation — "Where can you go?"

The Semantic Aligner implements communication segmentation for ATF Element 4. It governs what agents can say to each other across domain boundaries, preventing semantic confusion that could lead to unauthorized actions triggered by vocabulary mismatches.

| ATF Requirement | Implementation |
|:---|:---|
| A2A Communication Control | Translation layer validates cross-domain messages |
| Action Boundaries | Domain-specific vocabulary prevents unauthorized command injection |
| Resource Allowlist | Only mapped ontology terms are translated and forwarded |
| Blast Radius Containment | Untranslatable messages are rejected, not guessed |

### Cross-Element Support

| ATF Element | Contribution |
|:---|:---|
| Element 1 (Identity) | Vocabulary mappings are tied to agent domain declarations |
| Element 3 (Data Governance) | Semantic validation is a form of input/output governance |

## ATF Maturity Level Support

| Level | Semantic Aligner Role |
|:---|:---|
| Intern | No cross-domain communication allowed |
| Junior | Translation with human review of new mappings |
| Senior | Autonomous translation with learned mappings stored |
| Principal | Full cross-domain interop with confidence scoring |

## Verification

```bash
npm run test
npm run test:e2e
```

## Reference

ATF Specification: https://github.com/massivescale-ai/agentic-trust-framework
Unified Implementation: https://github.com/yogami/atf-reference-implementation
