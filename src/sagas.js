import { call, fork, put, select, take, takeLatest, takeEvery/*, cancel, cancelled*/ } from 'redux-saga/effects';
//import { eventChannel, buffers, END } from 'redux-saga';
//import { cacheBlockhash, getBlockhashSet, blockhashCacheThreshold } from "./firebase";
import { LOAD_WEB3, LOAD_WEB3_SUCCESS, NETWORK_CHANGE, ACCOUNT_CHANGE, ACCOUNT_CHANGED, 
         SEND_TX, BLOCK_UPDATE, SupplyChain, SupplyChainAddress, SupplyChainGenesis, 
         mapEventToState, createBlockUpdateChannel, createAccountChangeChannel, //createEventListenerChannel,
         createTransactionChannel, loadAccountState, saveAccountState,  
         getPastEvents, ITEM_SEARCH_UPDATE, accountTopic, CREATE_SUPPLY_ITEM,
         addSupplyItemTx, CREATE_SUPPLY_NODE, CREATE_SUPPLY_STEP, addSupplyNodeTx, SEARCH_UPDATE, 
         UI_ITEM_SELECTED, UI_STEP_SELECTED, UI_NODE_SELECTED, addSupplyStepTx 
       } from './constants';

import { web3Loaded, web3Error, accountChange, accountChanged, accountError,
         blockUpdate, accountMounted, contractEvent, txUpdate, searchResult,
         sendTx, addTempFile, removeTempFile, uiItemLastStepSelected
          } from './actions';

import { infuraConfig } from './infuraConfig';

import { firebase } from '@firebase/app';
import '@firebase/database';
import { firebaseConfig } from './firebaseConfig';

import { writeNodeFile, writeItemFile, writeStepFile, readIPFile, hashNodeFile } from './ipfs';
import bs58 from 'bs58';


const network = 'private';//'ropsten';


function* mountNetwork() {

  firebase.initializeApp(firebaseConfig);
  const cachebase = firebase.database();
  console.log('cachebase: ', cachebase);

  const Web3 = require('web3');
  let appWeb3;
  if (network === 'mainnet') {
    appWeb3 = new Web3( new Web3.providers.WebsocketProvider(
        `wss://mainnet.infura.io/ws/v3/${infuraConfig.key}`
    ));
  } else if (network === 'ropsten') {
    appWeb3 = new Web3( new Web3.providers.WebsocketProvider(
        `wss://ropsten.infura.io/ws/v3/${infuraConfig.key}`
    ));
  } else {//private
    appWeb3 = new Web3( new Web3.providers.WebsocketProvider(
        'ws://127.0.0.1:8545'
    ));
  }

  if (!appWeb3) {
      yield put(web3Error({error: 'App Web3 Provider failed.'}));
      return;
  }

  let accountWeb3 = undefined;
  if (typeof window.ethereum !== 'undefined') {
    try {// Requesting account access
      yield call(window.ethereum.enable);
      accountWeb3 = new Web3(window.ethereum, null, {
        transactionConfirmationBlocks: 12,
        transactionBlockTimeout: 64
      });
    } catch (e) {// User denied account access
      yield put(accountError({error: 'Web3 User denied account access.'}));
    }
  } else if (typeof window.web3 !== 'undefined') {// Legacy dapp browsers...
    accountWeb3 = new Web3(window.web3.currentProvider, null, {
      transactionConfirmationBlocks: 12,
      transactionBlockTimeout: 64
    });
  } else {
    yield put(accountError({error: 'Metamask/Web3 Provider not found.'}));
  }

  const supplyChainC = new appWeb3.eth.Contract(SupplyChain.abi, SupplyChainAddress);
  const block = yield call(appWeb3.eth.getBlock, 'latest');
  let init = {
    cachebase,
    appWeb3,
    supplyChainC,
    network,
    block,
    accountWeb3: undefined,
    account: '',
    accountView: ''
  };

  if(!!accountWeb3) {
    const getNetwork = async (web3) => await web3.eth.net.getNetworkType();
    const accountNetwork = yield call(getNetwork, accountWeb3);
    if (accountNetwork === init.network) {
      init.accountWeb3 = accountWeb3;
      yield fork(watchForAccountChanges);
    } else yield put(accountError({error: 'Set Web3 Network to: '+init.network}));
  } else yield put(accountError({error: 'Require Web3 Provider'}));
    /*
  let lastBlock = SupplyChainGenesis;
  let newEvents;
  let caughtUp = false;
  while (!caughtUp) {
    const _block = yield call(appWeb3.eth.getBlock, 'latest');
    if (lastBlock === _block.number){
      caughtUp = true;
      init.block = _block;
      yield fork(watchForBlockUpdates, appWeb3);
    } else {
      //console.log('catching up with block: ', _block.number);
      newEvents = yield* getNewAppEvents(lastBlock+1, _block.number);
      newEvents.forEach((e) => mapEventToState(e, init));
      if (!!init.accountWeb3) {
        newEvents = yield* getNewAccountEvents(lastBlock+1, _block.number);
        newEvents.forEach((e) => mapEventToState(e, init));
      }
      lastBlock = _block.number;
    }
    
  }
*/
  yield put(web3Loaded(init));
  yield fork(watchForBlockUpdates, appWeb3);
}

