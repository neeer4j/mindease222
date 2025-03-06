$sourceIcon = "C:\project\vivek\New folder\mindease222\android\icons\icon.png"
$densities = @("mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi")

foreach ($density in $densities) {
    $targetDir = "android\app\src\main\res\mipmap-$density"
    $targetPath = "$targetDir\ic_launcher.png"
    
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Force -Path $targetDir
    }
    
    Copy-Item -Path $sourceIcon -Destination $targetPath -Force
    Write-Host "Copied icon to $targetPath"
} 