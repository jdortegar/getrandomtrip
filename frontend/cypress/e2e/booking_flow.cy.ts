describe('Main Booking Flow E2E Test', () => {
  beforeEach(() => {
    // Intercept the API call to create a booking and return a mock ID
    cy.intercept('POST', '**/bookings', {
      statusCode: 201,
      fixture: "booking.create.success.json", // Changed to use fixture
    }).as('createBooking');

    // Intercept PATCH calls to simulate successful updates
    cy.intercept('PATCH', '**/api/bookings/*', { // Changed to wildcard
      statusCode: 200,
      fixture: "booking.patch.confirmed.json", // Changed to use fixture
    }).as('confirmBooking'); // Changed alias

    // Intercept GET calls to return mock booking data
     cy.intercept('GET', '**/api/bookings/mock-booking-id-123', {
      statusCode: 200,
      body: { travelerCount: 2, totalPrice: 500, duration_nights: 3 },
    }).as('getBooking');
  });

  it('should allow a user to complete the entire booking journey', () => {
    // 1. Landing Page
    cy.visit('/');
    cy.contains('RandomtripME!').click();
    cy.wait('@createBooking');
    cy.url().should('include', '/journey/exploration?bookingId=mock-booking-id-123');

    // 2. Exploration Page
    cy.contains('By Traveller').click();
    cy.wait('@confirmBooking'); // Changed alias
    cy.url().should('include', '/journey/experience-level?bookingId=mock-booking-id-123');

    // 3. Experience Level Page
    cy.contains('Essenza').click();
    cy.wait('@confirmBooking'); // Changed alias
    cy.url().should('include', '/journey/basic-config?bookingId=mock-booking-id-123');

    // 4. Basic Config Page
    cy.get('#originCity').type('Buenos Aires, Argentina');
    cy.get('#startDate').type('2025-12-25');
    cy.get('#travelerCount').clear().type('2');
    cy.contains('Continuar').click();
    cy.wait('@confirmBooking'); // Changed alias
    cy.url().should('include', '/journey/premium-filters?bookingId=mock-booking-id-123');
    
    // 5. Premium Filters Page
    cy.contains('Playa / Sol').click();
    cy.contains('Continuar a Add-ons').click();
    cy.wait('@confirmBooking'); // Changed alias
    cy.url().should('include', '/journey/add-ons?bookingId=mock-booking-id-123');

    // 6. Add-ons Page
    cy.contains('Seguro de Viajes').click();
    cy.contains('Ir al Resumen Final').click();
    cy.wait('@confirmBooking'); // Changed alias
    cy.url().should('include', '/journey/summary?bookingId=mock-booking-id-123');
    
    // 7. Summary Page
    cy.contains('Tu Aventura Está Lista').should('be.visible');
    cy.contains('Confirmar y Pagar').click();
    cy.wait('@confirmBooking'); // Changed alias
    cy.url().should('include', '/journey/confirmation?bookingId=mock-booking-id-123');
    
    // 8. Confirmation Page
    cy.contains('¡Tu aventura está en marcha!').should('be.visible');
    cy.contains('mock-booking-id-123').should('be.visible');
  });
});