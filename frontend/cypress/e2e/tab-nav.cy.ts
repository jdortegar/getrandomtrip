describe("Internal tab navigation", () => {
  it("Navbar → Top Trippers", () => {
    cy.visit("/");
    cy.contains("Trippers’ Finder").click();
    cy.url().should("include", "tab=Top%20Trippers");
    cy.get('[data-testid="journey-section"]').should("be.visible");
  });

  it("CTA → By Traveller", () => {
    cy.visit("/");
    cy.contains("RANDOMTRIPME!").click();
    cy.url().should("include", "tab=By%20Traveller");
    cy.get('[data-testid="journey-section"]').should("be.visible");
  });

  it("Works from any pre-selected tab", () => {
    cy.visit("/?tab=Roadtrips");
    cy.contains("Trippers’ Finder").click();
    cy.url().should("include", "tab=Top%20Trippers");
  });
});