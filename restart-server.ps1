$processName = "node"

Write-Host "Looking for existing Node.js processes..."
$processes = Get-Process -Name $processName -ErrorAction SilentlyContinue

if ($processes) {
    Write-Host "Stopping existing Node.js processes..."
    $processes | ForEach-Object {
        $_ | Stop-Process -Force
        Write-Host "   Stopped process with ID: $($_.Id)"
    }
} else {
    Write-Host "✨ No existing Node.js processes found"
}

Write-Host "🚀 Starting development server..."
Write-Host "-----------------------------------"
npm start