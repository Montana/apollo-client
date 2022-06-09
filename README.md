# Appollo Client w/ React

This simple component I made rehydrates, sometimes known as rehydrating the client-side cache. Although the server-side cache's state is available in `__APOLLO_STATE__,` it isn't yet available in the client-side cache. `InMemoryCache` provides a helpful restore function for rehydrating its state with data extracted from another cache instance.
