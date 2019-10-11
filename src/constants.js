import { eventChannel, buffers, END } from 'redux-saga';
//const BigNumber = require('bignumber.js');

export const SupplyChain = require("./contracts/SupplyChain.json");
export const SupplyChainAddress = '0xEbFefE3741461b4eE325c57D590BeB51bCd1e4Ba';
export const SupplyChainGenesis = 0;

export const getContract = (web3) => 
  new web3.eth.Contract(SupplyChain.abi, SupplyChainAddress);

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

/* ACTiONS */
export const LOAD_WEB3 = 'SupplyChain/LOAD_WEB3';
export const LOAD_WEB3_SUCCESS = 'SupplyChain/LOAD_WEB3_SUCCESS';
export const LOAD_WEB3_ERROR = 'SupplyChain/LOAD_WEB3_ERROR';
export const NETWORK_LOADED = 'SupplyChain/NETWORK_LOADED';
export const NETWORK_CHANGE = 'SupplyChain/NETWORK_CHANGE';
export const NETWORK_SYNCING = 'SupplyChain/NETWORK_SYNCING';
export const BLOCK_UPDATE = 'SupplyChain/BLOCK_UPDATE';
export const ACCOUNT_CHANGE = 'SupplyChain/ACCOUNT_CHANGE';
export const ACCOUNT_CHANGED = 'SupplyChain/ACCOUNT_CHANGED';
export const ACCOUNT_MOUNTED = 'SupplyChain/ACCOUNT_MOUNTED';
export const ACCOUNT_ERROR = 'SupplyChain/ACCOUNT_ERROR';
export const CONTRACT_EVENT = 'SupplyChain/CONTRACT_EVENT';
export const SEND_TX = 'SupplyChain/SEND_TX';
export const TX_UPDATE = 'SupplyChain/TX_UPDATE';
export const UI_CHANGE_DRAWER_VIEW = 'SupplyChain/UI_CHANGE_DRAWER_VIEW';
export const UI_NODE_SELECTED = 'SupplyChain/UI_NODE_SELECTED';
export const UI_ITEM_SELECTED = 'SupplyChain/UI_ITEM_SELECTED';
export const UI_ITEM_LAST_STEP = 'SupplyChain/UI_ITEM_LAST_STEP';
export const UI_STEP_SELECTED = 'SupplyChain/UI_STEP_SELECTED';
export const CREATE_SUPPLY_NODE = 'SupplyChain/CREATE_SUPPLY_NODE';
export const CREATE_SUPPLY_ITEM = 'SupplyChain/CREATE_SUPPLY_ITEM';
export const CREATE_SUPPLY_STEP = 'SupplyChain/CREATE_SUPPLY_STEP';
export const ADD_TEMP_FILE = 'SupplyChain/ADD_TEMP_FILE';
export const REMOVE_TEMP_FILE = 'SupplyChain/REMOVE_TEMP_FILE';
export const SEARCH_UPDATE = 'SupplyChain/SEARCH_UPDATE';
export const SEARCH_RESULT = 'SupplyChain/SEARCH_RESULT';
export const UI_TOGGLE_CREATE_MODAL = 'BlockRacer/UI_TOGGLE_CREATE_MODAL';



/* Create external event channels */
export const createBlockUpdateChannel = (web3) => eventChannel(emitter => {
  const blockSub = web3.eth.subscribe('newBlockHeaders');
  const onBlockUpdate = (block) => {
    emitter({block});
  };
  blockSub.on("data", onBlockUpdate);
  return () => blockSub.unsubscribe();
}, buffers.sliding(2));

export const createAccountChangeChannel = () => eventChannel(emitter => {
  const accountChanged = () => {
    emitter({ accountHasChanged: true });
  };
  if (!!window.ethereum) 
    window.ethereum.on('accountsChanged', accountChanged);
  else if (!!window.web3) {
    window.web3.on('accountsChanged', accountChanged);
  }
  return () => {
    if (!!window.ethereum) 
      window.ethereum.off('accountsChanged', accountChanged);
    else if (!!window.web3) {
      window.web3.off('accountsChanged', accountChanged);
    }
  }
}, buffers.sliding(2));

export const createTransactionChannel = (tx, params) => eventChannel(emitter => {
  let txSub;
  var hash;
  try { 
    txSub = tx.send(params);
    txSub.on('transactionHash', (_hash) => {
      hash = _hash; 
      //console.log('Hash: '+hash)
      emitter({type: 'hash', hash});
    });
    txSub.on('receipt', (receipt) => emitter({type: 'receipt', receipt, hash}));
    txSub.on('confirmation', (count, receipt) => {
      emitter({type: 'confirmation', receipt, count, hash});
      if (count >= 12) emitter(END);
    });
    txSub.on('error', (error) => {
      emitter({type: 'error', error, hash});
      emitter(END);
    });
  } catch(error) {
    emitter({type: 'cancel', error});
    emitter(END);
  }
  return () => {}
}, buffers.sliding(2));