function* watchForBlockUpdates(web3) {
  const blockUpdateChannel = yield call(createBlockUpdateChannel, web3);
  try {
    while (true) {
      const { block } = yield take(blockUpdateChannel);
      if (!!block) {
        const { loadingWeb3, account, loadingAccount, mountingAccount, 
                  uiSelectedItem, uiSelectedStep } = yield select();
        if (!!account && !loadingAccount && !mountingAccount) {
          const { events, eventLog, nodes, nodeItems, nodeSteps, lastBlock } = yield select();
          yield fork(saveAccountState, account, { events, eventLog, nodes, 
            nodeItems, nodeSteps, lastBlock });
        }
        if (!loadingWeb3) yield put(blockUpdate({block}));
        if (!!uiSelectedItem) {
          yield fork(updateItemLastStep, {id: uiSelectedItem})
        }
      }
    }
  } catch (e) { console.log('Block Update Channel Error caught: ',e);
  } finally {
    blockUpdateChannel.close();
  }
}

function* watchForAccountChanges() {
  const accountChangeChannel = yield call(createAccountChangeChannel);
  try {
    while (true) {
      yield take(accountChangeChannel);
      yield put(accountChange());
    }
  } catch (e) { console.log('Internal RPC Error caught: ',e);
  } finally {
    accountChangeChannel.close();
  }
}

function* changeAccount() {
  const { accountWeb3 } = yield select();
  let accounts = undefined;
  if (!!accountWeb3) {
    try {
      accounts = yield call(accountWeb3.eth.getAccounts);
    } catch (e) { 
      accounts = undefined;
      console.log('Internal RPC Error caught: ',e);
    }
  }
  if (!!accounts && !!accounts[0]){
    const account = accounts[0].toString();
    const accountView = account.substr(0,7)+'...'+ account.substr(account.length-5, account.length);
    yield put(accountChanged({account, accountView}));
  } else {//account load error, clear account
    yield put(accountChanged({account: '', accountView: ''}));
  }
}

function* initAccountEvents() {
  const { appWeb3, account } = yield select();
  if (!appWeb3 || !account) return;
  const prevState = loadAccountState(account);
  console.log('trying prevState: ', prevState);
  let state = (true || !prevState) ? {
    account,
    lastBlock: SupplyChainGenesis, 
    events: [], 
    eventLog: {},
    nodes: [],
    nodeItems: {},
    nodeSteps: {}
  } : {
    ...prevState, account,
    //start from 12 blocks before last to recover from any reorg changes
    lastBlock: (prevState.lastBlock > 12) ? prevState.lastBlock - 12 : prevState.lastBlock
  };

  let newEvents;
  let caughtUp = false;
  while (!caughtUp) {
    const _block = yield call(appWeb3.eth.getBlock, 'latest');
    if (state.lastBlock === _block.number) caughtUp = true;
    else {
      //console.log('catching up with block: ', _block.number);
      newEvents = yield* getNewEvents(state.lastBlock+1, _block.number);
      if (!!newEvents && !!newEvents.length) {
        for (let i=0; i<newEvents.length; i++) {
          const event = newEvents[i]; 
          mapEventToState(event, state);
          yield* updateForEvent(event);
        }
      }

      if (!!state.nodes && !!state.nodes.length) {
        newEvents = yield* initNodeEvents(state.nodes, state.lastBlock+1, _block.number);
        if (!!newEvents && !!newEvents.length) {
          for (let i=0; i<newEvents.length; i++) {
            const event = newEvents[i]; 
            mapEventToState(event, state);
            yield* updateForEvent(event);
          }
        }
      }
      state.lastBlock = _block.number;
    }
  }
  console.log('loading state: ', state);
  yield put(accountMounted(state));
}

