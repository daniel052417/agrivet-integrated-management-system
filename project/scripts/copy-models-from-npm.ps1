# PowerShell script to copy face-api.js models from node_modules to public/models
# This is the most reliable method since the models come with the npm package

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Copying Face-API.js Models from NPM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if face-api.js is installed
$faceApiPath = "node_modules\face-api.js"
if (-not (Test-Path $faceApiPath)) {
    Write-Host "Error: face-api.js is not installed!" -ForegroundColor Red
    Write-Host "Please run: npm install face-api.js" -ForegroundColor Yellow
    exit 1
}

# Check if weights directory exists in node_modules
$weightsSource = Join-Path $faceApiPath "weights"
if (-not (Test-Path $weightsSource)) {
    Write-Host "Models not found in node_modules/face-api.js/weights" -ForegroundColor Yellow
    Write-Host "The face-api.js npm package does not include model files." -ForegroundColor Yellow
    Write-Host "You need to download them manually from GitHub." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please use the manual download method in FIX_MODEL_DOWNLOAD.md" -ForegroundColor Cyan
    exit 1
}

# Create destination directory
$modelsDest = "public\models"
if (-not (Test-Path $modelsDest)) {
    Write-Host "Creating $modelsDest directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $modelsDest | Out-Null
}

# Files to copy
$filesToCopy = @(
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1"
)

Write-Host "Copying models from npm package..." -ForegroundColor Green
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($file in $filesToCopy) {
    $sourceFile = Join-Path $weightsSource $file
    $destFile = Join-Path $modelsDest $file
    
    if (Test-Path $sourceFile) {
        try {
            Write-Host "Copying: $file" -ForegroundColor Yellow -NoNewline
            Copy-Item -Path $sourceFile -Destination $destFile -Force
            $size = (Get-Item $destFile).Length
            Write-Host " OK ($([math]::Round($size/1KB, 2)) KB)" -ForegroundColor Green
            $successCount++
        } catch {
            Write-Host " FAILED: $($_.Exception.Message)" -ForegroundColor Red
            $failCount++
        }
    } else {
        Write-Host "Not found: $file" -ForegroundColor Yellow
        $failCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($failCount -eq 0) {
    Write-Host "All models copied successfully!" -ForegroundColor Green
    Write-Host "You can now use the face registration feature." -ForegroundColor Green
} else {
    Write-Host "Some files were not found in npm package." -ForegroundColor Yellow
    Write-Host "Success: $successCount, Missing: $failCount" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You need to download models manually from:" -ForegroundColor Yellow
    Write-Host "https://github.com/justadudewhohacks/face-api.js/tree/master/weights" -ForegroundColor Cyan
}
Write-Host "========================================" -ForegroundColor Cyan
