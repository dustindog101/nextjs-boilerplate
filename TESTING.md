# Testing Strategy

Comprehensive testing for ID Pirate, following best practices from the top
testing skills on [skills.sh](https://www.skills.sh) and
[qaskills.sh](https://qaskills.sh):

1. **Playwright E2E** (#1 skill — 86 installs, 92/100 quality)
2. **Vitest unit testing** (#2 skill)
3. **pytest patterns** (#3 skill — for Lambda backend)

## Test pyramid

```
        ┌───────────┐
        │    E2E    │  ← Playwright (browser, slow, high confidence)
        │  ~10-20   │
        ├───────────┤
        │ Component │  ← Vitest + React Testing Library (jsdom, fast)
        │  ~30-50   │
        ├───────────┤
        │   Unit    │  ← Vitest (pure logic, instant)
        │  ~50-100  │
        ├───────────┤
        │  Lambda   │  ← pytest + moto (Python backend, mocked DynamoDB)
        │  ~20-30   │
        └───────────┘
```

## Commands

```bash
# All frontend tests (unit + component)
npm test

# Just unit tests (pricing, utils — node environment)
npm run test:unit

# Just component tests (React components — jsdom environment)
npm run test:components

# Watch mode (re-runs on file change)
npm run test:watch

# E2E tests (requires dev server running, or set PLAYWRIGHT_BASE_URL)
npm run test:e2e

# E2E with interactive UI
npm run test:e2e:ui

# Lambda backend tests (Python, mocked DynamoDB)
npm run test:lambda

# Type check (faster than build, catches type errors)
npm run typecheck

# Full build (catches SSR + import errors)
npm run build
```

## What lives where

| Directory | What | Runner |
|---|---|---|
| `tests/**/*.test.ts` | Pure-logic unit tests (pricing, utils) | Vitest (node) |
| `tests/components/**/*.test.tsx` | React component tests | Vitest (jsdom) + React Testing Library |
| `e2e/*.spec.ts` | Browser E2E tests | Playwright |
| `e2e/mobile.spec.ts` | Mobile-specific tests (Pixel 7 viewport) | Playwright (mobile-chrome project) |
| `integration/discounts/tests/` | Python Lambda tests | pytest + moto |

## Best practices (from skills.sh research)

### Vitest unit tests
- **One concept per test** — don't test 5 things in one `it()` block
- **Arrange-Act-Assert** — structure every test with clear sections
- **No shared state** — each test sets up its own data; use `beforeEach` not `beforeAll`
- **Test behavior, not implementation** — don't assert on private variables
- **Name tests as sentences** — `it('returns 20% off for 4+ IDs')` not `it('test1')`

### React component tests (Testing Library)
- **Query by role first**: `screen.getByRole('button', { name: 'Submit' })`
- **Then by label**: `screen.getByLabelText('Email')`
- **Then by text**: `screen.getByText('Welcome')`
- **Last resort**: `screen.getByTestId('submit-btn')`
- **Never** use `container.querySelector('.btn')` — too fragile
- **Use `userEvent` not `fireEvent`**: `await user.click(button)` (simulates real browser behavior)
- **Await async**: `await screen.findByText('Saved')` (auto-retries) not `screen.getByText('Saved')`

### Playwright E2E
- **Web-first assertions**: `await expect(locator).toBeVisible()` (auto-retries)
- **No hard waits**: `page.waitForTimeout(3000)` is flaky; use `expect().toBeVisible()`
- **Role-based selectors**: `page.getByRole('button', { name: 'Submit' })`
- **Independent tests**: no shared state; each test sets up + tears down its own data
- **Page Object Model**: for any project with >3 tests (see `e2e/pages/`)

### pytest (Lambda backend)
- **moto for DynamoDB mocking**: `@mock_aws` decorator — never hit real AWS in tests
- **Fixture isolation**: each test creates its own tables in `beforeEach`
- **Test the handler, not just the function**: call `lambda_handler(event, None)` end-to-end
- **Test error paths**: 400, 403, 404, 500 — not just the happy path
- **Regression tests**: when a bug is found, write a test that would have caught it

## CI integration

The `.github/workflows/ci.yml` workflow runs:
1. `npm ci` — install deps
2. `npm run typecheck` — TypeScript type check
3. `npm test` — vitest unit + component tests
4. `npm run build` — Next.js production build

E2E tests (`npm run test:e2e`) are NOT in CI yet because they need a running
dev server + browser binaries. Add them to CI once the test count justifies
the extra CI minutes.

## Coverage goals

| Layer | Current | Goal |
|---|---|---|
| `lib/pricing.ts` | 100% of functions | Maintain |
| `lib/productCatalog.ts` | 0% | 80%+ |
| `lib/apiClient.ts` | 0% | 60%+ (harder — needs fetch mocking) |
| Admin components | 0% | 40%+ (focus on DiscountsSection, OrdersSection) |
| Lambda discount logic | 100% of scope paths | Maintain |
| E2E critical paths | 0% | Home, Track, Order, Account, Admin login |

## Adding a new test

### Unit test (pure logic)
```bash
# 1. Create the test file
touch tests/myutil.test.ts

# 2. Write the test
cat > tests/myutil.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';
import { myFunction } from '../lib/myutil';

describe('myFunction', () => {
    it('does the right thing', () => {
        expect(myFunction(1, 2)).toBe(3);
    });
});
EOF

# 3. Run it
npm run test:unit
```

### Component test (React)
```bash
# 1. Create the test file
touch tests/components/MyComponent.test.tsx

# 2. Write the test
cat > tests/components/MyComponent.test.tsx << 'EOF'
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyComponent } from '@/app/components/MyComponent';

describe('MyComponent', () => {
    it('renders the title', () => {
        render(<MyComponent title="Hello" />);
        expect(screen.getByRole('heading', { name: 'Hello' })).toBeInTheDocument();
    });
});
EOF

# 3. Run it
npm run test:components
```

### E2E test (browser)
```bash
# 1. Create the test file
touch e2e/myflow.spec.ts

# 2. Write the test
cat > e2e/myflow.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test('my flow works', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
EOF

# 3. Run it (requires dev server)
npm run test:e2e
```
