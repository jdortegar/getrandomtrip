describe('Full User Journey', () => {
  it('should complete the full user journey from checkout to reveal', () => {
    // Visit the checkout page
    cy.visit('http://localhost:3000/checkout'); // Assuming your frontend runs on port 3000

    // Click the Pay Now button
    cy.get('button').contains('Pay Now').click();

    // Assert that payment is processing
    cy.contains('Processing payment...');

    // Assert redirection to post-purchase page
    cy.url().should('include', '/post-purchase');
    cy.contains('Thank You for Your Purchase!');

    // Click the Reveal My Destination button
    cy.get('button').contains('Reveal My Destination!').click();

    // Assert redirection to reveal-destination page
    cy.url().should('include', '/reveal-destination');

    // Assert countdown and eventual revelation
    cy.contains('Your destination will be revealed in:');
    // Wait for the countdown to finish and destination to be revealed
    cy.contains('Your Destination Revealed!', { timeout: 15000 }); // Adjust timeout as needed
    cy.contains('Kyoto, Japan'); // Assuming mock destination
  });
});
