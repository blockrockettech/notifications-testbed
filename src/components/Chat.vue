<template>
    <div class="hello">

        <div class="row mb-4" v-if="accounts.user">
            <div class="col">
                Your account: {{accounts.user}}
            </div>
        </div>

        <div v-if="kitties.user && kitties.user.length" class="row">
            <div class="col">
                <b-card-group columns>

                    <b-card v-for="(kittie, idx) in kitties.user" :key="idx" class="p-0 text-center" :class="{'border-primary': kittie.id.toString() === kitties.userSelected}">
                        <b-card-img :src="kittie.image_url_png" @click="userKittieSelected(kittie.id.toString())"></b-card-img>
                        <b-card-title class="text-center" @click="userKittieSelected(kittie.id.toString())">{{ kittie.name }}</b-card-title>
                        <b-card-text class="">
                            <div class="row text-center">
                                <div class="col"><span class="badge badge-light">{{ kittie.id }}</span></div>
                                <div class="col"><span class="badge badge-primary">GEN: {{ kittie.generation }}</span></div>
                            </div>
                        </b-card-text>

                        <b-list-group flush class="border-top">
                            <b-list-group-item v-for="(swipeRight, idx) in kittie.swipeRightsIncoming" :key="`I${idx}`"
                                               :class="{'bg-light': swipeRight.status === 'PENDING', 'bg-minty': swipeRight.status === 'MATCH'}">
                                <div class="row">
                                    <div class="col">
                                        <span class="badge"
                                              :class="{'badge-warning': swipeRight.status === 'PENDING', 'badge-light': swipeRight.status === 'MATCH'}">INCOMING {{swipeRight.status}}</span>

                                        <div class="row">
                                            <div class="col">
                                                <img style="height: 80px" :src="swipeRight.kittie.kittieImg"/>
                                                <div class="small">{{ swipeRight.kittie.name }}</div>
                                            </div>

                                            <div class="col">
                                                <img style="height: 80px" :src="swipeRight.stud.studImg"/>
                                                <div class="small">{{ swipeRight.stud.name }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="row mt-2">
                                    <div class="col text-right" v-if="swipeRight.status === 'PENDING'">
                                        <button @click="acceptRight(kittie.id, swipeRight.stud.id)" class="btn btn-info btn-sm">Match 💖</button>
                                    </div>
                                </div>
                            </b-list-group-item>

                            <b-list-group-item v-for="(swipeRight, idx) in kittie.swipeRightsOutgoing" :key="`O${idx}`"
                                               :class="{'bg-light': swipeRight.status === 'PENDING', 'bg-minty': swipeRight.status === 'MATCH'}">
                                <div class="row">
                                    <div class="col">
                                        <span class="badge" :class="{'badge-warning': swipeRight.status === 'PENDING', 'badge-light': swipeRight.status === 'MATCH'}">OUT {{swipeRight.status}}</span>

                                        <div class="row">
                                            <div class="col">
                                                <img style="height: 80px" :src="swipeRight.stud.studImg"/>
                                                <div class="small">{{ swipeRight.stud.name }}</div>
                                            </div>
                                            <div class="col">
                                                <img style="height: 80px" :src="swipeRight.kittie.kittieImg"/>
                                                <div class="small">{{ swipeRight.kittie.name }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </b-list-group-item>
                        </b-list-group>
                    </b-card>

                </b-card-group>
            </div>
        </div>
        <div v-else class="alert alert-warning">
            You don't own any kitties...
        </div>

        <hr/>

        <div class="row mb-4">
            <div class="col-8">
                <input id="other" type="text" v-model="accounts.other" class="form-control" placeholder="find kitties"/>
            </div>
            <div class="col-4">
                <button @click="find" class="btn btn-secondary">Find</button>
            </div>
        </div>

        <b-card-group columns v-if="kitties.other && kitties.other.length">

            <b-card :img-src="kittie.image_url_png" v-for="(kittie, idx) in kitties.other" :key="idx" class="p-0">
                <b-card-title class="text-center">{{ kittie.name }}</b-card-title>
                <b-card-text class="">
                    <div class="row text-center">
                        <div class="col"><span class="badge badge-light">{{ kittie.id }}</span></div>
                        <div class="col"><span class="badge badge-primary">GEN: {{ kittie.generation }}</span></div>
                    </div>
                </b-card-text>

                <b-card-footer>
                    <div class="row">
                        <div class="col text-right">
                            <button @click="swipeRight(kittie)" class="btn btn-info btn-sm">Swipe right 💖</button>
                        </div>
                    </div>
                </b-card-footer>
            </b-card>

        </b-card-group>
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
                    await Accounts.upsertFirebaseMessagingTokenForAccount(this.accounts.user.toLowerCase(), token);
                } else {
                    console.log('Unable to retrieve token - check permissions');
                }
            },
            getFCMToken: function () {
                messaging.getToken()
                    .then(currentToken => this.onFCMTokenReceived(currentToken))
                    .catch((err) => console.log('An error occurred while retrieving token. ', err));
            },
            swipeRight: async function (kittie) {
                const studId = this.kitties.userSelected;
                const {image_url_png, name} = this.kitties.user.filter(kittie => kittie.id.toString() === studId)[0];
                const studPayload = {
                    id: studId,
                    studImg: image_url_png,
                    name
                };
                const msg = `Want to breed with ${studPayload.name}?`;
                await KittiesService.swipeRight('mainnet', kittie, studPayload, msg, this.accounts.user.toLowerCase());

                console.log(`swipe right from ${studPayload.id} to ${kittie.id.toString()}`);

                // refresh page to see who your chasing
                this.getSwipeRights();
            },
            acceptRight: async function (kittieId, studId) {
                // it's a match
                console.log(`matching ${kittieId} to ${studId}`);
                await KittiesService.matchKitties('mainnet', studId.toString(), kittieId.toString());
            },
            find: async function () {
                this.kitties.other = await KittiesService.getAllKittiesForAddress('mainnet', this.accounts.other.toLowerCase());
            },
            getBlockchainUserKitties: async function () {

                // this loads from the blockchain and pushes to firebase - then gets the current data
                // this always upserts to get data fresh in case of transfers
                const cryptoKittiesApiEndpoint = `https://api.cryptokitties.co/v2/kitties?offset=0&limit=12&owner_wallet_address=${this.accounts.user}&parents=false&authenticated=true&include=sale,sire,other&orderBy=id&orderDirection=desc`;
                const kitties = (await axios.get(cryptoKittiesApiEndpoint)).data.kitties;

                this.kitties.user = kitties;

                this.userKittieSelected(kitties[0].id.toString());
                this.upsertKittiesAndGetSwipeRights(kitties);
            },
            upsertKittiesAndGetSwipeRights: async function (kitties) {
                await KittiesService.upsertKitties('mainnet', kitties);
                this.getSwipeRights();
            },
            getSwipeRights: async function () {
                this.kitties.user = await KittiesService.getAllKittiesWithSwipeRightsForAddress('mainnet', this.accounts.user.toLowerCase());
                this.kitties.userSelected = this.kitties.user[0].id.toString();
                console.log(`My kitties`, this.kitties.user);
            },
            userKittieSelected: async function (id) {
                this.kitties.userSelected = id;
            }
        },
        async mounted() {
            messaging.onMessage((payload) => {
                console.log('Message received:', payload);

                // in foreground
                const {title, body, icon} = payload.data;
                new Notification(title, {
                    body,
                    icon
                });

                // something happened get the latest data!!
                this.getSwipeRights();
            });

            messaging.onTokenRefresh(() => this.getFCMToken());

            // simple setup
            await window.ethereum.enable();
            const provider = new ethers.providers.Web3Provider(web3.currentProvider);

            const accounts = await provider.listAccounts();
            if (accounts && accounts.length) {
                this.accounts.user = accounts[0];

                // open up notification with a browser allow request
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        console.log('Notification permission granted.');

                        this.getFCMToken();

                        this.getBlockchainUserKitties();
                    } else {
                        console.log('Unable to get permission to notify.');
                    }
                });
            }
        },
    };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
    ul {
        list-style-type: none;
        padding: 0;
    }

    li {
        display: inline-block;
        margin: 0 10px;
    }

    .card-body {
        padding: 0;
    }

    .card-img {
        width: 50%;
    }
</style>
