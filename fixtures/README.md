# Fixtures

Versioned test data and replay files consumed by fake implementations and tests.
Maintained by the QA agent.

- Group by port: `fixtures/<port>/<scenario>.<ext>` (for example `fixtures/clock/`, `fixtures/location/`).
- Name each file after the scenario it represents, not the test that uses it.
- Every fixture is synthetic or anonymized. Never commit real user data.
