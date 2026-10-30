# Project Udyam Digital

## Project overview

Small businesses often have to navigate connectivity products, pricing,
registration checks, document verification, and order follow-up across
disconnected steps. Project Udyam Digital brings those tasks into one
multilingual onboarding experience: an advisor recommends eligible products,
Smart KYC checks business documents against the mock registries, checkout
explains monthly and setup costs, and a partner dashboard helps prioritize
unclosed leads for recovery.

The project is a demonstration built around the synthetic Track A dataset. It
is not connected to Airtel production systems or real government registries.

## System architecture

```text
Browser (responsive PWA + partner dashboard)
  ├─ Static HTML, Tailwind CDN, and vanilla JavaScript
  └─ Configurable API base URL
       ↓ HTTP / JSON / multipart + CORS
FastAPI application (backend/main.py)
  ├─ Data service ─────────── product_catalogue.csv + mock registries + leads
  ├─ KYC service ──────────── uploaded/local images → EasyOCR/Tesseract/metadata
  │                            └─ DPDP consent receipts → local SQLite
  ├─ Chat service ────────── product-catalogue retrieval → local Ollama (optional)
  └─ Lead scoring service ── propensity queue + funnel analytics
```

The frontend can use a same-origin API (for example, behind a reverse proxy) or
an API hosted at a separate origin configured in its `api-base-url` meta tag.
For separate origins, configure the backend CORS allowlist to match the
frontend origin exactly.

## Dataset overview

All businesses, people, identifiers, documents and figures in this pack are **fictional** and generated for the Accel YTL Hackathon. They do not describe any real company or customer.

## What's in the pack

| File | Rows | What it is |
| --- | --- | --- |
| `product_catalogue.csv` | 25 | Accel Business products with price range, setup fee, contract, eligibility rules and dependencies. Use it to power the advisor and the quote. |
| `smb_leads.csv` | 5,000 | One quarter (Apr-Jun 2026) of small-business leads with profile, funnel stage reached, drop reason, dates, and - for activated leads - bundle bought, value, churn and NPS. |
| `mock_gstin_registry.csv` | 3,534 | Mock GST registry. Back your "GSTIN lookup" API with this file. |
| `mock_udyam_registry.csv` | 2,723 | Mock Udyam registry. Back your "Udyam lookup" API with this file. |
| `kyc_documents/` | 47 images | Specimen KYC documents for 12 applicants (K01-K12): business registration, Udyam certificate, signatory ID and address proof. Some have problems your Smart KYC should catch. |

## Funnel at a glance

| Stage | Leads | % of previous stage |
| --- | --- | --- |
| Lead | 5,000 | - |
| Contacted | 3,406 | 68% |
| Needs assessed | 1,974 | 58% |
| Quote accepted | 861 | 44% |
| KYC complete | 588 | 68% |
| Activated | 368 | 63% |

Activated customers took 17.6 days on average from lead to activation and made 3 follow-up calls. Blended acquisition cost is about Rs 15,000 per activated customer.

## smb_leads.csv - column guide

| Column | Meaning |
| --- | --- |
| lead_id | Unique lead ID (L00001...) |
| created_date | Date lead was created |
| lead_source | Field sales, Website form, Channel partner, Inbound call, Referral, WhatsApp campaign |
| business_name, business_type, segment | Fictional business, its type and one of 4 segments |
| city, city_tier, state | Location; tier 1 or 2 |
| preferred_language | Language the owner prefers |
| employee_count, num_sites, annual_turnover_band | Size of the business |
| has_gstin, gstin, has_udyam, udyam_number | Registration status and numbers (match the mock registries) |
| current_internet, current_provider, monthly_telecom_spend_inr | Current setup and spend |
| products_of_interest | Product IDs the lead asked about (`;`-separated) |
| contact_name, contact_role | Fictional contact person |
| stage_reached | Last funnel stage reached |
| outcome, drop_reason | Activated or Dropped, with reason |
| contacted_date ... activated_date | Date each stage was reached (blank if not reached) |
| days_lead_to_activation | Days from lead to activation (activated only) |
| customer_follow_up_calls | Times the customer called to chase status |
| bundle_products | Products bought, as `P01x1;P07x2` (product x quantity) |
| monthly_bundle_value_inr, one_time_setup_inr, contract_months | Value of what was bought |
| churned_within_6_months, nps_score | Outcome after activation (0-10 NPS) |
| acquisition_cost_inr | Sales and partner cost spent on this lead |

