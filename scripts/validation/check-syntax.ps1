<#
.SYNOPSIS
  Verifica a sintaxe de todos os arquivos JS do dashboard com `node --check`.

.DESCRIPTION
  Este é o detector correto para a classe de erro que já derrubou o dashboard
  quatro vezes: crase dentro de comentário em template literal. Diferente da
  heurística em Perl (que produz falsos positivos), `node --check` faz o parse
  real e só acusa erro quando o arquivo realmente não compila.

  Rode ANTES de pedir validação visual. Se um arquivo falhar aqui, ele falharia
  no navegador — e no tablet o sintoma aparece como "erro de configuração" ou
  como o tema silenciosamente voltando ao anterior.

.EXAMPLE
  .\scripts\validation\check-syntax.ps1
  .\scripts\validation\check-syntax.ps1 -Path config\www\bruno-ui\subviews
#>
param(
  [string]$Path = "config\www"
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$target = Join-Path $repo $Path

# O winget instala em escopo de usuário e só atualiza o PATH em shells novos.
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
  $pkg = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" `
    -Filter "OpenJS.NodeJS*" -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($pkg) {
    $node = (Get-ChildItem $pkg.FullName -Recurse -Filter node.exe -ErrorAction SilentlyContinue |
             Select-Object -First 1).FullName
  }
}
if (-not $node) {
  Write-Host "node.exe nao encontrado. Instale com: winget install OpenJS.NodeJS.LTS --scope user" -ForegroundColor Red
  exit 2
}

$files = Get-ChildItem $target -Recurse -Filter *.js -File
$failures = @()

foreach ($f in $files) {
  $out = & $node --check $f.FullName 2>&1
  if ($LASTEXITCODE -ne 0) {
    $failures += [pscustomobject]@{
      File  = $f.FullName.Substring($repo.Length + 1)
      Error = ($out | Select-Object -First 3) -join ' '
    }
  }
}

Write-Host ""
Write-Host ("Arquivos verificados : {0}" -f $files.Count)
Write-Host ("Sintaxe OK           : {0}" -f ($files.Count - $failures.Count))

if ($failures.Count -eq 0) {
  Write-Host "Com erro             : 0" -ForegroundColor Green
  exit 0
}

Write-Host ("Com erro             : {0}" -f $failures.Count) -ForegroundColor Red
Write-Host ""
$failures | ForEach-Object {
  Write-Host ("  {0}" -f $_.File) -ForegroundColor Red
  Write-Host ("      {0}" -f $_.Error) -ForegroundColor DarkGray
}
exit 1
