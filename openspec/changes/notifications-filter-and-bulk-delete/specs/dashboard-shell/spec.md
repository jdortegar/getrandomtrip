# Delta for Dashboard Shell

## MODIFIED Requirements

### Requirement: Admin Notifications Tab

The admin nav MUST include a personal notifications tab, distinct from the XSED-signup notifications tab, backed by the existing `Notification` model's `ADMIN` audience (already populated by `REVIEW_SUBMITTED` and destination-assignment-reminder notifications before this change — this tab surfaces data that already exists with no prior UI). The unread-count dot on this tab MUST also reflect mark-read, mark-all-read, and delete mutations performed on the notifications page without requiring a shell remount or navigation, via a shared refresh signal the dot and the notifications page both subscribe to.

(Previously: constrained only the dot's audience-scoped data source, not when or how it updates after a mutation.)

#### Scenario: Admin views their own notifications

- GIVEN one or more `Notification` rows with `audience = ADMIN` and `userId` matching the signed-in admin
- WHEN the admin opens the Notifications tab
- THEN each notification renders with an action linking to the relevant admin section (reviews for `REVIEW_SUBMITTED`, trip-requests for a destination-assignment reminder, experiences when `experienceId` is present)

#### Scenario: Unread count reflects only the admin's own notifications

- GIVEN the admin has unread `ADMIN`-audience notifications
- WHEN the nav renders
- THEN the Notifications tab shows an unread-count dot sourced from `audience=ADMIN`, never falling back to another role's count

#### Scenario: Unread dot refreshes after a mutation without a remount

- GIVEN the admin's unread dot is showing a count that predates a recent action
- WHEN the admin marks a notification read, runs "mark all read", or bulk-deletes selected notifications from the notifications page
- THEN the unread dot updates to the new count immediately, without a page reload, remount, or navigation
