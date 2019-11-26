const firebase = require('firebase');
require("firebase/firestore");
require("firebase/messaging");

const {firebaseConfig} = require('../_config/env');

firebase.initializeApp(firebaseConfig);

module.exports = {
    db: firebase.firestore(),
    messaging: firebase.messaging()
};
