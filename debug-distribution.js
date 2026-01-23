// Debug helper for space distribution
// Add this code temporarily to FabricPreview.tsx distribute-v case after line 533

console.log('[DISTRIBUTE-V] Starting with', objs.length, 'objects');
const infos = objs.map(o => {
    const h = o.getScaledHeight();
    console.log('Object:', o.type, 'top:', o.top, 'height:', h, 'scaleY:', o.scaleY);
    return { obj: o, height: h, center: o.top! };
});

console.log('First top:', infos[0].center, 'height:', infos[0].height);
console.log('Last top:', infos[infos.length - 1].center, 'height:', infos[infos.length - 1].height);

const totalSpan = (infos[infos.length - 1].center + infos[infos.length - 1].height / 2) - (infos[0].center - infos[0].height / 2);
const totalOccupied = infos.reduce((sum, i) => sum + i.height, 0);
const gap = (totalSpan - totalOccupied) / (infos.length - 1);

console.log('totalSpan:', totalSpan, 'totalOccupied:', totalOccupied, 'gap:', gap);
