const app = require('express')();
const cors = require('cors');
const compression = require('compression');
const bodyParser = require('body-parser');

require('dotenv').config();

const itemsRoute = require('./routes/items');
const preferencesRoute = require('./routes/preferences');

const { runAll } = require('./core/puppeteer');

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};

app.use(compression());
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Routes in use
app.use('/preferences', preferencesRoute);
app.use('/items', itemsRoute);

app.get('/', async (req, res) => {
  res.send({
    message: 'Welcome to the Tracky\'s backend!',
  });
});

// Schedule the scraping function to run every 5 minutes
setInterval(() => {
  // console.log('\nChecking the items...\n');
  runAll();
}, 15_000);

const PORT = process.env.PORT || 8080;

// eslint-disable-next-line no-console
app.listen(PORT, () => console.log(`listening from :${PORT} 🚀`));
