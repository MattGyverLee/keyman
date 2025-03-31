@echo off
setlocal

set "SOURCE=.\KMEA\app\build\outputs\arr\keyman-engine-debug.aar"
set "DEST=.\KMAPro\kMAPro\libs\keyman-engine.aar"

echo Copying %SOURCE% to %DEST%...

copy /Y "%SOURCE%" "%DEST%"

if %ERRORLEVEL% equ 0 (
    echo File copied successfully.
) else (
    echo Error copying file.
)

endlocal
