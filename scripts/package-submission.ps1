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
    "__pycache__", "node_modules", "dist", "release", "logs", "memory", "download",
    "samples", "cache_data", "chroma_db"
)

function Copy-SubmissionDirectory {
    param([string]$RelativePath, [string]$DestinationRoot)

    $source = Join-Path $projectRoot $RelativePath
    if (-not (Test-Path -LiteralPath $source)) {
        throw "Required source directory is missing: $RelativePath"
    }
    $destination = Join-Path $DestinationRoot $RelativePath
    New-Item -ItemType Directory -Force $destination | Out-Null
    & robocopy $source $destination /E /XD $excludedDirectories /XF *.pyc *.pyo *.db *.db-shm *.db-wal | Out-Null
    if ($LASTEXITCODE -ge 8) {
        throw "Copy failed for $RelativePath (robocopy exit code $LASTEXITCODE)."
    }
}

$runtimeName = "lingshan-ai-digital-human-runtime"
$runtimeRoot = Join-Path $payloadRoot $runtimeName
New-Item -ItemType Directory -Force $runtimeRoot | Out-Null

$rootFiles = @("README.md", "LICENSE")
foreach ($relativePath in $rootFiles) {
    $source = Join-Path $projectRoot $relativePath
    if (Test-Path -LiteralPath $source) {
        Copy-Item -LiteralPath $source -Destination (Join-Path $runtimeRoot $relativePath) -Force
    }
}

$sourceDirectories = @("frontend", "backend", "miniprogram", "rag-knowledge")
foreach ($relativePath in $sourceDirectories) {
    Copy-SubmissionDirectory $relativePath $runtimeRoot
}

$runtimeReadme = @(
    "Lingshan AI Digital Human Guide - Complete Runtime Delivery",
    "",
    "This archive contains the competition application source, miniprogram, knowledge base, and the built static web runtime under web/.",
    "Excluded: documentation, Fay runtime, Live2D SDK, MCP services, auxiliary service projects, startup scripts, dependencies, caches, logs, databases, local tooling, source materials, prototypes, and Git metadata.",
    "",
    "Frontend: cd frontend; npm ci; npm run dev",
    "Backend: cd backend; npm ci; npm run dev",
    "Static build: cd frontend; npm ci; npm run build"
) -join [Environment]::NewLine
Set-Content -Encoding UTF8 -Value $runtimeReadme (Join-Path $runtimeRoot "DELIVERY_NOTES.txt")

$webRoot = Join-Path $runtimeRoot "web"
New-Item -ItemType Directory -Force $webRoot | Out-Null
Copy-Item -Path (Join-Path $projectRoot "docs\app\*") -Destination $webRoot -Recurse -Force
Copy-Item -LiteralPath (Join-Path $projectRoot "docs\.nojekyll") -Destination (Join-Path $webRoot ".nojekyll") -Force

$runtimeArchive = Join-Path $outputRoot "$runtimeName.zip"
$retiredArchives = @(
    (Join-Path $outputRoot "lingshan-ai-digital-human-source.zip"),
    (Join-Path $outputRoot "lingshan-ai-digital-human-web.zip")
)
Remove-Item -LiteralPath $runtimeArchive -Force -ErrorAction SilentlyContinue
foreach ($archive in $retiredArchives) {
    Remove-Item -LiteralPath $archive -Force -ErrorAction SilentlyContinue
}
Compress-Archive -LiteralPath $runtimeRoot -DestinationPath $runtimeArchive -CompressionLevel Optimal
Remove-Item -LiteralPath $payloadRoot -Recurse -Force

Get-Item $runtimeArchive | Select-Object Name, Length, LastWriteTime
