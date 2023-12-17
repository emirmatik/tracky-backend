const fb = require('firebase-admin');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { v4: uuid } = require('uuid');

const { getDefaultPreferences } = require('../data/defaults');

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CONFIG);

initializeApp({
  credential: fb.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = fb.database();
const auth = getAuth();

/**
 *  -- DB Schema --
 *
 *  tracked_items: {
 *      user_id_1: {
 *          item_id_1: <item_info>
 *      }
 *  }
 *
 *  preferences: {
 *      user_id_1: {
 *          ...
 *      }
 *  }
 */

const getValue = async (path, fallback = null) => {
  db.ref(path).on('value', () => { });
  const snapshot = await db.ref(path).get();

  if (snapshot.exists()) {
    return snapshot.val();
  }

  // console.log(`No data available for: ${path}`);
  return fallback;
};

const addTrackedItem = async (userId, item) => {
  const itemId = uuid();
  const newItem = { uid: itemId, isUpdated: false, ...item };
  await db.ref(`tracked_items/${userId}/${itemId}`).set(newItem);

  return newItem;
};

const markTrackedItemAsSeen = async (userId, itemId) => {
  await db.ref(`tracked_items/${userId}/${itemId}/isUpdated`).set(false);
};

const updateTrackedItem = async (userId, updatedValues, prevItem) => {
  const updatedItem = { ...prevItem, ...updatedValues };

  await db.ref(`tracked_items/${userId}/${updatedItem.uid}`).set(updatedItem);

  return updatedItem;
};

const updatePreferences = async (userId, preferences = {}) => {
  let currentPreferences = await getValue(`preferences/${userId}`);

  if (!currentPreferences) {
    const { email } = await auth.getUser(userId);
    currentPreferences = getDefaultPreferences(email);
  }

  const newPreferences = { ...currentPreferences, ...preferences };

  await db.ref(`preferences/${userId}`).set(newPreferences);

  return newPreferences;
};

module.exports = {
  auth,
  get: getValue,
  updateTrackedItem,
  addTrackedItem,
  updatePreferences,
  markTrackedItemAsSeen,
};