export const createEventListenerChannel = (contract, topics) => eventChannel(emitter => {
  const eventSub = contract.events.allEvents({
    topics,
    fromBlock: 'latest'
  });
  const onEvent = (e) => { console.log('EVENT---------EVENT', e); emitter(e); }
  eventSub.on("data", onEvent);
  eventSub.on("changed", onEvent);
  return () => {}
}, buffers.sliding(2));


/* Local account persistence */
export const saveAccountState = (account, state) => {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(`SupplyChain/account/${account}`, serialized);
  } catch (e) {
    console.error('Account cache store fail: error', e);
  }
};

export const loadAccountState = (account) => {
  try {
    const serialized = localStorage.getItem(`SupplyChain/account/${account}`);
    if (serialized === null) return undefined;
    else return JSON.parse(serialized);
  } catch (e) {
    console.error('Cached account retreival fail: error', e);
    return undefined;
  }
};

/* Global data persistence */
export const cacheSupplyItem = async (cachebase, network, itemId, itemName, itemFile) => {
  if (!cachebase || !network || !itemId || !itemValue) return; 
  const nameKey = itemName.toString().trim().toLowerCase();
  const itemValue = {
    id: itemId.toString().trim(),
    file: itemFile.toString().trim()
  };
  try {
    const nameRef = cachebase.ref(`/itemCache/${network}/${nameKey}`);
    const snapshot = await nameRef.once("value");
    if (!snapshot || !snapshot.val()) {
      nameRef.set(itemValue);
      console.log('cacheItem name SET: '+nameKey+' = ', itemValue);
    }else console.log('cacheItem name already set: '+nameKey+' = ', snapshot.val());
  } catch (e) {
    console.error('firebase cacheItem fail, e: ', e);
  }
};

export const uncacheSupplyItem = async (cachebase, network, itemId, itemName) => {
  if (!cachebase || !network || !itemId || !itemName) return; 
  const nameKey = itemName.toString().trim().toLowerCase();
  const itemKey = itemId.toString().trim();
  try {
    const nameRef = cachebase.ref(`/itemCache/${network}/${nameKey}`);
    const snapshot = await nameRef.once("value");
    if (!!snapshot && !!snapshot.val() && snapshot.val().id === itemKey) {
      nameRef.set(null);
      console.log('cacheItem name UNSET: '+nameKey+' = null');
    }else console.log('cacheItem name doesnt exist: '+nameKey+' = '+itemKey);
  } catch (e) {
    console.error('firebase uncacheItem fail, e: ', e);
  }
};


/* Transaction actions */
export const addSupplyNodeTx = ({ digest, meta, size }) => ({
  method: 'addSupplyNode', 
  args: [digest, meta, size]
});

export const removeSupplyNodeTx = (nodeId) => ({
  method: 'removeSupplyNode', 
  args: [nodeId]
});

export const addSupplyItemTx = ({ node, digest, meta, size }) => ({
  method: 'addSupplyItem', 
  args: [node, digest, meta, size]
});

export const removeSupplyItemTx = (itemId) => ({
  method: 'removeSupplyItem', 
  args: [itemId]
});

export const approveNodeOpTx = ({ node, operator, approved }) => ({
  method: 'approveNodeOp', 
  args: [node, operator, approved]
});

export const addSupplyStepTx = ({ node, item, precedents, digest, meta, size }) => ({
  method: 'addSupplyStep', 
  args: [node, item, precedents, digest, meta, size]
});  

export const removeSupplyStepTx = (stepId) => ({
  method: 'removeSupplyStep', 
  args: [stepId]
});  

export const requestSupplyStepTx = ({ step, node }) => ({
  method: 'requestSupplyStep', 
  args: [step, node]
});  

export const approveSupplyNodeTx = ({ step, node, approved }) => ({
  method: 'approveSupplyNode', 
  args: [step, node, approved]
});  


/* Manual topic filter */
export const accountTopic = (place, topic) => 
  //entity = transfer-from, nameChange,and spawned
  //blockRacer = enter, exit, train, finished
  ((place === 1) ? ([null, topic, null, null]) : 
  //entity = transfer-to
  //blockRacer = raceSettled, laneSettled
  (place === 2) ? ([null, null, topic, null]) : 
  //entity = spawner
  ([null, null, null, topic]));

/* Get past web3 events wrapper */
export const getPastEvents = async (contract, event, options) => 
  await contract.getPastEvents(event, options);

