/* eslint-disable no-restricted-syntax */
// /items route
const router = require('express').Router();

const { errorJson, successJson } = require('../../core/api-response');
const { sendMail } = require('../../core/puppeteer');
const {
  auth,
  get,
  addTrackedItem,
  markTrackedItemAsSeen,
} = require('../../db/firebase');

router.get('/', async (_req, res) => {
  res.json({ message: 'Welcome to /items' });
});

router.get('/all', async (_req, res) => {
  try {
    const users = await get('tracked_items');

    res.json(successJson(users));
  } catch (error) {
    res.status(500).json(errorJson(error, 'Error fetching users'));
  }
});

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  // user validation
  try {
    await auth.getUser(userId);
  } catch (error) {
    return res.status(404).json(errorJson(null, `No user found with the uid: ${userId}`, 404));
  }

  try {
    const itemsById = await get(`tracked_items/${userId}`, {});
    const items = Object?.values(itemsById);

    return res.json(successJson(items));
  } catch (error) {
    return res.status(500).json(errorJson(error));
  }
});

router.post('/:userId', async (req, res) => {
  const { userId } = req.params;
  const item = req.body;

  // required param for item
  const requiredParams = ['url', 'title', 'html', 'xpath'];

  if (!item
    || requiredParams.some((param) => !Object.prototype.hasOwnProperty.call(item, param))) {
    const missingParameters = requiredParams
      .filter((param) => !Object.prototype.hasOwnProperty.call(item, param));
    return res.status(400).json(errorJson(null, `Missing parameters in the item: ${missingParameters}`));
  }

  // user validation
  try {
    await auth.getUser(userId);
  } catch (error) {
    return res.status(404).json(errorJson(null, `No user found with the uid: ${userId}`, 404));
  }

  // add to the db
  try {
    const addedItem = await addTrackedItem(userId, item);
    const usersAllItems = await get(`tracked_items/${userId}`, {});

    if (Object.keys(usersAllItems).length === 1) {
      const user = await auth.getUser(userId);

      sendMail(user.email, 'You took the first step! 🏁', `
        You've successfully started tracking your first item: <strong>${addedItem.title}</strong> 👀 <br/> <br/>
        We will send a message to this email every time there's a change on <strong>${addedItem.title}</strong>. If you want to change
        the email we send messages to, head to the Tracky app to do so. <br/> <br/>
        We are so happy to see you here 🥳
      `, user.displayName);
    }

    return res.json(successJson(addedItem));
  } catch (error) {
    return res.status(400).json(errorJson(error));
  }
});

router.post('/seen/:userId', async (req, res) => {
  const { userId } = req.params;
  const itemIds = req.body;

  if (!itemIds || !Array.isArray(itemIds)) {
    return res.status(400).json(errorJson(null, 'Invalid itemIds'));
  }

  // user validation
  try {
    await auth.getUser(userId);
  } catch (error) {
    return res.status(404).json(errorJson(null, `No user found with the uid: ${userId}`));
  }

  const promises = [];

  for (const itemId of itemIds) {
    promises.push(markTrackedItemAsSeen(userId, itemId));
  }

  await Promise.all(promises);

  return res.json(successJson(null));
});

module.exports = router;
