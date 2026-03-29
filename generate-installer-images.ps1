# PowerShell Script to generate NSIS installer BMP images
# Creates Steam-style dark theme images for UTEAM installer

Add-Type -AssemblyName System.Drawing

# Color definitions (Steam dark theme)
$bgColor = [System.Drawing.Color]::FromArgb(23, 26, 33)
$accentColor = [System.Drawing.Color]::FromArgb(102, 192, 244)
$textColor = [System.Drawing.Color]::FromArgb(199, 213, 224)
$gradientTop = [System.Drawing.Color]::FromArgb(27, 40, 56)
$gradientBottom = [System.Drawing.Color]::FromArgb(23, 26, 33)

# =========================================
# Create Header Image (164x57 pixels)
# =========================================
function Create-HeaderImage {
    $width = 164
    $height = 57
    $bitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    
    # Gradient background
    $rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect, 
        $gradientTop, 
        $gradientBottom, 
        [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
    )
    $graphics.FillRectangle($brush, $rect)
    
    # Draw UTEAM text
    $font = New-Object System.Drawing.Font("Segoe UI", 20, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush($accentColor)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $textRect = New-Object System.Drawing.RectangleF(0, 0, $width, $height)
    $graphics.DrawString("UTEAM", $font, $textBrush, $textRect, $format)
    
    # Add subtle line decoration
    $pen = New-Object System.Drawing.Pen($accentColor, 2)
    $graphics.DrawLine($pen, 10, ($height - 5), ($width - 10), ($height - 5))
    
    # Cleanup
    $graphics.Dispose()
    $font.Dispose()
    $textBrush.Dispose()
    $brush.Dispose()
    $pen.Dispose()
    
    return $bitmap
}

# =========================================
# Create Welcome Image (164x314 pixels)
# =========================================
function Create-WelcomeImage {
    $width = 164
    $height = 314
    $bitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    
    # Gradient background
    $rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect, 
        $gradientTop, 
        $gradientBottom, 
        [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
    )
    $graphics.FillRectangle($brush, $rect)
    
    # Draw decorative circles (abstract gaming elements)
    $circleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 102, 192, 244))
    $graphics.FillEllipse($circleBrush, -30, 20, 100, 100)
    $graphics.FillEllipse($circleBrush, 100, 80, 80, 80)
    $graphics.FillEllipse($circleBrush, -20, 180, 60, 60)
    $graphics.FillEllipse($circleBrush, 110, 220, 90, 90)
    
    # Draw UTEAM logo area
    $logoBrush = New-Object System.Drawing.SolidBrush($accentColor)
    $logoRect = New-Object System.Drawing.Rectangle(42, 40, 80, 80)
    $graphics.FillEllipse($logoBrush, $logoRect)
    
    # Draw U letter in logo
    $font = New-Object System.Drawing.Font("Segoe UI", 40, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush($bgColor)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $logoTextRect = New-Object System.Drawing.RectangleF(42, 40, 80, 80)
    $graphics.DrawString("U", $font, $textBrush, $logoTextRect, $format)
    $font.Dispose()
    
    # Draw UTEAM text below logo
    $titleFont = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Bold)
    $titleBrush = New-Object System.Drawing.SolidBrush($accentColor)
    $titleFormat = New-Object System.Drawing.StringFormat
    $titleFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $titleRect = New-Object System.Drawing.RectangleF(0, 130, $width, 40)
    $graphics.DrawString("UTEAM", $titleFont, $titleBrush, $titleRect, $titleFormat)
    $titleFont.Dispose()
    
    # Draw tagline
    $tagFont = New-Object System.Drawing.Font("Segoe UI", 8, [System.Drawing.FontStyle]::Regular)
    $tagBrush = New-Object System.Drawing.SolidBrush($textColor)
    $tagFormat = New-Object System.Drawing.StringFormat
    $tagFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $tagRect = New-Object System.Drawing.RectangleF(0, 165, $width, 20)
    $graphics.DrawString("Game Platform", $tagFont, $tagBrush, $tagRect, $tagFormat)
    $tagFont.Dispose()
    
    # Draw version at bottom
    $verFont = New-Object System.Drawing.Font("Segoe UI", 7, [System.Drawing.FontStyle]::Regular)
    $verBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(128, 128, 128))
    $verFormat = New-Object System.Drawing.StringFormat
    $verFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $verRect = New-Object System.Drawing.RectangleF(0, ($height - 30), $width, 20)
    $graphics.DrawString("Version 1.0.0", $verFont, $verBrush, $verRect, $verFormat)
    $verFont.Dispose()
    
    # Draw copyright
    $copyRect = New-Object System.Drawing.RectangleF(0, ($height - 18), $width, 15)
    $copyFont = New-Object System.Drawing.Font("Segoe UI", 6, [System.Drawing.FontStyle]::Regular)
    $graphics.DrawString("(c) 2026 UTEAM Team", $copyFont, $verBrush, $copyRect, $verFormat)
    $copyFont.Dispose()
    
    # Cleanup
    $graphics.Dispose()
    $textBrush.Dispose()
    $brush.Dispose()
    $circleBrush.Dispose()
    $logoBrush.Dispose()
    $titleBrush.Dispose()
    $tagBrush.Dispose()
    $verBrush.Dispose()
    
    return $bitmap
}

# =========================================
# Main execution
# =========================================
$installerPath = Join-Path $PSScriptRoot "client\installer"

# Create header image
Write-Host "Creating header image..." -ForegroundColor Cyan
$header = Create-HeaderImage
$headerPath = Join-Path $installerPath "installer-header.bmp"
$header.Save($headerPath, [System.Drawing.Imaging.ImageFormat]::Bmp)
$header.Dispose()
Write-Host "  Saved: $headerPath" -ForegroundColor Green

# Create welcome image
Write-Host "Creating welcome image..." -ForegroundColor Cyan
$welcome = Create-WelcomeImage
$welcomePath = Join-Path $installerPath "installer-welcome.bmp"
$welcome.Save($welcomePath, [System.Drawing.Imaging.ImageFormat]::Bmp)
$welcome.Dispose()
Write-Host "  Saved: $welcomePath" -ForegroundColor Green

Write-Host ""
Write-Host "Installer images created successfully!" -ForegroundColor Green
Write-Host "You can now compile the NSIS installer." -ForegroundColor Yellow
