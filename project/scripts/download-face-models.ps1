# PowerShell script to download face-api.js models
# Run this from the project root directory

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Face-API.js Models Download Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set paths
$modelsPath = "public\models"
$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/"

# Create models directory if it doesn't exist
if (-not (Test-Path $modelsPath)) {
    Write-Host "Creating models directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $modelsPath | Out-Null
}

# Files to download with expected sizes (in bytes)
$files = @(
    @{ Name = "tiny_face_detector_model-weights_manifest.json"; Size = 0 },
    @{ Name = "tiny_face_detector_model-shard1"; Size = 194560 },
    @{ Name = "face_landmark_68_model-weights_manifest.json"; Size = 0 },
    @{ Name = "face_landmark_68_model-shard1"; Size = 1228800 },
    @{ Name = "face_recognition_model-weights_manifest.json"; Size = 0 },
    @{ Name = "face_recognition_model-shard1"; Size = 5529600 }
)

Write-Host "Downloading face-api.js models..." -ForegroundColor Green
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($file in $files) {
    $fileName = $file.Name
    $expectedSize = $file.Size
    $filePath = Join-Path $modelsPath $fileName
    $url = $baseUrl + $fileName
    
    try {
        Write-Host "Downloading: $fileName" -ForegroundColor Yellow -NoNewline
        
        # Download file
        Invoke-WebRequest -Uri $url -OutFile $filePath -UseBasicParsing
        
        # Verify file size for binary files
        if ($expectedSize -gt 0) {
            $actualSize = (Get-Item $filePath).Length
            if ($actualSize -eq $expectedSize) {
                Write-Host " ✓ (Size: $([math]::Round($actualSize/1KB, 2)) KB)" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host " ✗ Size mismatch! Expected: $expectedSize bytes, Got: $actualSize bytes" -ForegroundColor Red
                Remove-Item $filePath -Force
                $failCount++
            }
        } else {
            Write-Host " ✓" -ForegroundColor Green
            $successCount++
        }
    } catch {
        Write-Host " ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
        if (Test-Path $filePath) {
            Remove-Item $filePath -Force
        }
        $failCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($failCount -eq 0) {
    Write-Host "✓ All models downloaded successfully!" -ForegroundColor Green
    Write-Host "You can now use the face registration feature." -ForegroundColor Green
} else {
    Write-Host "✗ Some downloads failed. Please try again." -ForegroundColor Red
    Write-Host "Success: $successCount, Failed: $failCount" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan






