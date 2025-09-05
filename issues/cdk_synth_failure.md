**Error:**
CDK synth fails with the following error:

```
Error: Don't know default protocol for port: 3000; please supply a protocol
```

**Cause:**
The AWS CDK cannot infer the default protocol for port 3000 when defining a load balancer, listener, or target group. The protocol must be explicitly supplied for non-standard ports.

**Proposed Fix:**
- Locate where port 3000 is used in the CDK stack (see infra directory).
- Explicitly set the protocol (e.g., `elbv2.ApplicationProtocol.HTTP`) anywhere port 3000 is referenced for a listener or target group.

**Example Solution:**
```ts
listener.addTargets('App', {
  port: 3000,
  protocol: elbv2.ApplicationProtocol.HTTP,
  // ...other config
});
```

or

```ts
new elbv2.ApplicationTargetGroup(this, 'MyTargetGroup', {
  port: 3000,
  protocol: elbv2.ApplicationProtocol.HTTP,
  // ...other config
});
```

After this fix, re-run the workflow to ensure the error is resolved.

---
Link to failing job: https://github.com/tuitige/multi-agent-automation/actions/runs/17481410798/job/49652335201