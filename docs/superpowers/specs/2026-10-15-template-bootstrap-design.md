# template-rust-app 부트스트랩 설계

## 의도

이 저장소는 Rust 데스크톱 앱(Tauri 2)을 시작하는 **템플릿 저장소**다. 사용자가 요구사항만 건네면 AI 에이전트(Claude Code 등)가 저장소의 구성, 규칙, 디자인 문서를 스스로 읽고 바로 구현을 시작할 수 있게 하는 것이 목표다.

그러려면 두 가지가 함께 있어야 한다.

1. **실제로 돌아가는 최소 앱 뼈대.** 에이전트가 빈 디렉터리가 아니라 동작하는 코드 위에 기능을 덧붙이게 한다.
2. **에이전트용 규칙 문서**(`AGENTS.md`, `CLAUDE.md`, `docs/agents/`). 무엇을 어디에 어떻게 만드는지, 빌드와 릴리스는 어떻게 하는지를 정한다.

참고 원본:
- 앱 구성, 빌드, 릴리스: `/Users/hwpark/Documents/rust-workspace/vee-app`. Tauri 2 + React 19 + Vite + TS 구성이며, 로컬에서 서명·공증해 릴리스하고 자동 업데이트를 지원한다.
- 규칙 문서 형식과 버전 bump 워크플로: `/Users/hwpark/Documents/intellij-workspace/template-malgn-spring-modulith`. `AGENTS.md` Map과 `docs/agents/` 주제별 문서로 규칙을 나누고, `CLAUDE.md`는 `@AGENTS.md`를 불러온다. 버전 bump는 `.github/workflows/SmartVersionBumpOnPR.yml`과 `bump-version.sh`로 한다.

작업 브랜치는 현재 브랜치 `main`이다(`master`에서 이름을 바꿨다).

## 목표

### 앱 뼈대

`yarn tauri dev` 한 번으로 아래가 모두 동작해야 한다.

- **화면**
  - 메인 창 하나에 **"Hello, world"**를 표시한다.
  - 같은 화면에 **테마 선택기**(라이트 / 다크 / 시스템)를 둔다.
- **스택**: View는 **React**, 스타일은 **Tailwind CSS + daisyUI**로 한다.
  - `docs/design/kraken-design.md`의 색·글꼴·radius 토큰으로 daisyUI 커스텀 테마 `light`와 `dark` 두 개를 정의한다.
  - kraken 문서에는 라이트 색만 있으므로 다크 값은 같은 브랜드 퍼플을 기준으로 빌더가 만든다.
  - "시스템"을 고르면 OS의 `prefers-color-scheme`을 따르고, OS 설정이 바뀌면 즉시 반영한다.
- **SQLite**
  - 앱 데이터 디렉터리에 DB를 만들고 `PRAGMA user_version`으로 마이그레이션한다.
  - `settings(key, value)` 테이블에 `greeting`(초기값 `"Hello, world"`)과 `theme`(초기값 `"system"`)을 둔다.
  - Hello 텍스트는 Rust command로 SQLite에서 읽어 온다. 테마 선택도 SQLite에 저장해 재시작 후에도 유지한다.
  - 이렇게 해서 프론트 → Rust → SQLite 왕복 경로를 보여 준다.
- **트레이**
  - 메뉴는 열기 / 업데이트 확인 / 종료다. 업데이트가 준비되면 "업데이트 확인"이 "업데이트 후 재시작"으로 바뀐다.
- **Dock 아이콘(macOS)**
  - 일반 앱처럼 Dock과 Cmd-Tab에 나타난다. vee-app의 `ActivationPolicy::Accessory`는 쓰지 않는다.
  - 예제 앱 아이콘을 하나 만들어 넣는다(`app-icon.svg` → `yarn tauri icon`). 트레이용 템플릿 아이콘 `icons/tray.png`도 예제로 하나 둔다.
  - 창을 닫으면 숨기고 앱은 계속 실행된다. Dock 아이콘을 클릭하면 숨긴 창을 다시 연다.
- **자동 업데이트**
  - release 빌드에서만 동작한다. 시작할 때 한 번, 이후 6시간마다 GitHub Releases의 `latest.json`을 확인한다.
  - 새 버전은 백그라운드에서 내려받는다. 설치는 트레이 메뉴로 사용자가 요청할 때만 한다.

### 개발 환경

- `.mise.toml`(Node, Yarn 고정), `.yarnrc.yml`, `.gitignore`
- `docs/development.md`

### 릴리스: vee-app 방식 그대로, 로컬에서

