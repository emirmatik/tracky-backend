const puppeteer = require('puppeteer-extra');
const Stealth = require('puppeteer-extra-plugin-stealth');

const { KnownDevices } = require('puppeteer');
const { get, updateTrackedItem } = require('../db/firebase');

puppeteer.use(Stealth());

const iPhone = KnownDevices['iPhone 13 Pro Max'];

const checkItem = async (userId, item) => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.emulate(iPhone);

  const { html, url, xpath } = item;

  if (!html || !url || !xpath) {
    // console.log('Cannot check: Invalid item');
    await browser.close();
    return;
  }

  try {
    await page.goto(url, { waitUntil: ['load'] });

    await page.waitForXPath(xpath, { timeout: 5_000 });

    const [section] = await page.$x(xpath);

    if (section) {
      const sectionHTML = await section.evaluate((x) => x.innerHTML);

      if (sectionHTML !== html) {
        // there's a change!!

        // take a screenshot
        await section.screenshot({ path: `./${item.title}.png` });

        // update the value and set it as updated
        const updatedValues = { html: sectionHTML, isUpdated: true };

        await updateTrackedItem(userId, updatedValues, item);

        // TODO :: send notifications
      }
    }
  } catch (error) {
    // console.log(`No such HTML element for ${item.title}`);
  }

  await browser.close();
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

module.exports = { runAll };
