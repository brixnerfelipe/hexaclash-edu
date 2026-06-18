const fs = require('fs');
const path = require('path');

const regionsConfig = [
    { name: 'Zeta', count: 4, bonus: 2, color: '#d1f2eb' }, // Verde água
    { name: 'Delta', count: 5, bonus: 2, color: '#fdebd0' }, // Pêssego Claro
    { name: 'Alpha', count: 6, bonus: 3, color: '#d4e6f1' }, // Azul Gelo
    { name: 'Beta', count: 7, bonus: 5, color: '#fadbd8' }, // Rosa Pastel
    { name: 'Epsilon', count: 9, bonus: 5, color: '#ebdef0' }, // Lilás Suave
    { name: 'Gamma', count: 11, bonus: 7, color: '#fcf3cf' } // Amarelo Areia
];

// Odd-R mapping design
const gridStr = `
Z Z . . E E E E
. Z Z . E E E E
. . A A A . E .
. A A A . . . .
. . . G G G G D
. B B . G G G D
B B B . G G G D
. B B . G . . D
. . . . . . D .
`;

const lines = gridStr.trim().split('\n');
const territories = [];
let idCounter = 1;

const mapRegions = { 'Z': 'Zeta', 'D': 'Delta', 'A': 'Alpha', 'B': 'Beta', 'E': 'Epsilon', 'G': 'Gamma' };

const HEX_SIZE = 45;
const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
const HEX_HEIGHT = 2 * HEX_SIZE;

// Fórmula Odd-R exata pedida pelo usuário:
function getPixelCoords(col, row) {
    const x = col * HEX_WIDTH + (row % 2) * (HEX_WIDTH / 2);
    const y = row * HEX_HEIGHT * 0.75;
    return { x, y };
}

for(let row=0; row<lines.length; row++) {
    const cols = lines[row].trim().split(' ');
    for(let col=0; col<cols.length; col++) {
        const char = cols[col];
        if(char !== '.') {
            const region = mapRegions[char];
            const coords = getPixelCoords(col, row);
            const t = {
                id: idCounter++,
                name: `Terr ${idCounter-1}`,
                region: region,
                owner: null,
                armies: 0,
                col: col,
                row: row,
                x: coords.x,
                y: coords.y,
                neighbors: []
            };
            territories.push(t);
        }
    }
}

// Calculate neighbors using distance
const MAX_DIST = HEX_WIDTH * 1.1; // Tolerance
for(let i=0; i<territories.length; i++) {
    for(let j=i+1; j<territories.length; j++) {
        const t1 = territories[i];
        const t2 = territories[j];
        const dx = t1.x - t2.x;
        const dy = t1.y - t2.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < MAX_DIST) {
            t1.neighbors.push(t2.id);
            t2.neighbors.push(t1.id);
        }
    }
}

const jsContent = `// Map Data
const REGIONS = ${JSON.stringify(regionsConfig, null, 4)};

const TERRITORIES = ${JSON.stringify(territories, null, 4)};
`;

fs.writeFileSync(path.join(__dirname, 'js', 'mapData.js'), jsContent);
console.log('mapData.js generated with', territories.length, 'territories');
