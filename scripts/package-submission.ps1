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

$sourceName = "lingshan-ai-digital-human-source"
$sourceRoot = Join-Path $payloadRoot $sourceName
New-Item -ItemType Directory -Force $sourceRoot | Out-Null

$rootFiles = @(
    "README.md", "LICENSE", "requirements.txt", "main.py", "fay_booter.py", "fay_lite_server.py",
    "config.json", "settings.json", "system.conf", "qa.csv", "verifier.json", "favicon.ico", "icon.png"
)
foreach ($relativePath in $rootFiles) {
    $source = Join-Path $projectRoot $relativePath
    if (Test-Path -LiteralPath $source) {
        Copy-Item -LiteralPath $source -Destination (Join-Path $sourceRoot $relativePath) -Force
    }
}

$sourceDirectories = @(
    "frontend", "backend", "miniprogram", "rag-knowledge", "services", "scripts",
    "official-materials",
    "live2d-avatar", "ai_module", "asr", "config", "contracts",
    "core", "faymcp", "gui", "llm", "mcp_servers", "scheduler", "simulation_engine",
    "tts", "utils", "workflows"
)
foreach ($relativePath in $sourceDirectories) {
    Copy-SubmissionDirectory $relativePath $sourceRoot
}

$sourceReadme = @(
    "Lingshan AI Digital Human Guide - Source Delivery",
    "",
    "This archive contains the runtime source, configuration, knowledge base, digital-human assets, and startup scripts.",
    "Excluded: dependencies, caches, logs, databases, local tooling, duplicate source materials, optional Fay course archives, prototypes, and Git metadata.",
    "",
    "Frontend: cd frontend; npm ci; npm run dev",
    "Backend: cd backend; npm ci; npm run dev",
    "Static build: cd frontend; npm ci; npm run build"
) -join [Environment]::NewLine
Set-Content -Encoding UTF8 -Value $sourceReadme (Join-Path $sourceRoot "DELIVERY_NOTES.txt")

$webName = "lingshan-ai-digital-human-web"
$webRoot = Join-Path $payloadRoot $webName
New-Item -ItemType Directory -Force $webRoot | Out-Null
Copy-Item -Path (Join-Path $projectRoot "docs\app\*") -Destination $webRoot -Recurse -Force
Copy-Item -LiteralPath (Join-Path $projectRoot "docs\.nojekyll") -Destination (Join-Path $webRoot ".nojekyll") -Force
$webReadme = @(
    "Lingshan AI Digital Human Guide - Web Deployment",
    "",
    "Upload this directory to a static web server or GitHub Pages.",
    "The frontend uses relative asset paths and retains built-in guide data when the API is unavailable."
) -join [Environment]::NewLine
Set-Content -Encoding UTF8 -Value $webReadme (Join-Path $webRoot "DEPLOYMENT_NOTES.txt")

$sourceArchive = Join-Path $outputRoot "$sourceName.zip"
$webArchive = Join-Path $outputRoot "$webName.zip"
Remove-Item -LiteralPath $sourceArchive, $webArchive -Force -ErrorAction SilentlyContinue
Compress-Archive -LiteralPath $sourceRoot -DestinationPath $sourceArchive -CompressionLevel Optimal
Compress-Archive -LiteralPath $webRoot -DestinationPath $webArchive -CompressionLevel Optimal
Remove-Item -LiteralPath $payloadRoot -Recurse -Force

Get-Item $sourceArchive, $webArchive | Select-Object Name, Length, LastWriteTime
