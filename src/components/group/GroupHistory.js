/* @flow */
import type {
  Capabilities,
  GroupState,
  GroupRouteParams,
  RouteLocation,
} from "../../types";

import React, { Component } from "react";

import HistoryTable from "../HistoryTable";
import CollectionTabs from "./GroupTabs";


export default class GroupHistory extends Component {
  props: {
    params: GroupRouteParams,
    group: GroupState,
    capabilities: Capabilities,
    location: RouteLocation,
    hasNextHistory: boolean,
    listGroupNextHistory: ?Function,
  };

  render() {
    const {
      params,
      group,
      capabilities,
      location,
      listGroupNextHistory,
    } = this.props;
    const {bid, gid} = params;
    const {history: {entries, loaded, hasNextPage}} = group;

    return (
      <div>
        <h1>History for <b>{bid}/{gid}</b></h1>
        <CollectionTabs
          bid={bid}
          gid={gid}
          selected="history"
          capabilities={capabilities}>
          <HistoryTable
            bid={bid}
            historyLoaded={loaded}
            history={entries}
            hasNextHistory={hasNextPage}
            listNextHistory={listGroupNextHistory}
            location={location} />
        </CollectionTabs>
      </div>
    );
  }
}
