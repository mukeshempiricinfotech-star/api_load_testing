# Performance coverage baseline

Last completed run: **2026-06-01 18:00:00 Asia/Kolkata**

- Current Coverage: **61%**
- Current Risk Count: **6**
- Method: static endpoint analysis plus seven-day traffic and latency weighting
- Seed tickets: `APIPERF-1` (open review pagination risk) and `APIPERF-2` (resolved cart pagination risk). The project was empty, so Jira allocated these two keys rather than the example keys `APIPERF-101` and `APIPERF-095` from the fixture specification.

`coverage.json` is intentionally a historical snapshot. In particular, risk `PERF-BASE-002` documents an old cart pagination concern that the current implementation has fixed: `GET /api/cart` is a single-user, inventory-bounded resource with no client-controlled collection pagination contract. A future analysis should mark that record fixed and must not recreate the resolved Jira ticket unless the pattern reappears.

Manual notes in the baseline are reviewer-authored evidence. Automated updates may append machine analysis, but must preserve the exact text under `manualReviewerNote`.

`traffic-seed.json` contains seven full days of endpoint evidence (2026-06-25 through 2026-07-01, inclusive). `DELETE /api/cart/items/:id` deliberately has null monitoring values and is tagged with `fallbackSource: estimated_default` to exercise the GA4-then-estimate path.