- `scripts/release.sh`: macOS Apple Silicon용으로 빌드·서명·공증하고 GitHub 초안 릴리스에 올린다.
- `scripts/release.ps1`: Windows NSIS로 빌드해 같은 릴리스에 올린다. vee-app과 똑같이 Windows 코드 서명은 하지 않고, 업데이터용 Tauri 서명(`.sig`)만 만든다. 공증은 macOS만 한다.
- `scripts/latest-json.mjs`(+ `latest-json.test.mjs`): 릴리스의 `.sig`를 모아 `latest.json`을 만들고 올린다.
- 절차는 `docs/release.md`에 적는다.
- 빌드와 릴리스용 CI는 없다.

### 버전 bump: GitHub Actions, spring 템플릿과 같은 기능

- `.github/workflows/bump-version.yml`
  - `develop`에 push될 때(PR 머지) 실행한다.
  - 머지 커밋에서 PR 번호를 찾고, PR 제목과 라벨로 bump 종류를 정한다.
    - `[major]` 또는 라벨 `major`: major
    - `[minor]` 또는 라벨 `minor`: minor
    - 그 외: patch
  - `bump-version-up.sh`를 실행하고, 바뀐 파일을 `chore: bump version to X.Y.Z [skip ci]`로 커밋해 `develop`에 push한다.
- `bump-version-up.sh`(저장소 루트)
  - 인자는 `patch|minor|major`이고 기본값은 `patch`다. spring의 `bump-version.sh`처럼 색상 출력과 오류 검사를 한다.
  - 버전은 `src-tauri/tauri.conf.json`에서 읽는다.
  - 새 버전을 `tauri.conf.json`, `package.json`, `src-tauri/Cargo.toml` 세 곳에 함께 쓴다. `Cargo.lock`도 갱신해 커밋에 포함한다.
- **버전 형식은 순수 semver `X.Y.Z`이고 초기값은 `0.0.1`이다.**
  - spring의 `-rcN-yyyyMMdd` 접미사와 `date` 타입은 쓰지 않는다. 사용자가 정한 것이며, 업데이터의 버전 비교가 항상 맞게 동작하게 하기 위해서다.
  - minor bump는 patch를 0으로, major bump는 minor와 patch를 0으로 되돌린다.

### 디자인 연결

- `docs/agents/design.md`와 `AGENTS.md`에 "UI 작업 전 `docs/design/`을 참고한다"고 명시한다.
- 테마 토큰은 daisyUI 테마 정의 한 곳에만 둔다. 컴포넌트에는 색을 하드코딩하지 않고 daisyUI 클래스와 테마 변수를 쓴다.

### 에이전트 규칙과 README

- `AGENTS.md`, `CLAUDE.md`, `docs/agents/**`
- README: 템플릿 소개와 "새 앱으로 만들 때 바꿀 것" 체크리스트

### 패키지 구조 (사용자 승인)

**프론트엔드**: `/Users/hwpark/Documents/webstorm-workspace/template-nextjs-app` 구조를 Tauri SPA에 맞게 옮긴다.

```
src/
├─ app/            # main.tsx, App.tsx, _layouts/ (App 전용 하위 컴포넌트)
├─ domain/<name>/
│  ├─ apis/        # <name>.ts (Tauri command 호출) + <name>.dto.ts
│  ├─ queries/     # React Query 훅
│  ├─ components/
│  └─ store/       # Zustand slice
├─ shared/         # api/ (invoke 래퍼·에러 타입), components/, providers/, hooks/, queries/, store/(rootStore)
└─ utils/          # 순수 함수만
```

- nextjs 템플릿과 다른 점은 `apis/`다. ky로 HTTP를 호출하는 대신 Tauri command를 호출한다.
- 예제 도메인은 `settings`(greeting, theme)다.
- 테마는 nextjs처럼 `shared/providers/theme/ThemeProvider.tsx`와 `shared/components/theme/ThemeSwitcher.tsx`에 둔다.
- nextjs 템플릿의 규칙을 함께 가져온다.
  - 경로 별칭 `@/`
  - 파일 이름 규칙(`*.dto.ts`, `PascalCase.tsx`, `useXxx.tsx`)
  - `_layouts/`
  - React 섹션 주석 순서. 단, Server Component 관련 부분은 제외한다.
  - 새 도메인은 하위 폴더 4개(`apis`, `queries`, `components`, `store`)를 모두 만든다.
- 추가 라이브러리는 nextjs 템플릿과 같은 것을 쓴다.
  - `@tanstack/react-query`(+ devtools)
  - `zustand`, `immer`, `classnames`
  - ESLint/Prettier: `@bob-park/eslint-config-bobpark`, `@bob-park/prettier-config-bobpark`
  - GitHub Packages 레지스트리를 쓴다. `.yarnrc.yml`의 `npmScopes`와 `GITHUB_NPM_AUTH_TOKEN` 설정도 nextjs와 같게 한다.

