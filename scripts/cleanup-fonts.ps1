$fontsDir = "public/fonts"
$keepers = @()

$families = @(
    @{ name = "Roboto"; files = @("Roboto-Regular", "Roboto-Bold", "Roboto-Italic", "Roboto-BoldItalic") },
    @{ name = "OpenSans"; files = @("OpenSans-Regular", "OpenSans-Bold", "OpenSans-Italic", "OpenSans-BoldItalic"); target = "OpenSans" },
    @{ name = "Lato"; files = @("Lato-Regular", "Lato-Bold", "Lato-Italic", "Lato-BoldItalic") },
    @{ name = "Montserrat"; files = @("Montserrat-Regular", "Montserrat-Bold", "Montserrat-Italic", "Montserrat-BoldItalic") },
    @{ name = "Oswald"; files = @("Oswald-Regular", "Oswald-Bold") },
    @{ name = "Raleway"; files = @("Raleway-Regular", "Raleway-Bold", "Raleway-Italic", "Raleway-BoldItalic") },
    @{ name = "PTSans"; files = @("PTSans-Regular", "PTSans-Bold", "PTSans-Italic", "PTSans-BoldItalic") },
    @{ name = "Merriweather"; files = @("Merriweather_120pt-Regular", "Merriweather_120pt-Bold", "Merriweather_120pt-Italic"); target = "Merriweather" },
    @{ name = "Nunito"; files = @("Nunito-Regular", "Nunito-Bold", "Nunito-Italic", "Nunito-BoldItalic") },
    @{ name = "PlayfairDisplay"; files = @("PlayfairDisplay-Regular", "PlayfairDisplay-Bold", "PlayfairDisplay-Italic", "PlayfairDisplay-BoldItalic") },
    @{ name = "Poppins"; files = @("Poppins-Regular", "Poppins-Bold", "Poppins-Italic", "Poppins-BoldItalic") },
    @{ name = "SourceSansPro"; files = @("SourceSans3-Regular", "SourceSans3-Bold", "SourceSans3-Italic", "SourceSans3-BoldItalic"); target = "SourceSansPro" },
    @{ name = "Ubuntu"; files = @("Ubuntu-Regular", "Ubuntu-Bold", "Ubuntu-Italic") },
    @{ name = "RobotoSlab"; files = @("RobotoSlab-Regular", "RobotoSlab-Bold") },
    @{ name = "Lora"; files = @("Lora-Regular", "Lora-Bold", "Lora-Italic", "Lora-BoldItalic") },
    @{ name = "Pacifico"; files = @("Pacifico-Regular"); target = "Pacifico" },
    @{ name = "DancingScript"; files = @("DancingScript-Regular", "DancingScript-Bold"); target = "DancingScript" },
    @{ name = "BebasNeue"; files = @("BebasNeue-Regular"); target = "BebasNeue" },
    @{ name = "Lobster"; files = @("Lobster-Regular"); target = "Lobster" },
    @{ name = "AbrilFatface"; files = @("AbrilFatface-Regular"); target = "AbrilFatface" }
)

foreach ($f in $families) {
    $targetBase = if ($f.target) { $f.target } else { $f.name }
    
    foreach ($variant in $f.files) {
        $sourcePath = "$fontsDir/$variant.ttf"
        if (Test-Path $sourcePath) {
            $destName = $variant.Replace($f.files[0], $targetBase)
            # Special case for Regular -> BaseName
            if ($variant -like "*-Regular" -or $variant -like "*_Regular") {
                $destName = $targetBase
            }
            
            $destPath = "$fontsDir/$destName.ttf"
            if ($sourcePath -ne $destPath) {
                Write-Host "Renaming $variant to $destName"
                Move-Item -Path $sourcePath -Destination $destPath -Force
            }
            $keepers += "$destName.ttf"
        }
    }
}

# Add any already existing correct names to keepers
$keepers += "Roboto.ttf", "Roboto-Bold.ttf", "Poppins.ttf", "Poppins-Bold.ttf", "OpenSans.ttf"

# Clean up
$allFiles = Get-ChildItem -Path $fontsDir -Filter *.ttf
foreach ($file in $allFiles) {
    if ($keepers -notcontains $file.Name) {
        Write-Host "Deleting unneeded variant: $($file.Name)"
        Remove-Item -Path $file.FullName -Force
    }
}

Write-Host "Cleanup complete!"
