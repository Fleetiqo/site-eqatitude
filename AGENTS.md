<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project conventions

- Read `README.md` (architecture and principles) before changing code.
- Database access only through `src/server/repositories/*`; schema changes → edit `src/server/db/schema.ts`, then `npm run db:generate` and commit the SQL in `drizzle/`.
- Every admin page, Server Action (`src/server/actions/*`, wrapped in `adminAction`) and admin route handler must call `requireAdmin()`.
- Public pages must stay visually identical to the original design: reuse the class names of `src/styles/site.css`; editable wording goes through `src/content/blocks.ts`.
- Quote form fields are declared once in `src/lib/quotes/definitions.ts`.
- UI text is French; code and comments are English.
- Run `npm run check` before delivering.