function* initNodeEvents(nodes, fromBlock, toBlock) {
  const { accountWeb3, supplyChainC, eventLog } = yield select();
  if (!supplyChainC || !eventLog) return;
  console.log('initNodeEvents nodes: ', nodes);
  let newEvents = [];
  const addEvent = (e) => {
    if (!e || !e.id) return;
    if (!eventLog[e.id] || (e.removed && !!eventLog[e.id])) {
      //delay removing removed events until after state mapping, which is delayed for ordered events
      newEvents.push(e);
    }
  }

  if (!!accountWeb3 && !!nodes && !!nodes.length) {
    try {
      let pastEvents = yield call(getPastEvents, supplyChainC, 'SupplyItemAdded', {
        filter: { nodeId: nodes },
        fromBlock, 
        toBlock
      }); 
      console.log('SupplyItemAdded pastEvents: ', pastEvents);
      pastEvents.forEach(addEvent);

      pastEvents = yield call(getPastEvents, supplyChainC, 'SupplyItemRemoved', {
        filter: { nodeId: nodes },
        fromBlock, 
        toBlock
      }); 
      //console.log('SupplyItemRemoved pastEvents: ', pastEvents);
      pastEvents.forEach(addEvent);

      pastEvents = yield call(getPastEvents, supplyChainC, 'SupplyStepAdded', {
        filter: { nodeId: nodes },
        fromBlock, 
        toBlock
      }); 
      //console.log('SupplyItemRemoved pastEvents: ', pastEvents);
      pastEvents.forEach(addEvent);

      pastEvents = yield call(getPastEvents, supplyChainC, 'SupplyStepRemoved', {
        filter: { nodeId: nodes },
        fromBlock, 
        toBlock
      }); 
      //console.log('SupplyItemRemoved pastEvents: ', pastEvents);
      pastEvents.forEach(addEvent);

      pastEvents = yield call(getPastEvents, supplyChainC, 'SupplyNodeApproval', {
        filter: { nodeId: nodes },
        fromBlock, 
        toBlock
      }); 
      console.log('SupplyNodeApproval pastEvents: ', pastEvents);
      pastEvents.forEach(addEvent);

      pastEvents = yield call(getPastEvents, supplyChainC, 'SupplyStepRequest', {
        filter: { nodeId: nodes },
        fromBlock, 
        toBlock
      }); 
      console.log('SupplyStepRequest pastEvents: ', pastEvents);
      pastEvents.forEach(addEvent);

    } catch (e) { console.log('Internal RPC Error caught: ',e); }
  }

  if (!!newEvents.length) {
    newEvents.sort((a,b) => ((a.blockNumber === b.blockNumber) ?
      a.transactionIndex - b.transactionIndex : a.blockNumber - b.blockNumber));
  }

  return newEvents;
}

