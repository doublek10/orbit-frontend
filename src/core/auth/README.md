Empty on purpose. The Frontend has no direct integration with any
identity provider - Supabase is called exclusively by the Kernel. This
directory is reserved in case a future requirement (e.g. client-side
OAuth redirect handling that must happen in the browser) needs it.