/* Clean and type, incoming events */
const cleanEvent = (e) => ({
  ...e,
  raw: null,//unneeded
  returnValues: 
    (e.event === 'SupplyNodeAdded' || e.event === 'SupplyNodeRemoved') ? {
      node: e.returnValues.nodeId.toString(),
      owner: e.returnValues.owner.toString(),
      timestamp: parseInt(e.returnValues.timestamp,10)
    } : (e.event === 'NodeOpApproval') ? {
      node: e.returnValues.nodeId.toString(),
      operator: e.returnValues.operator.toString(),
      approved: (e.returnValues.approved) ? true : false,
      timestamp: parseInt(e.returnValues.timestamp,10)
    } : (e.event === 'SupplyItemAdded' || e.event === 'SupplyItemRemoved') ? {
      node: e.returnValues.nodeId.toString(),
      item: e.returnValues.itemId.toString(),
      timestamp: parseInt(e.returnValues.timestamp,10)
    } : (e.event === 'SupplyStepAdded' || e.event === 'SupplyStepRemoved') ? {
      step: e.returnValues.stepId.toString(),
      node: e.returnValues.nodeId.toString(),
      item: e.returnValues.itemId.toString(),
      timestamp: parseInt(e.returnValues.timestamp,10)
    } : (e.event === 'SupplyStepRequest') ? {
      step: e.returnValues.stepId.toString(),
      owner: e.returnValues.owner.toString(),
      node: e.returnValues.nodeId.toString(),
      timestamp: parseInt(e.returnValues.timestamp,10)
    } : (e.event === 'SupplyNodeApproval') ? {
      step: e.returnValues.stepId.toString(),
      owner: e.returnValues.owner.toString(),
      node: e.returnValues.nodeId.toString(),
      approved: (e.returnValues.approved) ? true : false,
      timestamp: parseInt(e.returnValues.timestamp,10)
    } : {}
});

