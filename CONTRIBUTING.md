# Contributing to NextWiki

We welcome contributions! Here's how to get started:

## Development Setup

1. Fork the repository
2. Clone your fork:

   ```bash
   git clone https://github.com/barisgit/nextwiki.git
   ```

3. Install dependencies:

   ```bash
   pnpm install
   ```

4. Set up database (see [README.md](./README.md#installation))

5. Start development server:

   ```bash
   pnpm run dev
   ```

### Problems with tailwind during development

If you encounter problems with tailwind during development, try the following:

```bash
rm -rf node_modules/ .next/
rm -f pnpm-lock.yaml
pnpm install
pnpm run dev
```

## Reporting Issues

- Use the [GitHub Issues](https://github.com/barisgit/nextwiki/issues) tracker
- Include:
  - Steps to reproduce
  - Expected vs actual behavior
  - Environment details (OS, Node version, etc)

## Pull Requests

1. Create a new branch from `development`. Follow the branch naming convention: `feature/feature-name` or `hotfix/bug-name`
2. Keep changes focused - one feature/bugfix per PR
3. Update documentation if needed
4. Run tests (when available) and ensure linting passes:

   ```bash
   pnpm run lint
   ```

5. Ensure that build passed and everything is working:

   ```bash
   pnpm run build
   # and then
   pnpm start
   ```

6. Push your branch and open a PR

## Code Style

- Follow existing TypeScript patterns
- Use Prettier formatting
- Add comments for complex logic
- Always use tailwind classes over custom CSS
- Use consistent naming conventions
- Always include types

## Need Help?

Open a discussion in GitHub Issues or reach out to maintainers.

Even if you're not coding, you can contribute by:

- Improving documentation
- Testing and reporting bugs
- Sharing feedback
- Spreading the word!
