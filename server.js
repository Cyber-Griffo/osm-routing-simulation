const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Render the main page
app.get('/', (req, res) => {
  res.render('project');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
