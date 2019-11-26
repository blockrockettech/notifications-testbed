<template>
    <div class="hello">
        <h1>Crypto Kitties Tinder🔥</h1>
        <small v-if="accounts.user">Your account: {{accounts.user}}</small>
        <div v-if="kitties.user && kitties.user.length">
            <small>Your kitties:</small>
            <ul>
                <li v-for="(kittie, idx) in kitties.user" :key="idx">
                    <small>{{kittie}}</small>
                </li>
            </ul>
        </div>
        <div v-else>
            <small>You don't own any kitties according to firebase...</small>
        </div>
        <hr/>
        <label for="other">Find kitties from ETH Address: </label>
        <input id="other" type="text" v-model="accounts.other"/>
        <button @click="find">Find</button>

        <div v-if="kitties.other && kitties.other.length">
            <small>Found kitties:</small>
            <ul>
                <li v-for="(kittie, idx) in kitties.other" :key="idx">
                    <small>{{kittie}}</small> - <button @click="poke(kittie)">Poke</button> - <button @click="swipeRight(kittie)">Swipe Right🔥</button>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
    import {ethers} from "ethers";
    import Accounts from '@/Firebase/Accounts';
    import {db, messaging, firebase} from '@/Firebase/index';
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
                },
                kitties: {
                    user: null,
                    other: null
                },
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
            poke: function (kittieId) {
                const uuid = this.$uuid;
                const pokeId = uuid.v4();
                db.collection('kitties').doc('network').collection('mainnet').doc(kittieId)
                    .collection('poke')
                    .doc(pokeId)
                    .set({msg: 'Hello treakle, want to tinder?', from: this.accounts.user, stud: this.kitties.user[0]}, {
                        merge: true
                    });
                console.log(`poke [[${pokeId}]] to kittie ${kittieId}`);
            },
            swipeRight: function (kittieId) {
                const uuid = this.$uuid;
                const swipeId = uuid.v4();
                const stud = this.kitties.user[0];
                db.collection('kitties').doc('network').collection('mainnet').doc(kittieId)
                    .collection('swipeRight')
                    .doc(swipeId)
                    .set({msg: `Hello treakle, want to breed with ${stud}?`, from: this.accounts.user, stud}, {
                        merge: true
                    });
                console.log(`swipe [[${swipeId}]] to kittie ${kittieId}`);
            },
            find: async function() {
                this.kitties.other = await this.getKittiesForAddressFromDB('mainnet', this.accounts.other);
            },
            getKittiesForAddressFromDB: async function(network, address) {
                return await db.collection('kitties')
                    .doc('network')
                    .collection(network)
                    .where('owner', '==', address)
                    .get()
                    .then(snapshots => {
                        if (snapshots.empty) {
                            return [];
                        }
                        return snapshots.docs.map(doc => doc.id);
                    });
            },
            getUserKitties: async function() {
                this.kitties.user = await this.getKittiesForAddressFromDB('mainnet', this.accounts.user);
            }
        },
        async mounted() {
            messaging.onMessage((payload) => {
                console.log('Message received. ', payload);
                const {title, body, icon} = payload.data;
                new Notification(title, {
                    body,
                    icon
                });
            });

            messaging.onTokenRefresh(() => this.getFCMToken());

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

                        this.getUserKitties();
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
