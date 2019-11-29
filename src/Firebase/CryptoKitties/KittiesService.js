// todo: change this path when imported into the CK tinder app
import {db} from '../index';

export default new class KittiesService {
    async getAllKittiesForAddress(network, address) {
        return db.collection('kitties')
            .doc('network')
            .collection(network)
            .where('owner.address', '==', address)
            .get()
            .then(snapshots => {
                if (snapshots.empty) {
                    return [];
                }
                return snapshots.docs.map(doc => doc.data());
            });
    }

    async getAllSwipeRightsForKittie(network, kittieId) {
        return db.collection('kitties')
            .doc('network')
            .collection(network)
            .doc(kittieId)
            .collection('swipeRight')
            .get()
            .then(snapshots => {
                if (snapshots.empty) {
                    return [];
                }
                return snapshots.docs.map(doc => doc.data());
            });
    }

    async getAllKittiesWithSwipeRightsForAddress(network, address) {
        return db.collection('kitties')
            .doc('network')
            .collection(network)
            .where('owner.address', '==', address)
            .get()
            .then(snapshots => {
                if (snapshots.empty) {
                    return [];
                }
                return Promise.all(snapshots.docs
                    .map(doc => doc.data())
                    .map(async kittie => ({
                        ...kittie,
                        swipeRights: await this.getAllSwipeRightsForKittie(network, kittie.id.toString())
                    })));
            });
    }

    async upsertKitties(network, kitties) {
        //checkValidNetwork(network);

        return Promise.all(kitties.map(kittie => {
            // /kitties/network/{networkID}/{kittieId}/
            return db
                .collection('kitties')
                .doc('network')
                .collection(network)
                .doc(kittie.id.toString())
                .set(kittie, {
                    merge: true
                });
        }));
    }

    async matchKitties(network, studId, otherKittieId) {
        const timestamp = Math.floor( Date.now() / 1000 );

        // challenger data
        const studMatchData = {
            otherKittieId,
            timestamp
        };

        // challengee data
        const otherKittieMatchData = {
            studId,
            timestamp
        };

        const networkRef = db.collection('kitties').doc('network').collection(network);
        const studMatchDataRef = networkRef.doc(studId).collection('match').doc(otherKittieId);
        const otherMatchDataRef = networkRef.doc(otherKittieId).collection('match').doc(studId);
        const otherSwipeRightDataRef = networkRef.doc(otherKittieId).collection('swipeRight').doc(studId);

        await db.runTransaction(t => {
            t.set(studMatchDataRef, studMatchData);
            t.set(otherMatchDataRef, otherKittieMatchData);
            t.set(otherSwipeRightDataRef, {status: 'MATCH'}, { merge: true });
            return Promise.resolve('done');
        });
    }

    async poke(network, pokeId, kittieId, message, from, studId) {
        return db.collection('kitties')
            .doc('network')
            .collection(network)
            .doc(kittieId)
            .collection('poke')
            .doc(pokeId)
            .set({msg: message, from, stud: studId}, {
                merge: true
            });
    }

    async swipeRight(network, kittieId, stud, msg, from) {
        const payload = {msg, from, stud, status: 'PENDING'};
        return db.collection('kitties')
            .doc('network')
            .collection(network)
            .doc(kittieId)
            .collection('swipeRight')
            .doc(stud.id)
            .set(payload, {
                merge: true
            });
    }
}