/* map incoming events to UI state */
export const mapEventToState = (event, state) => {
  if (!event || !state) return;
  const e = cleanEvent(event);
  if (!e.removed && !state.eventLog[e.id]) {
    e.account = state.account;
    state.eventLog[e.id] = e;
    state.events.unshift(e.id);//descending order
  } else if (!e.removed && !!state.eventLog[e.id]) {
    return;//already processed event
  } else if (e.removed && !state.eventLog[e.id]) {
    return;//already undid and removed event
  } else if (e.removed && !!state.eventLog[e.id]) {
    const alreadyRemoved = !!state.eventLog[e.id].removed;//defensive
    state.events = state.events.filter((each) => each !== e.id);
    state.eventLog[e.id] = null;
    if (alreadyRemoved) return;//never want to process remove more than once
  }
  //process event to state
  if (e.event === 'SupplyNodeAdded' || e.event === 'SupplyNodeRemoved' || e.event === 'NodeOpApproval') {
    const node = e.returnValues.node;
    if (!state.nodes) state.nodes = [];
    if (
      (!e.removed && e.event === 'SupplyNodeAdded' && !state.nodes.includes(node)) ||
      (e.removed && e.event === 'SupplyNodeRemoved' && !state.nodes.includes(node)) ||
      (!e.removed && e.event === 'NodeOpApproval' && e.returnValues.approved && !state.nodes.includes(node)) ||
      (e.removed && e.event === 'NodeOpApproval' && !e.returnValues.approved && !state.nodes.includes(node))
    ) {
      state.nodes.push(node);
    } else if (
      (!e.removed && e.event === 'SupplyNodeRemoved' && state.nodes.includes(node)) ||
      (e.removed && e.event === 'SupplyNodeAdded' && state.nodes.includes(node)) ||
      (!e.removed && e.event === 'NodeOpApproval' && !e.returnValues.approved && state.nodes.includes(node)) ||
      (e.removed && e.event === 'NodeOpApproval' && e.returnValues.approved && state.nodes.includes(node))
    ) {
      state.nodes = state.nodes.filter((each) => each !== node);
    }
  } else if (e.event === 'SupplyItemAdded' || e.event === 'SupplyItemRemoved') {
    const node = e.returnValues.node;
    const item = e.returnValues.item;
    if (!state.nodeItems) state.nodeItems = {};
    if (!state.nodeItems['$'+node]) state.nodeItems['$'+node] = [];
    if (
      (!e.removed && e.event === 'SupplyItemAdded' && !state.nodeItems['$'+node].includes(item)) ||
      (e.removed && e.event === 'SupplyItemRemoved' && !state.nodeItems['$'+node].includes(item))
    ) {
      state.nodeItems['$'+node].push(item);
    } else if (
      (!e.removed && e.event === 'SupplyItemRemoved' && state.nodeItems['$'+node].includes(item)) ||
      (e.removed && e.event === 'SupplyItemAdded' && state.nodeItems['$'+node].includes(item))
    ) {
      state.nodeItems['$'+node] = state.nodeItems['$'+node].filter((each) => each !== item);
    }
  } else if (e.event === 'SupplyStepAdded' || e.event === 'SupplyStepRemoved') {
    const node = e.returnValues.node;
    //const item = e.returnValues.item;
    const step = e.returnValues.step;
    if (!state.nodeSteps) state.nodeSteps = {};
    if (!state.nodeSteps['$'+node]) state.nodeSteps['$'+node] = [];
    if (
      (!e.removed && e.event === 'SupplyStepAdded' && !state.nodeSteps['$'+node].includes(step)) ||
      (e.removed && e.event === 'SupplyStepRemoved' && !state.nodeSteps['$'+node].includes(step))
    ) {
      state.nodeSteps['$'+node].push(step);
    } else if (
      (!e.removed && e.event === 'SupplyStepRemoved' && state.nodeSteps['$'+node].includes(step)) ||
      (e.removed && e.event === 'SupplyStepAdded' && state.nodeSteps['$'+node].includes(step))
    ) {
      state.nodeSteps['$'+node] = state.nodeSteps['$'+node].filter((each) => each !== step);
    }
  } else if (e.event === 'SupplyNodeApproval' && e.returnValues.owner === state.account) {
    const step = e.returnValues.step;
    const node = e.returnValues.node;
    const approved = e.returnValues.approved;
    if (!state.stepNodeApprovals) state.stepNodeApprovals = {};
    if (!state.stepNodeApprovals['$'+step]) state.stepNodeApprovals['$'+step] = [];
    if (
      (!e.removed && approved && !state.stepNodeApprovals['$'+step].includes(node)) ||
      (e.removed && !approved && !state.stepNodeApprovals['$'+step].includes(node))
    ) {
      state.stepNodeApprovals['$'+step].push(node);
    } else if (
      (!e.removed && !approved && state.stepNodeApprovals['$'+step].includes(node)) ||
      (e.removed && approved && state.stepNodeApprovals['$'+step].includes(node))
    ) {
      state.stepNodeApprovals['$'+step] = state.stepNodeApprovals['$'+step]
        .filter((each) => each !== node);
    }
  } else if (e.event === 'SupplyNodeApproval') {
    const step = e.returnValues.step;
    const node = e.returnValues.node;
    const approved = e.returnValues.approved;
    if (!state.nodeStepApprovals) state.nodeStepApprovals = {};
    if (!state.nodeStepApprovals['$'+step]) state.nodeStepApprovals['$'+step] = [];
    if (
      (!e.removed && approved && !state.nodeStepApprovals['$'+step].includes(node)) ||
      (e.removed && !approved && !state.nodeStepApprovals['$'+step].includes(node))
    ) {
      state.nodeStepApprovals['$'+step].push(node);
    } else if (
      (!e.removed && !approved && state.nodeStepApprovals['$'+step].includes(node)) ||
      (e.removed && approved && state.nodeStepApprovals['$'+step].includes(node))
    ) {
      state.nodeStepApprovals['$'+step] = state.nodeStepApprovals['$'+step]
        .filter((each) => each !== node);
    }
  } else if (e.event === 'SupplyStepRequest' && e.returnValues.owner === state.account) {
    const step = e.returnValues.step;
    const node = e.returnValues.node;
    if (!state.stepNodeRequests) state.stepNodeRequests = {};
    if (!state.stepNodeRequests['$'+step]) state.stepNodeRequests['$'+step] = [];
    if (
      (!e.removed && !state.stepNodeRequests['$'+step].includes(node))
    ) {
      state.stepNodeRequests['$'+step].push(node);
    } else if (
      (e.removed && state.stepNodeRequests['$'+step].includes(node))
    ) {
      state.stepNodeRequests['$'+step] = state.stepNodeRequests['$'+step]
        .filter((each) => each !== node);
    }
  } else if (e.event === 'SupplyStepRequest') {
    const step = e.returnValues.step;
    const node = e.returnValues.node;
    if (!state.nodeStepRequests) state.nodeStepRequests = {};
    if (!state.nodeStepRequests['$'+step]) state.nodeStepRequests['$'+step] = [];
    if (
      (!e.removed && !state.nodeStepRequests['$'+step].includes(node))
    ) {
      state.nodeStepRequests['$'+step].push(node);
    } else if (
      (e.removed && state.nodeStepRequests['$'+step].includes(node))
    ) {
      state.nodeStepRequests['$'+step] = state.nodeStepRequests['$'+step]
        .filter((each) => each !== node);
    }
  }
  
}

