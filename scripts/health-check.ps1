param(
    [string]$BusinessUrl = "http://127.0.0.1:8001/health",
    [string]$AdminUrl = "http://127.0.0.1:8002/health",
    [string]$RagUrl = "http://127.0.0.1:5012/api/v1/rag/health",
    [string]$FayUrl = "http://127.0.0.1:5000/",
    [string]$FayMcpUrl = "http://127.0.0.1:5010/api/mcp/servers",
    [string]$FayMcpSseHost = "127.0.0.1",
    [int]$FayMcpSsePort = 8765,
    [string]$DemoUrl = "http://127.0.0.1:8006/health",
    [string]$ExpressUrl = "http://127.0.0.1:3001/api/health",
    [string]$FrontendUrl = "http://127.0.0.1:5173/"
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

function Test-TcpEndpoint {
    param([string]$Name, [string]$Host, [int]$Port)

    if (Test-NetConnection -ComputerName $Host -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue) {
        Write-Host "[OK] $Name ${Host}:$Port"
        return $true
    }
    Write-Host "[FAIL] $Name unavailable: ${Host}:$Port"
    return $false
}

$results = @(
    Test-Endpoint -Name "Business-API" -Url $BusinessUrl
    Test-Endpoint -Name "Admin-API" -Url $AdminUrl
    Test-Endpoint -Name "RAG" -Url $RagUrl
    Test-Endpoint -Name "Fay" -Url $FayUrl
    Test-Endpoint -Name "Fay-MCP" -Url $FayMcpUrl
    Test-TcpEndpoint -Name "Fay-MCP-SSE" -Host $FayMcpSseHost -Port $FayMcpSsePort
    Test-Endpoint -Name "Demo-Mock" -Url $DemoUrl
    Test-Endpoint -Name "Express-API" -Url $ExpressUrl
    Test-Endpoint -Name "Frontend" -Url $FrontendUrl
)

if ($results -contains $false) {
    exit 1
}

Write-Host "[OK] Core health checks passed"
