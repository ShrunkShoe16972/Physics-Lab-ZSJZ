param(
  [int]$Port = 4178,
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$listener = $null

for ($p = $Port; $p -lt $Port + 12; $p++) {
  try {
    $candidate = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $p)
    $candidate.Start()
    $listener = $candidate
    $Port = $p
    break
  } catch { }
}
if (-not $listener) {
  Write-Host '无法启动本地服务器，请检查端口占用。' -ForegroundColor Red
  exit 1
}

$url = "http://127.0.0.1:$Port/"
Write-Host ''
Write-Host '  Prism · 棱镜物理实验室' -ForegroundColor Cyan
Write-Host "  本地服务已启动：$url" -ForegroundColor White
Write-Host '  按 Ctrl+C 停止服务' -ForegroundColor DarkGray
Write-Host ''

if (-not $NoBrowser) {
  $browsers = @(
    'C:\Program Files\Google\Chrome\Application\chrome.exe',
    'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
  )
  $browser = $browsers | Where-Object { Test-Path $_ } | Select-Object -First 1
  try {
    if ($browser) {
      Start-Process -FilePath $browser -ArgumentList @(
        "--app=$url",
        '--window-size=1500,980',
        '--no-first-run',
        '--disable-features=Translate'
      ) | Out-Null
    } else {
      Start-Process $url | Out-Null
    }
  } catch {
    Write-Host "请手动在浏览器打开：$url" -ForegroundColor Yellow
  }
}

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.htm'  = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'
  '.ico'  = 'image/x-icon'
  '.txt'  = 'text/plain; charset=utf-8'
  '.woff2'= 'font/woff2'
}

function Send-Response($stream, [int]$status, [string]$reason, [string]$type, [byte[]]$body) {
  $header = "HTTP/1.1 $status $reason`r`nContent-Type: $type`r`nContent-Length: $($body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`nX-Content-Type-Options: nosniff`r`n`r`n"
  $hb = [System.Text.Encoding]::ASCII.GetBytes($header)
  $stream.Write($hb, 0, $hb.Length)
  if ($body.Length -gt 0) { $stream.Write($body, 0, $body.Length) }
  $stream.Flush()
}

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $client.ReceiveTimeout = 5000
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 2048, $true)
      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($requestLine)) { $client.Close(); continue }
      while ($true) {
        $line = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($line)) { break }
      }
      $parts = $requestLine.Split(' ')
      if ($parts.Length -lt 2 -or $parts[0] -ne 'GET') {
        Send-Response $stream 405 'Method Not Allowed' 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Method Not Allowed'))
        $client.Close(); continue
      }
      $rawPath = $parts[1].Split('?')[0]
      $decoded = [System.Uri]::UnescapeDataString($rawPath)
      if ($decoded -eq '/') { $decoded = '/index.html' }
      $relative = $decoded.TrimStart('/') -replace '/', [System.IO.Path]::DirectorySeparatorChar
      $full = [System.IO.Path]::GetFullPath((Join-Path $root $relative))
      if (-not $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
        Send-Response $stream 403 'Forbidden' 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Forbidden'))
        $client.Close(); continue
      }
      if (-not (Test-Path -LiteralPath $full -PathType Leaf)) {
        Send-Response $stream 404 'Not Found' 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Not Found'))
        $client.Close(); continue
      }
      $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
      $type = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($full)
      Send-Response $stream 200 'OK' $type $bytes
    } catch {
      # A dropped connection is normal while the browser reloads.
    } finally {
      try { $client.Close() } catch { }
    }
  }
} finally {
  try { $listener.Stop() } catch { }
}
