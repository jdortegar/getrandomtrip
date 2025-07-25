# Randomtrip End-to-End Test Plan

## 1. Introduction
This document outlines the end-to-end test plan for the Randomtrip web application, covering key user flows and functionalities.

## 2. Test Objectives
- Verify that the core user flow (from landing page to destination revelation) functions as expected.
- Ensure all UI components are rendered correctly and are interactive.
- Validate pricing logic and dynamic updates.
- Confirm successful payment simulation and post-purchase experience.
- Identify and report any bugs or deviations from the expected behavior.

## 3. Scope of Testing
- **User Flow:**
  - Landing Page interaction.
  - Exploration Initial (Top Trippers, By Traveller, Roadtrip, Trippers Decode).
  - Experience Level selection.
  - Basic Configuration.
  - Premium Filters selection.
  - Add-ons selection.
  - Summary and Payment (simulated).
  - Post-Purchase experience.
  - Destination Revelation.
- **Functionality:**
  - Button clicks and navigation.
  - Form submissions and data handling.
  - Dynamic price calculations.
  - Error handling (e.g., payment failure, map loading issues).
- **UI/UX:**
  - Responsiveness across different screen sizes (desktop, mobile).
  - Adherence to design guidelines (colors, typography, spacing).

## 4. Test Environment
- **Browser:** Chrome, Firefox, Safari, Edge (latest stable versions).
- **Devices:** Desktop, Tablet, Mobile (iOS, Android).
- **Backend:** Staging environment with mock API data.

## 5. Test Cases (High-Level)

### 5.1. Happy Path
- User navigates through the entire flow, selecting options and completing a simulated purchase.

### 5.2. Edge Cases & Error Handling
- **Payment Failure:** Simulate a failed payment and verify error message and retry option.
- **Map Loading Failure:** Simulate map not loading on destination revelation and verify fallback.
- **No Filters/Add-ons:** Verify flow continues with base price if no premium options are selected.
- **Solo Traveller Markup:** Verify 50% markup is applied correctly.

### 5.3. Cross-Browser/Device Compatibility
- Verify UI and functionality across all specified browsers and devices.

## 6. Test Execution Matrix

| Test Case ID | Description | Steps | Expected Result | Browser | Device | Status |
|---|---|---|---|---|---|---|
| TC-001 | Full User Flow - Happy Path | ... | Successful booking & revelation | Chrome | Desktop | |
| TC-002 | Payment Failure Scenario | ... | Error message, retry option | Firefox | Mobile | |
| TC-003 | No Filters Selected | ... | Proceeds with base price | Safari | Tablet | |
| TC-004 | Solo Traveller Markup | ... | Price reflects 50% markup | Edge | Desktop | |
| ... | ... | ... | ... | ... | ... | ... |

## 7. Test Reporting
- Test results will be documented in a separate test report, including pass/fail status, defects found, and severity.

## 8. Tools
- Manual testing.
- Browser developer tools for responsiveness and console errors.
- Postman or curl for API testing.

## 9. API Endpoints for Manual Verification

### 9.1. Checkout Endpoint

**Description:** Simulates a payment process.

**Endpoint:** `POST /api/checkout`

**Request Body:**
```json
{
  "amount": 1410,
  "paymentMethod": "Mercado Pago"
}
```

**Sample cURL Command (Success):**
```bash
curl -X POST http://localhost:3001/api/checkout \
-H "Content-Type: application/json" \
-d "{\"amount\": 1410, \"paymentMethod\": \"Mercado Pago\"}"
```

**Sample cURL Command (Failure - adjust amount or method to trigger failure):**
```bash
curl -X POST http://localhost:3001/api/checkout \
-H "Content-Type: application/json" \
-d "{\"amount\": 10, \"paymentMethod\": \"Invalid Method\"}"
```

### 9.2. Post-Purchase Endpoint

**Description:** Records a booking confirmation.

**Endpoint:** `POST /api/post-purchase`

**Request Body:**
```json
{
  "bookingId": "mock_booking_123"
}
```

**Sample cURL Command:**
```bash
curl -X POST http://localhost:3001/api/post-purchase \
-H "Content-Type: application/json" \
-d "{\"bookingId\": \"mock_booking_123\"}"
```

### 9.3. Reveal Endpoint

**Description:** Triggers destination revelation.

**Endpoint:** `POST /api/reveal`

**Request Body:**
```json
{
  "bookingId": "mock_booking_123"
}
```

**Sample cURL Command:**
```bash
curl -X POST http://localhost:3001/api/reveal \
-H "Content-Type: application/json" \
-d "{\"bookingId\": \"mock_booking_123\"}"
```

## 10. Future Considerations
- Integration with automated testing frameworks (e.g., Cypress, Playwright).
- Performance testing.
- Security testing.
- Automated API testing using tools like Jest or Supertest.

