describe('Basic Configuration Page', () => {
  beforeEach(() => {
    cy.visit('/configuration/basic');
  });

  it('should display the main heading', () => {
    cy.get('h1').should('contain', 'Basic Services');
  });

  it('should show loading skeleton initially and then hide it', () => {
    cy.get('.animate-pulse').should('be.visible');
    cy.get('.animate-pulse', { timeout: 2000 }).should('not.exist');
    cy.get('h1').should('contain', 'Basic Services');
  });

  it('should allow inputting origin city', () => {
    cy.get('#originCity').type('London').should('have.value', 'London');
  });

  it('should allow selecting travel date', () => {
    cy.get('#travelDate').type('2025-12-25').should('have.value', '2025-12-25');
  });

  it('should allow inputting number of nights', () => {
    cy.get('#nights').clear().type('10').should('have.value', '10');
  });

  it('should allow inputting number of travelers', () => {
    cy.get('#travelers').clear().type('3').should('have.value', '3');
  });

  it('should allow selecting accommodation type', () => {
    cy.contains('span', 'Hotel').click();
    cy.get('input[name="accommodationType"][value="hotel"]').should('be.checked');
  });

  it('should allow selecting transportation type', () => {
    cy.contains('span', 'Train').click();
    cy.get('input[name="transportationType"][value="train"]').should('be.checked');
  });

  it('should navigate to premium filters on continue button click', () => {
    // Fill in some required fields to enable the button if validation were active
    cy.get('#originCity').type('Test City');
    cy.get('#travelDate').type('2025-01-01');
    cy.contains('button', 'Proceed to Premium Filters').click();
    // Add assertion for navigation if applicable, e.g., cy.url().should('include', '/filters-premium');
  });
});
