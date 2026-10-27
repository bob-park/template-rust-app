# template-rust-app

Tauri 2 데스크톱 앱 템플릿이다. Rust와 React(TypeScript)로 만든다. 요구사항만 건네면 AI 에이전트가 [AGENTS.md](AGENTS.md)의 구성과 규칙을 읽고 바로 구현을 시작할 수 있게 구성했다.

처음부터 들어 있는 것:

- **메인 창**: "Hello, world". 문구는 SQLite에서 읽어 온다.
- **설정 창** (`Cmd+,` / `Ctrl+,`). vee-app 스타일의 탭으로 나뉜다.
  - 일반: 테마(시스템/라이트/다크), 언어(시스템/한국어/English), 로그인 시 자동 실행
  - 업데이트: 현재 버전, 업데이트 확인, 자동 업데이트 켜기·끄기
- **트레이 메뉴**: 열기, 설정, 업데이트 확인, 종료. Dock 아이콘(macOS)도 보인다.
- **자동 업데이트**: GitHub Releases의 `latest.json`을 확인한다.
- **다국어**(한국어/영어): 화면과 트레이·앱 메뉴에 모두 적용된다.
- **릴리스 스크립트**: macOS는 서명·공증까지, Windows는 업데이터 서명만 하고 GitHub 릴리스에 올린다.
- **버전 자동 올림**: `develop`에 PR이 머지되면 GitHub Actions가 버전을 올린다.

기술 스택:

- 앱: Tauri 2, React 19, Vite, Tailwind CSS 4 + daisyUI 5
- 상태와 데이터: React Query, Zustand, SQLite(rusqlite)
- 도구: mise, Yarn 4

## 빠른 시작

```bash
mise install
export GITHUB_NPM_AUTH_TOKEN=<GitHub PAT, read:packages>
yarn install
yarn tauri dev
```

- [개발 환경 구성과 빌드](docs/development.md)
- [릴리스 절차](docs/release.md)
- [에이전트 가이드 (AGENTS.md)](AGENTS.md): 구조, 규칙, 워크플로
- [디자인](docs/design/): 모든 UI 작업 전에 본다

## 새 앱으로 만들 때 바꿀 것

자리표시자 이름은 `App` / `com.bobpark.app` / `template-rust-app` / `bob-park/template-rust-app`이다.

- [ ] `package.json`: `name`
- [ ] `src-tauri/Cargo.toml`: `[package] name`, `[lib] name` (`template_rust_app_lib`)
- [ ] `src-tauri/src/main.rs`: `template_rust_app_lib::run()`의 lib 이름
- [ ] `src-tauri/tauri.conf.json`:
  - `productName`, `identifier`, 창 `title`
  - `plugins.updater.endpoints`의 저장소 경로
  - `plugins.updater.pubkey`: [릴리스 절차](docs/release.md#처음-한-번)에서 생성
- [ ] `scripts/build-mac.sh`, `scripts/release.sh`, `scripts/release.ps1`, `scripts/latest-json.mjs`:
  - `REPO`
  - `~/.config/template-rust-app/sign.env` 경로
  - 번들 파일 이름의 `App_` / `App.app` 접두어 (productName과 같아야 한다)
  - 릴리스 제목 `App $TAG`
- [ ] `bump-version-up.sh`: `CRATE_NAME` (Cargo.lock의 패키지 이름)
- [ ] `index.html`: `<title>`
- [ ] `src/shared/store/rootStore.ts`: zustand devtools의 `name`
- [ ] `app-icon.svg`를 바꾼 뒤 `yarn tauri icon app-icon.svg`를 실행한다. 트레이 아이콘은 `src-tauri/icons/tray.png`(macOS 템플릿 이미지)다.
- [ ] `docs/design/`: 앱 디자인 문서
- [ ] `src/shared/i18n/*.ts`, `src-tauri/src/app/i18n.rs`: 앱 문구

## GitHub 설정

- [ ] `develop` 브랜치를 만든다. PR은 기본으로 `develop`을 향하게 한다([브랜치 규칙](docs/agents/workflow/branching.md)).
- [ ] Settings → Actions → General → Workflow permissions를 **Read and write**로 설정한다. `bump-version.yml`이 `develop`에 push하려면 필요하다.
  - `develop`에 브랜치 보호가 있으면 GitHub Actions가 push할 수 있도록 예외를 둔다.
- [ ] `@bob-park/*` 패키지를 받으려면 개발자마다 `GITHUB_NPM_AUTH_TOKEN`이 필요하다(`read:packages`).
