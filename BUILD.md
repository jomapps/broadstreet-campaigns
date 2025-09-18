# Build Instructions

## Memory Issue with Next.js Build

This project requires additional memory allocation for the Next.js build process due to:
- 48 routes (12 static pages + 36 API endpoints)
- Complex TypeScript compilation
- Tailwind CSS processing
- Bundle optimization

### Default Build (May Hang)
```bash
pnpm build
```
The default build may hang at "Creating an optimized production build..." due to Node.js memory limitations.

### Recommended Build (With Memory Allocation)
```bash
pnpm run build:memory
```
This allocates 4GB of memory to Node.js, allowing the build to complete successfully.

### Manual Build (Alternative)
```bash
# Windows
set NODE_OPTIONS=--max-old-space-size=4096 && npx next build

# Linux/macOS
NODE_OPTIONS="--max-old-space-size=4096" npx next build
```

## Why This Limitation Exists

Node.js has a default memory limit of ~1.4GB on 64-bit systems, which is often insufficient for:
- Large Next.js applications
- Complex TypeScript compilation
- Modern build tooling

The 4GB allocation (4096MB) provides sufficient headroom for the build process while remaining reasonable for most development and CI environments.

## CI/CD Considerations

Ensure your CI/CD environment has at least 4GB of available memory and uses the `build:memory` script for reliable builds.
