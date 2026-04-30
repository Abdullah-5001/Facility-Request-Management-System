# restart.ps1 - Kills any process on port 5257, then starts the API fresh
$port = 5257
$proc = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
if ($proc) {
    Stop-Process -Id $proc -Force
    Write-Host "Stopped old process (PID $proc) on port $port" -ForegroundColor Yellow
    Start-Sleep -Seconds 1
} else {
    Write-Host "Port $port is free." -ForegroundColor Green
}
Write-Host "Starting API..." -ForegroundColor Cyan
dotnet run --launch-profile http
