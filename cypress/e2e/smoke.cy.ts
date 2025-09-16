describe('Smoke', () => {
  it('Home responde y renderiza la cabecera o nav', () => {
    cy.request('/').its('status').should('eq', 200);
    cy.visit('/');
    cy.get('header, nav').should('exist');
  });
});