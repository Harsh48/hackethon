const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const reactionRoutes = require('./api/reaction');
const cors = require('cors');

// Initialize Express
const app = express();

app.use(cors());

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect('mongodb+srv://harsh:Vepsun8vit01@cluster0.mazps.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

// Use routes
app.use('/api', reactionRoutes);

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
