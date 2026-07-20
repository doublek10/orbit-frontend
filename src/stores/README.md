Reserved for client-side state that needs to persist across route changes
beyond what React Context handles (e.g. a Zustand store for in-progress
multi-step forms). Empty until a page actually needs it - don't add global
state stores speculatively.
