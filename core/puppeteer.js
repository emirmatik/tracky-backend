const puppeteer = require('puppeteer-extra');
const Stealth = require('puppeteer-extra-plugin-stealth');
const nodemailer = require('nodemailer');

const { KnownDevices } = require('puppeteer');
const { get, updateTrackedItem, auth } = require('../db/firebase');

puppeteer.use(Stealth());

const iPhone = KnownDevices['iPhone 13 Pro Max'];

const sendMail = (email, subject, text, username) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_TRANSPORTER_MAIL,
      pass: process.env.EMAIL_TRANSPORTER_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_TRANSPORTER_MAIL,
    to: email,
    subject,
    html: `Hey <strong>${username}</strong>,<br/><br/>
      ${text}<br/><br/>
      Stay well, <br/>
      Tracky team <br/>
      <br/>
      <img src="cid:tracky-banner"/>
      <br/>
    `,
    attachments: [{
      filename: 'tracky-banner.png',
      path: `${__dirname}/../data/tracky-banner.png`,
      cid: 'tracky-banner',
    }],
  };

  transporter.sendMail(mailOptions);
};

const checkItem = async (userId, item) => {
  const browser = await puppeteer.launch({
    args: [
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--no-zygote',
    ],
    headless: 'new',
    executablePath: process.env.NODE_ENV === 'production'
      ? process.env.PUPPETEER_EXECUTABLE_PATH
      : puppeteer.executablePath(),
  });
  try {
    const page = await browser.newPage();

    await page.emulate(iPhone);

    const { html, url, xpath } = item;

    if (!html || !url || !xpath) {
      await browser.close();
      return;
    }

    await page.goto(url, { waitUntil: ['load'] });

    await page.waitForXPath(xpath, { timeout: 5_000 });

    const [section] = await page.$x(xpath);

    if (section) {
      const sectionHTML = await section.evaluate((x) => x.innerHTML);

      if (sectionHTML !== html) {
        // take a screenshot
        // await section.screenshot({ path: `./${item.title}.png` });

        // update the value and set it as updated
        const updatedValues = { html: sectionHTML, isUpdated: true };

        await updateTrackedItem(userId, updatedValues, item);

        const user = await auth.getUser(userId);
        const preferences = await get(`preferences/${userId}`);

        const subject = 'One of your tracked items has changed! | Tracky';
        const body = `There is a change on your item ${item.title}! <br/>
          Head to the Tracky app to see what's changed!!<br/><br/>
          <a href="https://www.google.com">or see it on the website!</a>
        `;

        if (preferences.enableEmailNotifications) {
          sendMail(user.email, subject, body, user.displayName);
        }
      }
    }
  } catch (error) {
    // console.log(`No such HTML element for ${item.title}`);
  } finally {
    await browser.close();
  }
};

const runAll = async () => {
  const itemsByUserId = await get('tracked_items');

  Object.keys(itemsByUserId).forEach(async (userId) => {
    const userItems = Object.values(itemsByUserId[userId]);

    const promises = [];

    userItems.forEach((item) => {
      promises.push(checkItem(userId, item));
    });

    await Promise.all(promises);
  });
};

module.exports = { runAll, sendMail };
