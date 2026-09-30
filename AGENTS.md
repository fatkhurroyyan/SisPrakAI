<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Typography
Always use **Plus Jakarta Sans** for the primary sans-serif font, never use Inter.

# UI/UX Guidelines: Page Layouts
1. When building Dashboard content areas, NEVER use a fixed `max-width` (like 1200px) that restricts data-heavy views.
2. Instead, set `max-width: none`, `width: 100%`, and use horizontal padding of `50px` from the edges so tables and content can expand dynamically on large screens.

# UI/UX Guidelines: Notifications & Alerts
1. NEVER use native browser `alert()`, `confirm()`, or `prompt()` for user interactions or feedback.
2. ALWAYS use a custom, well-designed Modal (with overlay background and centered card) for destructive action confirmations (like Delete), instead of native `window.confirm`.
3. For success or error messages (e.g., after a file upload or CRUD operation), ALWAYS use non-blocking Toast notifications positioned at the edge of the screen (e.g., top-right). Success messages MUST have a highly visible green background with white text.
4. Toasts should automatically dismiss after a few seconds and use appropriate semantic colors (e.g., green for success, red for error).

# UI/UX Guidelines: Action Buttons
1. When placing "Edit" and "Delete" buttons together, ALWAYS separate them into distinct buttons.
2. Use strict semantic colors for actions: Delete/Remove MUST be Red (`var(--color-danger)`). Edit/Update MUST be Green or Blue (e.g., `var(--color-green)`).

# UI/UX Guidelines: Table Layouts
1. When displaying data tables with potentially long lists of rows (e.g., attendance lists, data grids), ALWAYS implement sticky headers.
2. Wrap the table in a container with a defined `max-height` (e.g., `calc(100vh - 300px)`), `overflow-y: auto`, and `width: "100%"`.
3. Apply `position: sticky`, `top: 0`, and a solid background color to the `<thead>` or `<th>` elements so they remain visible while scrolling the table body.
4. For horizontal sub-tab navigation (e.g., switching between classes), use a compact height (e.g., `padding: "6px 16px"`) and avoid making the tabs unnecessarily tall.

# Backend: Session & Authentication
1. The `session` object obtained from `getSession()` in `auth.ts` only contains `nim`, `role`, and `nama`. It does **NOT** contain `id`.
2. When a user's UUID `id` or `kelas_id` is required for database relations, you MUST query the `users` table using `nim`: `supabase.from('users').select('id, kelas_id').eq('nim', session.nim).single()`.

# Business Logic: Absensi & Keterlambatan
1. Default status absensi adalah **ALPA**.
2. Skor Kehadiran dihitung berdasarkan status:
   - HADIR = Skor 5
   - TERLAMBAT <= 10 menit = Skor 4
   - TERLAMBAT 11-30 menit = Skor 3
   - TERLAMBAT 31-60 menit = Skor 2
   - TERLAMBAT > 60 menit = Skor 1
   - SAKIT / IZIN / DISPEN / ALPA = Skor 0
3. Persentase Kehadiran = (Jumlah HADIR + TERLAMBAT) / (Total data absensi yang sudah tercatat untuk mahasiswa tersebut) * 100%. SAKIT, IZIN, DISPEN, dan ALPA tidak dihitung sebagai hadir dalam persentase ini.

# Database & SQL Rules
1. When generating SQL seed data (e.g., `INSERT INTO`), use standard single quotes for strings (e.g., `'NAMA'`).
2. NEVER use triple single quotes (`'''`) around values unless the string itself legitimately contains a literal single quote that requires escaping, and even then, standard SQL escaping (`''`) is preferred to avoid injecting quotes into the data.

# Frontend: React & Server Actions
1. When calling asynchronous Server Actions inside a `useEffect`, ALWAYS implement an `isMounted` flag.
2. Only update state (e.g., `setLoading`, `setData`) or trigger UI changes (e.g., `showToast`) if `isMounted` is true. This prevents memory leaks and phantom error toasts when a user navigates away from the page before the Server Action completes.

# Debugging: Next.js Turbopack Cache Issues
1. If a React component error or Server Action error persists in the browser console despite the source code being verifiably fixed, the Next.js dev server may be serving a stale cache.
2. In this scenario, you MUST forcefully stop the Next.js dev server (e.g., using `Stop-Process` for Node.js) and clear the `.next` cache directory before restarting the server to ensure fresh compilation.
