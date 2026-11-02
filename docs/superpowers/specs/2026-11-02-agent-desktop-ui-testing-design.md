# agent-desktop UI 테스트 가이드 + rustfmt 설정 + AI 작업 폴더 ignore

- 날짜: 2026-11-02
- 브랜치: 현재 브랜치(`main`)에서 작업
- 크기: 작은 변경 (짧은 설계)

## 의도

`~/Downloads/AGENTS.md`의 agent-desktop UI/UX 테스트 가이드를 이 템플릿의 문서 체계에 맞게 넣는다. 템플릿으로 만든 모든 앱이 손대지 않고 그대로 쓸 수 있어야 한다. 함께 Rust 포맷 설정(`rustfmt.toml`)을 들이고, AI 도구가 로컬에 남기는 폴더를 git에서 제외한다.

## 목표 / 비목표

- 목표: 에이전트가 agent-desktop으로 앱을 띄우고, 관찰 → 조작 → 검증하고, 결과를 남기는 방법을 하나의 규칙 문서로 제공한다.
- 목표: 앱 이름·번들 ID를 문서에 박지 않는다. `src-tauri/tauri.conf.json`에서 읽는다.
- 목표: Rust 코드 포맷을 `cargo fmt`로 통일하고 필수 검사에 넣는다.
- 비목표: 기존 UI의 접근성 문제를 이번에 고치는 것. 발견하면 메모만 남긴다.
- 비목표: CI에 검사를 추가하는 것(현재 CI는 `bump-version.yml`뿐).
- 안티골: AGENTS.md가 긴 본문으로 불어나는 것. 원본에 있던 `pnpm`, `npm install -g` 같은 이 프로젝트와 맞지 않는 명령이 남는 것.

## 접근 방법 (검토한 것)

- **A. 주제별 문서 + AGENTS.md에는 링크 (선택)**: `docs/agents/documentation.md` 규칙과 일치하고, 필요할 때만 읽힌다.
- B. AGENTS.md에 본문 직접 삽입: 86줄 → 약 250줄. 모든 작업에 로드되고 "지도" 구조를 깬다.
- C. `.claude/skills/` 스킬: Claude 전용이라 에이전트 무관 원칙과 맞지 않는다.

## 결정된 내용

### 1. `docs/agents/ui-testing.md` (새 파일, 영어)
- frontmatter(`title`, `scope`, `applies_to`, `related`: build-run, testing, design, i18n) + `# Title` + TL;DR 한 줄.
- 원본 1~7장을 옮기되 아래를 바꾼다.
  - "0. 프로젝트 설정" 표 삭제 → 시작 시 값 읽기:
    - macOS/Linux: `APP_NAME=$(jq -r .productName src-tauri/tauri.conf.json)`, `BUNDLE_ID=$(jq -r .identifier src-tauri/tauri.conf.json)`
    - Windows: `(Get-Content src-tauri/tauri.conf.json | ConvertFrom-Json).productName` / `.identifier`
  - `pnpm tauri dev/build` → `yarn tauri dev` / `yarn tauri build` (mise 경유, `docs/agents/build-run.md` 링크).
  - 설치: `npm install -g agent-desktop`은 mise Node 위에서 한다고 명시(`mise exec -- npm install -g agent-desktop`).
  - 접근성 규칙: 접근성 이름(`aria-label` 등)도 사용자에게 보이는 문구이므로 `src/shared/i18n/{en,ko}.ts`에서 가져온다(하드코딩 금지).
  - 시나리오 위치 `docs/ui-scenarios/`, 결과 위치 `.ui-test-results/<YYYYMMDD-HHmm>/report.md`.
  - 다크/라이트 + ko/en 확인 규칙(design.md)과 연결.

### 2. `AGENTS.md`
- Map의 Ops 아래에 `UI Testing` 한 줄.
- How to use에 "앱 UI를 직접 보고 조작/테스트할 때" 경로 한 줄.
- 마지막 "four checks" → "five checks".

### 3. `docs/ui-scenarios/` P0 기본 시나리오 7개
원본 5장 형식(우선순위, 전제조건, 단계, 기대 결과, UX 확인 포인트)으로 한 파일씩. 이 템플릿의 실제 기능에 맞춘다.
- `01-launch-quit.md`: 실행 → 메인 창 → 종료(트레이/메뉴 Quit)
- `02-window-behavior.md`: 리사이즈, 최소화·복원, 이동
- `03-keyboard.md`: Tab/Enter/Esc로 주요 동작
- `04-settings-persist.md`: 설정 창에서 greeting/theme/language/auto-update 변경 → 재시작 후 유지
- `05-error-display.md`: 잘못된 입력 시 오류 메시지
- `06-theme.md`: 라이트/다크 대비 (screenshot)
- `07-update-check.md`: 업데이트 확인 UI 응답

시나리오 문서는 사람·에이전트 공용이며 영어로 쓴다(`docs/agents/`와 같은 기준). 기대 문구는 i18n 키와 en/ko 문구를 함께 적는다.

### 4. `src-tauri/rustfmt.toml` (새 파일)
```toml
edition = "2024"
max_width = 100
newline_style = "Unix"
```
- stable 옵션만. nightly 전용 옵션은 넣지 않는다.
- `cargo fmt --manifest-path src-tauri/Cargo.toml`로 기존 코드 정리(현재 33곳 차이). 동작 변경 없음. 별도 커밋(`style:` 또는 프로젝트 커밋 규칙의 해당 prefix).
- 필수 검사에 `cargo fmt --manifest-path src-tauri/Cargo.toml --check` 추가: `docs/agents/testing.md`(표 + TL;DR "four" → "five"), `CLAUDE.md` 검증 목록, `docs/development.md`에 테스트 명령이 있으면 거기도.

### 5. `.gitignore`
"AI / agent local workspaces" 섹션 추가. 기존 `.superpowers/` 항목은 이 섹션으로 옮긴다.
```
.superpowers/
.taste-skill/
.claude/
.gstack/
.context/
.playwright-mcp/
.ui-test-results/
```
- `.claude/` 전체 제외는 사용자 요청. 현재 추적 중인 `.claude/` 파일은 없다. 나중에 팀이 공유할 `.claude/settings.json`이나 프로젝트 스킬을 커밋하려면 이 항목을 `.claude/settings.local.json` 정도로 좁혀야 한다(문서에 한 줄 남김).

## 빌더에게 맡기는 것
- 문서 문장 다듬기, 시나리오별 세부 단계(실제 화면을 보고 i18n 키 확인).
- 커밋 분리 단위(문서 / rustfmt+포맷 / gitignore), 커밋 prefix는 `docs/agents/workflow/commit-messages.md`를 따른다.

## 완료 기준
- `cargo test --manifest-path src-tauri/Cargo.toml --lib`, `cargo fmt --manifest-path src-tauri/Cargo.toml --check`, `yarn test`, `yarn typecheck`, `yarn lint` 모두 통과.
- `jq -r .productName src-tauri/tauri.conf.json`이 `App`을 출력.
- UI 코드는 바꾸지 않으므로 앱 화면 확인은 필요 없음(선택: agent-desktop으로 01 시나리오 한 번 실행해 문서 명령이 실제로 동작하는지 확인).
