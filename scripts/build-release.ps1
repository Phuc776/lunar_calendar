$ErrorActionPreference = 'Stop'
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'Cai dependency that bai.' }
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'Kiem thu lich that bai.' }
    & npm.cmd run desktop:build
    if ($LASTEXITCODE -ne 0) { throw 'Build desktop that bai.' }

    New-Item -ItemType Directory -Path 'release' -Force | Out-Null
    Copy-Item -LiteralPath 'src-tauri/target/release/lich-am.exe' -Destination 'release/Lich-am.exe' -Force
    $installer = Get-ChildItem -LiteralPath 'src-tauri/target/release/bundle/nsis' -Filter '*-setup.exe' | Select-Object -First 1
    if (-not $installer) { throw 'Khong tim thay bo cai NSIS.' }
    Copy-Item -LiteralPath $installer.FullName -Destination 'release/Lich-am-1.0.0-setup.exe' -Force
    Get-FileHash -LiteralPath 'release/Lich-am.exe','release/Lich-am-1.0.0-setup.exe' -Algorithm SHA256 | Format-Table
} finally { Pop-Location }
