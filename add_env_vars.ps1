$envFile = ".env.vercel.production"
$envVars = Get-Content $envFile

foreach ($line in $envVars) {
    if ($line -match "(.+?)=(.*)") {
        $name = $matches[1]
        $value = $matches[2]
        
        Write-Host "Adding $name to Vercel production environment..."
        # Using echo to pipe the value into the command to avoid interactive prompts
        echo $value | vercel env add $name production
    }
}

Write-Host "All environment variables have been added to Vercel production!" 