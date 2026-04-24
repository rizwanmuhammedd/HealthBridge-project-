const fs = require('fs');
const path = 'c:/Users/risva/OneDrive/Documents/Desktop/hospital/hospitalms-frontend/src/pages/Home.tsx';
let content = fs.readFileSync(path, 'utf8');

// The file currently has literal '\n' characters in the first part instead of actual newlines.
// We will replace all literal '\n' with an actual newline character.
content = content.split('\\n').join('\n');

fs.writeFileSync(path, content);
