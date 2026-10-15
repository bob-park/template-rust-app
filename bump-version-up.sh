#!/bin/bash
# Bumps the app version (semver X.Y.Z) in every file that carries it.
# Usage: ./bump-version-up.sh [patch|minor|major]   (default: patch)
# Run by .github/workflows/bump-version.yml on every merge into develop.
set -euo pipefail
cd "$(dirname "$0")"

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

TAURI_CONF="src-tauri/tauri.conf.json"
PACKAGE_JSON="package.json"
CARGO_TOML="src-tauri/Cargo.toml"
CARGO_LOCK="src-tauri/Cargo.lock"
CRATE_NAME="template-rust-app"

for f in "$TAURI_CONF" "$PACKAGE_JSON" "$CARGO_TOML" "$CARGO_LOCK"; do
    if [ ! -f "$f" ]; then
        echo -e "${RED}Error: $f 파일을 찾을 수 없습니다.${NC}"
        exit 1
    fi
done

# 현재 버전 추출 (tauri.conf.json 이 기준)
current_version=$(perl -ne 'if (/^\s*"version":\s*"([^"]*)"/) { print $1; exit }' "$TAURI_CONF")

if [ -z "$current_version" ]; then
    echo -e "${RED}Error: 버전 정보를 찾을 수 없습니다.${NC}"
    exit 1
fi

echo -e "${YELLOW}현재 버전: $current_version${NC}"

# 버전 파싱 (예: 0.0.1)
if [[ $current_version =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    major=${BASH_REMATCH[1]}
    minor=${BASH_REMATCH[2]}
    patch=${BASH_REMATCH[3]}
else
    echo -e "${RED}Error: 버전 형식이 올바르지 않습니다. (예: 0.0.1)${NC}"
    exit 1
fi

update_type=${1:-patch}

case $update_type in
    "patch") new_version="${major}.${minor}.$((patch + 1))" ;;
    "minor") new_version="${major}.$((minor + 1)).0" ;;
    "major") new_version="$((major + 1)).0.0" ;;
    *)
        echo -e "${RED}Error: 잘못된 업데이트 타입입니다. [patch|minor|major]${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}새로운 버전: $new_version${NC}"

export NEW_VERSION="$new_version" CRATE_NAME
# First top-level "version" only: dependency entries never use that key.
perl -i -pe 'if (!$done && s/^(\s*"version":\s*)"[^"]*"/$1"$ENV{NEW_VERSION}"/) { $done = 1 } $done = 0 if eof' "$TAURI_CONF" "$PACKAGE_JSON"
# [package] comes first in Cargo.toml; dependency tables use inline `version =` after a name.
perl -i -pe 'if (!$done && s/^version = "[^"]*"/version = "$ENV{NEW_VERSION}"/) { $done = 1 }' "$CARGO_TOML"
perl -0 -i -pe 's/(name = "\Q$ENV{CRATE_NAME}\E"\nversion = )"[^"]*"/$1"$ENV{NEW_VERSION}"/' "$CARGO_LOCK"

echo -e "${GREEN}✅ 버전이 성공적으로 업데이트되었습니다!${NC}"
echo -e "${YELLOW}$current_version → $new_version${NC}"
