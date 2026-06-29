const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const directories = ['uploads', 'data', 'logs'];
directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

app.use('/api/report', reportRoutes);

app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running with JSReport (HTML Preview Mode)',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const startServer = async () => {
  try {
    const jsreport = require('jsreport')();
    
    console.log('🔄 Initializing JSReport with HTML recipe...');
    
    //initialize jsreport
    await jsreport.init();
    
    console.log('JSReport initialized successfully');
    global.jsreportInstance = jsreport;
    
    //node server initialize
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`JSReport available for HTML rendering`);
    });
    
  } catch (error) {
    console.log("Error occured: ", error.message);
    console.log("Error details", error.stack)
  }
};

startServer();
module.exports = app;