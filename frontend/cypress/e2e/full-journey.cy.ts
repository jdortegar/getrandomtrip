describe('Full User Journey', () => {
  beforeEach(() => {
    // Mock API calls
    cy.intercept('POST', '**/api/bookings', { fixture: 'booking.create.success.json' }).as('createBooking');
    cy.intercept('PATCH', '**/api/bookings/*', { fixture: 'booking.patch.confirmed.json' }).as('confirmBooking');
    cy.intercept('POST', '**/api/checkout', { fixture: 'checkout.preference.success.json' }).as('checkout');
    cy.intercept('POST', '**/api/post-purchase', { fixture: 'postpurchase.success.json' }).as('postPurchase'); // Assuming POST for post-purchase
    cy.intercept('POST', '**/api/reveal', { fixture: 'reveal.success.json' }).as('reveal'); // Assuming POST for reveal

    // Mock the GET for post-purchase confirmation if needed
    cy.intercept('GET', '**/api/bookings/*', { fixture: 'postpurchase.success.json' }).as('getBookingConfirmation');
    cy.intercept('GET', '**/api/bookings/*/reveal', { fixture: 'reveal.success.json' }).as('getReveal');
  });

  it('should complete the full user journey with mocks', () => {
    cy.clock(); // Start Cypress clock

    // 1. Landing Page -> Exploration
    cy.visit('/');
    cy.contains('RandomtripME!').click();
    cy.wait('@createBooking');
    cy.url().should('include', '/journey/exploration');

    // 2. Exploration -> Experience Level
    cy.get('[data-testid="tab-by-traveller"]').click(); // Assuming this is the first step
    cy.wait('@confirmBooking');
    cy.url().should('include', '/journey/experience-level');

    // 3. Experience Level -> Basic Config
    cy.contains('Essenza').click(); // Assuming 'Essenza' is a clickable element
    cy.wait('@confirmBooking');
    cy.url().should('include', '/journey/basic-config');

    // 4. Basic Config -> Premium Filters
    cy.get('#originCity').type('Buenos Aires');
    cy.get('#startDate').type('2025-12-25');
    cy.get('#travelerCount').clear().type('2');
    cy.contains('Continuar').click();
    cy.wait('@confirmBooking');
    cy.url().should('include', '/journey/premium-filters');

    // 5. Premium Filters -> Add-ons
    cy.get('[data-testid="premium-transport"]').click(); // Example filter
    cy.contains('Continue to Add-ons').click();
    cy.wait('@confirmBooking');
    cy.url().should('include', '/add-ons');

    // 6. Add-ons -> Summary
    cy.get('[data-testid="addon-item-travel_insurance"]').click(); // Example add-on
    cy.contains('Review and Pay').click();
    cy.wait('@confirmBooking');
    cy.url().should('include', '/checkout');

    // 7. Checkout -> Post-Purchase
    cy.get('[data-testid="pay-now"]').click();
    cy.wait('@checkout');
    cy.url().should('include', '/post-purchase');
    cy.get('[data-testid="postpurchase-title"]').should('exist');

    // 8. Post-Purchase -> Reveal Destination
    cy.contains('Reveal My Destination!').click();
    cy.url().should('include', '/reveal-destination');
    cy.get('[data-testid="reveal-title"]').should('exist');

    // 9. Reveal Destination - countdown and reveal
    cy.get('[data-testid="reveal-countdown"]').should('exist');
    cy.tick(48 * 60 * 60 * 1000); // Simulate time passing for reveal
    cy.wait('@getReveal'); // Wait for the reveal API call
    cy.get('[data-testid="reveal-destination"]').should('exist');
  });
});