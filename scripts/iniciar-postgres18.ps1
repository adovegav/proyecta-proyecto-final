$ErrorActionPreference = 'Stop'
$pgCtl = 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe'
$pgData = 'C:\Program Files\PostgreSQL\18\data'
$projectRoot = Split-Path $PSScriptRoot -Parent
$logDirectory = Join-Path $projectRoot '.tools'
if (-not (Test-Path $pgCtl)) { throw 'No se encuentra PostgreSQL 18 en la ruta configurada.' }
& $pgCtl status -D $pgData
if ($LASTEXITCODE -eq 0) {
    Write-Host 'El cluster ya esta iniciado. Verifica puerto y version con npm.cmd run db:check desde backend.'
    exit 0
}
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
& $pgCtl start -D $pgData -l (Join-Path $logDirectory 'postgres18.log') -o '-p 5433 -h localhost' -w -t 15
if ($LASTEXITCODE -ne 0) { throw 'No se pudo iniciar PostgreSQL 18. Revisa .tools/postgres18.log.' }
