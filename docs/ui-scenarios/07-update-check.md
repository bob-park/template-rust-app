# 07-update-check: Update check responds

- Priority: P0
- Preconditions: app running. Network available (or note that it isn't).

## Steps
1. Open Settings, Updates tab. Snapshot.
2. Activate `updates.check` "Check for Updates" / "업데이트 확인". Snapshot immediately, then `wait` for the status text to change.
3. From the tray, choose `check_update` "Check for Updates" / "업데이트 확인".

## Expected
- Step 1: `updates.version` shows the version from `src-tauri/tauri.conf.json`; status is `updates.idle` "Not checked yet" / "아직 확인하지 않음" (or the last result).
- Step 2: status goes to `updates.checking` "Checking…" / "확인 중…", then one of `updates.upToDate` "Up to date" / "최신 버전", `updates.ready` "Version X is ready" / "버전 X 준비됨", or `updates.failed` "Update check failed" / "업데이트 확인 실패". It never stays on Checking.
- If ready, the button reads `updates.restart` "Restart to Update" / "업데이트 후 재시작" and the tray item reads `restart_update`. Don't press it unless the user agrees (it installs and restarts).
- Dev builds may legitimately report `updates.failed` with no published release; record that, don't call it a FAIL without checking `latest.json`.

## UX checks
- Is the result readable without opening a log?
