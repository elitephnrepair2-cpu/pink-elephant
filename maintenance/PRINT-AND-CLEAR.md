# Local Print & Clear change

Status: implemented and tested locally; submitted for GitHub review. Not deployed or run against live customer records. Clearing any selected active visit requires the current `pe_clear_queue` definition in `QUEUE-CLEAR-ANY-STATUS.sql`. Earlier installations may restrict clearing to completed visits. Apply the narrow replacement only after inspecting the live definition; it preserves staff authorization and only changes the archive flag.

## Staff use

1. Choose **Mark completed**. Once the saved completed status is verified, the app asks **Visit completed. Print now?** Choose **Print & Clear** to continue or **Not now — keep in queue** to leave it completed and active. You can also open its saved form and choose **Print & Clear**, or select one or more active queue entries and choose **Clear selected**. This opens a choice: **Print & Clear instead**, **Yes, clear without printing**, or **Cancel — keep in queue**. Clearing without printing requires the explicit Yes choice and still preserves all saved records. History's **Print** creates the same packet without clearing anything.
2. Inspect the actual printed pages. Choose **Cancelled / failed — keep in queue** if anything is missing, cancelled, unreadable, or the printer fails. Escape also keeps the visit queued. Only choose **I checked every printed page — clear queue** after every selected customer's packet has printed.

The original consent print layout was restored at the user's request on October 28, 2026. It prints the waiver, inline signatures, client/artist sections and original identification grid. The added intake-evidence appendix and separate signature/attachment pages have been removed. The original layout does not print every saved intake field; database records and attachments remain retained unchanged. Pagination still depends on paper size, print scale and the saved ID images.

## Safety and persistence

- Opens an isolated printing window, reads current saved records and renews private document links before printing.
- Waits for stylesheet and image loading; missing signatures or failed attachment loading block printing/clearing.
- Does not interpret `afterprint`, window focus, or closing a print dialog as proof of success. A browser cannot observe the physical printer.
- Staff can select and clear waiting, in-progress or completed visits. The button counts all selected active visits. Clearing never marks a procedure completed; its original status remains stored. Limits a batch to 200 active visits.
- Checks the saved record again before clearing. Changes during staff review require a fresh print. Existing RPC row-lock/status checks still apply; the frontend freshness check is not an atomic database compare-and-swap.
- Calls only the existing `pe_clear_queue` RPC, which sets `form_data.isArchived=true`. Does not delete database rows, consent, attachments, or history. Existing separate administrator history actions are unchanged.
- Refreshes after clearing attempts, checks returned IDs and checks that successfully cleared visits no longer appear active. A failed refresh is reported as unverified; no false success message.
- Existing real-time database subscriptions remain in place for other staff screens. Physical printing and live cross-device updates still require staff acceptance testing.

## Verification

- `npm run lint`: passed.
- `node --test tests/*.test.ts`: 42 passed, including clearing selected waiting/in-progress visits, explicit no-print confirmation, queue readback, completion save/readback and Print & Clear checks.
- `npm run build`: passed; existing large frontend bundle warning remains.
- Chrome sample-data browser checks: passed for waiting-visit selection/clearing, staff cancellation, Escape, missing image, print exception, explicit confirmation, refreshed queue and retained signatures/record. The print function and database effects are simulated; no live records are mutated.
- Restored-layout sample regenerated and browser-checked on October 28, 2026: `print-clear-qa/sample-packet.png`. Printable sample: `print-clear-qa/sample-signed-packet.pdf`. All sample names/signatures are artificial. Generated QA files remain local and are not included in the GitHub update.

Optional browser check (requires Playwright and installed Chrome):

```sh
node tests/printAndClear.browser.cjs
```

If Playwright is provided outside the project, set `PLAYWRIGHT_MODULE` to its module path. No dependency installation is needed for the standard tests above. The browser check serves only local sample content and recreates the QA files.

Before publishing, use one completed test visit and a real printer: cancel once, confirm it remains queued; then print all pages, explicitly confirm, and check Form History plus a second staff screen. Do not use actual customer records for an unapproved live mutation test.

## Database verification

`tests/queueClear.database.cjs` tests the narrow SQL replacement against isolated PostgreSQL (PGlite) with synthetic records. It verifies staff authorization, anonymous denial, waiting/in-progress/completed batch clearing, size limits, atomic rejection of stale/missing IDs, unchanged procedure status and preserved consent, signatures and attachments. It never connects to the live database. Run with `PGLITE_MODULE` set to an installed PGlite module path, or install PGlite in a separate test environment.

The older `verify-queue-history-rollback.sql` and `verify-admin-deletion-rollback.sql` scripts describe the historical completed-only rule and should not be used to validate the new any-status clearing rule.