## product_catalogue.csv - eligibility rules

- `available_city_tiers`: tiers where the product is sold
- `min_employees`, `min_sites`: product is only offered at or above these sizes
- `requires_gstin = Y`: cannot be sold without a valid, active GSTIN
- `requires_one_of`: product needs at least one of these products in the same bundle (`|`-separated)
- `typical_install_days`: use for the order tracker and for expected activation dates

## Notes on identifiers

- GSTINs follow the real 15-character structure with a valid checksum, so you can build a real format check. The 4th character of the embedded PAN is always `X`, which is not a valid entity type, so none of them can match a real taxpayer. Accept `X` in your validator.
- Udyam numbers use district code `00`, which does not exist.
- Use 2026-07-15 as "today" for any date-based check (e.g. address proof must be no older than 90 days).

## Privacy expectations

Treat this data as if it were real customer data: collect only what each step needs, show a clear consent notice before KYC, mask identifiers in logs and UI, and explain how long documents are retained. Your 1-page privacy note should cover these choices.

## Quickstart and backend configuration

Install the backend dependencies and start the API from the project root:

```powershell
# 1. Copy the optional settings template.
Copy-Item .env.example .env

# 2. Install backend dependencies.
python -m pip install -r backend/requirements.txt

# 3. Start the API (local defaults: 127.0.0.1:8000).
uvicorn backend.main:app --reload
```

The local server listens on `127.0.0.1:8000`. Use `GET /` as a health check;
the API documentation is available at `http://127.0.0.1:8000/docs`.

For deployment, set `HOST`, `PORT`, and `ENVIRONMENT` in the hosting platform.
Configure `CORS_ORIGINS` as a comma-separated list of exact frontend origins,
or set the single-origin `FRONTEND_ORIGIN`. If neither is configured, the API
allows the local development origins. Do not use wildcard origins with
credentials. For example, a reverse-proxy deployment can set
`CORS_ORIGINS=https://your-frontend.example`; a container commonly binds to
`HOST=0.0.0.0` and uses the platform-provided port. Example values and optional
OCR/assistant settings are in [.env.example](./.env.example). Keep real `.env`
files and local consent databases out of Git.

When the hosting platform exposes `HOST` and `PORT` as process environment
variables, pass them to Uvicorn explicitly, for example in PowerShell:

```powershell
uvicorn backend.main:app --host "$env:HOST" --port "$env:PORT"
```

The API loads the four CSV datasets at startup. Interactive API documentation is
available at `http://localhost:8000/docs`.

- `GET /api/products` returns the catalogue. Optional `city_tier`,
  `min_employees`, `min_sites`, and `has_gstin` query parameters filter products
  by availability and eligibility; dependent products are returned only when an
  eligible prerequisite is also available.
- `GET /api/lookup/gstin/{gstin}` and `GET /api/lookup/udyam/{udyam_no}` look up
  identifiers in the mock registries and return `404` when a record is missing.
- `POST /api/recommend` accepts a business profile with `business_type`,
  `employee_count`, `num_sites`, `city_tier`, `state`, `has_gstin`,
  `monthly_budget`, and `key_needs`. The response includes the selected bundle,
  eligible products, monthly and setup totals, budget status, and unmet needs.
  Products requiring GSTIN or a prerequisite are not recommended unless the
  profile and bundle satisfy those rules. Savings are estimated against the
  catalogue's maximum monthly prices; no extra bundle discount is assumed.
- `POST /api/chat` answers product questions in English, Hindi, Telugu, or
  Tamil using retrieved catalogue information. Optional Ollama generation is
  local-only; the catalogue-backed fallback works without an LLM.
- `POST /api/kyc/verify-document` accepts an image file and `doc_type` (`gst`,
  `udyam`, `id`, or `utility_bill`) as multipart form data. Optional `gstin`,
  `udyam_no`, and `applicant_name` fields enable ID-name cross-checking. It
  returns extracted fields, verification status, and flag/drop reasons. Signatory
  ID numbers are masked in responses.
- `POST /api/kyc/consent` records a minimal DPDP consent receipt in
  `backend/data/kyc_consents.sqlite3`; set `KYC_CONSENT_DB` to change its path.
- `GET /api/kyc/test-applicant/{applicant_id}` batch-checks local test images.
  It supports both `kyc_documents/K01/` folders and the supplied
  `kyc_documents/K01_*.png` layout. Missing required document types are
  included in the flagged result instead of aborting the batch.

