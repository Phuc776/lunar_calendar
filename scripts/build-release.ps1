param([switch]$SkipInstall)
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    $package = Get-Content -LiteralPath 'package.json' -Raw | ConvertFrom-Json
    $version = $package.version
    $tauri = Get-Content -LiteralPath 'src-tauri/tauri.conf.json' -Raw | ConvertFrom-Json
    if ($version -ne $tauri.version) { throw 'Version trong package.json va Tauri khong khop.' }
    $cargo = Get-Content -LiteralPath 'src-tauri/Cargo.toml' -Raw
    if ($cargo -notmatch ('(?m)^version\s*=\s*"' + [regex]::Escape($version) + '"')) { throw 'Version Rust khong khop.' }
    if (-not $SkipInstall) {
        & npm.cmd ci
        if ($LASTEXITCODE -ne 0) { throw 'Cai dependency that bai.' }
    }
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'Kiem thu lich that bai.' }
    & npm.cmd run desktop:build
    if ($LASTEXITCODE -ne 0) { throw 'Build desktop that bai.' }

    New-Item -ItemType Directory -Path 'release' -Force | Out-Null
    Copy-Item -LiteralPath 'src-tauri/target/release/lich-am.exe' -Destination 'release/Lich-am.exe' -Force
    $installer = Get-ChildItem -LiteralPath 'src-tauri/target/release/bundle/nsis' -Filter ('*_' + $version + '_x64-setup.exe') | Select-Object -First 1
    if (-not $installer) { throw 'Khong tim thay bo cai NSIS.' }
    $installerName = 'Lich-am-' + $version + '-setup.exe'
    Copy-Item -LiteralPath $installer.FullName -Destination (Join-Path 'release' $installerName) -Force
    $hashes = Get-FileHash -LiteralPath 'release/Lich-am.exe',(Join-Path 'release' $installerName) -Algorithm SHA256
    $hashes | ForEach-Object { $_.Hash.ToLower() + '  ' + [IO.Path]::GetFileName($_.Path) } | Set-Content -LiteralPath 'release/SHA256SUMS.txt' -Encoding ascii
    $hashes | Format-Table
} finally { Pop-Location }
