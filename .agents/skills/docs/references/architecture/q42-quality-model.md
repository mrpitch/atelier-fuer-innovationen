# Q42 Quality Model — Reference

Source: [quality.arc42.org](https://quality.arc42.org) (checked 2026-10-15)

Q42 is arc42's quality model. It provides the shared vocabulary for quality goals in arc42 Section 1.2 and quality scenarios in Section 10. As of October 2026 it lists about 190 qualities across **9 dimensions**, plus roughly 150 measurable **example requirements** and 55 **solution approaches** (architecture tactics). The dimensions overlap by design — a quality can belong to more than one, e.g. testability is tagged both `#suitable` and `#maintainable`.

---

## The 9 Q42 Dimensions

| Dimension    | Tag             | Focus                                                            |
| ------------ | --------------- | ---------------------------------------------------------------- |
| Efficient    | `#efficient`    | Response time, throughput, resource utilisation, capacity        |
| Flexible     | `#flexible`     | Adaptability, extensibility, portability, scalability            |
| Maintainable | `#maintainable` | Modularity, analysability, modifiability, testability            |
| Operable     | `#operable`     | Installability, deployability, monitorability, administrability  |
| Reliable     | `#reliable`     | Availability, fault tolerance, recoverability, data integrity    |
| Safe         | `#safe`         | Hazard avoidance, fail-safe behaviour, risk-free operation       |
| Secure       | `#secure`       | Confidentiality, integrity, authenticity, accountability         |
| Suitable     | `#suitable`     | Functional completeness and correctness, testability             |
| Usable       | `#usable`       | Learnability, accessibility, error protection, user satisfaction |

The counts per dimension change as the catalogue grows; look them up on quality.arc42.org rather than quoting them.

## Using the catalogue while drafting

- **§1.2 and §10:** start from the [example requirements](https://quality.arc42.org/requirements/) for the tag you need and adapt the numbers — they are already in a measurable form.
- **§4 "approaches to achieve quality goals" and §8:** the [solution approaches](https://quality.arc42.org/approaches/) link each quality to tactics (caching, redundancy, circuit breakers, …). Cite the approach you chose.

---

## Cross-Section Traceability Chain

Quality goals defined in Section 1.2 must be traceable through the entire documentation:

```
Section 1.2  → State the quality goal + attach a Q42 tag
              e.g. "#reliable — 99.9% uptime"

Section 4    → Describe the primary architectural mechanism that achieves it
              e.g. "#reliable → active-passive failover, 30s RTO"

Section 10   → Elaborate into a measurable, testable scenario
              e.g. "QS-03 — Under normal load, when the primary node fails,
                   the system fails over within 30s and resumes processing"

Section 11   → Track aspirational scenarios not yet met as RISK-xx entries
              e.g. "RISK-04 — Failover target (30s) not yet verified under
                   production load; stress tests pending"
```

`arc42-lint.py` Rule 3 (Section 1 → Section 10): every Q42 tag in the Section 1.2 quality goals table needs at least one tagged `QS-xx` scenario in Section 10. Section 10 may carry further tags for lesser requirements.

---

## Concrete vs. Vague Quality Goals

Quality goals must be measurable. Reject vague inputs and push for concrete scenarios with specific numbers.

| ❌ Vague                    | ✅ Concrete                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| "The system should be fast" | "API p95 response time < 200ms under 1000 concurrent users"                                                       |
| "It should be reliable"     | "99.9% uptime — max 8.76 hours downtime per year"                                                                 |
| "Must be secure"            | "Failed login attempts are rate-limited to 5 per minute per IP; brute-force attempts trigger an alert within 60s" |
| "Easy to deploy"            | "A new version must be deployable with zero downtime in < 10 minutes"                                             |
| "Maintainable"              | "A developer unfamiliar with the codebase can locate and fix a documented bug in < 4 hours"                       |

---

## Common Tag Assignments by System Type

| System Characteristic               | Most Relevant Tags                          |
| ----------------------------------- | ------------------------------------------- |
| Public API under load               | `#efficient` · `#reliable` · `#secure`      |
| Regulated system (GDPR, HIPAA, SOX) | `#secure` · `#safe` · `#operable`           |
| Developer-facing platform           | `#suitable` · `#maintainable` · `#operable` |
| Long-lived enterprise system        | `#maintainable` · `#flexible` · `#reliable` |
| Real-time / embedded system         | `#efficient` · `#safe` · `#reliable`        |
| Consumer-facing product             | `#usable` · `#efficient` · `#reliable`      |

---

## Section Quick-Reference: Where Each Tag Appears

| Tag             | Section 1      | Section 4                        | Section 7                             | Section 8                            | Section 10                               |
| --------------- | -------------- | -------------------------------- | ------------------------------------- | ------------------------------------ | ---------------------------------------- |
| `#reliable`     | Goal statement | Failover / replication approach  | AZ deployment, health checks          | Error handling, circuit breakers     | Failover scenario, recovery time         |
| `#efficient`    | Goal statement | Cache layer, async design        | Auto-scaling, CDN config              | Communication patterns               | Load scenario, p95 target                |
| `#secure`       | Goal statement | Auth model choice                | TLS termination, network segmentation | Security concept                     | Auth failure, privilege escalation       |
| `#operable`     | Goal statement | CI/CD approach                   | Deploy topology                       | Observability, logging               | Deployment time, alert latency           |
| `#flexible`     | Goal statement | Modular design rationale         | —                                     | Persistence pattern, API versioning  | Change time scenario                     |
| `#maintainable` | Goal statement | Module boundaries, test strategy | —                                     | Coding conventions, dependency rules | Change scenario: effort to modify / test |
| `#usable`       | Goal statement | UX/accessibility approach        | —                                     | —                                    | Task completion, error recovery          |
| `#safe`         | Goal statement | Fail-safe design                 | Redundancy                            | —                                    | Graceful degradation scenario            |
| `#suitable`     | Goal statement | Test strategy                    | —                                     | Test coverage approach               | Coverage, correctness scenario           |
