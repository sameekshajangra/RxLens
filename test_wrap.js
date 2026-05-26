const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Replace return ( <div className="app-container"> ... ) with return ( <ErrorBoundary><div className="app-container"> ... </div></ErrorBoundary> );

// We can just wrap the outer most div:
content = content.replace(
  'return (',
  'return (\n    <ErrorBoundary>'
);

// find the last `);` of the App component.
// It's the end of the file basically:
content = content.replace(
  '    </div>\n  );\n}\n\nexport default App;',
  '    </div>\n    </ErrorBoundary>\n  );\n}\n\nexport default App;'
);

fs.writeFileSync('frontend/src/App.jsx', content);
