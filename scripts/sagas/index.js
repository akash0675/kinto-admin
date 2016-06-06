import { fork } from "redux-saga/effects";

import * as sessionSagas from "./session";
import * as routeSagas from "./route";
import * as bucketSagas from "./bucket";
import * as collectionSagas from "./collection";


export default function* rootSaga() {
  yield [
    // session
    fork(sessionSagas.watchSessionSetup),
    fork(sessionSagas.watchSessionSetupComplete),
    fork(sessionSagas.watchSessionLogout),
    fork(sessionSagas.watchSessionBuckets),
    // route
    fork(routeSagas.watchRouteUpdated),
    // bucket/collections
    fork(bucketSagas.watchBucketLoad),
    fork(bucketSagas.watchBucketCreate),
    fork(bucketSagas.watchBucketUpdate),
    fork(bucketSagas.watchBucketDelete),
    fork(bucketSagas.watchCollectionLoad),
    fork(bucketSagas.watchCollectionCreate),
    fork(bucketSagas.watchCollectionUpdate),
    fork(bucketSagas.watchCollectionDelete),
    // collection/records
    fork(collectionSagas.watchCollectionRecords),
    fork(collectionSagas.watchRecordLoad),
    fork(collectionSagas.watchRecordCreate),
    fork(collectionSagas.watchRecordUpdate),
    fork(collectionSagas.watchRecordDelete),
    fork(collectionSagas.watchBulkCreateRecords),
    fork(collectionSagas.watchAttachmentDelete),
  ];
}