function* getNewEvents(fromBlock, toBlock) {
  const { accountWeb3, account, supplyChainC, eventLog, nodes } = yield select();
  if (!supplyChainC || !eventLog) return;
  console.log('getNewEvents nodes: ', nodes);

  let newEvents = [];
  const addEvent = (e) => {
    if (!e || !e.id) return;
    if (!eventLog[e.id] || (e.removed && !!eventLog[e.id])) {
      //delay removing removed events until after state mapping, which is delayed for ordered events
      newEvents.push(e);
    }
  }

  if (!!accountWeb3 && !!account) {
    const topic = accountWeb3.eth.abi.encodeParameter('address', account);
    try {
      let pastEvents = yield call(getPastEvents, supplyChainC, 'allEvents', {
        topics: accountTopic(2, topic),//SupplyNodeAdded, SupplyNodeRemoved,and NodeOpApproval
        fromBlock, 
        toBlock
      }); 
      console.log('getNewEvents allEvents: ', pastEvents);
      pastEvents.forEach(addEvent);

      if (!!nodes && !!nodes.length) {
        pastEvents = yield call(getPastEvents, supplyChainC, 'SupplyItemAdded', {
          filter: { nodeId: nodes },
          fromBlock, 
          toBlock
        }); 
        console.log('SupplyItemAdded pastEvents: ', pastEvents);
        pastEvents.forEach(addEvent);

        pastEvents = yield call(getPastEvents, supplyChainC, 'SupplyItemRemoved', {
          filter: { nodeId: nodes },
          fromBlock, 
          toBlock
        }); 
        //console.log('SupplyItemRemoved pastEvents: ', pastEvents);
        pastEvents.forEach(addEvent);

        pastEvents = yield call(getPastEvents, supplyChainC, 'SupplyStepAdded', {
          filter: { nodeId: nodes },
          fromBlock, 
          toBlock
        }); 
        //console.log('SupplyItemRemoved pastEvents: ', pastEvents);
        pastEvents.forEach(addEvent);

        pastEvents = yield call(getPastEvents, supplyChainC, 'SupplyStepRemoved', {
          filter: { nodeId: nodes },
          fromBlock, 
          toBlock
        }); 
        //console.log('SupplyItemRemoved pastEvents: ', pastEvents);
        pastEvents.forEach(addEvent);

        pastEvents = yield call(getPastEvents, supplyChainC, 'SupplyNodeApproval', {
          filter: { nodeId: nodes },
          fromBlock, 
          toBlock
        }); 
        //console.log('SupplyItemRemoved pastEvents: ', pastEvents);
        pastEvents.forEach(addEvent);

        pastEvents = yield call(getPastEvents, supplyChainC, 'SupplyStepRequest', {
          filter: { nodeId: nodes },
          fromBlock, 
          toBlock
        }); 
        //console.log('SupplyItemRemoved pastEvents: ', pastEvents);
        pastEvents.forEach(addEvent);
      }
    } catch (e) { console.log('Internal RPC Error caught: ',e); }
  }

  if (!!newEvents.length) {
    newEvents.sort((a,b) => ((a.blockNumber === b.blockNumber) ?
      a.transactionIndex - b.transactionIndex : a.blockNumber - b.blockNumber));
  }

  return newEvents;
}

function* updateBlockEvents() {
  const { block } = yield select();
  const newEvents = yield* getNewEvents(block.number, block.number);
  if (!!newEvents && !!newEvents.length) {
    for (let i=0; i<newEvents.length; i++) {
      const event = newEvents[i]; 
      yield put(contractEvent({event}));
      yield* updateForEvent(event);
    }
  }
}

function* createSupplyNode({file}) {
  console.log('createSupplyNode, file: ', file);
  const fileHash = yield call(writeNodeFile, file);
  console.log('createSupplyNode, fileHash: ', fileHash);
  //yield put(addTempFile({fileHash, file}));

  const decoded = bs58.decode(fileHash);
  const txArgs = {
    digest: `0x${decoded.slice(2).toString('hex')}`,
    meta: decoded[0],
    size: decoded[1],
  }
  console.log('createSupplyNode, txArgs: ', txArgs);
  yield put(sendTx(addSupplyNodeTx(txArgs)));
}

function* createSupplyItem({file}) {
  const { uiSelectedNode } = yield select();
  if (!uiSelectedNode) return;

  console.log('createSupplyItem, file: ', file);
  const fileHash = yield call(writeItemFile, file);
  console.log('createSupplyItem, fileHash: ', fileHash);
  const decoded = bs58.decode(fileHash);
  const txArgs = {
    node: uiSelectedNode,
    digest: `0x${decoded.slice(2).toString('hex')}`,
    meta: decoded[0],
    size: decoded[1],
  }
  console.log('createSupplyItem, txArgs: ', txArgs);
  yield put(sendTx(addSupplyItemTx(txArgs)));
  
}

function* createSupplyStep({file, precedents}) {
  const { uiSelectedItem, uiSelectedNode} = yield select();
  if (!uiSelectedItem) return;
  const item = uiSelectedItem;
  const node = uiSelectedNode;
  console.log('createSupplyStep, node: ', uiSelectedNode);
  console.log('createSupplyStep, item: ', uiSelectedItem);
  console.log('createSupplyStep, file: ', file);
  console.log('createSupplyStep, precedents: ', precedents);
  if (!precedents) precedents = [];
  const fileHash = yield call(writeItemFile, file);
  console.log('createSupplyStep, fileHash: ', fileHash);
  const decoded = bs58.decode(fileHash);
  const txArgs = {
    node: uiSelectedNode,
    item: uiSelectedItem,
    precedents,
    digest: `0x${decoded.slice(2).toString('hex')}`,
    meta: decoded[0],
    size: decoded[1]
  }
  console.log('createSupplyStep, txArgs: ', txArgs);
  yield put(sendTx(addSupplyStepTx(txArgs)));
  
}

