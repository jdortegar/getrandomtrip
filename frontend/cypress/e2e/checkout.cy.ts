describe('Checkout Page', () => {
  beforeEach(() => {
    cy.visit('/checkout?bookingId=bk_123');
  });

  it('should display the main heading', () => {
    cy.get('h1').should('contain', 'Review Your Trip & Payment');
  });

  it('should display trip summary sections', () => {
    cy.get('[data-testid="checkout-summary"]').should('exist');
  });

  it('should display price breakdown', () => {
    cy.get('[data-testid="checkout-prices"]').should('exist');
  });

  it('should display payment section', () => {
    cy.get('[data-testid="checkout-payment"]').should('exist');
    cy.get('[data-testid="pay-now"]').should('be.visible');
  });

  it('should show success toast and redirect on successful payment', () => {
    // Intercept the POST request to /api/checkout and mock a successful response
    cy.intercept('POST', '**/checkout', {
      statusCode: 200,
      fixture: "checkout.preference.success.json",
    }).as('checkoutRequest');

    cy.get('[data-testid="pay-now"]').click();

    cy.wait('@checkoutRequest').then(() => {
      cy.contains('Payment successful! Redirecting...').should('be.visible');
      cy.url().should('include', '/post-purchase');
    });
  });

  it('should show error toast on failed payment', () => {
    // Intercept the POST request to /api/checkout and mock a failed response
    cy.intercept('POST', '**/checkout', {
      statusCode: 400,
      body: { success: false, message: 'Payment failed due to invalid details.' },
    }).as('checkoutRequest');

    cy.get('[data-testid="pay-now"]').click();

    cy.wait('@checkoutRequest').then(() => {
      cy.contains('Payment failed due to invalid details.').should('be.visible');
      cy.url().should('not.include', '/post-purchase');
    });
  });

  it('should show error toast on network error during payment', () => {
    // Intercept the POST request to /api/checkout and simulate a network error
    cy.intercept('POST', '**/checkout', {
      forceNetworkError: true,
    }).as('checkoutRequest');

    cy.get('[data-testid="pay-now"]').click();

    cy.wait('@checkoutRequest').then(() => {
      cy.contains('Network error or server issue. Please check your connection.').should('be.visible');
      cy.url().should('not.include', '/post-purchase');
    });
  });
});