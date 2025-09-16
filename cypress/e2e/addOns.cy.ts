describe('Add-ons Page', () => {
  beforeEach(() => {
    cy.visit('/journey/add-ons?bookingId=bk_123');
  });

  it('should display the main heading', () => {
    cy.get('h1').should('contain', 'Servicios Adicionales');
  });

  it('should display all add-on options', () => {
    cy.get('[data-testid="addon-item-insurance_cancellation"]').should('be.visible');
    cy.get('[data-testid="addon-item-insurance_travel"]').should('be.visible');
    cy.get('[data-testid="addon-item-seat_selection"]').should('be.visible');
    cy.get('[data-testid="addon-item-breakfast"]').should('be.visible');
    cy.get('[data-testid="addon-item-airport_pickup"]').should('be.visible');
    cy.get('[data-testid="addon-item-airport_dropoff"]').should('be.visible');
    cy.get('[data-testid="addon-item-car_rental"]').should('be.visible');
  });

  it('should allow selecting/deselecting add-ons and update costs', () => {
    // Select Insurance Travel (35 per person)
    cy.get('[data-testid="addon-item-insurance_travel"]').click();
    cy.get('[data-testid="addons-total"]').should('contain', '$35.00');

    // Select Airport Pickup (30 per booking)
    cy.get('[data-testid="addon-item-airport_pickup"]').click();
    cy.get('[data-testid="addons-total"]').should('contain', '$65.00');

    // Deselect Insurance Travel
    cy.get('[data-testid="addon-item-insurance_travel"]').click();
    cy.get('[data-testid="addons-total"]').should('contain', '$30.00');
  });

  it('should navigate to review and pay on continue button click', () => {
    cy.contains('button', 'Ir al Resumen Final').click();
    cy.url().should('include', '/journey/summary');
  });
});