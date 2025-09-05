### Issue: npm ci Failure

The build is failing due to an out-of-sync `package.json` and `package-lock.json` in the `services/agent-langgraph` directory.

### Solution
To resolve this issue, run the following command in the `services/agent-langgraph` directory:

```
npm install
```

This will update the `package-lock.json` file. Make sure to commit the updated `package-lock.json` to prevent future build failures.