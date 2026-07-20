param(
    [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\release")
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$outputRoot = [System.IO.Path]::GetFullPath($OutputDirectory)
$payloadRoot = Join-Path $outputRoot "_package-staging"

New-Item -ItemType Directory -Force $outputRoot | Out-Null
if (-not $payloadRoot.StartsWith($outputRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Staging directory escaped the output directory."
}
Remove-Item -LiteralPath $payloadRoot -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $payloadRoot | Out-Null

$excludedDirectories = @(
    ".git", ".codegraph", ".cursor", ".omx", ".playwright-mcp", ".pytest_cache",
    "__pycache__", "node_modules", "dist", "release", "logs", "download", "docs", "test", "tests",
    ".venv", "venv", "samples", "cache_data"
)

function Copy-SubmissionDirectory {
    param([string]$RelativePath, [string]$DestinationRoot)

    $source = Join-Path $projectRoot $RelativePath
    if (-not (Test-Path -LiteralPath $source)) {
        throw "Required source directory is missing: $RelativePath"
    }
    $destination = Join-Path $DestinationRoot $RelativePath
    New-Item -ItemType Directory -Force $destination | Out-Null
    & robocopy $source $destination /E /XD $excludedDirectories /XF *.pyc *.pyo | Out-Null
    if ($LASTEXITCODE -ge 8) {
        throw "Copy failed for $RelativePath (robocopy exit code $LASTEXITCODE)."
    }
}

$packageRootName = "lingshan-ai-digital-human"
$sourceRoot = Join-Path (Join-Path $payloadRoot "source") $packageRootName
$scriptsRoot = Join-Path (Join-Path $payloadRoot "scripts") $packageRootName
New-Item -ItemType Directory -Force $sourceRoot | Out-Null
New-Item -ItemType Directory -Force $scriptsRoot | Out-Null

$rootFiles = @(
    "main.py", "fay_booter.py", "fay_lite_server.py", "requirements.txt",
    "config.json", "settings.json", "system.conf", "system.conf.bak",
    "qa.csv", "verifier.json", "favicon.ico", "icon.png"
)
foreach ($relativePath in $rootFiles) {
    $source = Join-Path $projectRoot $relativePath
    if (Test-Path -LiteralPath $source) {
        Copy-Item -LiteralPath $source -Destination (Join-Path $sourceRoot $relativePath) -Force
    }
}

$sourceDirectories = @(
    "frontend", "backend", "miniprogram", "rag-knowledge", "rag", "services",
    "live2d-avatar", "ai_module", "asr", "config", "contracts", "core",
    "faymcp", "fay_player_knowledge", "genagents", "gui", "llm", "mcp_servers",
    "scheduler", "simulation_engine", "tools", "tts", "utils", "workflows",
    "official-materials", "memory"
)
foreach ($relativePath in $sourceDirectories) {
    Copy-SubmissionDirectory $relativePath $sourceRoot
}
Copy-SubmissionDirectory "scripts" $scriptsRoot

# The local registry may contain development-only entries. The delivery archive
# carries the MCP integration used by the scenic-guide runtime.
$packagedMcpConfig = Join-Path $sourceRoot "faymcp\data\mcp_servers.json"
$runtimeMcpServers = @(
    [ordered]@{
        id = 1
        name = "Scenic Live Data"
        ip = ""
        connection_time = ""
        key = ""
        transport = "stdio"
        command = "python"
        args = @("mcp_servers/scenic_data/server.py")
        cwd = ""
        env = [ordered]@{
            ADMIN_API_URL = "http://127.0.0.1:8002/v1"
            ADMIN_TOKEN = "`${ADMIN_TOKEN}"
        }
        autostart = $true
    }
)
$runtimeMcpServers | ConvertTo-Json -Depth 16 | Set-Content -LiteralPath $packagedMcpConfig -Encoding UTF8

$webRoot = Join-Path $sourceRoot "web"
New-Item -ItemType Directory -Force $webRoot | Out-Null
Copy-Item -Path (Join-Path $projectRoot "docs\app\*") -Destination $webRoot -Recurse -Force
Copy-Item -LiteralPath (Join-Path $projectRoot "docs\.nojekyll") -Destination (Join-Path $webRoot ".nojekyll") -Force

$sourceArchive = Join-Path $outputRoot "lingshan-ai-digital-human-source.zip"
$scriptsArchive = Join-Path $outputRoot "lingshan-ai-digital-human-scripts.zip"
$retiredArchives = @(
    (Join-Path $outputRoot "lingshan-ai-digital-human-runtime.zip"),
    (Join-Path $outputRoot "lingshan-ai-digital-human-web.zip")
)
Remove-Item -LiteralPath $sourceArchive -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $scriptsArchive -Force -ErrorAction SilentlyContinue
foreach ($archive in $retiredArchives) {
    Remove-Item -LiteralPath $archive -Force -ErrorAction SilentlyContinue
}
Compress-Archive -LiteralPath $sourceRoot -DestinationPath $sourceArchive -CompressionLevel Optimal
Compress-Archive -LiteralPath $scriptsRoot -DestinationPath $scriptsArchive -CompressionLevel Optimal
Remove-Item -LiteralPath $payloadRoot -Recurse -Force

Get-Item $sourceArchive, $scriptsArchive | Select-Object Name, Length, LastWriteTime
