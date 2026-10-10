# Raunak Kushwah — portfolio v5 (redesign)

## Preview on Windows
1. Extract the entire ZIP to a folder.
2. Open that folder in Visual Studio Code.
3. Open `index.html` in your browser, or use Live Server → **Open with Live Server** (recommended — gives the most accurate preview).
4. Keep the `assets` and `projects` folders beside `index.html`.

No build step, npm installation or database is needed.

## What changed in v5

### Review findings (v4)
- Three stylesheets (`styles.css` → `theme.css` → `colour-motion.css`) overrode each other, with `!important` rules and conflicting colours. Replaced by one stylesheet, `assets/site.css`, built on a small set of tokens.
- Colour drift: blue, violet, cyan and rose accents competed with each other. v5 uses one identity: dark ink, signal blue, cool white. Green and amber appear only as OK/attention status colours.
- No defined typeface: the site fell back to Segoe UI/Arial. v5 serves Archivo (headings) and IBM Plex Sans / Plex Mono (body, data labels) from `assets/fonts/`, under the SIL Open Font License. There are still no requests to outside font services.
- Contact form bug: the "Computer vision" option was malformed (`</option value="vision">`), so `contact.html?service=vision` could not pre-select it. Fixed.
- Typo: "that that" in the YG8 project summary. Fixed.
- Mobile: the header stopped being sticky, and the menu was a plain text button that pushed the page down. v5 has a sticky header, an animated menu button, a full-screen menu panel that closes on Escape or after a link is tapped, and a floating Call / WhatsApp / Inquire bar that hides while you scroll down.
- Project pages were mostly long lists with oversized icon headings. They are now structured as requirement / application panels, an animated workflow timeline, a capabilities list, hardware and software spec cards, a sticky "Ask about this project" panel, and previous/next project links.

### Design and interaction
- Home hero: a live workflow monitor (read hardware → guide operation → record result) cycles through the devices, OK result and record log. It replaces the static "One connected workflow" panel and uses the same text.
- Animated counters, all derived from the site's own content (no invented metrics): 10 documented projects, 36 hardware components listed across the project scopes, 4 service areas.
- Services shown as interactive rows on the home page. The Services page has a section index that highlights the section you are reading, plus animated FAQ answers.
- Project cards include a small workflow line built from each project's steps. On hover, a soft spotlight follows the pointer and the steps light up.
- Project library: filter chips show a count for each category, filtered cards animate in, and a "Need something similar?" panel sits in the grid.
- Scroll reveals (only for content below the fold), a scroll progress bar, a header that changes on scroll, process and workflow lines that fill on scroll, and cross-page fade transitions in browsers that support them.
- Motion respects `prefers-reduced-motion`. With JavaScript disabled, all content stays visible. Print styles are included.

### Preserved
All page text, project content, URLs, canonical/OG/JSON-LD metadata, the sitemap and robots file, the email-draft / copy-inquiry form flow, optional direct delivery, opt-in analytics with consent, phone and WhatsApp links, and `?service=` / `?project=` pre-fill.

### File changes
- Removed: `assets/styles.css`, `assets/theme.css`, `assets/colour-motion.css`.
- Added: `assets/site.css`, `assets/fonts/`.
- Rewritten: `assets/app.js` (same form, consent and analytics logic, plus updated menu and filter behaviour) and `assets/motion.js`.
- Redesigned: `og-image.png` (social share card, same 1733 × 907 size, so page metadata is unchanged). See `SOCIAL-IMAGE-NOTES.txt`.
- Unchanged: `assets/config.js`, `assets/projects.json`, `sitemap.xml`, `robots.txt`.
- Asset URLs carry `?v=5` to avoid stale browser caches after upload.

## PLC Data Logging & Reporting demo (Home page)
A live, self-contained dashboard demo now sits on the Home page between "How I can help" and "Selected projects" (`index.html#plc-demo`).