function* updateForEvent(e) {
  if (e.event === 'SupplyNodeAdded' || e.event === 'SupplyNodeRemoved') {
    if (
      (!e.removed && e.event === 'SupplyNodeAdded') ||
      (e.removed && e.event === 'SupplyNodeRemoved')
    ) {
      yield fork(cacheNode, e.returnValues.nodeId.toString());
    } else if (
      (!e.removed && e.event === 'SupplyNodeRemoved') ||
      (e.removed && e.event === 'SupplyNodeAdded')
    ) {
      yield fork(uncacheFile, 'node', e.returnValues.nodeId.toString());
    }
  } else if (e.event === 'SupplyItemAdded' || e.event === 'SupplyItemRemoved') {
    if (
      (!e.removed && e.event === 'SupplyItemAdded') ||
      (e.removed && e.event === 'SupplyItemRemoved')
    ) {
      yield fork(cacheItem, e.returnValues.itemId.toString());
    } else if (
      (!e.removed && e.event === 'SupplyItemRemoved') ||
      (e.removed && e.event === 'SupplyItemAdded')
    ) {
      yield fork(uncacheFile, 'item', e.returnValues.itemId.toString());
    }
  } else if (e.event === 'SupplyStepAdded' || e.event === 'SupplyStepRemoved') {
    if (
      (!e.removed && e.event === 'SupplyStepAdded') ||
      (e.removed && e.event === 'SupplyStepRemoved')
    ) {
      yield fork(cacheStep, e.returnValues.stepId.toString());
    } else if (
      (!e.removed && e.event === 'SupplyStepRemoved') ||
      (e.removed && e.event === 'SupplyStepAdded')
    ) {
      yield fork(uncacheFile, 'step', e.returnValues.stepId.toString());
    }
  }
}

const encodeMultiHash = (fileDigest, fileMeta, fileSize) => {
  const hashBytes = Buffer.from(fileDigest.slice(2), 'hex');
  const multiHash = new (hashBytes.constructor)(2 + hashBytes.length);
  multiHash[0] = fileMeta;
  multiHash[1] = fileSize;
  multiHash.set(hashBytes, 2);
  return bs58.encode(multiHash);
}

function* cacheNode(id) {
  const { supplyChainC, cachebase, network, account } = yield select();
  let fileHash = undefined;
  try {
    const queryCall = async () => await 
      cachebase.ref(`/nodeCache/${network}`)
      .orderByChild('id')
      .equalTo(id)
      .limitToFirst(1)
      .once('value');
    const snapshot = yield call(queryCall);
    if (!!snapshot && !!snapshot.val()) {
      const keys = Object.keys(snapshot.val());
      if (keys.length > 0 && !!keys[0]) {
        console.log('cacheNode already cached at fileHash: ', keys[0]);
        return;
      }
    }
  } catch (e) {
    console.error('cacheNode cache chceck failed, e: ', e);
  }

  console.log('cacheNode pulling from contract id: ', id);
  try {
    const nodeMethod = yield call(supplyChainC.methods.supplyNode, id);
    const { owner, fileDigest, fileMeta, fileSize } = yield call(nodeMethod.call);
    if (!!fileSize && !!fileDigest && !!fileMeta) {
      fileHash = encodeMultiHash(fileDigest, fileMeta, fileSize);
      console.log('cacheNode, contract fileHash: ', fileHash);
      if (!!fileHash) {
        const file = yield call(readIPFile, fileHash);
        console.log('cacheNode, pulled ipfs file: ', file);
        console.log('cacheNode, caching file name: ', file.name);
        const cacheCall = async () => 
          await cachebase.ref(`/nodeCache/${network}`).child(fileHash).set({
            id,
            owner,
            ...file
          });
        yield call(cacheCall);
        console.log('cacheNode, cached file name: ', file.name);
      } else console.error('cacheNode, contract fileHash null');
    } else console.log('cacheNode, contract fileHash null');
  } catch (e) {
    console.error('cacheNode contract failed, e: ', e);
  }

}

