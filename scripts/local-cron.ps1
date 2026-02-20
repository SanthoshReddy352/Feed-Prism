# ============================================================
# Feed Prism — Local Development RSS Cron
# ============================================================
# This script calls the ingestion API every 3 minutes in
# batched mode, simulating the production pg_cron behavior.
#
# Usage:
#   powershell -File .\scripts\local-cron.ps1
#
# Press Ctrl+C to stop.
# ============================================================

$secret = "feedprism_cron_secret_2026"
$baseUrl = "http://localhost:3000/api/ingest"
$interval = 10  # seconds (3 minutes)

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Feed Prism Local Cron - Batched Ingestion" -ForegroundColor Cyan
Write-Host "  Interval: every $interval seconds" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl`?secret=$secret" -TimeoutSec 120

        if ($response.success) {
            Write-Host "[$timestamp] Batch $($response.batch) | " -NoNewline -ForegroundColor Green
            Write-Host "Inserted: $($response.articles_inserted) | " -NoNewline
            Write-Host "Skipped: $($response.articles_skipped) | " -NoNewline
            Write-Host "Errors: $($response.errors) | " -NoNewline
            Write-Host "$($response.duration_ms)ms" -ForegroundColor DarkGray

            if ($response.updates) {
                foreach ($update in $response.updates) {
                     Write-Host "   + [$($update.category)] $($update.source): $($update.count) new" -ForegroundColor Cyan
                }
            }

            if ($response.sources_in_batch) {
                Write-Host "         Sources: $($response.sources_in_batch -join ', ')" -ForegroundColor DarkGray
            }
        } else {
            Write-Host "[$timestamp] Unexpected response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[$timestamp] ERROR: $_" -ForegroundColor Red
    }

    Write-Host "         Next batch in $interval seconds..." -ForegroundColor DarkGray
    Start-Sleep -Seconds $interval
}
