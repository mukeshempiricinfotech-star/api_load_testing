# Performance coverage baseline

Review Date: **2026-07-02 Asia/Kolkata (00:00–23:59)**

- Current Coverage: **100%**
- Previous Coverage: **61%**
- Coverage Change: **+39 percentage points**
- Current Risk Count: **6**
- Previous Risk Count: **6**
- Last Updated Timestamp: **2026-07-02 23:59:00+05:30**
- Method: static endpoint analysis plus seven-day traffic and latency weighting
- Seed tickets: `APIPERF-1` (open review pagination risk) and `APIPERF-2` (resolved cart pagination risk). The project was empty, so Jira allocated these two keys rather than the example keys `APIPERF-101` and `APIPERF-095` from the fixture specification.

`coverage.json` is intentionally a historical snapshot. In particular, risk `PERF-BASE-002` documents an old cart pagination concern that the current implementation has fixed: `GET /api/cart` is a single-user, inventory-bounded resource with no client-controlled collection pagination contract. A future analysis should mark that record fixed and must not recreate the resolved Jira ticket unless the pattern reappears.

Manual notes in the baseline are reviewer-authored evidence. Automated updates may append machine analysis, but must preserve the exact text under `manualReviewerNote`.

`traffic-seed.json` contains seven full days of endpoint evidence (2026-06-25 through 2026-07-01, inclusive). `DELETE /api/cart/items/:id` deliberately has null monitoring values and is tagged with `fallbackSource: estimated_default` to exercise the GA4-then-estimate path.

## Current reviewed risks

| Root Cause Category | Root Cause Summary | Priority | Recommended Fix | Reviewer Status | Jira Ticket ID |
|---|---|---|---|---|---|
| Synchronous External Call | `checkout.service.js:2-5` waits on Stripe PaymentIntent creation in the request path. | High | Persist an idempotent attempt and move capture to BullMQ/webhook processing; keep timeout/circuit-breaker fallback if synchronous confirmation remains mandatory. | Verified current; accepted-risk manual note preserved. | [APIPERF-4](https://expert-team-w5rkwxzm.atlassian.net/browse/APIPERF-4) |
| Missing Pagination | `products.service.js:4-7` and `products.controller.js:2` return the active catalog without a query or output bound. | High | Add stable cursor/keyset pagination and default/maximum page sizes. | Verified current. | [APIPERF-5](https://expert-team-w5rkwxzm.atlassian.net/browse/APIPERF-5) |
| Missing Caching | `products.service.js:9-13` executes every product detail read against PostgreSQL despite configured Redis. | Medium | Add cache-aside product-detail reads with bounded TTL, mutation invalidation, and a Redis-degraded fallback. | Verified current; improvement task was also created. | [APIPERF-3](https://expert-team-w5rkwxzm.atlassian.net/browse/APIPERF-3) |
| Database Query Inefficiency | `orders.service.js:15-16` issues two PostgreSQL mutations per input item inside a loop (bounded to 50 items); the current baseline had no matching record, so details are in `risk-analysis.json`. | Medium | Batch item insert and inventory decrement statements while retaining transaction locks and validation. | Newly identified current risk. | — |
| Missing Pagination | `reviews.service.js:3-5` returns all product reviews; controller response is unbounded. | Low | Add created-at/id cursor pagination, maximum page size, and response metadata. | Verified current; existing unresolved ticket retained. | [APIPERF-1](https://expert-team-w5rkwxzm.atlassian.net/browse/APIPERF-1) |
| Database Query Inefficiency | `orders.service.js:2-6` issues one line-items query per returned order; the enclosing history list is also unbounded. | Low | Use a set-based join/aggregation or two batched queries and paginate order history. | Verified current. | — |

The previous `GET /api/cart` pagination risk remains fixed, its historical record and `APIPERF-2` reference are retained, and no current ticket was recreated.
