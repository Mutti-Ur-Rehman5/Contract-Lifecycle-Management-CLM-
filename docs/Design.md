# Design.md — UI/UX Design System
## Enterprise Contract Lifecycle Management (CLM) Platform

> This is an **enterprise legal/compliance tool**, not a marketing site. The people using it (legal reviewers, finance approvers, compliance officers) live in this app for hours, scanning dense information under time pressure. Design for **clarity, trust, and speed of scanning** — not for flashy hero sections. Avoid generic default AI-generated look (do NOT default to: cream background + terracotta accent + serif display; near-black + neon accent; or plain default shadcn indigo-on-white with zero personality). This document defines a specific identity — follow it exactly.

---

## 1. Design Identity — "Ledger"

The product's visual identity is called **Ledger**: it borrows the feeling of a well-kept legal ledger book — precise rules, clear status marks, ink-on-paper contrast — translated into a modern SaaS interface. The signature element of the product is the **Stage Rail**: a persistent, color-coded vertical or horizontal indicator (used on contract cards, the contract detail page, and the workflow stepper) that always shows where a contract sits in its lifecycle at a glance, using the workflow status colors defined below. Every list, card, and detail view treats "what stage is this contract in" as the single most important piece of information on screen — because in a CLM tool, that answer is what the user opened the app to find.

---

## 2. Color Palette

### Base (Light mode — primary mode for this app)
| Token | Hex | Use |
|---|---|---|
| `--bg-canvas` | `#F6F5F1` | App background (warm paper white, not stark white) |
| `--bg-surface` | `#FFFFFF` | Cards, panels, modals |
| `--bg-surface-muted` | `#EEECE5` | Table row alternates, subtle section backgrounds |
| `--ink-primary` | `#1B2430` | Primary text (deep ink navy, not pure black) |
| `--ink-secondary` | `#5B6472` | Secondary text, labels, metadata |
| `--ink-faint` | `#9AA1AC` | Placeholder text, disabled states |
| `--border-hairline` | `#D9D6CC` | Card borders, table dividers |
| `--accent-primary` | `#1F5C4C` | Deep emerald — primary actions, links, active nav (trust/legal/finance association, deliberately NOT blue-purple SaaS default) |
| `--accent-primary-hover` | `#173F35` | Hover state for primary accent |

### Workflow Stage Colors (the Stage Rail — signature system)
| Stage | Hex | Meaning |
|---|---|---|
| Draft | `#9AA1AC` | Neutral gray — not yet in motion |
| Internal Review | `#7C8BC4` | Slate blue |
| Legal Review | `#8A5FBF` | Violet |
| Finance Approval | `#C68A2E` | Amber/gold |
| Executive Approval | `#B5543A` | Rust/clay |
| Pending Signature | `#1F5C4C` | Emerald (matches primary accent — "almost done") |
| Published | `#2E7D4F` | Confident green |
| Archived | `#5B6472` | Muted ink-secondary |
| Rejected | `#B3261E` | Red — reserved ONLY for rejected/error states, never decorative |

