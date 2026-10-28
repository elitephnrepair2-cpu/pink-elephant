# Local Print & Clear change

Status: implemented and tested locally; submitted for GitHub review. Not deployed or run against live customer records. No database migration required by this change; the existing `pe_clear_queue` procedure must already be installed (maintenance/07-queue-history-controls.sql).

## Staff use

1. Mark a visit completed. Open its saved form and choose **Print & Clear**, or select completed queue entries and choose **Print & Clear completed**. History's **Print** creates the same packet without clearing anything.
2. Inspect the actual printed pages. Choose **Cancelled / failed — keep in queue** if anything is missing, cancelled, unreadable, or the printer fails. Escape also keeps the visit queued. Only choose **I checked every printed page — clear queue** after every selected customer's packet has printed.

The original consent print layout was restored at the user's request on October 28, 2026. It prints the waiver, inline signatures, client/artist sections and original identification grid. The added intake-evidence appendix and separate signature/attachment pages have been removed. The original layout does not print every saved intake field; database records and attachments remain retained unchanged. Pagination still depends on paper size, print scale and the saved ID images.

## Safety and persistence

- Opens an isolated printing window, reads current saved records and renews private document links before printing.
- Waits for stylesheet and image loading; missing signatures or failed attachment loading block printing/clearing.
- Does not interpret `afterprint`, window focus, or closing a print dialog as proof of success. A browser cannot observe the physical printer.
- Ignores uncompleted/archived visits in queue selection; limits a batch to 200 completed visits.
- Checks the saved record again before clearing. Changes during staff review require a fresh print. Existing RPC row-lock/status checks still apply; the frontend freshness check is not an atomic database compare-and-swap.
- Calls only the existing `pe_clear_queue` RPC, which sets `form_data.isArchived=true`. Does not delete database rows, consent, attachments, or history. Existing separate administrator history actions are unchanged.
- Refreshes after clearing attempts, checks returned IDs and checks that successfully cleared visits no longer appear active. A failed refresh is reported as unverified; no false success message.
- Existing real-time database subscriptions remain in place for other staff screens. Physical printing and live cross-device updates still require staff acceptance testing.

## Verification

- `npm run lint`: passed.
- `node --test tests/*.test.ts`: 33 passed, including 12 new Print & Clear checks.
- `npm run build`: passed; existing large frontend bundle warning remains.
- Chrome sample-data browser checks: passed for staff cancellation, Escape, missing image, print exception, explicit confirmation, refreshed queue and retained signatures/record. The print function and database effects are simulated; no live records are mutated.
- Restored-layout sample regenerated and browser-checked on October 28, 2026: `print-clear-qa/sample-packet.png`. Printable sample: `print-clear-qa/sample-signed-packet.pdf`. All sample names/signatures are artificial. Generated QA files remain local and are not included in the GitHub update.

Optional browser check (requires Playwright and installed Chrome):

```sh
node tests/printAndClear.browser.cjs
```

If Playwright is provided outside the project, set `PLAYWRIGHT_MODULE` to its module path. No dependency installation is needed for the standard tests above. The browser check serves only local sample content and recreates the QA files.

Before publishing, use one completed test visit and a real printer: cancel once, confirm it remains queued; then print all pages, explicitly confirm, and check Form History plus a second staff screen. Do not use actual customer records for an unapproved live mutation test.
