# Release Checklist for express-type-safe-routes

Use this checklist before publishing to npm.

## Pre-Release

### Code Quality
- [ ] All tests pass: `pnpm test`
- [ ] Type tests pass: `pnpm test:types`
- [ ] Build succeeds: `pnpm build`
- [ ] No TypeScript errors: `pnpm typecheck`
- [ ] Code is linted (if linter configured)

### Documentation
- [ ] README.md is up-to-date
- [ ] CHANGELOG.md updated with new version changes (if exists)
- [ ] Examples work with current code
- [ ] API documentation reflects all changes
- [ ] Breaking changes clearly documented

### Package Configuration
- [ ] Version number updated in `package.json`
- [ ] `package.json` metadata is correct:
  - [ ] Name
  - [ ] Description
  - [ ] Keywords
  - [ ] Repository URL
  - [ ] Homepage
  - [ ] Author
  - [ ] License
- [ ] Dependencies are up-to-date
- [ ] Peer dependencies are correct
- [ ] `files` field includes all necessary files
- [ ] `exports` field configured correctly

### Files
- [ ] LICENSE file present and correct year
- [ ] .npmignore excludes source files, tests, examples
- [ ] dist/ folder contains build output
- [ ] No sensitive files in package (check with `npm pack`)

## Testing the Package

### Local Testing
```bash
# Create tarball
npm pack

# Install in test project
cd /tmp
mkdir test-package && cd test-package
npm init -y
npm install /path/to/express-type-safe-routes-0.1.0.tgz

# Test imports
node -e "const pkg = require('express-type-safe-routes'); console.log(pkg)"
```

### Dry Run
```bash
npm publish --dry-run --access public
```

Check:
- [ ] Package size is reasonable (~10 KB)
- [ ] File count is correct (~9 files)
- [ ] No warnings about missing files
- [ ] No errors

## Publishing

### npm Account
- [ ] Logged into npm: `npm whoami`
- [ ] Have publish permissions
- [ ] Two-factor authentication enabled (recommended)

### Version Tagging
```bash
# For v0.1.0
git tag v0.1.0
git push origin v0.1.0
```

### Publish
```bash
npm publish --access public
```

## Post-Release

### Verification
- [ ] Package appears on npm: https://www.npmjs.com/package/express-type-safe-routes
- [ ] Installation works: `npm install express-type-safe-routes`
- [ ] Import works in test project
- [ ] TypeScript types are available

### GitHub
- [ ] Create GitHub Release for the tag
- [ ] Include release notes
- [ ] Link to npm package

### Communication
- [ ] Update project homepage (if any)
- [ ] Announce on social media (optional)
- [ ] Post on relevant forums (optional)

## Rollback Plan

If something goes wrong:

1. **Within 72 hours**: Can unpublish
   ```bash
   npm unpublish express-type-safe-routes@0.1.0
   ```

2. **After 72 hours**: Publish a patch version
   ```bash
   npm version patch
   npm publish --access public
   ```

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 0.1.0 | YYYY-MM-DD | Initial release |

## Notes

- Always test the package locally before publishing
- Use semantic versioning
- Document breaking changes
- Keep CHANGELOG.md updated
- Tag releases in git
