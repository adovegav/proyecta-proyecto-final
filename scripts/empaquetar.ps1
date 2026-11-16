$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$destination = Join-Path $projectRoot 'artifacts/entrega'
$stage = Join-Path $projectRoot ('artifacts/staging-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Force -Path $destination, $stage | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem
foreach ($project in @('backend', 'frontend')) {
    $files = & git -c "safe.directory=$($projectRoot.Replace('\','/'))" -C $projectRoot ls-files -- $project
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo leer la lista de archivos versionados.' }
    foreach ($file in $files) {
        if ($file -match '(^|/)(node_modules|dist|coverage)(/|$)' -or $file -match '(^|/)\.env$') { throw "Archivo no permitido: $file" }
        $target = Join-Path $stage $file
        New-Item -ItemType Directory -Force -Path (Split-Path $target -Parent) | Out-Null
        Copy-Item -LiteralPath (Join-Path $projectRoot $file) -Destination $target
    }
    Copy-Item -LiteralPath (Join-Path $projectRoot 'README.md') -Destination (Join-Path $stage "$project/GUIA_INSTALACION.md")
    $archive = Join-Path $destination "$project.zip"
    if (Test-Path $archive) { Remove-Item -LiteralPath $archive }
    [System.IO.Compression.ZipFile]::CreateFromDirectory((Join-Path $stage $project), $archive, [System.IO.Compression.CompressionLevel]::Optimal, $true)
    Write-Host "Generado: $archive"
}
Copy-Item -LiteralPath (Join-Path $projectRoot 'README.md') -Destination (Join-Path $destination 'GUIA_INSTALACION.md') -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'docs/API.md') -Destination (Join-Path $destination 'API.md') -Force
$hashes = Get-ChildItem -LiteralPath $destination -File | Where-Object { $_.Name -ne 'SHA256SUMS.txt' } | ForEach-Object {
    $hash = Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256
    "$($hash.Hash.ToLower())  $($_.Name)"
}
$hashes | Set-Content -LiteralPath (Join-Path $destination 'SHA256SUMS.txt') -Encoding UTF8
Write-Host 'Paquetes sin dependencias ni secretos. Extraer y verificar antes de entregar.'
