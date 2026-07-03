# api_load_testing

A production-shaped Node.js/Express ecommerce backend designed as the subject for performance-analysis workflows. PostgreSQL owns operational data, Redis stores refresh-token and future cache state, BullMQ runs order-confirmation jobs, and Stripe PaymentIntents capture checkout payment.

The application intentionally retains five observable performance risks: unbounded product listing, uncached product detail, N+1 order-item reads, a synchronous Stripe call, and an unbounded reviews response. The dated performance baseline contains a sixth historical cart risk that is fixed in current code.

## Quick start

1. Copy `.env.example` to `.env` and use Stripe test credentials.
2. Run `docker compose up -d` to start PostgreSQL and Redis. The database schema is installed on the first boot.
3. Run `npm install`, then `npm run seed`.
4. Run `npm run dev` and, separately, `npm run worker`.

To run the API and its Datadog Agent together, set `DD_API_KEY` in `.env` and run `docker compose up --build`. The `api` container emits APM traces, DogStatsD request metrics, correlated JSON logs, and (when configured) GA4 Measurement Protocol events.

## Production observability

The repository is wired for Datadog US5 and GA4 without committing any account credentials. Copy the observability fields from `.env.example` into the deployment environment or GitHub environment secrets/variables:

| Variable | Purpose |
|---|---|
| `DD_API_KEY` | Datadog Agent and optional GitHub Actions CI Visibility authentication (GitHub secret) |
| `DD_SITE` | Datadog site; this account uses `us5.datadoghq.com` (GitHub variable) |
| `DD_ENV`, `DD_SERVICE`, `DD_VERSION` | Unified Datadog tags |
| `GA_MEASUREMENT_ID` | GA4 web-stream Measurement ID (`G-...`) |
| `GA_API_SECRET` | GA4 Measurement Protocol API secret |
| `GA_CLIENT_ID` | Non-personal aggregate client ID for server-side events |

The runtime sends one `api_request` GA4 event per completed request with the HTTP method, Express route template, status, duration, and environment. It intentionally excludes URL query strings, path values, authorization data, IP addresses, and user attributes. Datadog metrics use the same low-cardinality route templates under `api_load_testing.http.*`.

The GitHub Actions workflow in `.github/workflows/observability.yml` runs tests under Datadog CI Visibility after the `DD_API_KEY` repository secret is added. Without that secret it still runs the same test suite, so pull requests are not blocked while setup is incomplete.

The sample account created by the seed script is `buyer@example.test` / `load-test-password`.

## HTTP contract

All bodies are JSON. Authenticated endpoints require `Authorization: Bearer <accessToken>`.

| Method | Endpoint | Auth | Input |
|---|---|---:|---|
| POST | `/api/auth/register` | Public | `{email,password,firstName,lastName}` |
| POST | `/api/auth/login` | Public | `{email,password}` |
| POST | `/api/auth/refresh` | Public | `{email,password,refreshToken}` |
| POST | `/api/auth/logout` | Public | `{email,password,refreshToken}` |
| GET | `/api/products` | Public | none; intentionally no pagination |
| GET | `/api/products/:id` | Public | UUID path parameter; deliberately no cache |
| GET | `/api/products/search?q=` | Public | `q`, 2–80 characters |
| GET | `/api/products/:id/reviews` | Public | UUID path parameter; intentionally no pagination |
| GET | `/api/orders` | JWT | none; deliberately uses N+1 item queries |
| POST | `/api/orders` | JWT | `{items:[{productId,quantity}],shippingAddress:{...}}` |
| GET | `/api/cart` | JWT | bounded current-user cart |
| POST | `/api/cart/items` | JWT | `{productId,quantity}` |
| DELETE | `/api/cart/items/:id` | JWT | cart-item UUID |
| POST | `/api/checkout/payment` | JWT | `{orderId,paymentMethodId}`; synchronous Stripe capture |

## Performance fixtures

- `performance/coverage.json`: completed 2026-06-01 Asia/Kolkata baseline, 61% coverage, six risks, immutable manual reviewer note, and Jira references.
- `performance/traffic-seed.json`: seven daily data points through 2026-07-01 for every route. One route deliberately has no telemetry and carries an explicit estimated default.
- `CODEOWNERS`: team ownership at module level for analysis ownership routing.

The risky patterns are documented as intentional fixtures. Do not “optimize” them before the downstream performance-analysis workflow has exercised detection and deduplication.
