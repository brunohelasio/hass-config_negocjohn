<#
.SYNOPSIS
  Normaliza os PNG de cômodo para que todos ocupem a mesma área visual.

.DESCRIPTION
  Os assets são renders 3D com proporções de 0,84 a 1,73. Numa caixa de proporção
  fixa com `object-fit: contain`, a largura renderizada varia de 67 a 120 px — os
  cômodos parecem ter tamanhos diferentes. Ver docs/07-design-system.md.

  Este script recoloca cada imagem numa tela QUADRADA comum e escala o conteúdo
  para que a ÁREA OPACA seja a mesma em todos. Área, não altura: é a área que o
  olho lê como "mesmo tamanho".

  Trava de segurança: nenhuma dimensão do conteúdo pode passar de MaxFill da tela.
  Sem isso, um objeto alto e estreito (a porta do Corredor) seria ampliado até
  estourar a caixa para compensar a área.

  Pares on/off do mesmo cômodo recebem SEMPRE a mesma escala, calculada pelo
  estado `off`. Escalas diferentes fariam a imagem "pular" ao acender.

.PARAMETER OutDir
  Escreve num diretório separado em vez de sobrescrever. Use para conferir antes.

.PARAMETER TargetArea
  Fração da tela que o conteúdo deve ocupar (padrão 0.42).

.EXAMPLE
  .\scripts\maintenance\normalize-room-assets.ps1 -OutDir tmp\preview\normalized
  .\scripts\maintenance\normalize-room-assets.ps1

.NOTES
  Rollback: git checkout pre-dashboard-architecture -- config/www/bruno-ui/assets/
