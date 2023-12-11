const router = require('express').Router();

const { errorJson, successJson } = require('../../core/api-response');
const { get, updatePreferences, auth } = require('../../db/firebase');

router.get('/', async (req, res) => {
  res.json({ message: 'Welcome to /preferences' });
});

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  // user validation
  try {
    await auth.getUser(userId);
  } catch (error) {
    return res.status(404).json(errorJson(null, `No user found with the uid: ${userId}`));
  }

  try {
    const preferences = await get(`preferences/${userId}`) || await updatePreferences(userId);

    return res.json(successJson(preferences));
  } catch (error) {
    return res.status(500).json(errorJson(error));
  }
});

router.put('/:userId', async (req, res) => {
  const { userId } = req.params;
  const newPreferences = req.body;

  if (!newPreferences || typeof newPreferences !== 'object') {
    return res.status(400).json(errorJson(null, 'You should provide a valid preference object'));
  }

  // user validation
  try {
    await auth.getUser(userId);
  } catch (error) {
    return res.status(404).json(errorJson(null, `No user found with the uid: ${userId}`));
  }

  // update preferences
  try {
    const preferences = await updatePreferences(userId, newPreferences);

    return res.json(successJson(preferences));
  } catch (error) {
    return res.status(500).json(errorJson(error));
  }
});

module.exports = router;
