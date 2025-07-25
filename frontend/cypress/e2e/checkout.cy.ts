describe('Checkout Page', () => {
  beforeEach(() => {
    cy.visit('/checkout');
  });

  it('should display the main heading', () => {
    cy.get('h1').should('contain', 'Review Your Trip & Payment');
  });

  it('should display trip summary sections', () => {
    cy.contains('h2', 'Your Trip Details').should('be.visible');
    cy.contains('h3', 'Experience Level:').should('be.visible');
    cy.contains('h3', 'Basic Configuration:').should('be.visible');
    cy.contains('h3', 'Premium Filters:').should('be.visible');
    cy.contains('h3', 'Add-ons:').should('be.visible');
  });

  it('should display price breakdown', () => {
    cy.contains('h2', 'Price Breakdown').should('be.visible');
    cy.contains('p', 'Base Price:').should('be.visible');
    cy.contains('p', 'Premium Filters Cost:').should('be.visible');
    cy.contains('p', 'Add-ons Cost:').should('be.visible');
    cy.contains('p', 'Total Price:').should('be.visible');
  });

  it('should display payment section', () => {
    cy.contains('h2', 'Payment').should('be.visible');
    cy.contains('button', 'Pay Now').should('be.visible');
  });

  it('should show success toast and redirect on successful payment', () => {
    // Intercept the POST request to /api/checkout and mock a successful response
    cy.intercept('POST', '/api/checkout', {
      statusCode: 200,
      body: { success: true, message: 'Payment processed successfully.' },
    }).as('checkoutRequest');

    cy.contains('button', 'Pay Now').click();

    cy.wait('@checkoutRequest').then(() => {
      cy.contains('Payment successful! Redirecting...').should('be.visible');
      cy.url().should('include', '/post-purchase');
    });
  });

  it('should show error toast on failed payment', () => {
    // Intercept the POST request to /api/checkout and mock a failed response
    cy.intercept('POST', '/api/checkout', {
      statusCode: 400,
      body: { success: false, message: 'Payment failed due to invalid details.' },
    }).as('checkoutRequest');

    cy.contains('button', 'Pay Now').click();

    cy.wait('@checkoutRequest').then(() => {
      cy.contains('Payment failed due to invalid details.').should('be.visible');
      cy.url().should('not.include', '/post-purchase');
    });
  });

  it('should show error toast on network error during payment', () => {
    // Intercept the POST request to /api/checkout and simulate a network error
    cy.intercept('POST', '/api/checkout', {
      forceNetworkError: true,
    }).as('checkoutRequest');

    cy.contains('button', 'Pay Now').click();

    cy.wait('@checkoutRequest').then(() => {
      cy.contains('Network error or server issue. Please check your connection.').should('be.visible');
      cy.url().should('not.include', '/post-purchase');
    });
  });
});
