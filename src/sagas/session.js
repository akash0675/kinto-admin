/* @flow */
import type { ActionType, GetStateFn, SagaGen } from "../types";

import { push as updatePath } from "react-router-redux";
import { call, put } from "redux-saga/effects";

import { saveSession, clearSession } from "../store/localStore";
import * as notificationActions from "../actions/notifications";
import * as actions from "../actions/session";
import * as historyActions from "../actions/history";
import { clone } from "../utils";
import { getClient, setupClient, resetClient } from "../client";


export function* setupSession(getState: GetStateFn, action: ActionType<typeof actions.setup>): SagaGen {
  const {auth} = action;
  try {
    setupClient(auth);
    yield put(notificationActions.clearNotifications({force: true}));
    yield put(actions.sessionBusy(true));
    yield put(actions.listBuckets());
    yield put(actions.setupComplete(auth));
  } catch(error) {
    yield put(notificationActions.notifyError("Couldn't complete session setup.", error));
  } finally {
    yield put(actions.sessionBusy(false));
  }
}

export function* sessionLogout(getState: GetStateFn, action: ActionType<typeof actions.logout>): SagaGen {
  resetClient();
  yield put(updatePath("/"));
  yield put(notificationActions.notifySuccess("Logged out.", {persistent: true}));
  yield call(clearSession);
}

function expandBucketsCollections(buckets, permissions) {
  // Create a copy to avoid mutating the source object
  const bucketsCopy = clone(buckets);

  // Augment the list of bucket and collections with the ones retrieved from
  // the /permissions endpoint
  for (const permission of permissions) {
    // Add any missing bucket to the current list
    let bucket = bucketsCopy.find(x => x.id === permission.bucket_id);
    if (!bucket) {
      bucket = {id: permission.bucket_id, collections: []};
      bucketsCopy.push(bucket);
    }
    // Add any missing collection to the current bucket collections list; note
    // that this will expose collections we have shared records within too.
    if ("collection_id" in permission) {
      const collection = bucket.collections.find(x => x.id === permission.collection_id);
      if (!collection) {
        bucket.collections.push({id: permission.collection_id});
      }
    }
  }

  return bucketsCopy;
}

export function* listBuckets(getState: GetStateFn, action: ActionType<typeof actions.listBuckets>): SagaGen {
  try {
    const client = getClient();
    // Fetch server information
    const serverInfo = yield call([client, client.fetchServerInfo]);
    // We got a valid response; officially declare current user authenticated
    // XXX: authenticated here means that we have setup the client, not
    // that the credentials are valid :/
    yield put(actions.setAuthenticated());
    // Store this valid server url in the history
    yield put(historyActions.addHistory(serverInfo.url));
    // Notify they're received
    yield put(actions.serverInfoSuccess(serverInfo));
    // Retrieve and build the list of buckets
    const {data} = yield call([client, client.listBuckets]);
    const responses = yield call([client, client.batch], (batch) => {
      for (const {id} of data) {
        batch.bucket(id).listCollections();
      }
    });
    let buckets = data.map((bucket, index) => {
      const {data: collections=[]} = responses[index].body;
      return {id: bucket.id, collections};
    });

    // If the Kinto API version allows it, retrieves all permissions
    if ("permissions_endpoint" in serverInfo.capabilities) {
      const {data: permissions} = yield call([client, client.listPermissions]);
      buckets = expandBucketsCollections(buckets, permissions);
      yield put(actions.permissionsListSuccess(permissions));
    }
    else {
      yield put(notificationActions.notifyInfo("Permissions endpoint is not enabled on server."));
    }

    yield put(actions.bucketsSuccess(buckets));

    // Save current app state
    yield call(saveSession, getState().session);
  } catch(error) {
    yield put(notificationActions.notifyError("Couldn't list buckets.", error));
  }
}
