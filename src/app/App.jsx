// ====================================================================
// App — Root Application Component
//
// Purpose:
// The top-level component rendered by main.jsx. Its sole responsibility
// is to compose the global provider tree with the router so that every
// route has access to auth, theme, and toast contexts.
//
// Keeping this component thin (just <Providers><AppRouter /></Providers>)
// separates concerns: providers.jsx owns context wiring, router.jsx owns
// route declarations, and this file just connects them.
// ====================================================================

import Providers from './providers'
import AppRouter from './router'

export default function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  )
}
