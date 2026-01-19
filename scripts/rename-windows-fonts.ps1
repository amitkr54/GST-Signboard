$fontsDir = "public/fonts"

$renames = @(
    @{ src = "arial.ttf"; dest = "Arial.ttf" },
    @{ src = "arialbd.ttf"; dest = "Arial-Bold.ttf" },
    @{ src = "ariali.ttf"; dest = "Arial-Italic.ttf" },
    @{ src = "arialbi.ttf"; dest = "Arial-BoldItalic.ttf" },
    @{ src = "times.ttf"; dest = "TimesNewRoman.ttf" },
    @{ src = "timesbd.ttf"; dest = "TimesNewRoman-Bold.ttf" },
    @{ src = "timesi.ttf"; dest = "TimesNewRoman-Italic.ttf" },
    @{ src = "timesbi.ttf"; dest = "TimesNewRoman-BoldItalic.ttf" },
    @{ src = "cour.ttf"; dest = "CourierNew.ttf" },
    @{ src = "courbd.ttf"; dest = "CourierNew-Bold.ttf" },
    @{ src = "couri.ttf"; dest = "CourierNew-Italic.ttf" },
    @{ src = "courbi.ttf"; dest = "CourierNew-BoldItalic.ttf" },
    @{ src = "georgia.ttf"; dest = "Georgia.ttf" },
    @{ src = "georgiab.ttf"; dest = "Georgia-Bold.ttf" },
    @{ src = "georgiai.ttf"; dest = "Georgia-Italic.ttf" },
    @{ src = "georgiaz.ttf"; dest = "Georgia-BoldItalic.ttf" },
    @{ src = "verdana.ttf"; dest = "Verdana.ttf" },
    @{ src = "verdanab.ttf"; dest = "Verdana-Bold.ttf" },
    @{ src = "verdanai.ttf"; dest = "Verdana-Italic.ttf" },
    @{ src = "verdanaz.ttf"; dest = "Verdana-BoldItalic.ttf" },
    @{ src = "comic.ttf"; dest = "ComicSansMS.ttf" },
    @{ src = "comicbd.ttf"; dest = "ComicSansMS-Bold.ttf" },
    @{ src = "comici.ttf"; dest = "ComicSansMS-Italic.ttf" },
    @{ src = "comicz.ttf"; dest = "ComicSansMS-BoldItalic.ttf" },
    @{ src = "impact.ttf"; dest = "Impact.ttf" }
)

foreach ($r in $renames) {
    $srcPath = "$fontsDir/$($r.src)"
    $destPath = "$fontsDir/$($r.dest)"
    if (Test-Path $srcPath) {
        Write-Host "Renaming $($r.src) to $($r.dest)"
        Move-Item -Path $srcPath -Destination $destPath -Force
    } else {
        Write-Host "File not found: $($r.src)"
    }
}

Write-Host "Windows font renaming complete!"
