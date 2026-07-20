Reserved for the WebSocket client the frontend will open for live updates
(e.g. workflow status, replay progress). Per the architecture, this still
connects through infrastructure the Gateway controls (e.g. a signed,
short-lived WS ticket issued via gateway.ts) - it does not open a socket
directly to the Kernel. Not implemented yet.
