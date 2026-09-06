param([string]$BlenderPath = '')
$ErrorActionPreference = 'Stop'
if (-not $BlenderPath) {
  $installed = 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
  $BlenderPath = if (Test-Path -LiteralPath $installed) { $installed } else { "$PSScriptRoot\..\.tools\blender-4.5.0-windows-x64\blender.exe" }
}
if (-not (Test-Path -LiteralPath $BlenderPath)) { throw 'Blender não encontrado. Passe -BlenderPath com o caminho do executável.' }
Push-Location (Join-Path $PSScriptRoot '..')
try {
  & $BlenderPath --background --python-exit-code 1 --python scripts/blender/build_city.py
  if ($LASTEXITCODE -ne 0) { throw 'Falha na exportação Blender.' }
  node scripts/optimize-assets.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Falha na otimização GLB.' }
} finally { Pop-Location }
