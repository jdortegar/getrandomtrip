describe('Reveal Destination Page', () => {
  beforeEach(() => {
    cy.visit('/reveal-destination?bookingId=bk_123');
  });

  it('should display loading skeleton initially and then hide it', () => {
    cy.get('.animate-pulse').should('be.visible');
    cy.get('.animate-pulse', { timeout: 2000 }).should('not.exist');
    cy.get('h1').should('contain', 'Preparing Your Reveal...');
  });

  it('should display countdown initially', () => {
    cy.get('[data-testid="reveal-title"]').should('exist');
    cy.get('[data-testid="reveal-countdown"]').should('be.visible');
  });

  it('should reveal destination after countdown', () => {
    cy.clock();
    cy.intercept("GET", "**/bookings/**/reveal", { fixture: "reveal.success.json" }).as("reveal");
    cy.visit("/reveal-destination?bookingId=bk_123"); // Assuming a bookingId is needed
    cy.get('[data-testid="reveal-countdown"]').should("exist");
    cy.tick(48 * 60 * 60 * 1000); // Adjust based on actual UI logic
    cy.wait("@reveal");
    cy.get('[data-testid="reveal-title"]').should('contain', 'Your Destination Revealed!');
    cy.get('[data-testid="reveal-destination"]').should('contain', 'Barcelona');
  });

  it('should display error message on failed destination fetch', () => {
    cy.clock();
    cy.intercept('GET', '**/bookings/**/reveal', {
      statusCode: 500,
      body: { success: false, message: 'Failed to fetch destination.' },
    }).as('revealRequest');

    cy.visit("/reveal-destination?bookingId=bk_123");
    cy.tick(48 * 60 * 60 * 1000); // Advance time to trigger reveal
    cy.wait('@revealRequest');
    cy.get('h1').should('contain', 'Error!');
    cy.contains('p', 'Failed to fetch destination.').should('be.visible');
  });

  it('should display network error message on network failure during destination fetch', () => {
    cy.clock();
    cy.intercept('GET', '**/bookings/**/reveal', {
      forceNetworkError: true,
    }).as('revealRequest');

    cy.visit("/reveal-destination?bookingId=bk_123");
    cy.tick(48 * 60 * 60 * 1000); // Advance time to trigger reveal
    cy.wait('@revealRequest');
    cy.get('h1').should('contain', 'Error!');
    cy.contains('p', 'Network error or server issue.').should('be.visible');
  });
});