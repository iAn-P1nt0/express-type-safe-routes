# Publishing Guide

This document outlines the steps to publish `express-type-safe-routes` to npm.

## Pre-Publishing Checklist

✅ All tests pass (unit + type tests)
✅ Build succeeds without errors
✅ `package.json` configured with proper metadata
✅ LICENSE file present
✅ README.md comprehensive and up-to-date
✅ `.npmignore` excludes unnecessary files
✅ Version number updated appropriately

## Package Contents

The published package includes:
- `dist/` - Compiled JavaScript (CJS + ESM) and TypeScript declarations
- `README.md` - Package documentation
- `LICENSE` - MIT license
- `package.json` - Package metadata

Total size: ~10 KB (gzipped)

## Publishing Steps

### 1. Ensure You're Logged Into npm

```bash
npm login
```

Enter your npm credentials when prompted.

### 2. Verify Package Contents (Dry Run)

```bash
npm publish --dry-run --access public
```

This will show you:
- Files that will be included in the package
- Package size
- Any warnings or errors

Expected output should show approximately 9 files totaling ~56 KB unpacked.

### 3. Run Pre-Publish Tests

The `prepublishOnly` script will automatically run before publishing:

```bash
pnpm run build && pnpm test && pnpm test:types
```

This ensures:
- ✅ Build succeeds
- ✅ All unit tests pass
- ✅ All type tests pass

### 4. Publish to npm

```bash
npm publish --access public
```

For scoped packages (if you decide to use @username/express-type-safe-routes):
```bash
npm publish --access public
```

### 5. Verify Publication

After publishing:

```bash
# Check package on npm
npm view express-type-safe-routes

# Test installation
npm install express-type-safe-routes
```

## Version Management

Follow [Semantic Versioning](https://semver.org/):

- **Patch** (0.1.x): Bug fixes, no API changes
  ```bash
  npm version patch
  ```

- **Minor** (0.x.0): New features, backward compatible
  ```bash
  npm version minor
  ```

- **Major** (x.0.0): Breaking changes
  ```bash
  npm version major
  ```

Each `npm version` command will:
1. Update version in `package.json`
2. Create a git commit
3. Create a git tag

Then push and publish:
```bash
git push && git push --tags
npm publish --access public
```

## Post-Publishing

After publishing:

1. **Tag the release on GitHub**
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

2. **Create GitHub Release**
   - Go to: https://github.com/ipgthb/express-type-safe-routes/releases/new
   - Select the tag
   - Add release notes
   - Publish release

3. **Update README badges** (if needed)
   - npm version badge should auto-update
   - Add download stats: `[![npm downloads](https://img.shields.io/npm/dm/express-type-safe-routes.svg)](https://www.npmjs.com/package/express-type-safe-routes)`

4. **Announce** (optional)
   - Twitter/X
   - Reddit (r/typescript, r/node)
   - Dev.to
   - Your blog

## Troubleshooting

### "You do not have permission to publish"

Make sure you're logged in:
```bash
npm whoami
npm login
```

### "Package name too similar to existing package"

Choose a different name or scope it:
```bash
# Update package.json name to:
"name": "@yourusername/express-type-safe-routes"
```

### "Version already exists"

Increment the version:
```bash
npm version patch
```

### Build fails during prepublishOnly

Fix the errors before publishing:
```bash
pnpm build
pnpm test
pnpm test:types
```

## Rollback a Published Version

If you need to unpublish (within 72 hours):

```bash
npm unpublish express-type-safe-routes@0.1.0
```

**Warning**: Unpublishing is discouraged. Consider publishing a patch version instead.

## CI/CD Publishing (GitHub Actions)

For automated publishing on release, create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test
      - run: pnpm test:types
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Add `NPM_TOKEN` to GitHub Secrets:
1. Generate token at https://www.npmjs.com/settings/USERNAME/tokens
2. Add to GitHub: Settings → Secrets → Actions → New repository secret

## Resources

- [npm Documentation](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [npm package.json fields](https://docs.npmjs.com/cli/v9/configuring-npm/package-json)
