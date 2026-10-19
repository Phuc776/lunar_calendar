!macro NSIS_HOOK_PREUNINSTALL
  ; Remove only this application's current-user auto-start entry.
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Lịch âm"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run" "Lịch âm"
!macroend
