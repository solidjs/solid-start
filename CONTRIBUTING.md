# Contributing

1. Clone the repository
   `git clone https://github.com/solidjs/solid-start.git`
2. Install dependencies
   `pnpm install`
3. Run an example
   `pnpm --filter example-hackernews run dev`
4. Make changes and check if things work in examples
5. Add integration tests in `test`, if appropriate
6. Run tests locally
   - Setup playwright: `pnpm --filter solid-start-tests install:playwright`
   - Run all tests: `pnpm run test:all`

## Requirements

1. Node.js: ^16.13.0
