/*
 * App Actions
 *
 * Actions change things in your application
 * Since this boilerplate uses a uni-directional data flow, specifically redux,
 * we have these actions which are the only way your application interacts with
 * your application state. This guarantees that your state is up to date and nobody
 * messes it up weirdly somewhere.
 *
 * To add a new Action:
 * 1) Import your constant
 * 2) Add a function like this:
 *    export function yourAction(var) {
 *        return { type: YOUR_ACTION_CONSTANT, var: var }
 *    }
 */
import { LOAD_WEB3, LOAD_WEB3_SUCCESS, LOAD_WEB3_ERROR, NETWORK_LOADED, 
				 NETWORK_CHANGE, NETWORK_SYNCING, BLOCK_UPDATE, ACCOUNT_CHANGE,
				 ACCOUNT_CHANGED, ACCOUNT_MOUNTED, CONTRACT_EVENT, SEND_TX, TX_UPDATE, 
         UI_CHANGE_DRAWER_VIEW, UI_NODE_SELECTED, SEARCH_UPDATE, 
         SEARCH_RESULT, ACCOUNT_ERROR, CREATE_SUPPLY_ITEM,
         UI_TOGGLE_CREATE_MODAL, CREATE_SUPPLY_NODE,UI_ITEM_LAST_STEP,
         UI_ITEM_SELECTED, UI_STEP_SELECTED, CREATE_SUPPLY_STEP } from './constants';

/**
 * Load web3, this action starts the request saga
 * @return {object} An action object with a type of LOAD_WEB3
 */
export function loadWeb3() {
  return {
    type: LOAD_WEB3
  };
}

export function web3Loaded({cachebase, appWeb3, supplyChainC, network, block, accountWeb3, account, accountView }) {
  return {
    type: LOAD_WEB3_SUCCESS,
    cachebase, appWeb3, supplyChainC, network, block, accountWeb3, account, accountView
  };
}

export function web3Error({error}) {
  return {
    type: LOAD_WEB3_ERROR,
    error
  };
}

export function networkLoaded() {
  return {
    type: NETWORK_LOADED
  };
}

export function networkChange() {
  return {
    type: NETWORK_CHANGE
  };
}

export function networkSyncing({isSyncing}) {
  return {
    type: NETWORK_SYNCING,
    isSyncing
  };
}

export function blockUpdate({block}) {
  return {
    type: BLOCK_UPDATE,
    block
  };
}

export function accountChange() {
  return {
    type: ACCOUNT_CHANGE
  };
}

export function accountChanged({account, accountView}) {
  return {
    type: ACCOUNT_CHANGED,
		account, accountView
  };
}

export function accountError({error}) {
  return {
    type: ACCOUNT_ERROR,
    error
  };
}

export function accountMounted({events, eventLog, nodes, nodeItems, nodeSteps, lastBlock, stepNodeRequests, stepNodeApprovals, nodeStepRequests, nodeStepApprovals}) {
  return {
    type: ACCOUNT_MOUNTED,
    events, eventLog, nodes, nodeItems, nodeSteps, lastBlock, stepNodeRequests, stepNodeApprovals, nodeStepRequests, nodeStepApprovals
  };
}

export function contractEvent({event}) {
  return {
    type: CONTRACT_EVENT,
    event
  };
}

export function sendTx({method, args}) {
  return {
    type: SEND_TX,
    method, args
  };
}

export function txUpdate({tx}) {
  return {
    type: TX_UPDATE,
    tx
  };
}

export function uiChangeDrawerView({open, view}) {
  return {
    type: UI_CHANGE_DRAWER_VIEW,
    open, view
  };
}

export function uiToggleCreateModal({open, data}) {
  return {
    type: UI_TOGGLE_CREATE_MODAL,
    open, data
  };
}

export function createSupplyNode({file}) {
  return {
    type: CREATE_SUPPLY_NODE,
    file
  };
}

export function createSupplyItem({file}) {
  return {
    type: CREATE_SUPPLY_ITEM,
    file
  };
}

export function createSupplyStep({file, precedents}) {
  return {
    type: CREATE_SUPPLY_STEP,
    file, precedents
  };
}

export function searchUpdate({search, searchType}) {
  return {
    type: SEARCH_UPDATE,
    search, searchType
  };
}

export function searchResult({result}) {
  return {
    type: SEARCH_RESULT,
    result
  };
}

export function uiNodeSelected({id}) {
  return {
    type: UI_NODE_SELECTED,
    id
  };
}

export function uiItemSelected({id}) {
  return {
    type: UI_ITEM_SELECTED,
    id
  };
}

export function uiItemLastStepSelected({stepId}) {
  return {
    type: UI_ITEM_LAST_STEP,
    stepId
  };
}

export function uiStepSelected({id}) {
  return {
    type: UI_STEP_SELECTED,
    id
  };
}



