# Spec: Fay Scenic Guide User Prototype

## Objective

Build a runnable mobile-first user prototype for the China Software Cup 2026 A5 scenic guide AI digital human client.

The prototype should replace the unibest template surface with a tourist-facing Fay guide experience: a guide home page, a service capability page, and a visitor profile page. It should communicate how Fay supports scenic Q&A, route planning, voice guidance, digital-human broadcasting, ticket/service context, and later integration with the main Fay runtime.

## Tech Stack

- uni-app
- Vue 3
- TypeScript
- Vite
- UnoCSS utility classes plus scoped SCSS
- pnpm

## Commands

```bash
pnpm dev:h5 --host 127.0.0.1
pnpm type-check
pnpm build:h5
pnpm lint
```

## Project Structure

```text
src/pages/index/index.vue  Guide home and primary tourist task surface
src/pages/about/about.vue  Service capability and integration story
src/pages/me/me.vue        Visitor profile, itinerary, tickets, preferences
src/tabbar/config.ts       Bottom navigation labels and icons
env/.env                   App title, H5 port, backend placeholders
docs/                      Lightweight product and implementation specs
```

## Code Style

Keep page-specific prototype data local to the page unless it is reused by multiple pages.

```ts
interface ActionCard {
  title: string
  desc: string
  icon: string
}

const actionCards: ActionCard[] = [
  { title: 'Ask Fay', desc: 'Get scenic answers from the guide knowledge base.', icon: 'i-carbon-chat' },
]
```

Prefer typed arrays, short computed-free templates, scoped SCSS for visual polish, and existing project conventions. Do not add new dependencies for this prototype.

## Testing Strategy

- Type safety: `pnpm type-check`
- Production build: `pnpm build:h5`
- Runtime smoke test: start `pnpm dev:h5 --host 127.0.0.1`, open H5 page, verify no blank screen and the three tab surfaces render.
- Lint if time allows after build-critical verification.

## Boundaries

- Always: keep the app runnable, preserve uni-app multi-platform compatibility, avoid new dependencies, keep edits small and page-focused.
- Ask first: backend contract changes, real payment/ticketing logic, login policy changes, new packages, destructive git operations.
- Never: commit secrets, hardcode real user data, remove generated/build configuration without proof, replace the project with a separate demo app.

## Success Criteria

- H5 dev server starts successfully from this repository.
- Home page presents Fay as a scenic digital-human guide, not the unibest template.
- Service page explains route, Q&A, voice, broadcast, knowledge-base, and operations capabilities.
- Visitor page shows profile, itinerary, ticket/service status, preferences, and guide history placeholders.
- Bottom tab labels match the user-facing scenic guide product.
- `pnpm build:h5` succeeds.

## Open Questions

- Exact scenic area name and visual identity are not finalized in the repo. This prototype uses a generic "Lingshan scenic area" demo context based on prior project materials and can be renamed later.
- Real Fay backend endpoints are not wired in this pass.
