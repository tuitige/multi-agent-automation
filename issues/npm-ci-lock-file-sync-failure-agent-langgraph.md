### Title: npm ci lock file sync failure in agent-langgraph Docker build

**Body:**
The Docker build for `services/agent-langgraph` fails during the `npm ci --only=production` step because the service directory lacks a `package-lock.json` file. This prevents successful container builds and deployment in the CI/CD pipeline.

**Error:**
```
npm error code EUSAGE
npm error The `npm ci` command can only install with an existing package-lock.json or
npm error npm-shrinkwrap.json with lockfileVersion >= 1. Run an install with npm@5 or
npm error later to generate a package-lock.json file, then try again.
```

**Root Cause:**
- The `services/agent-langgraph/` directory contains only `package.json` but no `package-lock.json`
- The Dockerfile uses `npm ci --only=production` which requires a lock file to be present
- The CI workflow attempts to copy the root `package-lock.json` but this may have synchronization issues

**Impact:**
- Docker builds fail in CI/CD pipeline for agent-langgraph service
- Cannot deploy agent-langgraph service to production
- Local Docker development requires manual intervention

**Reproduction:**
```bash
cd services/agent-langgraph
docker build -t test-agent-langgraph .
# Fails at RUN npm ci --only=production step
```

**Acceptance Criteria:**
- Docker build succeeds for `services/agent-langgraph` without manual intervention
- CI/CD pipeline completes successfully through Docker build step for agent-langgraph
- Lock file dependencies remain consistent and maintainable
- Solution doesn't break existing `mcp-server` Docker builds

**Files Involved:**
- `services/agent-langgraph/Dockerfile` (line 9: `RUN npm ci --only=production`)
- `services/agent-langgraph/package.json` (exists)
- `services/agent-langgraph/package-lock.json` (missing)
- `.github/workflows/ci-cd.yml` (lines 64-66: current workaround)

This issue is assignable to Coding Agent.