function* cacheItem(id) {
  const { supplyChainC, cachebase, network, account } = yield select();
  let fileHash = undefined;
  try {
    const queryCall = async () => await 
      cachebase.ref(`/itemCache/${network}`)
      .orderByChild('id')
      .equalTo(id)
      .limitToFirst(1)
      .once('value');
    const snapshot = yield call(queryCall);
    if (!!snapshot && !!snapshot.val()) {
      const keys = Object.keys(snapshot.val());
      if (keys.length > 0 && !!keys[0]) {
        console.log('cacheItem already cached at fileHash: ', keys[0]);
        return;
      }
    }
  } catch (e) {
    console.error('cacheItem cache chceck failed, e: ', e);
  }

  console.log('cacheItem pulling from contract id: ', id);
  try {
    const itemMethod = yield call(supplyChainC.methods.supplyItem, id);
    const { nodeId, fileDigest, fileMeta, fileSize } = yield call(itemMethod.call);
    if (!!nodeId && !!fileSize && !!fileDigest && !!fileMeta) {
      fileHash = encodeMultiHash(fileDigest, fileMeta, fileSize);
      console.log('cacheItem, contract fileHash: ', fileHash);
      if (!!fileHash) {
        const file = yield call(readIPFile, fileHash);
        console.log('cacheItem, pulled ipfs file: ', file);
        console.log('cacheItem, caching file name: ', file.name);
        const cacheCall = async () => 
          await cachebase.ref(`/itemCache/${network}`).child(fileHash).set({
            id,
            node: nodeId.toString(),
            ...file
          });
        yield call(cacheCall);
        console.log('cacheItem, cached file name: ', file.name);
      } else console.error('cacheItem, contract fileHash null');
    } else console.log('cacheItem, contract fileHash null');
  } catch (e) {
    console.error('cacheItem contract failed, e: ', e);
  }

}

function* cacheStep(id) {
  const { supplyChainC, cachebase, network, account } = yield select();
  let fileHash = undefined;
  try {
    const queryCall = async () => await 
      cachebase.ref(`/stepCache/${network}`)
      .orderByChild('id')
      .equalTo(id)
      .limitToFirst(1)
      .once('value');
    const snapshot = yield call(queryCall);
    if (!!snapshot && !!snapshot.val()) {
      const keys = Object.keys(snapshot.val());
      if (keys.length > 0 && !!keys[0]) {
        console.log('cacheStep already cached at fileHash: ', keys[0]);
        return;
      }
    }
  } catch (e) {
    console.error('cacheStep cache chceck failed, e: ', e);
  }

  console.log('cacheStep pulling from contract id: ', id);
  try {
    const stepMethod = yield call(supplyChainC.methods.supplyStep, id);
    const { 
      nodeId, itemId, precedents, fileDigest, fileMeta, fileSize 
    } = yield call(stepMethod.call);
    if (!!nodeId && !!itemId && !!fileSize && !!fileDigest && !!fileMeta) {
      fileHash = encodeMultiHash(fileDigest, fileMeta, fileSize);
      console.log('cacheStep, contract fileHash: ', fileHash);
      if (!!fileHash) {
        const file = yield call(readIPFile, fileHash);
        console.log('cacheStep, pulled ipfs file: ', file);
        console.log('cacheStep, caching file name: ', file.name);
        const cacheCall = async () => 
          await cachebase.ref(`/stepCache/${network}`).child(fileHash).set({
            id,
            node: nodeId.toString(),
            item: itemId.toString(),
            precedents: ((!precedents || !precedents.length) ? [] : precedents.map((id) => id.toString())),
            ...file
          });
        yield call(cacheCall);
        console.log('cacheStep, cached file name: ', file.name);
      } else console.error('cacheStep, contract fileHash null');
    } else console.log('cacheStep, contract fileHash null');
  } catch (e) {
    console.error('cacheStep contract failed, e: ', e);
  }

}

