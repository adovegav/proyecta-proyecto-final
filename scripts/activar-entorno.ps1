$projectRoot = Split-Path $PSScriptRoot -Parent
$localNode = Join-Path $projectRoot '.tools/node-v24.22.3-win-x64'
if (Test-Path (Join-Path $localNode 'node.exe')) {
    $env:Path = "$localNode;$env:Path"
} elseif ((& node --version) -notmatch '^v24\.') {
    throw 'Instala Node.js 24 LTS o prepara la versión portable en .tools.'
}
Write-Host "Node: $(node --version). Usa npm.cmd para evitar restricciones de npm.ps1."
