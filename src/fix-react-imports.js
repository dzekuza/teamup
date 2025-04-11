const fs = require('fs');
const path = require('path');

// Fix React imports
const reactPath = path.resolve(__dirname, '../node_modules/react/index.js');
if (fs.existsSync(reactPath)) {
  let content = fs.readFileSync(reactPath, 'utf8');
  if (!content.includes('module.exports.default = module.exports;')) {
    content += '\nmodule.exports.default = module.exports;\n';
    fs.writeFileSync(reactPath, content);
    console.log('Fixed React imports');
  }
}

// Fix React DOM imports
const reactDomPath = path.resolve(__dirname, '../node_modules/react-dom/index.js');
if (fs.existsSync(reactDomPath)) {
  let content = fs.readFileSync(reactDomPath, 'utf8');
  if (!content.includes('module.exports.default = module.exports;')) {
    content += '\nmodule.exports.default = module.exports;\n';
    fs.writeFileSync(reactDomPath, content);
    console.log('Fixed React DOM imports');
  }
} 