## Summary
- Describe what changed and why.

## Validation
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual verification (if applicable)

## Tenant + Subscription Readiness Checklist (Required for all new modules)
- [ ] Confirmed tenant ownership with `schoolId` on module entities and queries.
- [ ] Added or mapped an entitlement key for the module and plan tier behavior.
- [ ] Decided whether module output requires template-based print support.
- [ ] Added audit events for create/update/delete/export/print actions.
- [ ] Added tenant-isolation tests to prevent cross-tenant access regressions.

## Deployment / Rollback
- [ ] Migration steps documented (if any)
- [ ] Rollback steps documented
