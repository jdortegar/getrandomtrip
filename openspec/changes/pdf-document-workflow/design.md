# PDF document workflow design

Reuse existing draft/delivery hooks and all five controlled forms; no backend lifecycle redesign. Preserve browser-memory preview/exact-byte publication contract from form-generated-fulfillment-pdfs.

A hub owns attached-document synchronization and private-draft navigation. A dedicated dialog/editor isolates document actions from the underlying trip form. New-document selection precedes editing. Editor/review are explicit UI states, with existing inline validation scopes and unsaved guards. Save & preview waits for the server-returned saved revision before dispatching rendering from the updated hook identity; stale asynchronous completions are ignored.

Extract focused selection/list, editor actionbar/review and field-group components as needed; each component stays below300lines. Use existing field, dialog and StatusIndicatorBadge primitives. Mutations remain explicit. Parent upload/delete callbacks keep published rows synchronized; publication/list refresh must report failure and preserve editor/trip state. Existing independently loaded parent document state and swallowed refresh errors are the observed consistency risk; fix synchronization rather than relabel statuses.

Review units:U1 asynchronous save result contract;U2 authoritative hub synchronization/navigation;U3 guarded editor/review actions;U4 grouped fields/dashboard integration and regression/responsive verification. Each unit targets<=400 changed lines with tests/copy. No commit/push in this execution. Existing PR167 remains separate.