> These stage colors are used consistently across the Stage Rail, status badges, calendar entries, and dashboard charts. Never reuse a stage color for an unrelated UI purpose (e.g., don't use the amber Finance Approval color for a generic "warning" toast — use a separate semantic warning token if needed).

### Dark Mode (secondary — implement if time allows in Phase 6)
| Token | Hex |
|---|---|
| `--bg-canvas` | `#14181D` |
| `--bg-surface` | `#1C2128` |
| `--ink-primary` | `#EDEBE4` |
| `--accent-primary` | `#3E9C82` |

---

## 3. Typography

- **Display / Headings face:** `"Fraunces"` (variable serif, use weight 500–600 for headings) — gives the "ledger/legal document" gravitas without going full formal-serif-everywhere. Use ONLY for page titles and section headers (H1/H2), sparingly.
- **UI / Body face:** `"Inter"` — for all body text, labels, table content, forms, buttons. Chosen for its excellent legibility at small sizes (dense data tables) over more decorative sans options.
- **Monospace / Data face:** `"IBM Plex Mono"` — for contract IDs, timestamps in audit logs, version numbers, signature hashes. Reinforces the "auditable record" feeling.

### Type Scale
| Role | Font | Size | Weight |
|---|---|---|---|
| Page Title (H1) | Fraunces | 28px | 600 |
| Section Header (H2) | Fraunces | 20px | 600 |
| Card Title (H3) | Inter | 16px | 600 |
| Body | Inter | 14px | 400 |
| Label / Caption | Inter | 12px | 500 (uppercase, letter-spacing 0.03em) |
| Data / Mono | IBM Plex Mono | 13px | 400 |

Do not use more than these two families (Fraunces + Inter) plus the mono face. Do not introduce a third decorative font.

---

## 4. Layout Patterns

- **App Shell:** Fixed left sidebar (240px, `--bg-surface`, hairline right border) with org switcher at top, nav items grouped by module (Contracts, Workflow/Approvals, Compliance, Obligations, Settings). Top bar holds search, notification bell, user menu — keep it thin (56px), no wasted vertical space.
- **List Views (Contract Repository, Approval Inbox):** Dense table layout, NOT card-grid — this is enterprise data, users need to scan many rows fast. Each row shows: Stage Rail color dot + label, Title, Type, Owner, Last Updated, primary action. Row height ~48px, hover state = `--bg-surface-muted`.
- **Detail Views (Contract Detail):** Two-column layout — left column (roughly 70%) holds the document content/rich text; right column (30%, sticky) holds metadata panel: current stage (Stage Rail vertical), parties, signatories status, obligations, version history link. This mirrors how legal professionals actually work — document + context panel side by side.
- **Dashboard (Compliance Dashboard):** Grid of distinct widget cards, NOT one giant chart. Top row = 3–4 KPI number cards (Expiring Contracts, Pending Approvals, Compliance Violations, Active Contracts). Below: Renewal Calendar (left, larger) + Risk Category breakdown (right, smaller donut/bar).
- **Forms/Modals:** Right-side slide-over drawer for quick actions (approve/reject, add obligation) rather than center modals — keeps context of the underlying list/document visible. Reserve center modals for destructive confirmations only.
- **Spacing scale:** 4px base unit — 4, 8, 12, 16, 24, 32, 48, 64. Be consistent; don't invent arbitrary padding values.
- **Border radius:** Small and consistent — `6px` for buttons/inputs, `10px` for cards. Not fully rounded (avoid the "bubbly SaaS" look), not zero-radius (avoid the harsh broadsheet look).

---

## 5. Components

- **Stage Rail component:** Reused everywhere — a horizontal stepper on the Contract Detail page (all stages shown, current one filled + labeled, future ones outlined, past ones checked), and a small color-dot + label badge in list rows.
- **Buttons:** Primary (`--accent-primary` fill, white text), Secondary (outline, `--ink-primary` text), Destructive (red outline, only for reject/delete). No gradient buttons, no drop-shadow-heavy buttons.
- **Badges:** Pill-shaped, small, using stage colors at 15% opacity as background + full color text.
- **Tables:** Hairline row dividers (`--border-hairline`), no heavy zebra striping — use the muted background only on hover, not by default, to keep it calm for long reading sessions.
- **Rich Text Editor (Contract Builder):** Editor surface should look like a document — white surface, generous margins (like a real page, ~72px side padding on desktop), Inter body font at 15px/1.6 line-height. Toolbar is a slim, sticky top bar with icon-only buttons + tooltips, not a bulky ribbon.
- **Notification Bell:** Badge count in `--accent-primary`, dropdown panel grouped by "Today" / "Earlier," each item shows stage-color dot matching the related contract's current stage.
- **Empty States:** Every list/dashboard widget needs a deliberate empty state — plain-language explanation + one clear action (e.g., Contract Repository empty: "No contracts yet. Create your first contract from a template." + button). No generic "No data found."
- **Loading States:** Skeleton loaders matching the shape of the content (table row skeletons for lists, block skeleton for the document editor) — not spinners for anything that takes longer than ~500ms.

---

## 6. Motion (Framer Motion / `motion` package)

Use motion deliberately, not decoratively — this is a serious enterprise tool, animation should communicate state change, not entertain.

- **Stage Rail transition:** When a contract advances a stage, animate the fill/checkmark on the Stage Rail with a short (200ms) ease — this is the one moment worth making feel satisfying, since it's the core "progress" moment of the whole product.
- **Approval action feedback:** On Approve/Reject, a brief (150ms) success pulse on the action card before it leaves the Approval Inbox list — confirms the action registered.
- **Drawer/panel transitions:** Slide-over drawers slide in from the right, 200–250ms ease-out. Modals fade+scale slightly (0.98 → 1), 150ms.
- **Do NOT:** animate every card on hover, add page-load "reveal" animations to dashboard KPI numbers, or add bouncy/spring physics anywhere — it undercuts the trustworthy, precise tone. Respect `prefers-reduced-motion`.

---

## 7. Voice & Microcopy

- Buttons name the exact action and result: "Send for Review," not "Submit." "Sign Contract," not "Confirm."
- Status labels are plain: "Pending Your Approval," not "Awaiting Action Item."
- Errors state what happened and what to do: "This contract has already been signed by all parties. No further signatures can be added." — not "Something went wrong."
- Empty states invite action, not apologize: "No obligations tracked yet. Add a deliverable or payment milestone to start tracking."

---

## 8. Accessibility Baseline

- All interactive elements have visible keyboard focus rings (`--accent-primary`, 2px offset outline).
- Color is never the only signal — Stage Rail always pairs color with a text label, never a bare colored dot alone in a context where meaning matters.
- Minimum contrast: body text on canvas/surface must meet WCAG AA (4.5:1).
- All modals/drawers trap focus and are dismissible via `Esc`.