function* uncacheFile(fileType, id) {
  const { cachebase, network, node } = yield select();
  //if (!id || !node['$'+id]) return;//already uncached
  console.log('uncacheFile check cache for id: '+id);
  const fileCache = 
    (fileType === 'node') ? cachebase.ref(`/nodeCache/${network}`) :
    (fileType === 'item') ? cachebase.ref(`/itemCache/${network}`) :
    cachebase.ref(`/stepCache/${network}`)

  try {
    const queryCall = async () => await 
      fileCache
      .orderByChild('id')
      .equalTo(id)
      .limitToFirst(1)
      .once('value');
    const snapshot = yield call(queryCall);
    if (!!snapshot && !!snapshot.val()) {
      const keys = Object.keys(snapshot.val());
      if (keys.length > 0 && !!keys[0]) {
        console.log('uncacheFile uncaching fileHash: ', keys[0]);
        const uncacheCall = async () => 
          await fileCache.child(keys[0]).set(null);
        yield call(uncacheCall); 
      } else console.log('uncacheFile cache is already null');
    } else console.log('uncacheFile cache is already null');
  } catch (e) {
    console.error('uncacheFile cache failed, e: ', e);
  }
}

function* updateItemLastStep({id}) {
  const { supplyChainC } = yield select();
  if (!id || !supplyChainC) return; 
  //console.log('updateItemLastStep item id: ',id);
  try {
    const lastStepMethod = yield call(supplyChainC.methods.itemLastStep, id);
    const result = yield call(lastStepMethod.call);
    let stepId = (!result.toString()) ? "0" : result.toString();
    //console.log('updateItemLastStep step id: ',stepId);
    yield put(uiItemLastStepSelected({stepId}));
  } catch (e) {
    console.error('updateItemLastStep result failed, e: ', e);
  }
}


/*
function* cacheNode(id) {
  const { supplyChainC, cachebase, network, node } = yield select();
  //if (!id || !!node['$'+id]) return;//already cached
  let fileHash = undefined;
  let file = undefined;
  console.log('cacheNode pulling from contract id: ', id);
  try {
    const nodeMethod = yield call(supplyChainC.methods.supplyNode, id);
    const { fileDigest, fileMeta, fileSize } = yield call(nodeMethod.call);
    if (!!fileSize && !!fileDigest && !!fileMeta) {
      const hashBytes = Buffer.from(fileDigest.slice(2), 'hex');
      const multiHash = new (hashBytes.constructor)(2 + hashBytes.length);
      multiHash[0] = fileMeta;
      multiHash[1] = fileSize;
      multiHash.set(hashBytes, 2);
      fileHash = bs58.encode(multiHash);
      console.log('cacheNode, fileHash: ', fileHash);
    } else console.log('cacheNode, contract file doesnt exist for node: ', id);
  } catch (e) {
    console.error('cacheNode contract failed, e: ', e);
  }

  if (!!fileHash && !!file) {
    const fileHashCheck = yield call(writeNodeFile, file);
    if (fileHash === fileHashCheck) {
      console.log('cacheNode, fileHash match: ', fileHashCheck);
      const nodeFile = { id, ...file };
      const cacheCall = async () => 
        await cachebase.ref(`/nodeCache/${network}`).child(fileHash).set(nodeFile);
      yield call(cacheCall);
      console.log('cacheNode, cached: ', id);
      yield put(removeTempFile({fileHash})); 
    } else console.error('cacheNode, fileHash mismatch: ', fileHashCheck);
  }
}

function* unpopulateNode(id) {
  const { cachebase, network, node } = yield select();
  //if (!id || !node['$'+id]) return;//already uncached
  console.log('uncacheNode check cache for id: '+id);
  try {
    const queryCall = async () => await 
      cachebase.ref(`/nodeCache/${network}`)
      .orderByChild('id')
      .equalTo(id)
      .limitToFirst(1)
      .once('value');
    const snapshot = yield call(queryCall);
    if (!!snapshot && !!snapshot.val()) {
      const keys = Object.keys(snapshot.val());
      if (keys.length > 0 && !!keys[0]) {
        console.log('uncacheNode cached fileHash: ', keys[0]);
        const uncacheCall = async () => 
          await cachebase.ref(`/nodeCache/${network}`).child(keys[0]).set(null);
        yield call(uncacheCall); 
      } else console.log('uncacheNode cache is already null');
    } else console.log('uncacheNode cache is already null');
  } catch (e) {
    console.error('uncacheNode cache failed, e: ', e);
  }

  //yield put(fileUncached({fileType: 'node', id, file})); 
}
*/



