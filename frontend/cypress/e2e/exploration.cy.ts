describe('Exploration Page', () => {
  it('should navigate to Trippers Decode tab on the home page', () => {
    cy.visit('/');
    cy.get('[data-testid="tab-trippers-decode"]').click();
    cy.get('[data-testid="journey-section"]').should('exist');
  });
});