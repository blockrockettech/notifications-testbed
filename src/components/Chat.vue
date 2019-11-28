<template>
    <div class="hello">
        <h1>Crypto Kitties Tinder🔥</h1>
        <small v-if="accounts.user">Your account: {{accounts.user}}</small>
        <div v-if="kitties.user && kitties.user.length">
            <small>Your kitties:</small>
            <ul>
                <li v-for="(kittie, idx) in kitties.user" :key="idx" style="display: block;">
                    <input type="radio" name="userKittie" :checked="kittie.id.toString() === kitties.userSelected" :value="kittie.id.toString()" @change="userKittieSelected"/>
                    <img style="height: 80px" :src="kittie.image_url_png" />
                    <small> {{kittie.id}}</small>
                    -
                    <small> {{kittie.name}}</small>
                    <small v-for="(swipeRight, idx) in kittie.swipeRights" :key="idx"> - {{swipeRight.status}} Swipe Right from {{swipeRight.stud}} <button @click="acceptRight(kittie.kittieId, swipeRight.stud)" v-if="swipeRight.status === 'PENDING'">Accept</button></small>
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
                <li v-for="(kittie, idx) in kitties.other" :key="idx" style="display: block;">
                    <img style="height: 80px" :src="kittie.image_url_png" />
                    <small>{{kittie.id}}-{{kittie.name}}</small> - <button @click="poke(kittie)">Poke</button> - <button @click="swipeRight(kittie.id.toString())">Swipe Right🔥</button>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
    import axios from 'axios';
    import {ethers} from "ethers";
    import Accounts from '@/Firebase/Accounts';
    import {db, messaging} from '@/Firebase/index';
    import KittiesService from '@/Firebase/CryptoKitties/KittiesService';
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
                    other: null,
                    userSelected: null
                },
            };
        },
        methods: {
            onFCMTokenReceived: async function (token) {
                if (token) {
                    console.log('token', token);
                    await Accounts.upsertFirebaseMessagingTokenForAccount('0x401cBf2194D35D078c0BcdAe4BeA42275483ab5F'.toLowerCase(), token);
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
                const msg = 'Hello treakle, want to tinder?';
                KittiesService.poke('mainnet', pokeId, kittieId, msg, this.accounts.user, this.kitties.user[0]);

                console.log(`poke [[${pokeId}]] to kittie ${kittieId}`);
            },
            swipeRight: async function (kittieId) {
                const studId = this.kitties.userSelected;
                const {image_url_png, name} = this.kitties.user.filter(kittie => kittie.id.toString() === studId)[0];
                const studPayload = {
                    id: studId,
                    studImg: image_url_png,
                    name
                };
                const msg = `Want to breed with ${studPayload.name}?`;
                await KittiesService.swipeRight('mainnet', kittieId, studPayload, msg, '0x401cBf2194D35D078c0BcdAe4BeA42275483ab5F'.toLowerCase());

                console.log(`swipe right from ${studPayload.id} to ${kittieId}`);
            },
            acceptRight: async function (kittieId, studId) {
                await KittiesService.matchKitties('mainnet', studId, kittieId);
                console.log('done matching!');
            },
            find: async function() {
                this.kitties.other = await KittiesService.getAllKittiesForAddress('mainnet', this.accounts.other.toLowerCase());
            },
            getUserKitties: async function() {
                const kitties = (await axios.get('https://api.cryptokitties.co/v2/kitties?offset=0&limit=12&owner_wallet_address=0x401cBf2194D35D078c0BcdAe4BeA42275483ab5F&parents=false&authenticated=true&include=sale,sire,other&orderBy=id&orderDirection=desc')).data.kitties;
                console.log('kitties', kitties);
                this.kitties.userSelected = kitties[0].id.toString();
                this.kitties.user = kitties;
                KittiesService.upsertKitties('mainnet', kitties);
                //this.kitties.user = await KittiesService.getAllKittiesWithSwipeRightsForAddress('mainnet', /*this.accounts.user*/'0x401cBf2194D35D078c0BcdAe4BeA42275483ab5F');
            },
            userKittieSelected: async function(e) {
                this.kitties.userSelected = e.target.value;
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
