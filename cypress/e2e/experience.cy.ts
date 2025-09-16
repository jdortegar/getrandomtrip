describe('Experience Level Page', () => {
  beforeEach(() => {
    cy.visit('/experience');
  });

  it('should display the main heading', () => {
    cy.get('h1').should('contain', 'Select Your Experience Level');
  });

  it('should display all experience level cards', () => {
    cy.contains('h2', 'Essenza').should('be.visible');
    cy.contains('h2', 'Explora').should('be.visible');
    cy.contains('h2', 'Explora+').should('be.visible');
    cy.contains('h2', 'Bivouac').should('be.visible');
    cy.contains('h2', 'Atelier').should('be.visible');
  });

  it('should allow selecting an experience level', () => {
    cy.contains('h2', 'Explora').click();
    cy.contains('Explora').parent().should('have.class', 'border-4');
    cy.contains('Explora').parent().contains('Selected').should('be.visible');
  });

  it('should show loading spinner initially and then hide it', () => {
    cy.get('.animate-spin').should('be.visible');
    cy.get('.animate-spin', { timeout: 2000 }).should('not.exist');
    cy.get('h1').should('contain', 'Select Your Experience Level');
  });

  it('should navigate to basic configuration on continue button click', () => {
    cy.contains('h2', 'Explora').click();
    cy.contains('button', 'Continue to Basic Configuration').click();
    // Assuming navigation happens, you might assert the URL or a new element on the next page
    // For now, we'll just check if the button click doesn't throw an error.
  });
});
