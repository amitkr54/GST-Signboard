'use client';

import React from 'react';

export function WebFontLoader() {
    // List of Google Fonts used in the application
    // Note: System fonts (Arial, Verdana, etc.) are excluded
    const googleFonts = [
        "Roboto", "Open Sans", "Lato", "Montserrat", "Oswald", "Raleway",
        "PT Sans", "Merriweather", "Nunito", "Playfair Display", "Poppins",
        "Source Sans Pro", "Ubuntu", "Roboto Slab", "Lora", "Pacifico",
        "Dancing Script", "Bebas Neue", "Lobster", "Abril Fatface"
    ];

    // Construct the Google Fonts URL
    const fontFamilies = googleFonts.map(font => {
        // Replace spaces with +
        return font.replace(/\s+/g, '+') + ':wght@400;700'; // Load regular and bold
    });

    const href = `https://fonts.googleapis.com/css2?family=${fontFamilies.join('&family=')}&display=swap`;

    return (
        <link rel="stylesheet" href={href} />
    );
}
