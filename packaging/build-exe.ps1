$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$version = (Get-Content (Join-Path $root 'VERSION') -Raw).Trim()
$dist = Join-Path $root 'dist'
$build = Join-Path $PSScriptRoot '.build'
$stage = Join-Path $build 'stage'
$zip = Join-Path $build 'app.zip'
$csc = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'
$out = Join-Path $dist ("PrismLab-$version.exe")

if (-not (Test-Path $csc)) { throw "C# compiler not found: $csc" }
if (Test-Path $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
if (Test-Path $zip) { Remove-Item -LiteralPath $zip -Force }
New-Item -ItemType Directory -Force -Path $stage, $dist, $build | Out-Null

Copy-Item (Join-Path $root 'index.html') (Join-Path $stage 'index.html')
Copy-Item (Join-Path $root 'LICENSE') (Join-Path $stage 'LICENSE')
New-Item -ItemType Directory -Force -Path (Join-Path $stage 'assets') | Out-Null
Copy-Item (Join-Path $root 'assets\css') (Join-Path $stage 'assets\css') -Recurse
Copy-Item (Join-Path $root 'assets\js') (Join-Path $stage 'assets\js') -Recurse
Copy-Item (Join-Path $root 'assets\vendor') (Join-Path $stage 'assets\vendor') -Recurse
New-Item -ItemType Directory -Force -Path (Join-Path $stage 'assets\img') | Out-Null
Copy-Item (Join-Path $root 'assets\img\school-badge.png') (Join-Path $stage 'assets\img\school-badge.png')
Copy-Item (Join-Path $root 'assets\img\thumbs') (Join-Path $stage 'assets\img\thumbs') -Recurse
Copy-Item (Join-Path $root 'assets\img\backgrounds') (Join-Path $stage 'assets\img\backgrounds') -Recurse
Copy-Item (Join-Path $root 'assets\ppt') (Join-Path $stage 'assets\ppt') -Recurse

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($stage, $zip, [System.IO.Compression.CompressionLevel]::Optimal, $false)

$sources = @(
  (Join-Path $PSScriptRoot 'PrismLauncher.cs'),
  (Join-Path $PSScriptRoot 'AssemblyInfo.cs')
)

$arguments = @(
  '/nologo',
  '/target:winexe',
  '/platform:anycpu',
  '/optimize+',
  '/codepage:65001',
  ('/out:' + $out),
  ('/win32icon:' + (Join-Path $PSScriptRoot 'prism.ico')),
  '/r:System.Web.Extensions.dll',
  ('/win32manifest:' + (Join-Path $PSScriptRoot 'app.manifest')),
  ('/resource:' + $zip + ',PrismLab.app.zip'),
  '/reference:System.dll',
  '/reference:System.Core.dll',
  '/reference:System.Drawing.dll',
  '/reference:System.Windows.Forms.dll',
  '/reference:System.IO.Compression.dll',
  '/reference:System.IO.Compression.FileSystem.dll'
) + $sources

Write-Host "Compiling school physics lab portable app ..."
& $csc $arguments
if ($LASTEXITCODE -ne 0) { throw "Compilation failed with exit code $LASTEXITCODE" }

$hash = (Get-FileHash -LiteralPath $out -Algorithm SHA256).Hash
$size = (Get-Item -LiteralPath $out).Length
$readme = @"
中山市中山纪念中学物理实验室 v$version
便携版 · Windows 10 / 11

使用方法
1. 双击 PrismLab-$version.exe
2. 程序会自动在 Chrome / Edge 的应用窗口中打开实验室
3. 如果浏览器没有自动打开，可在系统托盘右键校徽图标，选择“打开实验室”或“复制访问地址”

说明
- 所有 HTML / CSS / JavaScript 资源都已封装在 exe 内，不需要联网。
- 运行状态优先保存在 %LOCALAPPDATA%\PrismLab；学习进度由浏览器的本地存储保存。
- 关闭浏览器窗口不会退出后台服务；请右键系统托盘中的校徽图标，选择“退出”。
- 由于没有购买代码签名证书，Windows SmartScreen 可能提示“未知发布者”。选择“更多信息 → 仍要运行”即可。

版本：$version
SHA-256：$hash

文件大小：$size bytes
"@
Set-Content -LiteralPath (Join-Path $dist '使用说明.txt') -Value $readme -Encoding UTF8

Write-Host ''
Write-Host "Built: $out" -ForegroundColor Green
Write-Host ("Size:  {0:N1} KB" -f ($size / 1024))
Write-Host "SHA256: $hash"
