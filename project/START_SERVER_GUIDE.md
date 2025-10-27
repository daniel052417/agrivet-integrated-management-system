# Start Development Server Guide

## 🚨 Issue: Connection Refused

The error `ERR_CONNECTION_REFUSED` means your development server is not running.

## 🔧 Solution: Start the Development Server

### Method 1: Using npm (Recommended)
```bash
# Open terminal/command prompt in the project directory
cd project
npm run dev
```

### Method 2: Using npx directly
```bash
# Open terminal/command prompt in the project directory
cd project
npx vite
```

### Method 3: Using yarn (if you have yarn installed)
```bash
# Open terminal/command prompt in the project directory
cd project
yarn dev
```

## 📋 Expected Output

When the server starts successfully, you should see something like:
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## 🧪 Test the Activation Page

1. **Start the server** using one of the methods above
2. **Wait for the server to start** (you'll see the "ready" message)
3. **Open your browser** and go to:
   ```
   http://localhost:3000/activate?token=35420c1e-0615-40b2-9b0f-59e2d9bf60f7
   ```

## 🔍 Troubleshooting

### If you get "command not found" errors:
- Make sure you have Node.js installed
- Make sure you're in the correct directory (`project` folder)
- Try running `node --version` to check Node.js

### If you get port already in use errors:
- The server might already be running
- Check if you have another terminal with the server running
- Try a different port: `npx vite --port 3001`

### If you get permission errors:
- Try running as administrator (Windows)
- Check if you have write permissions in the project folder

## 📱 What You Should See

Once the server is running and you visit the activation URL:
- ✅ AccountActivation component should load
- ✅ "Activate Your Account" form should appear
- ✅ Password input fields should be visible
- ✅ No more "connection refused" error

## 🚀 Quick Start

1. **Open terminal/command prompt**
2. **Navigate to project folder:**
   ```bash
   cd C:\Users\Asus\Downloads\agrivet-integrated-management-system-main\agrivet-integrated-management-system-main\project
   ```
3. **Start the server:**
   ```bash
   npm run dev
   ```
4. **Wait for "ready" message**
5. **Open browser to activation URL**

**The server must be running for the activation page to work!**
