import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button, Drawer, List, Radio, Row, Select, 
         Badge } from 'antd';
import NodeListView from "./NodeListView";
import NodeView from "./NodeView";
import { ADDRESS_ZERO } from '../constants';
import { uiNodeSelected, uiItemSelected, uiStepSelected, uiChangeDrawerView, 
        sendTx, uiToggleCreateModal } from '../actions';


class RightDrawerView extends PureComponent {

  render () {
    const { supplyChainC, loadingAccount, mountingAccount, txs, txLog, 
            account, events, eventLog, uiRightDrawerOpen, uiRightDrawerView, 
            uiSelectedNode, uiSelectedItem, uiSelectedStep, node, item, step,
            nodes, nodeItems, nodeSteps, dispatch } = this.props;

    return (
      <Drawer
        title={
          <Radio.Group buttonStyle="solid"
            value={uiRightDrawerView} 
            onChange={(e) => dispatch(uiChangeDrawerView({open: true, view: e.target.value}))}>
            <Radio.Button value="nodes" style={uiRightDrawerView!=="nodes"?{color: "#ffc107", backgroundColor: "#002950"}:{color: "#002950"}}>Nodes</Radio.Button>
            <Radio.Button value="events" style={uiRightDrawerView!=="events"?{color: "#ffc107", backgroundColor: "#002950"}:{color: "#002950"}}>Events</Radio.Button>
            <Radio.Button value="txs" style={uiRightDrawerView!=="txs"?{color: "#ffc107", backgroundColor: "#002950"}:{color: "#002950"}}>Txs</Radio.Button>
          </Radio.Group>
        }
        placement="right"
        closable={true}
        maskClosable={true}
        onClose={() => dispatch(uiChangeDrawerView({open: false}))}
        visible={uiRightDrawerOpen}
        width={300}>

        {(uiRightDrawerView === 'events') ? (
          <Row style={{ marginTop: "-16px" }}>
          <List
            size="small"
            itemLayout="horizontal"
            dataSource={events || []}
            renderItem={(key) => this.eventLogView(eventLog[key], account, dispatch)}/>
          </Row>

        ) : (uiRightDrawerView === 'txs') ? (
          <Row style={{ marginTop: "-16px" }}>
          <List
            itemLayout="horizontal"
            dataSource={(txs || [])}
              //.filter((each) => !!txLog[each])
              //.sort((a,b)=>((txLog[b].timestamp < txLog[a].timestamp) ? -1 : 1))}
            renderItem={(key) => (
              <List.Item><span>
                <strong>{txLog[key].title+' Tx: '}</strong>
                <a href={"https://ropsten.etherscan.io/tx/"+key} target="_blank" rel="noopener noreferrer"> 
                  {key.substring(0,12)+'...'}
                </a>
                &nbsp;
                {((!txLog[key].status) ? <Badge status="error" text="FAILED"/> : 
                  (!!txLog[key].confirmCount && txLog[key].confirmCount === 12) ? 
                    <Badge status="success" text="VERIFIED"/>: (!!txLog[key].confirmCount) ? 
                      <Badge status="warning" text={'Confirmed '+txLog[key].confirmCount+' time(s)'}/> : 
                      <Badge status="processing" text="Pending"/>)}
              </span></List.Item>
            )}/>
          </Row>
        ) : (//nodes
          <>
          <NodeListView />
          {!!uiSelectedNode && <NodeView />}
          </>
        )}
      </Drawer>
    );
  }

