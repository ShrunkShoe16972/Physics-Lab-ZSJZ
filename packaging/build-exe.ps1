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
  '/platform:x64',
  '/optimize+',
  '/codepage:65001',
  ('/out:' + $out),
  ('/win32icon:' + (Join-Path $PSScriptRoot 'prism.ico')),
  '/r:System.Web.Extensions.dll',
  ('/r:' + (Join-Path $PSScriptRoot 'webview2\Microsoft.Web.WebView2.Core.dll')),
  ('/r:' + (Join-Path $PSScriptRoot 'webview2\Microsoft.Web.WebView2.WinForms.dll')),
  ('/resource:' + (Join-Path $PSScriptRoot 'webview2\Microsoft.Web.WebView2.Core.dll') + ',PrismLab.WebView2.Core.dll'),
  ('/resource:' + (Join-Path $PSScriptRoot 'webview2\Microsoft.Web.WebView2.WinForms.dll') + ',PrismLab.WebView2.WinForms.dll'),
  ('/resource:' + (Join-Path $PSScriptRoot 'webview2\WebView2Loader.dll') + ',PrismLab.WebView2Loader.dll'),
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

$signingCert = Get-ChildItem Cert:\CurrentUser\My -ErrorAction SilentlyContinue | Where-Object { $_.FriendlyName -eq 'PrismLab Code Signing 0.7' } | Select-Object -First 1
if ($signingCert) {
  $signature = Set-AuthenticodeSignature -FilePath $out -Certificate $signingCert -HashAlgorithm SHA256
  Write-Host ("Signed: " + $signature.Status + " · " + $signingCert.Thumbprint)
} else {
  Write-Host 'Signing certificate not found; EXE left unsigned.' -ForegroundColor Yellow
}

$hash = (Get-FileHash -LiteralPath $out -Algorithm SHA256).Hash
$size = (Get-Item -LiteralPath $out).Length
$readme = @"
中山市中山纪念中学物理实验室 v$version
独立桌面版 · Windows 10 / 11 x64

使用方法
1. 推荐解压 PrismLab-$version-portable.zip，双击 PrismLab-$version.exe
2. 便携 ZIP 内置 runtime/ WebView2 固定运行时，目标电脑无需安装 WebView2
3. 若只复制 exe，程序会回退使用系统 WebView2，可能因未安装而无法启动
4. 关闭窗口即退出；系统托盘仍可重新打开或退出

说明
- 所有 HTML / CSS / JavaScript / 字体 / 图片 / PPT 资源都已封装在 exe 内。
- 运行数据优先保存在 %LOCALAPPDATA%\PrismLab；学习进度由 WebView2 本地存储保存。
- 0.7.0 起使用学校自签名证书 PrismLab Code Signing 0.7。
  公钥证书：PrismLab-CodeSigning.cer
  指纹：4C10FB0E9B1C0CF4FAE5188AA9E29734B05BCC59
- 自签名证书不是公共 CA 证书，Windows 可能仍提示“未知发布者”。

版本：$version
SHA-256：$hash

文件大小：$size bytes
"@
Set-Content -LiteralPath (Join-Path $dist '使用说明.txt') -Value $readme -Encoding UTF8
$archiveItems = @($out, (Join-Path $dist '使用说明.txt'))
$bundledRuntime = Join-Path $dist 'runtime'
if (Test-Path (Join-Path $bundledRuntime 'msedgewebview2.exe')) {
  $archiveItems += $bundledRuntime
}
$certFile = Join-Path $PSScriptRoot 'certs\PrismLab-CodeSigning.cer'
if (Test-Path $certFile) {
  Copy-Item $certFile (Join-Path $dist 'PrismLab-CodeSigning.cer') -Force
  $archiveItems += (Join-Path $dist 'PrismLab-CodeSigning.cer')
}
$zipOut = Join-Path $dist ("PrismLab-$version-portable.zip")
if (Test-Path $zipOut) { Remove-Item -LiteralPath $zipOut -Force }
Compress-Archive -Path $archiveItems -DestinationPath $zipOut -CompressionLevel Optimal

Write-Host ''
Write-Host "Built: $out" -ForegroundColor Green
Write-Host ("Size:  {0:N1} KB" -f ($size / 1024))
Write-Host "SHA256: $hash"
Write-Host "Zip:   $zipOut"