- **Files:** `assets/plc-demo.css` and `assets/plc-demo.js` (loaded on the Home page only, `?v=6`). All classes use a `pd-` prefix, so the demo cannot affect the rest of the site. No libraries, CDNs or network requests.
- **Access:** a "Live Demo" link was added to the main navigation on all 17 pages, plus a "Live demo" shortcut under the hero buttons. Deep links open a specific view: `index.html#plc-demo-live`, `#plc-demo-logs`, `#plc-demo-reports`, `#plc-demo-alarms`.
- **Views:** Overview (6 KPI cards, machine fleet with PLC status and link indicators, production and cycle-time charts with 6H/24H/7D/30D ranges, recent activity, system health); Live monitoring (simulated Start / Stop / Trigger fault / Reset, sensor gauges with alarm limits, PLC I/O diagnostics, rolling live trend); Data logs (search, filters, date range, sorting, paging, record details, CSV and Excel export); Reports (production, quality, downtime and alarm reports with chart, summary and table; Print/PDF prints only the report; CSV and .xlsx export); Alarms (acknowledge, acknowledge all, filters).
- **Data:** 4 simulated PLCs and 30 days of generated hourly history. Nothing is real and nothing is sent anywhere; the UI says so in several places. The simulation only runs while the section is on screen and the browser tab is visible. Pause/resume and the polling interval are remembered in the visitor's browser.
- **Without JavaScript** the section shows a short note instead of an empty dashboard. With reduced motion, animations are skipped.
- **Checked:** headless Chromium at 1440, 820 and 390 px, no horizontal overflow and no console errors; every tab, control, filter, sort, pager, dialog and export was exercised, and the exported .xlsx files open cleanly in a spreadsheet library.

## Project images (detail pages)
Nine project pages now show an image below the page header: magnatest, rfid, sms, vision, y9t, yg8, andon, email and fgscan. The gearbox page has no image yet, because only a placeholder was supplied.
- Files are in `assets/projects/`: `<project>-1600.webp`, `<project>-900.webp` (phones) and `<project>-1600.jpg` (fallback and "View full size").
- Each image has descriptive alt text and a caption labelled "Application screen" or "Illustration". The sms, vision and email images are labelled "Illustration".
- To replace an image, overwrite the three files with the same names. To add the gearbox image, copy the `shot-section` block from another project page and change the file names, alt text and caption.
- The same images also appear as thumbnails on the Projects page cards and the Home page "Selected projects" cards (decorative, `alt=""`, lazy-loaded). Gearbox shows a neutral P-10 panel until a real photo is added.
- Styles are at the end of `assets/site.css`. Stylesheet links now use `?v=7`.
- Before publishing, make sure you have permission to show the customer names and logos visible in some screens.

## Before publication
Review all hardware, software and feature descriptions for factual accuracy and permission to publish. `assets/projects.json` is a content reference; editing it alone does not regenerate the HTML. Real screenshots, a portrait, testimonials and measured results were not supplied, and none have been invented. When permitted assets are available, add them with descriptive alt text and explicit dimensions.

## Enable direct inquiry delivery
Default: the button is **Open email draft**. No inquiry is sent or stored by the website. Copy inquiry, phone and WhatsApp provide alternatives.

To enable direct delivery, edit `assets/config.js` with your HTTPS form endpoint, provider name and provider privacy policy URL. All three are required. Use a form provider or your own backend; never put a private API key in frontend files. The endpoint must accept JSON with `name`, `company`, `email`, `phone`, `service`, `message` and `_gotcha`, allow the website origin through CORS, and return 2xx only after accepting the inquiry. Non-2xx, network failures and a 15-second timeout show an error without clearing the form.

The backend must validate inputs, check the honeypot, enforce size limits and rate limiting, and handle email delivery failures. Browser validation and a honeypot alone are not a complete anti-spam system. Update the Privacy page to accurately reflect provider retention and processing. No live delivery endpoint or account has been created or verified in this package.

## Analytics and Search Console
`gaMeasurementId` is empty. Set your own `G-...` ID only after creating/selecting your Analytics property. The consent prompt then becomes available; declining prevents the Analytics script from loading. Page URLs sent to Analytics omit query strings and fragments; event calls do not include inquiry fields. Disable automatic form-interaction measurement in your GA property and review its privacy settings before launch.

Canonical and social URLs point to `https://raunakkushwah-tech.github.io/portfolio/`. If hosting elsewhere, replace this base URL in all HTML and in `sitemap.xml` / `robots.txt`. For Search Console, verify the actual deployed property with a Google-provided verification token/file or DNS record, then submit the sitemap. No verification token is fabricated in this project. Account setup and live tracking have not been performed.

For GitHub project Pages, robots.txt is normally read at the host root, not the `/portfolio/` project path. Submit the sitemap directly in Search Console or maintain the root robots file if you control it. GitHub Pages serves the static pages but does not run an email backend.

## Upload
Upload the *contents* of this folder into the existing site's publishing source, preserving its folder structure. This package is static HTML, not a WordPress theme. No live site has been overwritten.

## Validation performed
Pages were rendered in headless Chromium at 1440, 820 and 390 px wide, with no horizontal overflow and no console errors. All local links and fragment targets were checked across 17 pages, with no broken links or duplicate IDs. The following were tested: project filters and search (including empty results and reset), `?service=` and `?project=` pre-fill, form validation, the FAQ, mobile menu open/Escape, reduced-motion mode and no-JavaScript rendering. Test in your own Windows browser before publishing.
