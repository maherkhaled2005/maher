Add-Type -AssemblyName System.Drawing
$srcPath = "C:/Users/mylap/.gemini/antigravity/brain/6e6500c8-0cb0-474f-b0e3-e14f052ac199/.user_uploaded/media_1790438853410.jpg"
$img = [System.Drawing.Image]::FromFile($srcPath)

function Save-ResizedImage($source, $targetPath, $width, $height, $format) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($source, 0, 0, $width, $height)
    $g.Dispose()
    $bmp.Save($targetPath, $format)
    $bmp.Dispose()
    Write-Host "Saved $targetPath"
}

# 1. Main Icon (1024x1024 PNG)
Save-ResizedImage $img "c:\Users\mylap\Desktop\ooo2\mobile\assets\icon.png" 1024 1024 ([System.Drawing.Imaging.ImageFormat]::Png)

# 2. Android Adaptive Icon Foreground (1024x1024 PNG)
Save-ResizedImage $img "c:\Users\mylap\Desktop\ooo2\mobile\assets\android-icon-foreground.png" 1024 1024 ([System.Drawing.Imaging.ImageFormat]::Png)

# 3. Favicon (192x192 PNG)
Save-ResizedImage $img "c:\Users\mylap\Desktop\ooo2\mobile\assets\favicon.png" 192 192 ([System.Drawing.Imaging.ImageFormat]::Png)

# 4. Splash (1024x1024 PNG)
Save-ResizedImage $img "c:\Users\mylap\Desktop\ooo2\mobile\assets\splash.png" 1024 1024 ([System.Drawing.Imaging.ImageFormat]::Png)

# 5. In-app headers and showcase
Save-ResizedImage $img "c:\Users\mylap\Desktop\ooo2\mobile\assets\tecnorexa_official_logo.jpg" 1024 1024 ([System.Drawing.Imaging.ImageFormat]::Jpeg)
Save-ResizedImage $img "c:\Users\mylap\Desktop\ooo2\mobile\assets\tecnorexa_logo_gold.jpg" 1024 1024 ([System.Drawing.Imaging.ImageFormat]::Jpeg)
Save-ResizedImage $img "c:\Users\mylap\Desktop\ooo2\mobile\assets\tecnorexa_sphere_showcase.jpg" 1024 1024 ([System.Drawing.Imaging.ImageFormat]::Jpeg)
Save-ResizedImage $img "c:\Users\mylap\Desktop\ooo2\mobile\assets\splash-icon.jpg" 1024 1024 ([System.Drawing.Imaging.ImageFormat]::Jpeg)

$img.Dispose()
Write-Host "All official app icons and assets updated successfully!"
