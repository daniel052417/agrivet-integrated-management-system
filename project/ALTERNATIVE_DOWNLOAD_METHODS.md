# Alternative Model Download Methods

Since direct downloads from GitHub are getting interrupted, here are alternative methods:

## Method 1: CDN Download (Recommended - Try This First)

CDN downloads are often more reliable than GitHub raw URLs:

```powershell
.\scripts\download-models-cdn.ps1
```

This uses jsDelivr CDN which mirrors GitHub and is optimized for file downloads.

## Method 2: Git Clone (Most Reliable)

If you have Git installed, this is the most reliable method:

```powershell
.\scripts\download-models-git.ps1
```

This clones the repository and extracts only the weights folder.

**Note:** Requires Git to be installed. Download from: https://git-scm.com/download/win

## Method 3: Download from Release Archive

1. Go to: https://github.com/justadudewhohacks/face-api.js/releases
2. Download the latest source code (zip file)
3. Extract `face-api.js-master/weights/` folder
4. Copy the 6 model files to `public/models/`

## Method 4: Use Browser with Download Manager Extension

1. Install a browser extension like "Download Manager" or "Free Download Manager"
2. Add these URLs to the download manager:
   - https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/tiny_face_detector_model-weights_manifest.json
   - https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/tiny_face_detector_model-shard1
   - https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_landmark_68_model-weights_manifest.json
   - https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_landmark_68_model-shard1
   - https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_recognition_model-weights_manifest.json
   - https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_recognition_model-shard1
3. Set download location to `public/models/`
4. Enable resume capability
5. Start downloads

## Method 5: Manual Download from CDN

Right-click and "Save As" each link to `public/models/`:

**Using jsDelivr CDN:**
- https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/tiny_face_detector_model-weights_manifest.json
- https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/tiny_face_detector_model-shard1
- https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_landmark_68_model-weights_manifest.json
- https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_landmark_68_model-shard1
- https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_recognition_model-weights_manifest.json
- https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_recognition_model-shard1

**Advantages of CDN:**
- Optimized for large file downloads
- Better connection stability
- Resume capability
- Faster download speeds

## Verification

After any method, verify file sizes:

```powershell
Get-ChildItem public\models\*-shard1 | Select-Object Name, @{Name="Size (KB)";Expression={[math]::Round($_.Length/1KB, 2)}}, @{Name="Status";Expression={if($_.Name -like "*tiny*" -and $_.Length -gt 180000){"OK"}elseif($_.Name -like "*landmark*" -and $_.Length -gt 1100000){"OK"}elseif($_.Name -like "*recognition*" -and $_.Length -gt 5000000){"OK"}else{"INCOMPLETE"}}}
```

Expected sizes:
- `tiny_face_detector_model-shard1`: ~190 KB
- `face_landmark_68_model-shard1`: ~1200 KB
- `face_recognition_model-shard1`: ~5400 KB

## Troubleshooting

**If CDN method also fails:**
- Try the Git method (most reliable)
- Check your firewall/antivirus isn't blocking downloads
- Try a different network/VPN
- Download during off-peak hours

**If Git method fails:**
- Ensure Git is properly installed
- Check internet connection
- Try running PowerShell as Administrator



