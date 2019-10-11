import produce from 'immer';
import { LOAD_WEB3, LOAD_WEB3_SUCCESS, LOAD_WEB3_ERROR, BLOCK_UPDATE, ACCOUNT_CHANGE,
				 ACCOUNT_CHANGED, ACCOUNT_MOUNTED, CONTRACT_EVENT, SEND_TX, TX_UPDATE,  
         mapEventToState, UI_CHANGE_DRAWER_VIEW, SEARCH_UPDATE, SEARCH_RESULT,
         UI_NODE_SELECTED, UI_TOGGLE_CREATE_MODAL, UI_ITEM_LAST_STEP,
         UI_ITEM_SELECTED, UI_STEP_SELECTED
          } from './constants';

export const initialState = {
  loadingWeb3: false,
  web3Error: "",
  cachebase: undefined,
  appWeb3: undefined,
  network: '',
  block: undefined,
  supplyChainC: undefined,
  loadingAccount: false,
  mountingAccount: false,
  accountWeb3: undefined,
  account: '',
  accountView: '',
  accountError: '',
  lastBlock: 0,
  txs: [],
  txLog: {},
  events: [],
  eventLog: {},
  nodes: [],
  stepNodeApprovals: {},
  stepNodeRequests: {},
  nodeStepApprovals: {},
  nodeStepRequests: {},
  nodeItems: {},
  nodeSteps: {},
  newEventCount: 0,
  newTxCount: 0,
  newNodeCount: 0,
  uiRightDrawerOpen: false,
  uiRightDrawerView: 'events',
  uiSelectedNode: undefined,
  uiSelectedItem: undefined,
  uiSelectedItemLastStep: undefined,
  uiSelectedStep: undefined,
  searchType: 'node',
  searchValue: '',
  searchResult: {},
  searching: false,
  uiCreateModalOpen: false,
  uiCreateModalData: undefined
};

const clearAccountState = (state) => {
	state.account = '';
  state.accountView = '';
  state.accountError = '';
  state.txs = [];
  state.txLog = {};
  state.events = [];
  state.eventLog = {};
  state.nodes = [];
  state.stepNodeRequests = {};
  state.stepNodeApprovals = {};
  state.nodeStepRequests = {};
  state.nodeStepApprovals = {};
  state.nodeItems = {};
  state.nodeSteps = {};
  state.newEventCount = 0;
  state.newTxCount = 0;
  state.newNodeCount = 0;
  state.uiRightDrawerOpen = false;
  state.uiRightDrawerView = 'events';
  state.uiSelectedNode = undefined;
  state.uiSelectedItem = undefined;
  state.uiItemLastStep = undefined;
  state.uiCreateModalOpen = false;
  state.uiCreateModalData = undefined;
  state.searchType = 'node';
  state.searchValue = '';
  state.searchResult = {};
}

