<template>
    <div class="hello">
        <h1>Wizards Poke</h1>
        <small v-if="accounts.user">Your account: {{accounts.user}}</small>
        <hr/>
        <label for="other">Poke Wizards Owner: </label>
        <input id="other" type="text" v-model="accounts.other"/>
        <button @click="poke">Poke</button>
    </div>
</template>

<script>
    import {ethers} from "ethers";
    import Accounts from '@/Firebase/Accounts';
    import {db, messaging} from '@/Firebase/index';
    import env from '@/_config/env';

    messaging.usePublicVapidKey(env.messaging.publicVapidKey);

    export default {
        name: 'Chat',
        props: {
            msg: String
        },
        data: function () {
            return {
                accounts: {
                    user: null,
                    other: null
                }
            };
        },
        methods: {
            onFCMTokenReceived: async function (token) {
                if (token) {
                    console.log('token', token);
                    await Accounts.upsertFirebaseMessagingTokenForAccount(this.accounts.user, token);
                } else {
                    console.log('Unable to retrieve token - check permissions');
                }
            },
            getFCMToken: function () {
                messaging.getToken()
                    .then(currentToken => this.onFCMTokenReceived(currentToken))
                    .catch((err) => console.log('An error occurred while retrieving token. ', err));
            },
            poke: function () {
                const pokeId = this.$uuid.v4();
                db.collection('wizards').doc('network').collection('rinkeby').doc('293')
                    .collection('poke')
                    .doc(pokeId)
                    .set({msg: 'ullo'}, {
                        merge: true
                    });
                console.log(`poke!! ${pokeId}`);
            }
        },
        async mounted() {
            await window.ethereum.enable();
            const provider = new ethers.providers.Web3Provider(web3.currentProvider);
            const signer = provider.getSigner();

            const {chainId} = await provider.getNetwork();

            const accounts = await provider.listAccounts();
            if (accounts && accounts.length) {
                this.accounts.user = accounts[0];

                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        console.log('Notification permission granted.');

                        this.getFCMToken();

                        messaging.onTokenRefresh(() => this.getFCMToken());

                        messaging.onMessage(payload => {
                            console.log('Message received. ', payload);
                        });
                    } else {
                        console.log('Unable to get permission to notify.');
                    }
                });
            }
        },
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
