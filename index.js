const app = require('express')();
const cors = require('cors');
const compression = require('compression');
const bodyParser = require('body-parser');

require('dotenv').config();

// const nodemailer = require('nodemailer');

const itemsRoute = require('./routes/items');
const preferencesRoute = require('./routes/preferences');

// const { runAll } = require('./core/puppeteer');

// TODO :: move to puppeteer.js
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_TRANSPORTER_MAIL,
//         pass: process.env.EMAIL_TRANSPORTER_PASSWORD
//     }
// });

// const mailOptions = {
//     from: process.env.EMAIL_TRANSPORTER_MAIL,
//     to: 'emirmatik16@gmail.com',
//     subject: 'One of your tracked items has changed! | Tracky',
//     text: 'First attempt...'
// };

// transporter.sendMail(mailOptions, function (error, info) {
//     if (error) {
//         console.log(error);
//     } else {
//         console.log('Email sent: ' + info.response);
//     }
// });

// Sample user uuid: fJARoNcmiDUFXULNhBHC39kTR552 (matik@gmail.com)

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

// // Schedule the scraping function to run every 5 minutes
// setInterval(() => {
//   console.log('\nChecking the items...\n');
//   runAll();
// }, 15_000);

const PORT = process.env.PORT || 8080;

// eslint-disable-next-line no-console
app.listen(PORT, () => console.log(`listening from :${PORT} 🚀`));
