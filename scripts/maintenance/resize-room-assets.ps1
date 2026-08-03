<#
.SYNOPSIS
  Redimensiona os PNGs de cômodo para o tamanho em que são realmente exibidos.

.DESCRIPTION
  Os assets foram gerados em até 1254x1254 px, mas o CSS nunca os exibe acima de
  120x116 px. Cada PNG grande ocupa ~6 MB de memória DEPOIS de decodificado — o
  arquivo pode ter 1 MB, mas o bitmap na RAM é largura x altura x 4 bytes. Numa
  WebView de tablet com memória disputada, isso pesa muito mais que o download.

  Alvo: 384 px no lado maior para assets de cômodo (3x o tamanho exibido, folga
  confortável em telas de densidade 2x) e 768 px para a imagem da TV, que aparece
  maior no hub de mídia.

  Preserva: nome do arquivo, caminho, proporção e canal alfa (todos são RGBA).
  Não altera nenhuma linha de código.

.PARAMETER DryRun
  Mostra o que seria feito, sem escrever nada.

.EXAMPLE
  .\scripts\maintenance\resize-room-assets.ps1 -DryRun
  .\scripts\maintenance\resize-room-assets.ps1

.NOTES
  Rollback: git checkout pre-dashboard-architecture -- config/www/bruno-ui/assets/
#>
param([switch]$DryRun)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$repo    = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$assets  = Join-Path $repo 'config\www\bruno-ui\assets'

# Somente assets com referência ATIVA no código. Os demais (referenciados apenas
# em comentários de rollback) não são tocados — vão para _archive na Fase 3.
$roomAssets = @(
  'living-room-on','living-room-off','living-room-on-tight','living-room-off-tight',
  'couple-bedroom-on-generated-v3','couple-bedroom-off-generated-v3',
  'corridor-on-tight','corridor-off-tight',
  'kitchen-on-tight','kitchen-off-tight',
  'lavabo-on-tight','lavabo-off-tight',
  'marina-bedroom-on-tight','marina-bedroom-off-tight',
  'miguel-bedroom-on-tight','miguel-bedroom-off-tight',
  'office-on-tight','office-off-tight'
)
$plan = @{}
foreach ($a in $roomAssets) { $plan[$a] = 384 }
$plan['tcl-qled-mini-led-75'] = 768

$totalAntesKB = 0; $totalDepoisKB = 0; $ramAntes = 0.0; $ramDepois = 0.0

foreach ($name in ($plan.Keys | Sort-Object)) {
  $path = Join-Path $assets "$name.png"
  if (-not (Test-Path $path)) { Write-Host "  AUSENTE: $name.png" -ForegroundColor Yellow; continue }

  # Ler para memória primeiro: evita manter o arquivo bloqueado ao sobrescrever.
  $bytes = [System.IO.File]::ReadAllBytes($path)
  $ms    = New-Object System.IO.MemoryStream (,$bytes)
  $img   = [System.Drawing.Image]::FromStream($ms)

  $maxAlvo = $plan[$name]
  $maiorLado = [Math]::Max($img.Width, $img.Height)

  if ($maiorLado -le $maxAlvo) {
    Write-Host ("  ja pequeno   {0,-34} {1}x{2}" -f "$name.png", $img.Width, $img.Height) -ForegroundColor DarkGray
    $img.Dispose(); $ms.Dispose(); continue
  }

  $escala = $maxAlvo / $maiorLado
  $nw = [Math]::Max(1, [int][Math]::Round($img.Width  * $escala))
  $nh = [Math]::Max(1, [int][Math]::Round($img.Height * $escala))

  $kbAntes  = [math]::Round((Get-Item $path).Length / 1KB)
  $mbRamAntes  = [math]::Round($img.Width * $img.Height * 4 / 1MB, 2)
  $mbRamDepois = [math]::Round($nw * $nh * 4 / 1MB, 2)

  if ($DryRun) {
    Write-Host ("  [simulacao]  {0,-34} {1}x{2} -> {3}x{4}   RAM {5} -> {6} MB" -f `
      "$name.png", $img.Width, $img.Height, $nw, $nh, $mbRamAntes, $mbRamDepois)
    $totalAntesKB += $kbAntes; $ramAntes += $mbRamAntes; $ramDepois += $mbRamDepois
    $img.Dispose(); $ms.Dispose(); continue
  }

  $bmp = New-Object System.Drawing.Bitmap $nw, $nh, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g   = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $nw, $nh))
  $g.Dispose()

  $img.Dispose(); $ms.Dispose()

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()

  $kbDepois = [math]::Round((Get-Item $path).Length / 1KB)
  Write-Host ("  OK           {0,-34} {1}x{2} -> {3}x{4}   {5}KB -> {6}KB   RAM {7} -> {8} MB" -f `
    "$name.png", $img.Width, $img.Height, $nw, $nh, $kbAntes, $kbDepois, $mbRamAntes, $mbRamDepois) -ForegroundColor Green

  $totalAntesKB += $kbAntes; $totalDepoisKB += $kbDepois
  $ramAntes += $mbRamAntes;  $ramDepois += $mbRamDepois
}

Write-Host ""
Write-Host ("  Arquivo em disco : {0} KB -> {1} KB" -f $totalAntesKB, $totalDepoisKB)
Write-Host ("  RAM decodificada : {0} MB -> {1} MB" -f [math]::Round($ramAntes,1), [math]::Round($ramDepois,1))
if ($DryRun) { Write-Host "  (simulacao - nada foi escrito)" -ForegroundColor Yellow }
