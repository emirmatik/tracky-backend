const getDefaultPreferences = (email) => ({
  enableEmailNotifications: true,
  enableAppNotifications: true,
  notifiedEmail: email,
  // appTheme: 'light'
});

module.exports = { getDefaultPreferences };
