# Install ImageMagick if not already installed
if (-not (Get-Command magick -ErrorAction SilentlyContinue)) {
    Write-Host "Installing ImageMagick..."
    winget install ImageMagick.ImageMagick
}

$sizes = @{
    "mdpi" = 48
    "hdpi" = 72
    "xhdpi" = 96
    "xxhdpi" = 144
    "xxxhdpi" = 192
}

# Source image path
$sourceImage = "src/assets/mindease-icon.png"

foreach ($density in $sizes.Keys) {
    $size = $sizes[$density]
    $targetDir = "android/app/src/main/res/mipmap-$density"
    
    # Create regular icon
    magick convert $sourceImage -resize ${size}x${size} -background "#000080" -gravity center -extent ${size}x${size} "$targetDir/ic_launcher.png"
    
    # Create round icon (same as regular for now)
    magick convert $sourceImage -resize ${size}x${size} -background "#000080" -gravity center -extent ${size}x${size} "$targetDir/ic_launcher_round.png"
    
    Write-Host "Generated icons for $density: ${size}x${size}"
} 