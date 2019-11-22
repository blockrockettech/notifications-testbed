const firebase = require('firebase');
require("firebase/firestore");
require("firebase/messaging");

const {firebaseConfig} = require('../_config/env');

firebase.initializeApp(firebaseConfig);

const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert(require('../_config/sdk-keys')),
    databaseURL: 'https://alice-1555232535074.firebaseio.com'
});

module.exports = {
    db: firebase.firestore(),
    messaging: firebase.messaging(),
    admin
};
