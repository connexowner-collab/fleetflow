param(
    [string]$CommitMessage = "Update"
)

Write-Host "Updating git repository..." -ForegroundColor Cyan

Write-Host "1. Adding changes..."
git add .

Write-Host "2. Committing with message: '$CommitMessage'"
git commit -m "$CommitMessage"

Write-Host "3. Pushing to origin..."
git push origin master

Write-Host "Git update completed!" -ForegroundColor Green
