<template>
    <div class="hello">
        <h1>Chat</h1>
    </div>
</template>

<script>
    import firebase from 'firebase';
    import "firebase/messaging";

    firebase.initializeApp();

    const messaging = firebase.messaging();
    messaging.usePublicVapidKey();

    export default {
        name: 'Chat',
        props: {
            msg: String
        },
      methods: {
          onFCMTokenReceived: function(token) {
            if (token) {
              //sendTokenToServer(currentToken);
              //updateUIForPushEnabled(currentToken);
              console.log('token', token);
            } else {
              // Show permission request.
              console.log('Unable to retrieve token - check permissions');
              // Show permission UI.
              //updateUIForPushPermissionRequired();
              //setTokenSentToServer(false);
            }
          },
        getFCMToken: function() {
          messaging.getToken()
                  .then(currentToken => this.onFCMTokenReceived(currentToken))
                  .catch((err) => console.log('An error occurred while retrieving token. ', err));
        }
      },
        mounted() {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              console.log('Notification permission granted.');

              this.getFCMToken();

              messaging.onTokenRefresh(() => this.getFCMToken());
            } else {
              console.log('Unable to get permission to notify.');
            }
          });
        }
    }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
    h3 {
        margin: 40px 0 0;
    }

    ul {
        list-style-type: none;
        padding: 0;
    }

    li {
        display: inline-block;
        margin: 0 10px;
    }

    a {
        color: #42b983;
    }
</style>
