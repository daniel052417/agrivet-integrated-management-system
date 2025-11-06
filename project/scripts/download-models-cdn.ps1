# PowerShell script to download models from CDN (jsDelivr)
# This is often more reliable than GitHub raw URLs

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Downloading Face-API.js Models from CDN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create models directory if it doesn't exist
$modelsDest = "public\models"
if (-not (Test-Path $modelsDest)) {
    Write-Host "Creating $modelsDest directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $modelsDest | Out-Null
}

# CDN URLs (using jsDelivr which mirrors npm and GitHub)
$baseUrl = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/"

# Files to download with expected sizes
$files = @(
    @{ Name = "tiny_face_detector_model-weights_manifest.json"; Size = 0 },
    @{ Name = "tiny_face_detector_model-shard1"; Size = 194560 },
    @{ Name = "face_landmark_68_model-weights_manifest.json"; Size = 0 },
    @{ Name = "face_landmark_68_model-shard1"; Size = 1228800 },
    @{ Name = "face_recognition_model-weights_manifest.json"; Size = 0 },
    @{ Name = "face_recognition_model-shard1"; Size = 5529600 }
)

Write-Host "Downloading from CDN (jsDelivr)..." -ForegroundColor Green
Write-Host "This may take several minutes for large files..." -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($file in $files) {
    $fileName = $file.Name
    $expectedSize = $file.Size
    $filePath = Join-Path $modelsDest $fileName
    $url = $baseUrl + $fileName
    
    try {
        Write-Host "Downloading: $fileName" -ForegroundColor Yellow -NoNewline
        
        # Use WebClient for better download control
        $webClient = New-Object System.Net.WebClient
        $webClient.Headers.Add("User-Agent", "Mozilla/5.0")
        
        # Download with progress
        $webClient.DownloadFile($url, $filePath)
        $webClient.Dispose()
        
        # Verify file size for binary files
        if ($expectedSize -gt 0) {
            $actualSize = (Get-Item $filePath).Length
            if ($actualSize -ge ($expectedSize * 0.95)) { # Allow 5% tolerance
                Write-Host " OK ($([math]::Round($actualSize/1KB, 2)) KB)" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host " INCOMPLETE! Expected: ~$([math]::Round($expectedSize/1KB, 2)) KB, Got: $([math]::Round($actualSize/1KB, 2)) KB" -ForegroundColor Red
                Remove-Item $filePath -Force -ErrorAction SilentlyContinue
                $failCount++
            }
        } else {
            Write-Host " OK" -ForegroundColor Green
            $successCount++
        }
    } catch {
        Write-Host " FAILED: $($_.Exception.Message)" -ForegroundColor Red
        if (Test-Path $filePath) {
            Remove-Item $filePath -Force -ErrorAction SilentlyContinue
        }
        $failCount++
    }
    
    # Small delay between downloads
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($failCount -eq 0) {
    Write-Host "All models downloaded successfully!" -ForegroundColor Green
    Write-Host "You can now use the face registration feature." -ForegroundColor Green
} else {
    Write-Host "Some downloads failed or were incomplete." -ForegroundColor Red
    Write-Host "Success: $successCount, Failed: $failCount" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Try running the script again, or use the git method:" -ForegroundColor Yellow
    Write-Host ".\scripts\download-models-git.ps1" -ForegroundColor Cyan
}
Write-Host "========================================" -ForegroundColor Cyan



