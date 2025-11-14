# Face-API.js Models

This directory should contain the face-api.js model files for facial recognition.

## Required Files

You need to download the following 6 files from the face-api.js repository:

1. `tiny_face_detector_model-weights_manifest.json`
2. `tiny_face_detector_model-shard1` (binary file, ~190 KB)
3. `face_landmark_68_model-weights_manifest.json`
4. `face_landmark_68_model-shard1` (binary file, ~1.2 MB)
5. `face_recognition_model-weights_manifest.json`
6. `face_recognition_model-shard1` (binary file, ~5.4 MB)

## Download Instructions

### Option 1: Direct Download (Recommended)

Visit the GitHub repository and download each file:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

**Direct download links:**
- https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
- https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1
- https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
- https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1
- https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
- https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1

### Option 2: Using PowerShell (Windows)

Run this in PowerShell from the project root:

```powershell
$modelsPath = "public\models"
New-Item -ItemType Directory -Force -Path $modelsPath

$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/"

$files = @(
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1"
)

foreach ($file in $files) {
    Write-Host "Downloading $file..."
    $url = $baseUrl + $file
    $output = Join-Path $modelsPath $file
    Invoke-WebRequest -Uri $url -OutFile $output
    Write-Host "✓ Downloaded $file"
}

Write-Host "`nAll models downloaded successfully!"
```

### Option 3: Using curl (Linux/Mac)

```bash
cd public/models

curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1
```

## Verify File Sizes

After downloading, verify the file sizes are correct:

- `tiny_face_detector_model-shard1`: ~190 KB (194,560 bytes)
- `face_landmark_68_model-shard1`: ~1.2 MB (1,228,800 bytes)
- `face_recognition_model-shard1`: ~5.4 MB (5,529,600 bytes)

If files are smaller than expected, they're incomplete and need to be re-downloaded.

## Troubleshooting

If you get errors like "tensor should have X values but has Y", it means the model files are corrupted or incomplete. Delete all files in this directory and re-download them.






