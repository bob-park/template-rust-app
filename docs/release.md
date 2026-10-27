# 릴리스 절차

빌드·서명·업로드는 모두 개인 장비에서 한다. 빌드용 CI는 없다. GitHub Actions는 버전 올림에만 쓴다([버전 규칙](agents/workflow/versioning.md)).

- 지원 플랫폼: macOS는 Apple Silicon만, Windows는 x64만 지원한다.
- 서명:
  - macOS는 Developer ID로 서명하고 공증한다.
  - Windows는 코드 서명을 하지 않는다. 자동 업데이트 검증용 Tauri 서명(`.sig`)만 만든다.

## 처음 한 번

### 업데이터 서명 키 (새 앱마다 한 번)

먼저 `scripts/load-updater-key-macos.sh`의 `APP_NAME`과 `scripts/load-updater-key-windows.ps1`의 `$AppName`을 앱 이름으로 바꾼다. 아래 `<앱>`은 그 값이다.

```bash
yarn tauri signer generate -w <경로>   # 암호를 물어본다(-p로 지정, 이미 있으면 -f)
```

1. `<경로>.pub`(공개키)를 `src-tauri/updater.key.pub`으로 복사하고, 같은 내용을 `src-tauri/tauri.conf.json`의 `plugins.updater.pubkey`에 넣어 커밋한다.
   - 공개키가 비어 있으면 `latest-json.mjs`가 실행을 거부한다.
   - 이 값이 비어 있는 상태로 빌드된 앱은 업데이트를 검증하지 못한다.
2. 개인키 **내용**과 비밀번호는 아래 "macOS 장비"·"Windows PC"대로 키체인과 자격 증명 관리자에 넣는다. **저장소에는 절대 넣지 않는다.**
3. 개인키 파일은 오프라인 백업만 남기고 작업 기계에서 지운다. 개인키를 잃어버리면 이미 설치된 앱은 더 이상 업데이트를 받지 못한다.
4. 키를 바꾸면 이미 설치된 앱은 새 키로 서명된 업데이트를 받지 못하고, 사용자가 직접 다시 설치해야 한다. 개인키를 잃어버렸을 때만 바꾼다.

파일 하나를 손으로 다시 서명할 때: 키를 불러온 뒤(`source scripts/load-updater-key-macos.sh` / `. scripts/load-updater-key-windows.ps1`) `yarn tauri signer sign --app-version <버전> <파일>`. `yarn tauri build`가 업데이트 파일은 알아서 서명하므로 보통은 필요 없다.

### macOS 장비

- `gh auth login`
- 로그인 키체인에 `Developer ID Application` 인증서를 설치한다.
- 공증은 App Store Connect **API 키** 방식이다(Apple ID/앱 암호 방식은 쓰지 않는다).
  1. App Store Connect → 사용자 및 액세스 → 통합 → App Store Connect API에서 키를 만든다(액세스: Developer).
  2. 내려받은 `AuthKey_<키 ID>.p8`을 `~/.config/apple/`에 둔다. 한 번만 내려받을 수 있으니 백업한다.
  3. 키 ID와 발급자 ID(Issuer ID)를 로그인 키체인에 넣는다.

     ```bash
     security add-generic-password -a "$USER" -s tauri-apple-api-key -w '<키 ID>'
     security add-generic-password -a "$USER" -s tauri-apple-api-issuer -w '<Issuer ID>'
     ```

- `~/.config/apple/.env` (앱 공통):

  ```bash
  APPLE_SIGNING_IDENTITY="Developer ID Application: ..."
  ```

- 업데이터 서명 키 (앱마다): 개인키 내용과 암호를 로그인 키체인에 넣는다. `release-macos.sh`가 `scripts/load-updater-key-macos.sh`로 읽어 온다.

  ```bash
  security add-generic-password -a "$USER" -s tauri-updater-<앱> -w '<개인키 내용>'
  security add-generic-password -a "$USER" -s tauri-updater-<앱>-pw -w '<키 암호>'
  ```

  - 직접 `yarn tauri build`를 할 때는 먼저 `source scripts/load-updater-key-macos.sh`를 실행한다.
- 환경에 예전 `APPLE_ID`/`APPLE_PASSWORD`/`APPLE_TEAM_ID`가 남아 있으면 지운다. `APPLE_ID`가 있으면 Tauri가 API 키 대신 그쪽으로 공증한다.
- 서명·공증된 앱만 만들어 보려면 `scripts/release-macos.sh --build-only`를 실행한다(업로드 없음). Tauri는 `.app`만 공증하므로, 스크립트가 빌드 뒤 `.dmg`도 `notarytool`로 공증하고 스테이플한다.

### Windows PC

- 필요한 도구: Rust, Node 26 / Yarn 4.18.1, `gh auth login`, PowerShell 7
- 업데이터 서명 키: 저장소 루트에서 아래를 한 번 실행하고, 물어보는 두 값(개인키 내용, 키 암호)을 붙여 넣는다. 자격 증명 관리자에 `tauri-updater-<앱>`, `tauri-updater-<앱>-pw`로 저장되고, `release-windows.ps1`이 같은 스크립트로 읽어 온다.

  ```powershell
  . scripts/load-updater-key-windows.ps1 -Save
  ```

  - `cmdkey /pass`는 길이 제한 때문에 개인키를 다 담지 못하므로 쓰지 않는다.
  - 직접 `yarn tauri build`를 할 때는 먼저 `. scripts/load-updater-key-windows.ps1`을 실행한다.

### Yarn 버전 주의

yarn은 반드시 4.18.1(`../mise.toml`)로 실행한다. mise가 활성화되지 않아 전역 yarn 1.x가 잡히면 `yarn.lock`이 Yarn 1 형식으로 통째로 바뀐다.

