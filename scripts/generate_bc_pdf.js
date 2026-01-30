const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

async function generatePDF() {
    // 3.5 x 2 inches in points (72 points per inch)
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'in',
        format: [3.5, 2]
    });

    const imagePath = "C:/Users/Admin/.gemini/antigravity/brain/c50bb223-eedc-4396-9006-d4f9809377d8/business_card_print_ready_v2_1769666667781.png";

    if (fs.existsSync(imagePath)) {
        const imgData = fs.readFileSync(imagePath).toString('base64');
        // Add the design image to cover the entire page
        doc.addImage(imgData, 'PNG', 0, 0, 3.5, 2);
    } else {
        console.error('Design image not found at:', imagePath);
        process.exit(1);
    }

    const pdfData = doc.output();
    const outputPath = process.argv[2] || 'business_card.pdf';
    fs.writeFileSync(outputPath, Buffer.from(pdfData, 'binary'));
    console.log('PDF generated at:', outputPath);
}

generatePDF().catch(console.error);
