# Fix: Incomplete Model Files Download

## Problem
The model files are downloading incompletely, causing the tensor shape error:
```
Based on the provided shape, [3,3,256,256], the tensor should have 589824 values but has 146122
```

**Note**: Binary files appear empty on GitHub's web interface - this is normal! You need to use "Download raw file" or "View raw" button.

## Solution 1: Copy from NPM Package (Easiest - Recommended)

Since `face-api.js` is already installed, try copying models from the npm package:

```powershell
# Run this script
.\scripts\copy-models-from-npm.ps1
```

If the models aren't in the npm package, use Solution 2.

## Solution 2: Manual Download (If Solution 1 Fails)

The automatic download is getting interrupted. Please download the files manually:

### Step 1: Delete Incomplete Files
Delete these files from `public/models/`:
- `face_landmark_68_model-shard1` (if size < 1.2 MB)
- `face_recognition_model-shard1` (if size < 5.4 MB)

### Step 2: Download Files Manually

**Option A: Direct Browser Download (Easiest)**

1. Open your browser
2. Visit these URLs one by one and save each file to `public/models/`:

   - https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1
   - https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1

3. **Important**: Right-click each link → "Save As" → Save to `public/models/` folder
4. Wait for each download to complete fully before starting the next one

**Option B: Use Download Manager**

If your browser download is also getting interrupted:
1. Use a download manager (like Free Download Manager, JDownloader, etc.)
2. Add the URLs above
3. Set download location to `public/models/`
4. Resume if interrupted

### Step 3: Verify File Sizes

After downloading, verify the files are complete:

```powershell
Get-ChildItem public\models\*-shard1 | Select-Object Name, @{Name="Size (KB)";Expression={[math]::Round($_.Length/1KB, 2)}}
```

Expected sizes:
- `tiny_face_detector_model-shard1`: ~190 KB (188-195 KB is OK)
- `face_landmark_68_model-shard1`: ~1200 KB (1150-1250 KB is OK)
- `face_recognition_model-shard1`: ~5400 KB (5300-5500 KB is OK)

### Step 4: Test

1. Restart your dev server
2. Try the face registration feature again
3. Check browser console for model loading messages

## Alternative: Use CDN (If Manual Download Fails)

If manual download still fails, we can modify the code to load models from a CDN instead. Let me know if you need this option.

## Troubleshooting

**If files are still incomplete:**
- Check your internet connection
- Try downloading from a different network
- Use a VPN if GitHub is blocked
- Try downloading at a different time (GitHub may be slow)

**If download completes but error persists:**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Restart dev server
- Check browser console for specific error

