# Builds the Windows installer and uploads it with its .sig to the draft release.
# Run from a Windows PC; the updater signing key comes from Credential Manager via
# scripts/load-updater-key-windows.ps1. latest.json is assembled afterwards by
# scripts/latest-json.mjs.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

. scripts/load-updater-key-windows.ps1 # TAURI_SIGNING_PRIVATE_KEY(_PASSWORD)

$repo = "bob-park/template-rust-app"
$version = (Get-Content src-tauri/tauri.conf.json -Raw | ConvertFrom-Json).version
$tag = "v$version"

# A published release that already has this platform's build is shipped: overwriting it would
# change what users installed without a version bump. (Adding a missing platform is fine.)
$shipped = gh release view $tag -R $repo --json isDraft,assets -q 'select(.isDraft == false) | .assets[].name | select(endswith("_x64-setup.exe"))' 2> $null
if ($shipped) { throw "$tag is already published with a Windows build ($shipped). Bump the version first (docs/release.md)." }

yarn tauri build
if ($LASTEXITCODE) { throw "tauri build failed" }

# Exact name: old versions' installers stay in target/ after a version bump. Get-Item throws if missing.
$setup = Get-Item "src-tauri/target/release/bundle/nsis/App_${version}_x64-setup.exe"
$sig = Get-Item "$($setup.FullName).sig"

gh release view $tag -R $repo *> $null
if ($LASTEXITCODE) {
  # --target main: the tag is cut from main, not the repo's default branch (often develop).
  gh release create $tag -R $repo --target main --draft --title "App $tag" --notes "App $tag"
  if ($LASTEXITCODE) { throw "could not create release $tag" }
}
gh release upload $tag -R $repo --clobber $setup.FullName $sig.FullName
if ($LASTEXITCODE) { throw "upload failed" }

Write-Host "Draft $tag updated with the Windows build."
Write-Host "After the macOS upload: node scripts/latest-json.mjs $tag, then gh release edit $tag -R $repo --draft=false"
