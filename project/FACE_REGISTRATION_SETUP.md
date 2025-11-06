# Face Registration Setup Guide

This guide explains how to set up and use the face registration feature for staff members.

## Prerequisites

1. **Install face-api.js models**: The face recognition models need to be downloaded and placed in the `public/models` directory.

## Step 1: Download face-api.js Models

You need to download the following models from the [face-api.js repository](https://github.com/justadudewhohacks/face-api.js):

1. **tiny_face_detector_model-weights_manifest.json**
2. **tiny_face_detector_model-shard1**
3. **face_landmark_68_model-weights_manifest.json**
4. **face_landmark_68_model-shard1**
5. **face_recognition_model-weights_manifest.json**
6. **face_recognition_model-shard1**

### Quick Setup Script

Create the models directory and download the models:

```bash
# Create models directory
mkdir -p public/models

# Download models (using curl or wget)
cd public/models

# Tiny Face Detector
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1

# Face Landmark 68
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1

# Face Recognition
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1
```

### Manual Download

1. Visit: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
2. Download the 6 files mentioned above
3. Place them in `project/public/models/` directory

## Step 2: Run Database Migration

Execute the SQL migration to create the `staff_faces` table:

```sql
-- Run the migration file
-- File location: supabase/migrations/create_staff_faces_table.sql
```

You can run this in your Supabase SQL Editor or via the Supabase CLI.

## Step 3: Features

### Add Staff Mode
- When adding a new staff member, you can optionally register their face
- Face data is saved after the staff member is created
- The face registration can be done before or after staff creation

### Edit Staff Mode
- When editing an existing staff member, you can:
  - View if a face is already registered
  - Register a new face (replaces existing)
  - Update existing face registration

## Usage

1. **Adding Staff with Face Registration:**
   - Fill in the staff form
   - Click "Register Face" in the Face Registration section
   - Allow camera access when prompted
   - Position face in front of camera
   - Click "Capture Face"
   - Complete the form and submit

2. **Editing Staff Face:**
   - Open the staff member for editing
   - If face is already registered, you'll see a green indicator
   - Click "Re-register" to update the face
   - Follow the same capture process

## Technical Details

### Face Descriptor Storage
- Face descriptors are stored as JSONB arrays (128-dimensional vectors)
- Each staff member can have multiple face registrations
- One face is marked as "primary" per staff member
- Face data includes confidence scores and metadata

### Face Recognition Models
- **Tiny Face Detector**: Fast face detection
- **Face Landmark 68**: Detects facial landmarks
- **Face Recognition Net**: Generates face descriptors for matching

### API Endpoints
The face registration service provides:
- `saveFaceDescriptor()` - Save new face data
- `getStaffFace()` - Retrieve staff face data
- `updateFaceDescriptor()` - Update existing face
- `findMatchingStaff()` - Find staff by face (for attendance)

## Troubleshooting

### Models Not Loading
- Ensure models are in `public/models/` directory
- Check browser console for loading errors
- Verify model file names match exactly

### Camera Not Working
- Ensure HTTPS (required for camera access)
- Check browser permissions
- Try a different browser

### Face Not Detected
- Ensure good lighting
- Face should be clearly visible
- Remove glasses/hat if possible
- Try different angles

## Security Notes

- Face data is stored securely in Supabase
- RLS policies restrict access to authorized users
- Face descriptors are encrypted in transit
- Only HR admins and super-admins can manage face data

## Future Enhancements

- Multiple face registrations per staff member
- Face matching for attendance terminal
- Face verification for sensitive operations
- Batch face registration from photos