const appReducer = (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case LOAD_WEB3:
        draft.loadingWeb3 = true;
        draft.web3Error = "";
        draft.loadingAccount = false;
        draft.mountingAccount = false;
        draft.accountError = "";
        break;

      case LOAD_WEB3_SUCCESS:
        draft.cachebase = action.cachebase;
      	draft.appWeb3 = action.appWeb3;
      	draft.supplyChainC = action.supplyChainC;
      	draft.network = action.network;
      	draft.block = action.block;
        draft.accountWeb3 = action.accountWeb3;
      	draft.account = action.account;
      	draft.accountView = action.accountView;
        draft.loadingWeb3 = false;
        draft.web3Error = "";
        draft.loadingAccount = true;
        draft.accountError = "";
        break;

      case LOAD_WEB3_ERROR:
      	draft.loadingWeb3 = false;
      	draft.web3Error = action.error;
      	draft.loadingAccount = false;
        draft.accountError = action.error;
        break;

      case ACCOUNT_CHANGE:
      	clearAccountState(draft);
      	draft.loadingAccount = true;
        draft.mountingAccount = false;
      	draft.accountError = "";
        break;

      case ACCOUNT_CHANGED:
        if (!!action.account) {
          draft.account = action.account;
          draft.accountView = action.accountView;
        } else {
          draft.accountError = "Please select a Web3 Account.";
        }
        draft.loadingAccount = false;
        draft.mountingAccount = true;
        break;

      case ACCOUNT_MOUNTED:
        draft.events = action.events;
        draft.eventLog = action.eventLog;
        draft.nodes = action.nodes;
        draft.nodeItems = action.nodeItems;
        draft.nodeSteps = action.nodeSteps;
        if (!!action.stepNodeRequests) {
          draft.stepNodeRequests = action.stepNodeRequests;
        }
        if (!!action.stepNodeApprovals) {
          draft.stepNodeApprovals = action.stepNodeApprovals;
        }
        if (!!action.nodeStepRequests) {
          draft.nodeStepRequests = action.nodeStepRequests;
        }
        if (!!action.nodeStepApprovals) {
          draft.nodeStepApprovals = action.nodeStepApprovals;
        }
        draft.lastBlock = action.lastBlock;
        draft.mountingAccount = false;
        break;

      case BLOCK_UPDATE:
      	draft.block = action.block;
      	if (!!draft.account && !draft.loadingAccount && !draft.mountingAccount) {
      		draft.lastBlock = action.block.number;
      	}
        break;

      case CONTRACT_EVENT:
      	const e = action.event;
      	if (!e || !e.id) break;
      	mapEventToState(e, draft);
        draft.newEventCount += 1;
        if (!e.removed && e.event === 'SupplyNodeAdded') {
          draft.newNodeCount += 1;
        }
        break;

      case SEND_TX:
      /*
      	if (action.method === 'enterRaceQueue' && !!action.args[0]) {
      		const racerId = action.args[0];
      		if (draft.racer['$'+racerId].state === 'IDLE') {
      			draft.racer['$'+racerId].state = 'QUEUEING';
      		}
      	}
        */
        break;

      case TX_UPDATE:
  			if (!action.tx) break;
        //console.log('tx: ',action.tx)
	      if (action.tx.type === 'hash' && !draft.txLog[action.tx.hash]) {
          draft.newTxCount += 1;
	      	draft.txLog[action.tx.hash] = {
	      		transactionHash: action.tx.hash, 
	      		confirmCount: 0, 
	      		status: true,
	      		title: action.tx.title
	      	};
	      	draft.txs.unshift(action.tx.hash);
	      } else if (action.tx.type === 'receipt') {
	      	draft.txLog[action.tx.receipt.transactionHash] = {
	      		...action.tx.receipt, 
	      		confirmCount: 1,
	      		title: action.tx.title
	      	};
	      } else if (action.tx.type === 'confirmation') {
	      	draft.txLog[action.tx.receipt.transactionHash] = {
	      		...action.tx.receipt, 
	      		confirmCount: action.tx.count,
	      		title: action.tx.title
	      	};
	      } else if (action.tx.type === 'error' || action.tx.type === 'cancel') {
	      	if (action.tx.type === 'error' && !!action.tx.hash && !!draft.txLog[action.tx.hash]) {
            draft.txLog[action.tx.hash].confirmCount = 0;
            draft.txLog[action.tx.hash].status = false;
          }
          /*
          if (action.tx.title === 'enterRaceQueue' && !!action.tx.args[0]) {
	      		const racerId = action.tx.args[0];
	      		if (draft.racer['$'+racerId].state === 'QUEUEING') {
	      			draft.racer['$'+racerId].state = 'IDLE';
	      		}
	      	}
          */
	      }
        break;

      case UI_CHANGE_DRAWER_VIEW:
        if (action.open) {
          draft.uiRightDrawerView = (action.view === 'events') ? 'events' : 
            (action.view === 'txs') ? 'txs' : 'nodes';
          draft.uiRightDrawerOpen = true;
          if (action.view === 'events') draft.newEventCount = 0;
          else if (action.view === 'txs') draft.newTxCount = 0;
          else if (action.view === 'nodes') draft.newNodeCount = 0;
        } else draft.uiRightDrawerOpen = false;
        break;

      case UI_TOGGLE_CREATE_MODAL:
        if (action.open) {
          draft.uiCreateModalOpen = action.open;
          draft.uiCreateModalData = action.data;
        } else {
          draft.uiCreateModalOpen = false;
          draft.uiCreateModalData = undefined;
        } 
        break;

      case UI_NODE_SELECTED:
        draft.uiSelectedNode = action.id;
        break;

      case UI_ITEM_SELECTED:
        draft.uiSelectedItem = action.id;
        draft.uiItemLastStep = undefined;
        draft.uiSelectedStep = undefined;
        break;

      case UI_ITEM_LAST_STEP:
        draft.uiItemLastStep = action.stepId;
        break;

      case UI_STEP_SELECTED:
        draft.uiSelectedStep = action.id;
        break;

      case SEARCH_UPDATE:
        draft.searchValue = (!!action.search) ? action.search : '';
        draft.searchType = action.searchType;
        draft.searchResult = {};
        if (!!action.search) draft.searching = true;
        else draft.searching = false;
        break;

      case SEARCH_RESULT:
        draft.searchResult = action.result;
        draft.searching = false;
        break;

      default: break;
    }
  });

export default appReducer;

