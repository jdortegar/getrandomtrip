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
  - API integrations (checkout, post-purchase, reveal).
  - Email scheduling (backend verification).
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
  - **TC-FE-001: Full User Flow - Successful Purchase & Reveal**
    - **Description:** Verify the complete user journey from landing to destination reveal, including successful payment and post-purchase confirmation.
    - **Steps:**
      1. Navigate to the landing page.
      2. Complete all steps of the trip configuration (Exploration, Experience, Basic Config, Filters, Add-ons).
      3. On the Checkout page, click "Pay Now".
      4. Verify successful payment message and redirection to Post-Purchase page.
      5. On Post-Purchase page, verify booking confirmation details are displayed.
      6. Navigate to the Reveal Destination page.
      7. Verify the countdown timer and eventual revelation of the destination.
    - **Expected Result:** User successfully completes the purchase, sees confirmation, and the destination is revealed after the countdown.

### 5.2. Edge Cases & Error Handling
- **TC-FE-002: Payment Failure Scenario**
  - **Description:** Simulate a failed payment and verify error message and retry option.
  - **Steps:**
    1. Follow steps 1-3 of TC-FE-001.
    2. Simulate a payment failure (e.g., by modifying the mock API response or frontend logic for testing).
    3. Verify an appropriate error message is displayed on the Checkout page.
    4. Verify the "Pay Now" button is re-enabled for retry.
  - **Expected Result:** Payment failure is gracefully handled, and the user is prompted to retry.

- **TC-FE-003: Post-Purchase Data Fetch Failure**
  - **Description:** Verify handling when booking confirmation data cannot be fetched.
  - **Steps:**
    1. Successfully complete the checkout process (steps 1-4 of TC-FE-001).
    2. Simulate a failure in fetching data from the `/api/post-purchase` endpoint.
    3. Verify an error message is displayed on the Post-Purchase page.
  - **Expected Result:** An error message is displayed, indicating issues fetching confirmation data.

- **TC-FE-004: Reveal Destination Data Fetch Failure**
  - **Description:** Verify handling when destination data cannot be fetched.
  - **Steps:**
    1. Successfully complete the checkout and post-purchase process.
    2. Navigate to the Reveal Destination page.
    3. Simulate a failure in fetching data from the `/api/reveal` endpoint.
    4. Verify an error message is displayed on the Reveal Destination page.
  - **Expected Result:** An error message is displayed, indicating issues fetching destination data.

- **TC-FE-005: No Filters/Add-ons Selected**
  - **Description:** Verify flow continues with base price if no premium options are selected.
  - **Steps:**
    1. Navigate through the trip configuration, intentionally skipping premium filters and add-ons.
    2. Verify the total price on the Checkout page includes only the base price.
    3. Complete the purchase.
  - **Expected Result:** The purchase proceeds correctly with the base price.

- **TC-FE-006: Solo Traveller Markup**
  - **Description:** Verify 50% markup is applied correctly for a solo traveler.
  - **Steps:**
    1. Configure a trip for a single traveler.
    2. Verify the price calculation on the Checkout page includes the 50% solo traveler markup.
    3. Complete the purchase.
  - **Expected Result:** The price correctly reflects the solo traveler markup.

### 5.3. Cross-Browser/Device Compatibility
- Verify UI and functionality across all specified browsers and devices.

## 6. Test Execution Matrix

| Test Case ID | Description | Steps | Expected Result | Browser | Device | Status |
|---|---|---|---|---|---|---|
| TC-FE-001 | Full User Flow - Successful Purchase & Reveal | See 5.1 | Successful booking & revelation | Chrome | Desktop | |
| TC-FE-002 | Payment Failure Scenario | See 5.2 | Error message, retry option | Firefox | Mobile | |
| TC-FE-003 | Post-Purchase Data Fetch Failure | See 5.2 | Error message displayed | Safari | Tablet | |
| TC-FE-004 | Reveal Destination Data Fetch Failure | See 5.2 | Error message displayed | Edge | Desktop | |
| TC-FE-005 | No Filters Selected | See 5.2 | Proceeds with base price | Chrome | Mobile | |
| TC-FE-006 | Solo Traveller Markup | See 5.2 | Price reflects 50% markup | Firefox | Desktop | |
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
  "currency": "USD",
  "token": "mock_payment_token"
}
```

**Sample cURL Command (Success):**
```bash
curl -X POST http://localhost:3001/api/checkout \
-H "Content-Type: application/json" \
-d "{\"amount\": 1410, \"currency\": \"USD\", \"token\": \"mock_payment_token\"}"
```

**Sample cURL Command (Failure - adjust amount or method to trigger failure):**
```bash
curl -X POST http://localhost:3001/api/checkout \
-H "Content-Type: application/json" \
-d "{\"amount\": 10, \"currency\": \"USD\", \"token\": \"invalid_token\"}"
```

### 9.2. Post-Purchase Endpoint

**Description:** Records a booking confirmation.

**Endpoint:** `POST /api/post-purchase`

**Request Body:**
```json
{
  "bookingId": "mock_booking_123",
  "status": "confirmed",
  "paymentId": "mock_transaction_12345"
}
```

**Sample cURL Command:**
```bash
curl -X POST http://localhost:3001/api/post-purchase \
-H "Content-Type: application/json" \
-d "{\"bookingId\": \"mock_booking_123\", \"status\": \"confirmed\", \"paymentId\": \"mock_transaction_12345\"}"
```

### 9.3. Reveal Endpoint

**Description:** Triggers destination revelation.

**Endpoint:** `POST /api/reveal`

**Request Body:**
```json
{
  "bookingId": "mock_booking_123",
  "destination": "Paris"
}
```

**Sample cURL Command:**
```bash
curl -X POST http://localhost:3001/api/reveal \
-H "Content-Type: application/json" \
-d "{\"bookingId\": \"mock_booking_123\", \"destination\": \"Paris\"}"
```

## 10. Future Considerations
- Integration with automated testing frameworks (e.g., Cypress, Playwright).
- Performance testing.
- Security testing.
- Automated API testing using tools like Jest or Supertest.
