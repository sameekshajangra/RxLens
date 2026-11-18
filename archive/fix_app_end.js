const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Remove the wrongly placed closing divs inside ComprehensionCheck
const wrongEnd = `      </div>
    
        </div>
      </div>
</div>
  );
};`;
app = app.replace(wrongEnd, `      </div>
    </div>
  );
};`);

// Add the closing divs before ComprehensionCheck
const correctEnd = `      </AnimatePresence>
    </div>
    
  );
}`;
app = app.replace(correctEnd, `      </AnimatePresence>
        </div>
      </div>
    </div>
  );
}`);

fs.writeFileSync('frontend/src/App.jsx', app);
console.log("App end fixed");
