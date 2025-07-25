describe('Filters Premium Page', () => {
  beforeEach(() => {
    cy.visit('/filters-premium');
  });

  it('should display the main heading', () => {
    cy.get('h1').should('contain', 'Enhance Your Trip with Premium Filters');
  });

  it('should show loading skeleton initially and then hide it', () => {
    cy.get('.animate-pulse').should('be.visible');
    cy.get('.animate-pulse', { timeout: 2000 }).should('not.exist');
    cy.get('h1').should('contain', 'Enhance Your Trip with Premium Filters');
  });

  it('should display all premium filter options', () => {
    cy.contains('span', 'Preferred Transport Type').should('be.visible');
    cy.contains('span', 'Specific Experience Type').should('be.visible');
    cy.contains('span', 'Climate Preference').should('be.visible');
    cy.contains('span', 'Avoid Specific Destinations').should('be.visible');
  });

  it('should allow selecting and deselecting filters and update total price', () => {
    // Select 'Specific Experience Type' (price 50)
    cy.contains('span', 'Specific Experience Type').click();
    cy.get('input[type="checkbox"]').check('experience_type');
    cy.get('input[type="checkbox"][value="experience_type"]').should('be.checked');
    cy.contains('p', 'Current Total Price: $0.00').should('be.visible'); // First filter is free

    // Select 'Climate Preference' (price 30)
    cy.contains('span', 'Climate Preference').click();
    cy.get('input[type="checkbox"]').check('climate_preference');
    cy.get('input[type="checkbox"][value="climate_preference"]').should('be.checked');
    cy.contains('p', 'Current Total Price: $30.00').should('be.visible');

    // Deselect 'Specific Experience Type'
    cy.contains('span', 'Specific Experience Type').click();
    cy.get('input[type="checkbox"]').uncheck('experience_type');
    cy.get('input[type="checkbox"][value="experience_type"]').should('not.be.checked');
    cy.contains('p', 'Current Total Price: $30.00').should('be.visible'); // Only Climate Preference remains
  });

  it('should navigate to add-ons on continue button click', () => {
    cy.contains('button', 'Continue to Add-ons').click();
    // Add assertion for navigation if applicable, e.g., cy.url().should('include', '/add-ons');
  });
});
