@echo off
echo.
echo ====================================================
echo  PLACEMENT PORTAL - STARTUP GUIDE
echo ====================================================
echo.
echo STEP 1: Start the Backend (in this window)
echo --------------------------------------------------
echo   cd backend
echo   python app.py
echo.
echo   Backend will run on: http://localhost:5000
echo.
echo STEP 2: Open a NEW terminal window and run:
echo --------------------------------------------------
echo   cd frontend
echo   npm run dev
echo.
echo   Frontend will open on: http://localhost:3000
echo.
echo IMPORTANT: Always use http://localhost:3000
echo Do NOT open index.html directly from file explorer.
echo.
echo ====================================================
echo  DEMO LOGIN CREDENTIALS
echo ====================================================
echo.
echo  Role     Email                    Password
echo  ------   ---------------------    ----------
echo  ADMIN    admin@placement.in       admin@123
echo  MANAGER  manager@placement.in     manager@123
echo  MEMBER   member1@placement.in     member@123
echo           member2@placement.in     member@123
echo           ...
echo           member10@placement.in    member@123
echo.
pause
