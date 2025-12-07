#!/bin/bash
set -e

echo "🔍 Verifying package is ready for publishing..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

# 1. Check dependencies installed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Running pnpm install...${NC}"
    pnpm install
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# 2. Run build
echo "🔨 Building package..."
pnpm build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# 3. Run tests
echo "🧪 Running unit tests..."
pnpm test > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Unit tests passed${NC}"
else
    echo -e "${RED}❌ Unit tests failed${NC}"
    exit 1
fi
echo ""

# 4. Run type tests
echo "📝 Running type tests..."
pnpm test:types > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Type tests passed${NC}"
else
    echo -e "${RED}❌ Type tests failed${NC}"
    exit 1
fi
echo ""

# 5. Check required files
echo "📄 Checking required files..."
REQUIRED_FILES=("LICENSE" "README.md" ".npmignore" "dist/index.js" "dist/index.d.ts")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing required file: $file${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ All required files present${NC}"
echo ""

# 6. Check package.json fields
echo "🔍 Verifying package.json..."
REQUIRED_FIELDS=("name" "version" "description" "license" "repository" "author")
for field in "${REQUIRED_FIELDS[@]}"; do
    VALUE=$(node -p "require('./package.json').$field" 2>/dev/null)
    if [ -z "$VALUE" ] || [ "$VALUE" = "undefined" ]; then
        echo -e "${RED}❌ Missing package.json field: $field${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ package.json properly configured${NC}"
echo ""

# 7. Create and check tarball
echo "📦 Creating package tarball..."
npm pack > /dev/null 2>&1
TARBALL=$(ls express-type-safe-routes-*.tgz 2>/dev/null | head -n 1)
if [ -z "$TARBALL" ]; then
    echo -e "${RED}❌ Failed to create tarball${NC}"
    exit 1
fi

# Get package size
SIZE=$(du -h "$TARBALL" | cut -f1)
echo -e "${GREEN}✅ Package created: $TARBALL ($SIZE)${NC}"
echo ""

# 8. List tarball contents
echo "📋 Package contents:"
tar -tzf "$TARBALL" | sed 's/^/   /'
echo ""

# 9. Dry run publish
echo "🚀 Running publish dry-run..."
npm publish --dry-run --access public 2>&1 | grep -E "(notice|warn|error)" | sed 's/^/   /'
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Package verification complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ready to publish? Run:"
echo -e "${YELLOW}  npm publish --access public${NC}"
echo ""
echo "Or for dry-run:"
echo -e "${YELLOW}  npm publish --dry-run --access public${NC}"
echo ""

# Clean up tarball
rm -f "$TARBALL"
