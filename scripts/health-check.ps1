param(
    [string]$BusinessUrl = "http://127.0.0.1:8001/health",
    [string]$AdminUrl = "http://127.0.0.1:8002/health",
    [string]$RagUrl = "http://127.0.0.1:5010/api/v1/rag/health",
    [string]$FayUrl = "http://127.0.0.1:5000/"
)

$ErrorActionPreference = "Stop"

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [switch]$Optional
    )

    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
            Write-Host "[OK] $Name $Url"
            return $true
        }
        Write-Host "[FAIL] $Name returned HTTP $($response.StatusCode): $Url"
        return $false
    }
    catch {
        if ($Optional) {
            Write-Host "[WARN] $Name unavailable: $Url"
            return $true
        }
        Write-Host "[FAIL] $Name unavailable: $Url"
        return $false
    }
}

$results = @(
    Test-Endpoint -Name "Business-API" -Url $BusinessUrl
    Test-Endpoint -Name "Admin-API" -Url $AdminUrl
    Test-Endpoint -Name "RAG" -Url $RagUrl
    Test-Endpoint -Name "Fay" -Url $FayUrl -Optional
)

if ($results -contains $false) {
    exit 1
}

Write-Host "[OK] Core health checks passed"