**백엔드(Rust)**: 프론트와 같은 도메인 이름으로 짝을 맞춘다.

```
src-tauri/src/
├─ main.rs
├─ lib.rs                 # 조립만: 플러그인, setup, command 등록
├─ app/                   # 앱 껍데기: state.rs, window.rs, tray.rs, updater.rs
├─ domain/<name>/
│  ├─ mod.rs
│  ├─ model.rs            # 타입·검증 (순수 Rust)
│  ├─ repository.rs       # 이 도메인의 SQL (&Connection을 받음)
│  └─ commands.rs         # #[tauri::command] 얇은 어댑터
└─ shared/
   ├─ db.rs               # DB 열기 + 마이그레이션 실행
   ├─ migrations/0001_init.sql …
   └─ error.rs            # AppError (thiserror) → { code, message }로 직렬화
```

규칙은 다음과 같다.

- **의존 방향은 한쪽으로만 흐른다.** `commands` → `model`/`repository` → `shared::db` 순서다.
  - `tauri`를 import하는 곳은 `commands.rs`, `app/`, `lib.rs`뿐이다.
  - 그래서 도메인 로직은 Tauri 없이 메모리 DB로 테스트할 수 있다.
- **도메인끼리 서로의 repository를 직접 쓰지 않는다.** 다른 도메인이 필요하면 그 도메인의 `mod.rs`가 공개한 함수만 쓴다.
- **`service.rs`는 처음부터 만들지 않는다.** 여러 repository를 묶는 로직이 생길 때 그 도메인에 추가한다.
- **마이그레이션은 파일 하나가 버전 하나다.** `include_str!`로 읽고 `PRAGMA user_version`으로 적용한다. 배포된 마이그레이션 파일은 고치지 않는다.
- **command 에러는 `AppError`로 반환한다.** 직렬화하면 `{ code, message }` 형태가 된다. 프론트의 `shared/api`는 이 형태를 `AppError` 타입으로 받는다.
- 추가 crate는 `thiserror` 하나다.

## 비목표

- vee-app에만 있는 기능은 넣지 않는다.
  - 클립보드 감시, 효과음, 여러 패널 창, 전역 단축키, 드래그
  - 새 소식 창, 디스크 접근 권한, 별도 설정 창, i18n
- 빌드와 릴리스 CI. GitHub Actions는 버전 bump에만 쓴다.
- 이름 바꾸기 자동화 스크립트. 바꿀 곳은 문서 체크리스트로 안내한다.
- Intel Mac과 Linux 지원
- 라이선스. LICENSE 파일을 두지 않고 `license` 필드도 넣지 않는다.

## 반목표 (돌아는 가도 실패로 보는 것)

- 에이전트가 `AGENTS.md`만 읽고는 어떤 문서를 봐야 할지 모른다.
- 규칙 문서가 뼈대 코드와 어긋난다. 문서에 적힌 구조, 명령, 파일명은 실제 저장소와 일치해야 한다.
- 뼈대에 "나중에 쓸" 빈 모듈이나 추상화가 들어간다. 뼈대는 위 목표를 동작시키는 최소 코드여야 한다.
- 비밀 값(서명 키, Apple 계정)이 저장소에 들어간다.

## 제약

- 버전은 vee-app을 따른다.
  - Rust edition 2024, Tauri 2.x, React 19, Vite, TypeScript
  - Yarn 4(`nodeLinker: node-modules`), mise
  - 구체 버전은 vee-app의 `package.json`, `Cargo.toml`, `.mise.toml`이 기준이다.
- Tailwind와 daisyUI는 현재 최신 메이저(Tailwind v4, daisyUI v5)를 쓰며, 구성은 공식 문서대로 한다.
- 서명 비밀 값은 `~/.config/<app-slug>/sign.env`에서 읽는다. Windows는 `%USERPROFILE%\.config\<app-slug>\sign.env`다. 키 이름은 vee-app과 같다.
- 업데이터 공개키(`plugins.updater.pubkey`)는 템플릿에서 비워 둔다.
  - 새 앱마다 `yarn tauri signer generate`로 키를 만들어 채우는 절차를 `docs/release.md`에 적는다.
  - `latest-json.mjs`의 "pubkey가 비어 있으면 중단" 검사는 유지한다.
- 버전의 기준은 `tauri.conf.json`이다. 세 파일을 사람이 손으로 고치지 않고 bump 스크립트로만 바꾼다.

