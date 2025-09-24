# Launch the prototype in Edge as a frameless app window
# Usage: ./launch-edge.ps1 http://localhost:5173
param([string]$Url = "http://localhost:5173")
$edge = "$Env:ProgramFiles (x86)\Microsoft\Edge\Application\msedge.exe"
if (!(Test-Path $edge)) { $edge = "$Env:ProgramFiles\Microsoft\Edge\Application\msedge.exe" }
Start-Process $edge "--app=$Url --edge-kiosk-type=fullscreen"
