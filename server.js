const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

// Use process.cwd() to get the project root directory
const projectRoot = process.cwd();

app.set('view engine', 'pug');
// Set views directory relative to project root
app.set('views', path.join(projectRoot));

// Serve static files from the project root
app.use(express.static(projectRoot));
app.use('/lib', express.static(path.join(__dirname, 'lib')));

// Render the main page
app.get('/', (req, res) => {
  res.render('project');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