## 사용자가 정한 것

- 실행되는 뼈대를 넣는다. 화면에 Hello world가 나와야 한다.
- 트레이, SQLite, 자동 업데이트를 넣는다.
- View는 React, CSS는 Tailwind + daisyUI로 한다.
- 테마는 라이트 / 다크 / 시스템 세 가지다.
- Dock 아이콘은 예제를 하나 만들어 넣는다.
- 릴리스는 vee-app처럼 내 장비에서 스크립트로 서명·공증해 GitHub에 올린다.
- 버전 bump는 `.github/workflows`로 하고 `develop` 브랜치를 기준으로 한다. 스크립트 이름은 `bump-version-up.sh`이고 spring 템플릿과 같은 기능을 한다.
- 버전 형식은 `0.0.1` 같은 순수 semver다.
- 라이선스는 넣지 않는다.
- `AGENTS.md`는 spring 템플릿을 참고해 규칙을 주제별 문서로 나눈다.
- 앱 디자인은 `./docs/design`을 참고하라고 적는다.
- `CLAUDE.md`를 넣고 `@AGENTS.md`로 연결한다.

## 내가 정한 것 (검토 시 확인해 주세요)

- **이름 자리표시자.** 실제로 빌드되는 값을 넣는다.
  - productName: `App`
  - identifier: `com.bobpark.app`
  - crate: `template-rust-app` / `template_rust_app_lib`
  - GitHub repo: `bob-park/template-rust-app`
  - sign.env 디렉터리: `~/.config/template-rust-app/`
  - 바꿀 위치 목록은 README와 `docs/agents/overview.md`에 둔다.
- **SQLite.** DB 열기와 마이그레이션은 `shared/db.rs`, 도메인 SQL은 `domain/<name>/repository.rs`에 둔다. 테스트는 메모리 DB(`Connection::open_in_memory`)나 `tempfile`로 한다.
- **플러그인.** `tauri-plugin-single-instance`, `tauri-plugin-log`, `tauri-plugin-updater`만 넣는다. 트레이는 `tray-icon` feature를 쓴다. 두 번째로 실행하면 기존 창을 연다.
- **트레이 라벨**은 영어다. i18n이 필요해지면 vee-app의 `i18n/` 패턴을 따르라고 규칙 문서에 적는다.
- **테마 적용.**
  - 저장값(`light|dark|system`)을 `<html data-theme>`에 반영한다. `system`이면 `matchMedia`로 OS 설정을 따른다.
  - 첫 화면 깜빡임을 줄이기 위해 테마는 React 마운트 전에 먼저 적용한다.
- **프론트 테스트**는 vee-app처럼 Node 내장 `node:test`로 한다(`yarn test`).
- **규칙 문서 언어.**
  - `docs/agents/`는 spring 템플릿처럼 영어로 쓴다.
  - `CLAUDE.md`의 Claude 전용 규칙, `docs/development.md`, `docs/release.md`는 vee-app처럼 한국어로 쓴다.
- **브랜치와 릴리스 흐름.**
  - 브랜치는 spring 템플릿을 따른다: `main` / `develop` / `feature/*` / `hotfix/*`. 기본 PR base는 `develop`이다.
  - 릴리스 절차:
    1. `develop`을 `main`으로 머지한다.
    2. `main`에서 `scripts/release.sh`와 `scripts/release.ps1`을 실행한다.
    3. `latest-json.mjs`를 실행한다.
    4. 릴리스를 게시한다.
  - 태그는 `v<X.Y.Z>`다.
- **`yarn tauri build`(번들 포함)**에는 서명 키가 필요하다. 키가 없을 때는 `--no-bundle`로 확인하라고 안내한다. `createUpdaterArtifacts`는 vee-app처럼 `true`로 둔다.
- **bump 워크플로 권한.** `develop`에 push하려면 `contents: write` 권한이 필요하다. 브랜치 보호가 걸려 있으면 추가 설정이 필요하다는 점을 `workflow/versioning.md`에 적는다.

## docs/agents 구성 (초안)

각 문서는 spring 템플릿과 같은 형식으로 시작한다. frontmatter(`title`, `scope`, `applies_to`, `related`)와 한 줄 TL;DR을 둔다.

