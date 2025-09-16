describe('Filters Premium Page', () => {
  beforeEach(() => {
    cy.visit('/journey/premium-filters?bookingId=bk_123');
  });

  it('should display the main heading', () => {
    cy.get('h1').should('contain', 'Filtros Premium');
  });

  it('should display all premium filter options', () => {
    cy.get('[data-testid="premium-experience_beach"]').should('be.visible');
    cy.get('[data-testid="premium-experience_city"]').should('be.visible');
    cy.get('[data-testid="premium-experience_nature"]').should('be.visible');
    cy.get('[data-testid="premium-experience_relax"]').should('be.visible');
    cy.get('[data-testid="premium-climate_warm"]').should('be.visible');
    cy.get('[data-testid="premium-climate_template"]').should('be.visible');
    cy.get('[data-testid="premium-climate_cold"]').should('be.visible');
  });

  it('should allow selecting and deselecting filters and update total price', () => {
    // Select 'experience_beach' (first filter is free)
    cy.get('[data-testid="premium-experience_beach"]').click();
    cy.get('[data-testid="premium-total"]').should('contain', '$0.00');

    // Select 'climate_warm' (second filter costs 18)
    cy.get('[data-testid="premium-climate_warm"]').click();
    cy.get('[data-testid="premium-total"]').should('contain', '$18.00');

    // Deselect 'experience_beach'
    cy.get('[data-testid="premium-experience_beach"]').click();
    cy.get('[data-testid="premium-total"]').should('contain', '$18.00'); // Only climate_warm remains
  });

  it('should navigate to add-ons on continue button click', () => {
    cy.contains('button', 'Continuar a Add-ons').click();
    cy.url().should('include', '/journey/add-ons');
  });
});