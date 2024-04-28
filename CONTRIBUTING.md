# Contributing

1. Clone the repository
   `git clone https://github.com/solidjs/solid-start.git`
2. Install dependencies
   `pnpm install`
3. Build dependencies
   `pnpm run build:all`
4. Run an example
   `pnpm --filter example-hackernews run dev`
5. Make changes and check if things work in examples
6. Add integration tests in `test`, if appropriate
7. Run tests locally
   - Setup playwright: `pnpm run install:playwright`
   - Run all tests: `pnpm run test:all`
   - Show report: `pnpm run show:test-report`

## Requirements

1. Node.js: ^20
