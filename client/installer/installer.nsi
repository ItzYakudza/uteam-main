; UTEAM Installer Script
; NSIS Modern User Interface

!include "MUI2.nsh"

; General Settings
Name "UTEAM"
OutFile "UTEAM-Setup.exe"
InstallDir "$LOCALAPPDATA\UTEAM"
InstallDirRegKey HKCU "Software\UTEAM" "InstallDir"
RequestExecutionLevel user
Unicode True

; Сжатие: zlib быстрее чем lzma (сборка ~3x быстрее, размер +10-15%)
; Для максимального сжатия раскомментируйте: SetCompressor /SOLID lzma
SetCompressor /SOLID zlib

; Interface Settings - Custom Images
!define MUI_ICON "..\build\icon.ico"
!define MUI_UNICON "..\build\icon.ico"

; Header image (top banner)
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "installer-header.bmp"
!define MUI_HEADERIMAGE_RIGHT

; Welcome/Finish page image (left sidebar)
!define MUI_WELCOMEFINISHPAGE_BITMAP "installer-welcome.bmp"

; Other settings
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Welcome to UTEAM Setup"
!define MUI_WELCOMEPAGE_TEXT "This wizard will guide you through the installation of UTEAM.$\r$\n$\r$\nUTEAM is a gaming platform for discovering and playing games.$\r$\n$\r$\nClick Next to continue."
!define MUI_FINISHPAGE_RUN "$INSTDIR\UTEAM.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch UTEAM"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Languages
!insertmacro MUI_LANGUAGE "English"

; Installer Section
Section "UTEAM" SecMain
    SetOutPath "$INSTDIR"
    
    ; Copy all files from app folder
    File /r "app\*.*"
    
    ; Create uninstaller
    WriteUninstaller "$INSTDIR\Uninstall.exe"
    
    ; Create Start Menu shortcuts
    CreateDirectory "$SMPROGRAMS\UTEAM"
    CreateShortCut "$SMPROGRAMS\UTEAM\UTEAM.lnk" "$INSTDIR\UTEAM.exe"
    CreateShortCut "$SMPROGRAMS\UTEAM\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
    
    ; Create Desktop shortcut
    CreateShortCut "$DESKTOP\UTEAM.lnk" "$INSTDIR\UTEAM.exe"
    
    ; Write registry keys
    WriteRegStr HKCU "Software\UTEAM" "InstallDir" "$INSTDIR"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\UTEAM" "DisplayName" "UTEAM"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\UTEAM" "UninstallString" "$INSTDIR\Uninstall.exe"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\UTEAM" "DisplayIcon" "$INSTDIR\UTEAM.exe"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\UTEAM" "Publisher" "UTEAM"
    WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\UTEAM" "NoModify" 1
    WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\UTEAM" "NoRepair" 1
SectionEnd

; Uninstaller Section
Section "Uninstall"
    ; Remove files
    RMDir /r "$INSTDIR"
    
    ; Remove Start Menu shortcuts
    RMDir /r "$SMPROGRAMS\UTEAM"
    
    ; Remove Desktop shortcut
    Delete "$DESKTOP\UTEAM.lnk"
    
    ; Remove registry keys
    DeleteRegKey HKCU "Software\UTEAM"
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\UTEAM"
SectionEnd