- `yarn --version`으로 버전을 확인한다.
- 4.x가 아니면 `corepack yarn@4.18.1 <명령>`으로 실행한다.

## 절차

1. **버전은 손으로 올리지 않는다.** `develop`에 PR이 머지되면 GitHub Actions가 `bump-version-up.sh`로 올린다. `main`에 `hotfix/*` PR이 머지될 때도 올린다. 버전이 들어가는 곳은 `tauri.conf.json`, `package.json`, `Cargo.toml`, `Cargo.lock`이다.
2. `develop`을 `main`으로 머지하는 릴리스 PR을 만들고 머지한다. 이후 단계는 모두 `main`에서 한다. 릴리스 태그는 `--target main`으로 만들어져 항상 `main`을 가리킨다.
3. macOS에서 `scripts/release-macos.sh`를 실행한다. 빌드·서명·공증을 한 뒤 초안 릴리스 `v<버전>`에 다음 파일을 올린다.
   - `App_<버전>_aarch64.dmg`
   - `App_<버전>_aarch64.app.tar.gz`와 그 `.sig`
4. Windows에서 `pwsh scripts/release-windows.ps1`을 실행한다. 같은 릴리스에 `App_<버전>_x64-setup.exe`와 그 `.sig`를 올린다.
5. 3과 4는 순서가 상관없다. 둘 다 끝나면 릴리스 본문을 완성한다. 본문은 `latest.json`의 업데이트 노트로 들어간다.
6. 아무 기계에서 `node scripts/latest-json.mjs v<버전>`을 실행한다. 릴리스의 `.sig`를 모아 `latest.json`을 만들어 올린다. 올라온 플랫폼만 들어간다.
7. 출력된 플랫폼 목록에 `darwin-aarch64`와 `windows-x86_64`가 모두 있는지 확인한다.
8. `gh release edit v<버전> -R bob-park/template-rust-app --draft=false`로 게시한다.
   - 설치된 앱은 6시간 안에 새 버전을 감지한다.
   - 설정 → 업데이트 → "업데이트 확인"이나 트레이 메뉴로 바로 확인할 수도 있다.

## macOS만 먼저 게시하기

Windows 빌드를 바로 할 수 없을 때는 macOS만 먼저 내보내고, Windows는 나중에 같은 릴리스에 더한다.

1. 위 절차 1~3을 한다.
2. `node scripts/latest-json.mjs v<버전>`을 실행하고, 출력이 `darwin-aarch64`뿐인지 확인한다.
3. `gh release edit v<버전> -R bob-park/template-rust-app --draft=false`로 게시한다.
4. `curl -sL https://github.com/bob-park/template-rust-app/releases/latest/download/latest.json`의 결과에 새 버전과 `darwin-aarch64`가 보이는지 확인한다.

이 상태에서는 이렇게 된다.

- macOS 사용자는 바로 업데이트를 받는다.
- Windows 사용자는 `latest.json`에 `windows-x86_64`가 없어서 업데이트를 받지 않고 이전 버전에 머문다. 오류는 나지 않는다.
- 이 릴리스가 "Latest"가 되므로, Releases 페이지에서 새로 내려받으려는 Windows 사용자는 설치 파일을 찾을 수 없다. 가능한 빨리 Windows를 더한다.

나중에 Windows를 더할 때:

1. Windows PC에서 `pwsh scripts/release-windows.ps1`을 실행한다. 이미 게시된 같은 릴리스에 올라가고, 새 초안은 만들지 않는다.
2. 아무 기계에서 `node scripts/latest-json.mjs v<버전>`을 다시 실행해 `latest.json`을 덮어쓴다. 출력에 두 플랫폼이 모두 있는지 확인한다. 이미 게시된 상태이므로 `--draft=false`는 다시 할 필요 없다.

## 핫픽스

1. `main`에서 `hotfix/<주제>` 브랜치를 만든다.
2. `main`으로 PR을 보내고 머지한다. 머지되면 Actions가 patch 버전을 올린다.
3. 위 절차의 3번부터 진행한다.
4. 릴리스 후 `main`을 `develop`에 머지한다. 이 머지는 버전을 다시 올리지 않는다.

릴리스 스크립트는 **이미 게시된** `v<버전>`에 같은 플랫폼 빌드가 있으면 실행을 거부한다. 게시된 버전을 덮어쓰면 설치된 앱이 업데이트를 감지하지 못하기 때문이다. 버전을 올린 뒤 다시 릴리스한다.

## 문제 해결

- **`failed to decode secret key: ... Invalid symbol`**
  - 원인: 키체인/자격 증명 관리자의 `tauri-updater-<앱>`에 개인키 **내용**이 아닌 다른 값(파일 경로, 잘린 값)이 들어 있다.
  - 확인: 위 "업데이터 서명 키"대로 다시 저장한다.
  - macOS에서는 이 오류가 공증까지 끝난 뒤 마지막에 나며, 그때는 릴리스에 아무것도 올라가지 않는다.
- **`Credential Manager has no tauri-updater-<앱>`**: Windows에서 위 "Windows PC"의 `-Save`를 하지 않았다.
- **`missing .../AuthKey_<ID>.p8`** 또는 `security: SecKeychainSearchCopyNext`: 키체인 항목(`tauri-apple-api-key`, `tauri-apple-api-issuer`, `tauri-updater-<앱>`, `tauri-updater-<앱>-pw`)이나 `~/.config/apple/`의 `.p8`이 없다. 위 "macOS 장비"를 다시 본다.
- **`src-tauri/tauri.conf.json: plugins.updater.pubkey is empty`**: 위 "업데이터 서명 키" 절차를 먼저 한다.
