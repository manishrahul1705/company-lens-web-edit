This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000/design-system](http://localhost:3000/design-system) with your browser to see the default empty route.

You can start editing the default empty page by modifying `app/design-system/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Revision 3 data refresh

The committed dataset comes from **Stage G run 1** (`bench/runs/stage-g-run1` in the agent repository), the final measurement cited in SUBMISSION.md. It replaces the revision 2 payload from reference commit `97ea700`; application and mobile/phone fixes from `13ca14b` are unchanged.

The existing pipeline uses the agent's `scripts/export_for_jbox.py` for base profile conversion and this site's unchanged `scripts/derive-directory.mjs` for derived directory assets. Reference commit `97ea700` contains the final enriched payload and the directory generator, but does not commit a separate standalone script for its envelope/briefing enrichment. This refresh preserves those existing company/fact fields, projecting optional claims and cited briefings from final published envelopes only.

Existing files/schema are retained:

- `public/data/companies.json` and `public/data/companies/<org>.json`: company objects keyed by `org_number`, with section states, briefing/supporting detail and cited source records.
- `public/data/facts.json`, `public/data/facts/<org>.json` and existing `-more.json` pages: fact arrays with company/category/field/value, source URL/name, retrieval date, excerpt and evidence hash; existing optional GLEIF/news/proof fields remain supported.
- `public/data/source-summary.json`: supported-claim count, display-fact count, company count, run/date and input envelope hash.
- `public/data/index.json`, `metadata.json`, `explore.json`, their `.gz`/`.br` variants, `summary.json`, and `lib/generated/directory.json`: generated caches in the existing contracts.

Validated measurement: **113 websites, 47 social companies, 2 jobs companies, 1,000 activity companies, 7 website-news companies / 69 articles, 32 GLEIF companies, 0 TED awards, 165,481 supported claims**. The display projection is **46,877 facts**; this is not the supported-claim total. The envelope input SHA-256 is `9dfd143f31eeee6149d2b242789a87045502b452d4e033d2f2488c6a3de3d705`.

Known inherited generator mismatch: `summary.json.verifiedWebsites` is 0 because the existing generator reads an absent company flag. Its `websites` field, `metadata.json.websites`, the directory verified flags and the actual `/api/dataset-summary` metadata route correctly report 113. The unused legacy counter is disclosed rather than manually forced or changing generator logic in this data-only task.

Every company website URL was checked against the final published `official_website` claim; withheld candidate URLs are not company website links. Personal email strings are omitted from public citation text; company role addresses may remain. No credentials, tokens, raw envelopes/profiles, crawl downloads or registry bulk files are included in this refresh. No layout/component changes or new features are included.
