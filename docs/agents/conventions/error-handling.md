---
title: Error Handling
scope: src-tauri/src/**, src/shared/api/**, src/domain/*/queries/**
applies_to: returning an error from Rust, handling a failed command in the UI
related:
  - ./tauri-commands.md
  - ../libs/react-query.md
---

# Error Handling

> Rust returns `AppResult<T>` = `Result<T, AppError>`. `AppError` serializes to `{ code, message }`. The frontend receives it as the `AppError` type, via the rejected `call()` promise and `QueryMutationHandle.onError`.

## Rust

`src-tauri/src/shared/error.rs`:

| Variant | `code` | Use for |
| ------- | ------ | ------- |
| `InvalidInput(String)` | `INVALID_INPUT` | bad values from the webview (validation in the domain API) |
| `Db(rusqlite::Error)` | `DB` | any SQLite failure (`?` converts automatically) |
| `Io(std::io::Error)` | `IO` | filesystem failures |

- Add a variant only when the frontend must **branch** on it. Give it a stable SCREAMING_SNAKE `code` in `AppError::code()`.
- The `message` is for logs and developers. User-facing text comes from the i18n dictionaries, keyed by `code`.
- App-shell commands that wrap plugin errors (`autostart`, `updater`) may return `Result<T, String>`. `call()` turns a string into `{ code: 'UNKNOWN', message }`.

## Frontend

- `src/shared/api/common.dto.ts` defines `interface AppError { code: string; message: string }`.
- `call()` always rejects with an `AppError`, never a raw string or `Error`.
- Mutation hooks accept `QueryMutationHandle<T>` (`onSuccess`, `onError(err: AppError)`). Show errors in the component that triggered the action.
