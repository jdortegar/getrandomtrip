describe('Reveal Destination Page', () => {
  beforeEach(() => {
    cy.visit('/reveal-destination');
  });

  it('should display loading skeleton initially and then hide it', () => {
    cy.get('.animate-pulse').should('be.visible');
    cy.get('.animate-pulse', { timeout: 2000 }).should('not.exist');
    cy.get('h1').should('contain', 'Your Adventure Awaits!');
  });

  it('should display countdown initially', () => {
    cy.get('h1').should('contain', 'Your Adventure Awaits!');
    cy.contains('p', 'Your destination will be revealed in:').should('be.visible');
    cy.get('.text-6xl').should('be.visible'); // Checks for the countdown timer display
  });

  it('should reveal destination after countdown', () => {
    // Wait for the simulated countdown to finish (10 seconds in mockRevealTime)
    cy.get('h1', { timeout: 12000 }).should('contain', 'Your Destination Revealed!');
    cy.contains('h2', 'Kyoto, Japan').should('be.visible');
    cy.contains('h3', 'About Your Trip:').should('be.visible');
    cy.contains('h3', 'Your Itinerary:').should('be.visible');
    cy.contains('button', 'Share Your Experience').should('be.visible');
    cy.contains('button', 'Book Another Trip').should('be.visible');
  });

  it('should display error message on failed destination fetch', () => {
    cy.intercept('POST', '/api/reveal', {
      statusCode: 500,
      body: { success: false, message: 'Failed to fetch destination.' },
    }).as('revealRequest');

    // Wait for the simulated countdown to finish and API call to be made
    cy.get('h1', { timeout: 12000 }).should('contain', 'Error!');
    cy.contains('p', 'Failed to fetch destination.').should('be.visible');
  });

  it('should display network error message on network failure during destination fetch', () => {
    cy.intercept('POST', '/api/reveal', {
      forceNetworkError: true,
    }).as('revealRequest');

    // Wait for the simulated countdown to finish and API call to be made
    cy.get('h1', { timeout: 12000 }).should('contain', 'Error!');
    cy.contains('p', 'Network error or server issue.').should('be.visible');
  });
});