/*
const createEventListenerChannel = (contract, topics) => eventChannel(emitter => {
  const eventSub = contract.events.RaceEntered({
    topics,
    fromBlock: 'latest'
  });
  const onEvent = (e) => { console.log('EVENT---------EVENT', e); emitter(e); }
  eventSub.on("data", onEvent);
  eventSub.on("changed", onEvent);
  return () => {}
}, buffers.sliding(2));

function* watchForContractEvents(contract, topics) {
  //const eventListenerChannel = yield call(createEventListenerChannel, contract, topics);
  

  const eventListenerChannel = yield call(createEventListenerChannel, contract, topics);

  try {
    while (true) {
      const event = yield take(eventListenerChannel);
      const { eventLog } = yield select();
      if (!!event && (!event.removed && !eventLog[event.id] || event.removed && !!eventLog[event.id])) {
        yield put(contractEvent({event}));
        yield* updateForEvent(event);
      } 
    }
  } finally {
    eventListenerChannel.close();
  }
}

function* fileSearch() {
  const { cachebase, network, searchValue, searchType } = yield select();
  let result = {};
  let search = (!!searchValue) ? searchValue.toString().trim().toLowerCase() : '';
  console.log('fileSearch search: '+ search);
  if (!search || search.length < 2){
    yield put(searchResult({result}));
    return; 
  } 
  try {
    const cache = 
      (searchType === 'node') ? cachebase.ref(`/nodeCache/${network}`) :
      (searchType === 'item') ? cachebase.ref(`/itemCache/${network}`) :
      cachebase.ref(`/stepCache/${network}`);
    const searchQuery = 
      cache
      .orderByKey()
      .startAt(search)
      .endAt(`${search}\uf8ff`)
      .limitToFirst(12);
    const snapshot = yield call(searchQuery.once, "value");
    if (!!snapshot && !!snapshot.val()) {
      result = snapshot.val();
      console.log('fileSearch result: ', result);
    }else console.log('fileSearch result is null');
  } catch (e) {
    console.error('fileSearch result failed, e: ', e);
  } finally {
    //console.error('Cached hashHistory:', _hashHistory);
    yield put(searchResult({result}));
  }
}
*/


function* watchTransaction({method, args}) {
  const { accountWeb3, account } = yield select();
  if (!accountWeb3 || !account) return;
  const supplyChainC = new accountWeb3.eth.Contract(SupplyChain.abi, SupplyChainAddress);
  let txCall;
  if (!!args && !!args.length) {
    txCall = yield call(supplyChainC.methods[method], ...args);
  }else {
    txCall = yield call(supplyChainC.methods[method]);
  }
  if (!txCall) return;
  const params = {from: account};
  const transactionChannel = yield call(createTransactionChannel, txCall, params);
  try {
    while (true) {
      const tx = yield take(transactionChannel);
      //console.log('Incoming tx: ', tx)
      const { account } = yield select();
      if (params.from !== account) break;//defensive for account changes during tx lifetime
      tx.title = method;
      tx.args = args;
      yield put(txUpdate({tx}));
    }
  } finally {
    transactionChannel.close();
  }
}





export default function* rootSaga() {
  /* Network */
  yield takeLatest(LOAD_WEB3, mountNetwork);
  yield takeLatest(NETWORK_CHANGE, mountNetwork);
  yield takeLatest(LOAD_WEB3_SUCCESS, changeAccount);
  yield takeLatest(ACCOUNT_CHANGE, changeAccount);
  yield takeLatest(ACCOUNT_CHANGED, initAccountEvents);
  yield takeEvery(BLOCK_UPDATE, updateBlockEvents);
  yield takeEvery(SEND_TX, watchTransaction);
  /* Contract */
  yield takeEvery(CREATE_SUPPLY_NODE, createSupplyNode);
  yield takeEvery(CREATE_SUPPLY_ITEM, createSupplyItem);
  yield takeEvery(CREATE_SUPPLY_STEP, createSupplyStep);
  //yield takeLatest(UI_NODE_SELECTED, populateSupplyNode);
  yield takeLatest(UI_ITEM_SELECTED, updateItemLastStep);
  //yield takeLatest(SEARCH_UPDATE, fileSearch);
}