#>
param(
  [string]$OutDir = '',
  [double]$TargetArea = 0.42,
  [int]$Canvas = 384,
  # Altura da tela. NÃO é quadrada: acompanha a proporção da caixa do ícone
  # (124 × 82 = 1,512). Tela quadrada virava 82×82 centralizada nos 124px, com
  # 21px de folga de cada lado — o objeto nunca encostava na esquerda, onde o
  # texto do cômodo começa. Com a proporção certa, o `contain` preenche a caixa
  # inteira e a borda esquerda do conteúdo cai exatamente na do texto.
  [int]$CanvasH = 254,
  # Fração máxima da tela que o conteúdo pode ocupar.
  #
  # Era 0.94 por precaução, mas a precaução não protegia de nada: como todas as
  # telas passam a ser quadradas e o `object-fit: contain` encaixa a tela inteira
  # na caixa do tile, encher mais a tela não corta conteúdo — só faz o objeto
  # aparecer maior. A margem estava impedindo o ajuste do Q. Casal, que já vinha
  # encostado no limite.
  [double]$MaxFill = 0.99
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$repo   = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$assets = Join-Path $repo 'config\www\bruno-ui\assets'

# Ajuste fino por cômodo, sobre a escala calculada.
#
# A normalização por área trata todos os objetos como equivalentes, mas o olho
# não lê assim: objetos de silhueta simples e alongada (uma cama vista de cima,
# uma porta) parecem menores que objetos de silhueta cheia com a MESMA área.
#
# Este é o mesmo papel que `iconScale` terá em rooms.config.ts — calibrar no
# olho sem tocar em código nem regerar imagem. Ajustado a pedido do usuário
# em 2026-08-03.
# NOTA (2026-08-03): os fatores foram recalibrados depois de a caixa do icone
# ser corrigida de 94x94 para 124x82. A primeira calibracao foi feita contra a
# geometria errada, entao o Q. Casal (x1,15) ficou grande demais na caixa real.
# O Q. Casal NAO tem ajuste, de proposito.
#
# Ele foi reduzido tres vezes (1,15 -> 1,05 -> 0,95 -> 0,85) com base em
# avaliacao visual de um arquivo que o componente NAO exibia: o tile montava o
# caminho por convencao e carregava couple-bedroom-on-tight.png (orfao, 487x277,
# nunca processado) no lugar de couple-bedroom-on-generated-v3.png. As tres
# avaliacoes foram sobre a imagem errada e por isso foram descartadas.
#
# Corredor e Office ficam: foram julgados sobre os arquivos realmente exibidos.
$AJUSTE = @{
  'Corredor' = 1.12
  'Office'   = 0.94
}

# Pares on/off por cômodo. A escala vem do `off` e vale para os dois.
$PARES = @(
  @{ room = 'Sala';      off = 'living-room-off-tight';            on = 'living-room-on-tight' },
  @{ room = 'Office';    off = 'office-off-tight';                 on = 'office-on-tight' },
  @{ room = 'Cozinha';   off = 'kitchen-off-tight';                on = 'kitchen-on-tight' },
  @{ room = 'Lavabo';    off = 'lavabo-off-tight';                 on = 'lavabo-on-tight' },
  @{ room = 'Corredor';  off = 'corridor-off-tight';               on = 'corridor-on-tight' },
  @{ room = 'Q. Casal';  off = 'couple-bedroom-off-generated-v3';  on = 'couple-bedroom-on-generated-v3' },
  @{ room = 'Q. Marina'; off = 'marina-bedroom-off-tight';         on = 'marina-bedroom-on-tight' },
  @{ room = 'Q. Miguel'; off = 'miguel-bedroom-off-tight';         on = 'miguel-bedroom-on-tight' }
)

function Read-Bitmap([string]$path) {
  $bytes = [System.IO.File]::ReadAllBytes($path)
  $ms = New-Object System.IO.MemoryStream (,$bytes)
  $img = [System.Drawing.Image]::FromStream($ms)
  $bmp = New-Object System.Drawing.Bitmap($img)
  $img.Dispose(); $ms.Dispose()
  return $bmp
}

# Retângulo do conteúdo opaco + contagem de pixels opacos.
function Measure-Ink([System.Drawing.Bitmap]$bmp) {
  $w = $bmp.Width; $h = $bmp.Height
  $rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
  $data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly,
                        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $stride = $data.Stride
  $buf = New-Object byte[] ($stride * $h)
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $buf, 0, $buf.Length)
  $bmp.UnlockBits($data)

  $minX = $w; $minY = $h; $maxX = -1; $maxY = -1; $ink = 0
  for ($y = 0; $y -lt $h; $y++) {
    $row = $y * $stride
    for ($x = 0; $x -lt $w; $x++) {
      if ($buf[$row + $x*4 + 3] -gt 24) {
        $ink++
        if ($x -lt $minX) { $minX = $x }; if ($x -gt $maxX) { $maxX = $x }
        if ($y -lt $minY) { $minY = $y }; if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  return @{ X = $minX; Y = $minY; W = ($maxX - $minX + 1); H = ($maxY - $minY + 1); Ink = $ink }
}

$destRoot = if ($OutDir) { Join-Path $repo $OutDir } else { $assets }
if ($OutDir -and -not (Test-Path $destRoot)) { New-Item -ItemType Directory -Path $destRoot -Force | Out-Null }

$alvoInk = $Canvas * $CanvasH * $TargetArea

Write-Host ''
Write-Host ("  {0,-11} {1,-13} {2,9} {3,8} {4,9}" -f 'COMODO','CONTEUDO','AREA ORIG','ESCALA','AREA FINAL')
Write-Host ('  ' + ('-' * 56))

foreach ($p in $PARES) {
  $srcOff = Join-Path $assets "$($p.off).png"
  if (-not (Test-Path $srcOff)) { Write-Host "  AUSENTE: $($p.off)"; continue }

  $bOff = Read-Bitmap $srcOff
  $m = Measure-Ink $bOff

  # Escala que iguala a area opaca...
  $escala = [Math]::Sqrt($alvoInk / [double]$m.Ink)
  # ...com o ajuste fino do comodo, quando houver...
  $fator = if ($AJUSTE.ContainsKey($p.room)) { $AJUSTE[$p.room] } else { 1.0 }
  $escala = $escala * $fator
  # ...e limitada para o conteudo nao estourar a tela.
  $maxPorLargura = ($Canvas * $MaxFill) / $m.W
  $maxPorAltura  = ($CanvasH * $MaxFill) / $m.H
  $escala = [Math]::Min($escala, [Math]::Min($maxPorLargura, $maxPorAltura))

  $areaFinal = [Math]::Round(100 * ($m.Ink * $escala * $escala) / ($Canvas * $CanvasH))
  $marca = if ($fator -ne 1.0) { (" x{0:N2}" -f $fator) } else { '' }
  Write-Host ("  {0,-11} {1,-13} {2,8}% {3,8:N2} {4,8}%{5}" -f `
    $p.room, ("{0}x{1}" -f $m.W, $m.H),
    [Math]::Round(100 * $m.Ink / ($bOff.Width * $bOff.Height)), $escala, $areaFinal, $marca)

  foreach ($estado in @('off','on')) {
    $nome = $p[$estado]
    $src = Join-Path $assets "$nome.png"
    if (-not (Test-Path $src)) { continue }

    $bmp = if ($estado -eq 'off') { $bOff } else { Read-Bitmap $src }
    # O recorte vem do proprio estado, mas a ESCALA e a mesma do par.
    $mi = if ($estado -eq 'off') { $m } else { Measure-Ink $bmp }

    $nw = [Math]::Max(1, [int][Math]::Round($mi.W * $escala))
    $nh = [Math]::Max(1, [int][Math]::Round($mi.H * $escala))

    $out = New-Object System.Drawing.Bitmap $Canvas, $CanvasH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($out)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $destRect = New-Object System.Drawing.Rectangle `
      0, ([int](($CanvasH - $nh) / 2)), $nw, $nh
    $srcRect = New-Object System.Drawing.Rectangle $mi.X, $mi.Y, $mi.W, $mi.H
    $g.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $out.Save((Join-Path $destRoot "$nome.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $out.Dispose()
    if ($estado -eq 'on') { $bmp.Dispose() }
  }
  $bOff.Dispose()
}

Write-Host ''
Write-Host ("  tela comum: {0}x{0}  ·  area alvo: {1}%  ·  destino: {2}" -f `
  $Canvas, [Math]::Round($TargetArea * 100), $(if ($OutDir) { $OutDir } else { 'assets (SOBRESCRITO)' }))
