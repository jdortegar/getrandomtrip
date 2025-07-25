describe('Post-Purchase Page', () => {
  beforeEach(() => {
    cy.visit('/post-purchase');
  });

  it('should display loading skeleton initially and then hide it', () => {
    cy.get('.animate-pulse').should('be.visible');
    cy.get('.animate-pulse', { timeout: 2000 }).should('not.exist');
    cy.get('h1').should('contain', 'Thank You for Your Purchase!');
  });

  it('should display booking confirmation on successful fetch', () => {
    cy.intercept('POST', '/api/post-purchase', {
      statusCode: 200,
      body: { success: true, message: 'Booking confirmed!' },
    }).as('postPurchaseRequest');

    cy.wait('@postPurchaseRequest');
    cy.get('h1').should('contain', 'Thank You for Your Purchase!');
    cy.contains('p', 'Your Randomtrip adventure is confirmed.').should('be.visible');
    cy.contains('strong', 'Status:').parent().should('contain', 'Booking confirmed!');
    cy.contains('button', 'Reveal My Destination!').should('be.visible');
  });

  it('should display error message on failed fetch', () => {
    cy.intercept('POST', '/api/post-purchase', {
      statusCode: 500,
      body: { success: false, message: 'Failed to fetch booking confirmation.' },
    }).as('postPurchaseRequest');

    cy.wait('@postPurchaseRequest');
    cy.get('h1').should('contain', 'Error!');
    cy.contains('p', 'Failed to fetch booking confirmation.').should('be.visible');
  });

  it('should display network error message on network failure', () => {
    cy.intercept('POST', '/api/post-purchase', {
      forceNetworkError: true,
    }).as('postPurchaseRequest');

    cy.wait('@postPurchaseRequest');
    cy.get('h1').should('contain', 'Error!');
    cy.contains('p', 'Network error or server issue.').should('be.visible');
  });
});
