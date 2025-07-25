describe('Exploration Page', () => {
  beforeEach(() => {
    cy.visit('/exploration');
  });

  it('should display the main heading', () => {
    cy.get('h1').should('contain', 'Choose Your Adventure Style');
  });

  it('should display Top Trippers section', () => {
    cy.get('h2').contains('Top Trippers').should('be.visible');
    cy.get('input[placeholder="Search influencers/advisors..."]').should('be.visible');
  });

  it('should display By Traveller section and buttons', () => {
    cy.get('h2').contains('By Traveller').should('be.visible');
    cy.contains('button', 'Family').should('be.visible');
    cy.contains('button', 'Couple').should('be.visible');
    cy.contains('button', 'Group').should('be.visible');
    cy.contains('button', 'Honeymoon').should('be.visible');
    cy.contains('button', 'Solo').should('be.visible');
  });

  it('should display Roadtrip section and buttons', () => {
    cy.get('h2').contains('Roadtrip').should('be.visible');
    cy.contains('button', 'Car').should('be.visible');
    cy.contains('button', 'Motorcycle').should('be.visible');
    cy.contains('button', 'Bicycle').should('be.visible');
  });

  it('should display Trippers Decode section', () => {
    cy.get('h2').contains('Trippers Decode').should('be.visible');
    cy.get('input[placeholder="Search destination + month..."]').should('be.visible');
  });

  it('should show loading spinner initially and then hide it', () => {
    cy.get('.animate-spin').should('be.visible');
    cy.get('.animate-spin', { timeout: 2000 }).should('not.exist');
    cy.get('h1').should('contain', 'Choose Your Adventure Style');
  });
});
