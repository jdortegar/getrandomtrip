// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Log de todas las requests para ajustar intercepts más fácil
beforeEach(() => {
  cy.intercept('**', (req) => {
    // Sólo muestra fetch/xhr de tu app
    if (req.headers['x-cypress-request'] !== 'true' && !req.url.includes('__cypress')) {
      // Útil: ver en el runner qué está llamando el front
      // eslint-disable-next-line no-console
      console.log('[NET]', req.method, req.url);
    }
  });
});

// Import commands.js using ES2015 syntax:
import './commands'