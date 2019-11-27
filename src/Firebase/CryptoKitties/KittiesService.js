// todo: change this path when imported into the CK tinder app
import {db} from '../index';

export default new class KittiesService {
    async getAllKittiesForAddress(network, address) {
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
    }

    async getAllSwipeRightsForKittie(network, kittieId) {
        return await db.collection('kitties')
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

    async swipeRight(network, kittieId, studId, message, from) {
        const payload = {msg: message, from, stud: studId, status: 'PENDING'};
        return db.collection('kitties')
            .doc('network')
            .collection(network)
            .doc(kittieId)
            .collection('swipeRight')
            .doc(studId)
            .set(payload, {
                merge: true
            });
    }
}