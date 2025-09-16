describe('Post-Purchase Page', () => {
  beforeEach(() => {
    cy.visit('/post-purchase?bookingId=bk_123');
  });

  it('should display loading skeleton initially and then hide it', () => {
    cy.get('.animate-pulse').should('be.visible');
    cy.get('.animate-pulse', { timeout: 2000 }).should('not.exist');
    cy.get('h1').should('contain', 'Thank You for Your Purchase!');
  });

  it('should display booking confirmation on successful fetch', () => {
    cy.intercept('GET', '**/bookings/**', {
      statusCode: 200,
      fixture: "postpurchase.success.json",
    }).as('pp');

    cy.wait('@pp');
    cy.get('[data-testid="postpurchase-root"]').should('exist');
    cy.get('[data-testid="postpurchase-title"]').should('exist');
    cy.contains('button', 'Reveal My Destination!').should('be.visible');
  });

  it('should display error message on failed fetch', () => {
    cy.intercept('GET', '**/bookings/**', {
      statusCode: 500,
      body: { success: false, message: 'Failed to fetch booking confirmation.' },
    }).as('pp');

    cy.wait('@pp');
    cy.get('h1').should('contain', 'Error!');
    cy.contains('p', 'Failed to fetch booking confirmation.').should('be.visible');
  });

  it('should display network error message on network failure', () => {
    cy.intercept('GET', '**/bookings/**', {
      forceNetworkError: true,
    }).as('pp');

    cy.wait('@pp');
    cy.get('h1').should('contain', 'Error!');
    cy.contains('p', 'Network error or server issue.').should('be.visible');
  });
});