param(
  [switch]$AlsoPushGithub
)

$ErrorActionPreference = 'Stop'

$branch = git branch --show-current
if ($branch -ne 'main') {
  throw "Deployments must run from the main branch. Current branch: $branch"
}

git diff --quiet
if ($LASTEXITCODE -ne 0) {
  throw 'Commit local changes before deploying.'
}

git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  throw 'Commit staged changes before deploying.'
}

git push vps main

if ($AlsoPushGithub) {
  git push origin main
}

Write-Host 'Deployment completed: https://sih.athergrid.dev'
