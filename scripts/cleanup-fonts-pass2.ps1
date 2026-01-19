$fontsDir = "public/fonts"

# Specific renames for leftovers
$renames = @(
    @{ src = "Merriweather_120pt-Bold.ttf"; dest = "Merriweather-Bold.ttf" },
    @{ src = "Merriweather_120pt-Italic.ttf"; dest = "Merriweather-Italic.ttf" },
    @{ src = "SourceSans3-Bold.ttf"; dest = "SourceSansPro-Bold.ttf" },
    @{ src = "SourceSans3-BoldItalic.ttf"; dest = "SourceSansPro-BoldItalic.ttf" },
    @{ src = "SourceSans3-Italic.ttf"; dest = "SourceSansPro-Italic.ttf" }
)

foreach ($r in $renames) {
    if (Test-Path "$fontsDir/$($r.src)") {
        Write-Host "Renaming $($r.src) to $($r.dest)"
        Move-Item -Path "$fontsDir/$($r.src)" -Destination "$fontsDir/$($r.dest)" -Force
    }
}

Write-Host "Second pass complete!"
