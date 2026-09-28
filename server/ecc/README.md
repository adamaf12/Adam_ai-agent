# Adam ECC Agent Harness

This module adapts the useful engineering ideas from ECC to Adam's existing architecture.

It is intentionally not a copy of the ECC repository. Adam keeps its own model gateway,
agent registry, memory, security, tools and deployment architecture while adopting:

- skill-based routing
- explicit agent roles
- context budgeting
- bounded recovery
- deterministic verification
- tool-evidence discipline
- architecture/security/regression review phases
- continuous improvement without blindly persisting model output

ECC is the source of the design inspiration; this implementation is native to Adam.
