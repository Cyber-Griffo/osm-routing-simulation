const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname));

// Serve static files
app.use(express.static(__dirname));
app.use('/lib', express.static(path.join(__dirname, 'lib')));

// Render the main page
app.get('/', (req, res) => {
  res.render('project');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
