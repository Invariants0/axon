# Automatic Evolution Summary

This document summarizes where automatic evolution behavior is documented and tested.

## Scope

Automatic evolution in AXON primarily covers:

- skill generation/evaluation flows,
- evolution endpoint orchestration,
- pipeline-level validation in production-like scenarios.

## Primary References

- [AXON Phase 3 Report](PHASE_3_REPORT.md)
- [Phase 3 Circuit Breaker Refactoring](PHASE3_CIRCUIT_BREAKER_REFACTORING.md)
- [Phase 3 Before/After Comparison](PHASE3_BEFORE_AFTER_COMPARISON.md)
- [Evolution API](api/evolution.md)

## Related Validation Scripts

Utility scripts under `utils/` include evolution-focused checks, including:

- `utils/test_automatic_evolution.py`
- `utils/test_evolution_skill_generation.py`
- `utils/test_real_evolution_production.py`
- `utils/test_single_auto_evolution.py`

## Notes

For day-to-day operations, use [Quick Reference](QUICK_REFERENCE.md) and [Deployment Guide](DEPLOYMENT.md). This file is a navigational summary, not a full runbook.
