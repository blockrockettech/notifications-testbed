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

    async poke(pokeId, kittieId, message, from, studId) {
        return db.collection('kitties')
            .doc('network')
            .collection('mainnet')
            .doc(kittieId)
            .collection('poke')
            .doc(pokeId)
            .set({msg: message, from, stud: studId}, {
                merge: true
            });
    }

    async swipeRight(kittieId, studId, message, from) {
        return db.collection('kitties')
            .doc('network')
            .collection('mainnet')
            .doc(kittieId)
            .collection('swipeRight')
            .doc(studId)
            .set({msg: message, from, stud: studId}, {
                merge: true
            });
    }
}