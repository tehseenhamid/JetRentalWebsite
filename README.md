# Velora Air — visual edition for GitHub Pages

Exact website URL: https://tehseenhamid.github.io/JetRentalWebsite/

## Upload this version

1. Extract JetRentalWebsite-visual-update.zip.
2. Open the extracted folder. index.html, assets, about and the other page folders must be directly inside it.
3. In tehseenhamid/JetRentalWebsite on GitHub, choose Add file → Upload files.
4. Drag everything INSIDE the extracted folder from Finder into GitHub, replacing matching files. Do not upload the ZIP or an extra enclosing folder. Include the complete assets folder.
5. Commit, then use Settings → Pages → Deploy from a branch → main → / (root). No custom domain is needed.
6. Wait for deployment, then refresh the exact URL above. Use Command+Shift+R if you see cached pages.

The ZIP includes .nojekyll. Command+Shift+Period shows hidden files in Finder. If it is omitted during upload, create an empty .nojekyll file at the repository root in GitHub.

## Visual changes

- New original destination artwork replaces the large TEB, OPF, VNY and ASE tiles on the homepage and destination directory.
- Destination detail pages use destination imagery instead of the oversized airport-code badge. Useful airport names/codes in travel guidance and form suggestions are retained.
- Service, aircraft and guide cards have imagery. Route listings have destination thumbnails. Other pages have appropriate editorial images; policy, sitemap and form pages use compact images to preserve usability.
- Gentle CSS perspective tilt and image zoom on hover-capable desktop devices, short entry reveals, and a brief hero arrival animation. These are lightweight CSS 3D effects, not downloadable 3D models or a WebGL viewer.
- Touch devices do not get pointer tilt. Reduced-motion preferences disable animation and transforms. Content remains visible with JavaScript unavailable.
- All new destination images have responsive 480/800/1280 WebP variants, lazy loading, descriptive or decorative alt text, and explicit dimensions. No video, external font, animation framework or new network service is required.
- Existing navy/gold branding, main layout, copy, pages, filters, comparison, calculator and interactive planner remain.

See IMAGE-ASSETS.md for provenance and generation prompts. Images are illustrative.

## Static hosting behavior

No build or Node server is required to publish this folder. Every internal link and asset remains under /JetRentalWebsite/. GitHub Pages cannot save/deliver enquiries; the form retains its working client-side preview, validation and reset and explicitly says requests are not sent or saved. The original fictional demo's noindex policy remains. Project robots.txt is not authoritative for the entire github.io host. GitHub Pages ignores _headers; the site does not depend on it.

## Validation

All 37 HTML files, links, responsive image candidates and interactive features were checked. See VISUAL-VERIFICATION.md. Fresh rendered browser screenshots and performance scores could not be collected because macOS blocked browser process startup; no Lighthouse or real-device score is claimed.