  eventLogView = (e, account, dispatch) => (
    (!e) ? '' : 
    (e.event === "SupplyNodeAdded") ?
      <List.Item><span>
        <strong>{(new Date(e.returnValues.timestamp*1000).toLocaleString())}</strong>
        <br/>
        {'Added Supply Node '}
        <Button type="link" style={{padding: "0"}}
          onClick={() => dispatch(uiNodeSelected({id: e.returnValues.node, fileHash: undefined}))}>
          {'#'+e.returnValues.node}
        </Button>
      </span></List.Item> : 
    (e.event === "SupplyNodeRemoved") ?
      <List.Item><span>
        <strong>{(new Date(e.returnValues.timestamp*1000).toLocaleString())}</strong>
        <br/>
        {'Removed Supply Node '}
        <Button type="link" style={{padding: "0"}}
          onClick={() => dispatch(uiNodeSelected({id: e.returnValues.node}))}>
          {'#'+e.returnValues.node}
        </Button>
      </span></List.Item> : 
    (e.event === "NodeOpApproval") ? //to = user
      <List.Item><span>
        <strong>{(new Date(e.returnValues.timestamp*1000).toLocaleString())}</strong>
        <br/>
        {'Supply Node #'+e.returnValues.node+' Operator '+e.returnValues.operator+' Approved: '+e.returnValues.approved.toString()}
      </span></List.Item> : 
    (e.event === "SupplyItemAdded") ? 
      <List.Item><span>
        <strong>{(new Date(e.returnValues.timestamp*1000).toLocaleString())}</strong>
        <br/>
        {'Added Supply Item #'+e.returnValues.item}
      </span></List.Item> : 
    (e.event === "SupplyItemRemoved") ? 
      <List.Item><span>
        <strong>{(new Date(e.returnValues.timestamp*1000).toLocaleString())}</strong>
        <br/>
        {'Removed Supply Item #'+e.returnValues.item}
      </span></List.Item> : 
    (e.event === "SupplyStepAdded") ? 
      <List.Item><span>
        <strong>{(new Date(e.returnValues.timestamp*1000).toLocaleString())}</strong>
        <br/>
        {'Added Supply Step #'+e.returnValues.step+' with Supply Item #'+e.returnValues.item+' at Supply Node #'+e.returnValues.node}
      </span></List.Item> : 
    (e.event === "SupplyStepRemoved") ?
      <List.Item><span>
        <strong>{(new Date(e.returnValues.timestamp*1000).toLocaleString())}</strong>
        <br/>
        {'Removed Supply Step #'+e.returnValues.step+' with Supply Item #'+e.returnValues.item+' at Supply Node #'+e.returnValues.node}
      </span></List.Item> : 
    (e.event === "SupplyStepRequest" && e.returnValues.owner === account) ?
      <List.Item><span>
        <strong>{(new Date(e.returnValues.timestamp*1000).toLocaleString())}</strong>
        <br/>
        {'Supply Node #'+e.returnValues.node+' Request for Supply Step #'+e.returnValues.step}
      </span></List.Item> : 
    (e.event === "SupplyStepRequest") ?
      <List.Item><span>
        <strong>{(new Date(e.returnValues.timestamp*1000).toLocaleString())}</strong>
        <br/>
        {'Supply Node #'+e.returnValues.node+' Request for Supply Step #'+e.returnValues.step}
      </span></List.Item> : 
    (e.event === "SupplyNodeApproval" && e.returnValues.owner === account) ?
      <List.Item><span>
        <strong>{(new Date(e.returnValues.timestamp*1000).toLocaleString())}</strong>
        <br/>
        {'Supply Step #'+e.returnValues.step+' Approval for Supply Node #'+e.returnValues.node+': '+e.returnValues.approved.toString()}
      </span></List.Item> : 
    (e.event === "SupplyNodeApproval") ?
      <List.Item><span>
        <strong>{(new Date(e.returnValues.timestamp*1000).toLocaleString())}</strong>
        <br/>
        {'Supply Step #'+e.returnValues.step+' Approval for Supply Node #'+e.returnValues.node+': '+e.returnValues.approved.toString()}
      </span></List.Item> : ''
  );
 
}

RightDrawerView.propTypes = {
  supplyChainC: PropTypes.object,
  loadingAccount: PropTypes.bool,
  mountingAccount: PropTypes.bool,
  account: PropTypes.string,
  block: PropTypes.object,
  txs: PropTypes.array,
  txLog: PropTypes.object,
  events: PropTypes.array,
  eventLog: PropTypes.object,
  uiRightDrawerOpen: PropTypes.bool,
  uiRightDrawerView: PropTypes.string,
  uiSelectedNode: PropTypes.string,
  uiSelectedItem: PropTypes.string, 
  uiSelectedStep: PropTypes.string, 
  nodes: PropTypes.array,
  nodeItems: PropTypes.object,
  nodeSteps: PropTypes.object
}

export default connect((state) => ({
  supplyChainC: state.supplyChainC,
  loadingAccount: state.loadingAccount,
  mountingAccount: state.mountingAccount,
  account: state.account,
  block: state.block,
  txs: state.txs,
  txLog: state.txLog,
  events: state.events,
  eventLog: state.eventLog,
  uiRightDrawerOpen: state.uiRightDrawerOpen,
  uiRightDrawerView: state.uiRightDrawerView,
  uiSelectedNode: state.uiSelectedNode,
  uiSelectedItem: state.uiSelectedItem,
  uiSelectedStep: state.uiSelectedStep,
  nodes: state.nodes,
  nodeItems: state.nodeItems,
  nodeSteps: state.nodeSteps
}))(RightDrawerView); 