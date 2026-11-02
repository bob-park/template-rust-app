# 05-error-display: Errors are understandable

- Priority: P0
- Preconditions: app running.
- Status: **N/A in the bare template.** No screen takes free-form input; theme and language are fixed choices. Run this scenario once a domain adds input that the backend can reject.

## Steps (for an app with user input)
1. Enter a value the backend rejects (`AppError::InvalidInput` → `INVALID_INPUT`).
2. Snapshot the window.
3. Activate the alert's dismiss button.

## Expected
- Step 2: a `role="alert"` element shows `errors.INVALID_INPUT` "That value isn't allowed." / "허용되지 않는 값이에요." (or the domain's own message), not a raw code or stack trace.
- Nothing invalid was saved (reopen the screen and check the old value).
- Step 3: `errors.dismiss` "Dismiss" / "닫기" removes the alert.

## UX checks
- Does the message say what to do next?
