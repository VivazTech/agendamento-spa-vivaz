# Script para criar a pasta public e copiar o ícone
if (-not (Test-Path "public")) {
    New-Item -ItemType Directory -Path "public"
    Write-Host "Pasta public criada"
}

if (Test-Path "favicon-marrom.png") {
    Copy-Item "favicon-marrom.png" "public\favicon-marrom.png" -Force
    Write-Host "Arquivo favicon-marrom.png copiado para public/"
} else {
    Write-Host "Arquivo favicon-marrom.png não encontrado na raiz"
}

