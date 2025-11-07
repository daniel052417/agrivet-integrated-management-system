# Manual Model Download Guide

## Important: Binary Files on GitHub

**Binary files appear empty on GitHub's web interface - this is completely normal!** GitHub doesn't display binary file contents. You must use the **"Download raw file"** or **"View raw"** button to download them.

## Step-by-Step Download Instructions

### Method 1: Using "Download raw file" Button (Recommended)

1. **Go to the GitHub repository:**
   - Visit: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

2. **For each file, click "Download raw file":**
   - Click on the file name (e.g., `face_landmark_68_model-shard1`)
   - On the file page, click the **"Download raw file"** button (top right)
   - Save the file to `public/models/` folder
   - **Wait for download to complete** before proceeding to next file

3. **Files to download:**
   - `tiny_face_detector_model-weights_manifest.json`
   - `tiny_face_detector_model-shard1` (~190 KB)
   - `face_landmark_68_model-weights_manifest.json`
   - `face_landmark_68_model-shard1` (~1200 KB) ⚠️ **This one is large - wait for full download**
   - `face_recognition_model-weights_manifest.json`
   - `face_recognition_model-shard1` (~5400 KB) ⚠️ **This one is very large - wait for full download**

### Method 2: Direct URL Download

Right-click each link below and "Save As" to `public/models/`:

1. https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
2. https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1
3. https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
4. https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1
5. https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
6. https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1

**Important:** 
- Download one file at a time
- Wait for each download to complete (check file size)
- Don't close the browser tab until download finishes

### Method 3: Using Download Manager

If your browser downloads are getting interrupted:

1. Install a download manager (Free Download Manager, JDownloader, etc.)
2. Add all 6 URLs above to the download manager
3. Set download location to `public/models/`
4. Enable resume capability
5. Start downloads - the manager will handle interruptions

## Verify Downloads

After downloading, check file sizes:

```powershell
Get-ChildItem public\models\*-shard1 | Select-Object Name, @{Name="Size (KB)";Expression={[math]::Round($_.Length/1KB, 2)}}
```

**Expected sizes:**
- `tiny_face_detector_model-shard1`: ~190 KB (188-195 KB is OK)
- `face_landmark_68_model-shard1`: ~1200 KB (1150-1250 KB is OK)
- `face_recognition_model-shard1`: ~5400 KB (5300-5500 KB is OK)

If any file is smaller than expected, delete it and re-download.

## Troubleshooting

**Download keeps getting interrupted:**
- Try a different browser
- Use a download manager
- Try downloading at a different time (GitHub may be slow)
- Check your internet connection
- Try using a VPN

**File appears empty after download:**
- This is normal for binary files - they're not actually empty
- Check the file size instead of opening it
- If size is correct, the file is good

**Still getting tensor errors:**
- Delete all files in `public/models/`
- Re-download all 6 files
- Verify file sizes match expected values
- Clear browser cache
- Restart dev server