KYC bill dates are checked against the fixed reference date 2026-07-15. EasyOCR
is loaded lazily to read text from image pixels; Tesseract and embedded image
metadata remain fallbacks. OCR engines and model weights are not loaded during
API startup. EasyOCR may download its model on the first document check;
`EASYOCR_MODEL_DIR` can select a local model directory. Install the Tesseract
executable separately if you want to use that fallback.

## Frontend

Start the API, then serve the static frontend from the project root:

```powershell
# 1. In a second terminal, serve the frontend files.
python -m http.server 5173 --directory frontend

# 2. Open http://127.0.0.1:5173 in a browser.
```

On local hosts, the page calls the API at
`http://127.0.0.1:8000` on local development hosts. For a hosted frontend, set
the `api-base-url` meta tag in `frontend/index.html` (and
`frontend/dashboard.html`) to the backend base URL; leave it empty when the
frontend and API share an origin. Tailwind CSS and the display fonts are loaded
from their CDNs. The installable-style web manifest is
[frontend/manifest.json](./frontend/manifest.json); production PWA installation
requires HTTPS.

The floating AI Advisor widget is available throughout the onboarding flow.
`POST /api/chat` retrieves matching product catalogue entries and answers in
English, Hindi, Telugu, or Tamil. It works without an LLM; to enable local
conversational generation, run Ollama on the same machine and set
`AI_CHAT_MODEL` to an installed model name. `AI_CHAT_OLLAMA_URL` may point to a
different loopback Ollama URL; non-loopback hosts are rejected to keep
conversation context on the local machine. Without a local model, the assistant
uses catalogue-grounded multilingual responses.

## Partner / Field Dashboard

Open `http://127.0.0.1:5173/dashboard.html` or use the Partner / Field Dashboard
link in the onboarding header. The dashboard reads `GET /api/dashboard/analytics`
and `GET /api/dashboard/leads`, offers drop-reason and text filters, and pages
through the lead recovery queue. Lead scores use the observed GSTIN conversion
baseline (9.6% with GSTIN, 2.0% without) plus the specified GSTIN, segment,
city-tier, and employee-count score-point boosts, capped at 100%. The
acquisition-cost KPI is total recorded acquisition spend
divided by activations and rounded to the nearest ₹1,000. The source dataset
contains no contact phone numbers, so re-engagement asks the operator to enter
an authorized number before opening WhatsApp or a direct call.

## Smoke tests

There is no standalone test suite in this repository yet. With dependencies
installed and the API running, these PowerShell commands exercise the health
check, OCR/KYC batch flow, and lead scoring API:

```powershell
# Service health
$health = Invoke-RestMethod http://127.0.0.1:8000/
$health | Format-List
if ($health.status -ne "online") { throw "API health check failed" }

# OCR and registry verification for a known specimen applicant.
# The first document check may download EasyOCR model weights.
$kyc = Invoke-RestMethod http://127.0.0.1:8000/api/kyc/test-applicant/K02
$kyc.verification_status
$kyc.documents | Select-Object filename, ocr_engine, verification_status
if ($kyc.verification_status -ne "PASS") { throw "K02 KYC smoke test failed" }

# Check source-derived funnel totals and ranked propensity scores.
$analytics = Invoke-RestMethod http://127.0.0.1:8000/api/dashboard/analytics
$analytics | Select-Object total_leads, activated_count, activation_rate_percent,
  average_days_to_activate, blended_acquisition_cost_inr
if ($analytics.total_leads -ne 5000 -or $analytics.activated_count -ne 368) {
  throw "Lead analytics smoke test failed"
}
$leads = Invoke-RestMethod http://127.0.0.1:8000/api/dashboard/leads
$leads | Select-Object -First 5 lead_id, propensity_score, drop_reason
for ($i = 1; $i -lt $leads.Count; $i++) {
  if ($leads[$i].propensity_score -gt $leads[$i - 1].propensity_score) {
    throw "Recovery leads are not sorted by propensity"
  }
}
```

The sample K02 applicant is expected to pass the bundled mock-registry and
document checks. Other specimen applicants intentionally include conditions
that should be flagged. A healthy seed dataset reports 5,000 leads, 368
activations, a 7.36% activation rate, and sorted recovery scores.

For a single uploaded image, use `POST /api/kyc/verify-document` with multipart
form fields `file` and `doc_type`; the interactive request form is available
under `/docs`. The OCR response includes the engine used so EasyOCR, Tesseract,
and image-metadata fallback behavior can be distinguished.