- `overview.md`: 프로젝트 성격, 기술 스택과 버전, 새 앱으로 바꿀 때의 이름 체크리스트
- `architecture.md`: 프론트(React)와 Rust(Tauri)의 경계, `AppState`, command 흐름, 창·트레이·Dock·업데이터 수명주기
- `structure-dir.md`: 디렉터리 트리와 새 파일 위치
- `design.md`: UI 작업 시 `docs/design/` 참고, daisyUI 테마 토큰 규칙, 하드코딩 색 금지, 라이트·다크 모두 확인
- `conventions/rust-modules.md`: 기능별 `*.rs` 모듈, Tauri 비의존 로직 분리, command 경계의 에러 변환
- `conventions/tauri-commands.md`: command 작성과 등록, 프론트 호출은 `src/api.ts` 래퍼로만, 이벤트 이름(`<domain>://<event>`), capabilities
- `conventions/sqlite-store.md`: 스키마 버전 마이그레이션, 테스트
- `conventions/frontend.md`: React 컴포넌트 구조, Tailwind/daisyUI 사용 규칙
- `conventions/naming.md`
- `testing.md`: `cargo test --lib`, `yarn test`, `yarn typecheck`
- `build-run.md`: dev, build, `--no-bundle`
- `configuration.md`: `tauri.conf.json`, capabilities, sign.env(비밀 값 위치)
- `documentation.md`: `docs/superpowers/specs|plans`, `docs/design`
- `workflow/branching.md`, `workflow/commit-messages.md`, `workflow/pr.md`(PR 제목 → bump 매핑), `workflow/versioning.md`(semver, bump 스크립트와 워크플로), `workflow/release.md`(`docs/release.md` 요약과 링크)

`AGENTS.md`는 세 부분으로 구성한다: Map, 작업별 "How to use" 경로, Convention Enforcement 문단.

`CLAUDE.md`는 `@AGENTS.md` 아래에 Claude 전용 규칙을 덧붙인다. spring 템플릿 기준으로 Plan Mode, Skill Usage, Language, Dependency Changes 사전 확인, Destructive Operations 금지를 넣는다. Dependency Changes 규칙의 대상은 `Cargo.toml`과 `package.json`이다.

## 빌더에게 맡기는 것

- 각 규칙 문서의 구체적인 문구와 예시. 단, 실제 뼈대 코드와 일치해야 한다.
- 뼈대 코드의 세부 구현. vee-app의 `lib.rs`, `tray.rs`, `updater.rs`, `store.rs`를 위 패키지 구조에 맞게 나눠 가져오는 방식을 권장한다.
- 다크 테마의 구체적인 색 값
- `.gitignore` 정리. vee-app의 것에서 무관한 항목(Babelay, kiri 등)은 뺀다.

## 완료 기준

- `yarn install && yarn tauri dev`를 실행하면 아래가 모두 동작한다.
  - 창에 "Hello, world"가 뜬다.
  - 테마 선택이 바로 반영되고, 재시작한 뒤에도 유지된다.
  - 트레이 메뉴의 열기와 종료가 동작한다.
  - macOS Dock에 예제 아이콘이 보인다.
- `cargo test --manifest-path src-tauri/Cargo.toml --lib`, `yarn test`, `yarn typecheck`가 통과한다.
- `yarn tauri build --no-bundle`이 성공한다.
- `./bump-version-up.sh patch|minor|major`가 세 파일을 같은 값으로 올린다. 형식이 잘못된 버전이나 알 수 없는 인자는 오류로 끝난다.
- `AGENTS.md`의 모든 링크가 실제 파일을 가리킨다.

## 추가 요구 (2026-10-15, 구현 중 사용자 요청)

- **설정 화면을 추가하고, 기본 단축키는 `Cmd+,`다.** 위 비목표의 "별도 설정 창"을 대체한다.
- 내가 정한 것:
  - 별도 창(label `settings`, `create: false`, 480×360)으로 만들고, 닫으면 숨긴다.
  - **단축키:** 앱 메뉴에 "Settings…"(`CmdOrCtrl+,`)를 둔다. macOS 관례에 맞춰 앱이 포커스일 때만 동작하고, 전역 단축키는 쓰지 않는다.
  - **열 수 있는 다른 경로:** 트레이 메뉴에도 "Settings"를 둔다.
  - **테마 선택기 위치:** 설정 창으로 옮긴다. 메인 창에는 Hello만 남는다.
  - **창 간 테마 동기화:** `set_theme` 성공 시 Rust가 `settings://theme-changed`(payload: Theme)를 모든 창에 emit한다. 각 창의 프론트는 이를 받아 React Query 캐시를 갱신한다. 창마다 상태가 따로이기 때문이다.
  - **창 분기:** `main.tsx`에서 `getCurrentWindow().label`로 화면을 나눈다. `main`이면 `src/app/App.tsx`, `settings`면 `src/app/settings/SettingsApp.tsx`를 띄운다.
