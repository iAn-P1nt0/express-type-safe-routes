# Quick Publish Guide

## TL;DR - Publish in 3 Steps

### 1. Verify Everything is Ready
```bash
./scripts/verify-package.sh
```

This will:
- ✅ Build the package
- ✅ Run all tests
- ✅ Check required files
- ✅ Verify package.json
- ✅ Show what will be published

### 2. Login to npm (if not already)
```bash
npm login
```

### 3. Publish
```bash
npm publish --access public
```

---

## First Time Publishing?

Make sure you have:
1. An npm account: https://www.npmjs.com/signup
2. Email verified on npm
3. Two-factor authentication enabled (recommended)

---

## Publishing a New Version

### Patch Release (Bug fixes: 0.1.0 → 0.1.1)
```bash
npm version patch
git push && git push --tags
npm publish --access public
```

### Minor Release (New features: 0.1.0 → 0.2.0)
```bash
npm version minor
git push && git push --tags
npm publish --access public
```

### Major Release (Breaking changes: 0.1.0 → 1.0.0)
```bash
npm version major
git push && git push --tags
npm publish --access public
```

---

## Verify Publication

After publishing, check:

```bash
# View on npm
npm view express-type-safe-routes

# Test installation
mkdir /tmp/test-install && cd /tmp/test-install
npm init -y
npm install express-type-safe-routes

# Test import
node -e "console.log(require('express-type-safe-routes'))"
```

---

## Troubleshooting

### "You must verify your email"
Go to https://www.npmjs.com/settings/profile and verify your email.

### "You do not have permission to publish"
Make sure you're logged in:
```bash
npm whoami
npm login
```

### "Version already exists"
Increment version:
```bash
npm version patch
```

### Tests fail during prepublishOnly
Fix the errors first:
```bash
pnpm build
pnpm test
pnpm test:types
```

---

## What Gets Published?

Only these files (see package.json `files` field):
- `dist/` - Compiled code and type definitions
- `README.md` - Documentation
- `LICENSE` - MIT license
- `package.json` - Package metadata

**Not included:** src/, test/, examples/, config files

---

## Need More Details?

See [PUBLISHING.md](./PUBLISHING.md) for comprehensive guide.
