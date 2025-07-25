describe('Add-ons Page', () => {
  beforeEach(() => {
    cy.visit('/add-ons');
  });

  it('should display the main heading', () => {
    cy.get('h1').should('contain', 'Customize with Add-ons');
  });

  it('should show loading skeleton initially and then hide it', () => {
    cy.get('.animate-pulse').should('be.visible');
    cy.get('.animate-pulse', { timeout: 2000 }).should('not.exist');
    cy.get('h1').should('contain', 'Customize with Add-ons');
  });

  it('should allow changing number of travelers', () => {
    cy.get('#travelers').clear().type('3').should('have.value', '3');
  });

  it('should display all add-on options', () => {
    cy.contains('span', 'Travel Insurance').should('be.visible');
    cy.contains('span', 'Airport Transfer').should('be.visible');
    cy.contains('span', 'Excursion Package').should('be.visible');
    cy.contains('span', 'Premium Dining Experience').should('be.visible');
  });

  it('should allow selecting/deselecting add-ons and update costs', () => {
    // Select Travel Insurance (25/person)
    cy.contains('span', 'Travel Insurance').click();
    cy.get('input[type="checkbox"]').check('travel_insurance');
    cy.get('input[type="checkbox"][value="travel_insurance"]').should('be.checked');
    cy.contains('p', 'Extra Cost Per Person: $25.00').should('be.visible');
    cy.contains('p', 'Total Extra Cost: $25.00').should('be.visible'); // Assuming 1 traveler initially

    // Change travelers to 2
    cy.get('#travelers').clear().type('2');
    cy.contains('p', 'Total Extra Cost: $50.00').should('be.visible');

    // Select Airport Transfer (40/person)
    cy.contains('span', 'Airport Transfer').click();
    cy.get('input[type="checkbox"]').check('airport_transfer');
    cy.get('input[type="checkbox"][value="airport_transfer"]').should('be.checked');
    cy.contains('p', 'Extra Cost Per Person: $65.00').should('be.visible'); // 25 + 40
    cy.contains('p', 'Total Extra Cost: $130.00').should('be.visible'); // 65 * 2

    // Deselect Travel Insurance
    cy.contains('span', 'Travel Insurance').click();
    cy.get('input[type="checkbox"]').uncheck('travel_insurance');
    cy.get('input[type="checkbox"][value="travel_insurance"]').should('not.be.checked');
    cy.contains('p', 'Extra Cost Per Person: $40.00').should('be.visible'); // Only Airport Transfer remains
    cy.contains('p', 'Total Extra Cost: $80.00').should('be.visible'); // 40 * 2
  });

  it('should navigate to review and pay on continue button click', () => {
    cy.contains('button', 'Review and Pay').click();
    // Add assertion for navigation if applicable, e.g., cy.url().should('include', '/checkout');
  });
});
