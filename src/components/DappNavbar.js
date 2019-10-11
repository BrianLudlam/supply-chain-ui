import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Layout, Row, Col, Button, Badge, Modal } from 'antd';
import { uiChangeDrawerView} from '../actions';
import BlockClock from "./BlockClock";
const { Header } = Layout;

class DappNavbar extends PureComponent {

  render() {
    const { loadingWeb3, web3Error, networkSyncing, networkName, blockNumber, account, 
            accountError, newEventCount, newTxCount, dispatch } = this.props;
    
    return (
      <Header style={{paddingLeft: "12px", paddingRight: "12px"}}>
        <Row style={{height: "100%", width: "100%"}} style={{height: "100%"}}>
          <Col xs={5} sm={5} md={5} lg={5} xl={5} >
            <Row>
              <span style={{fontSize: "24px", fonWeight: "bold", color: "white"}}>
                Supply Chain
              </span>
            </Row>
          </Col>
          <Col offset={0} xs={3} sm={3} md={3} lg={3} xl={3} style={{height: "100%", paddingTop: "4px"}}>
            <Button className="hover-yellow" size="large" ghost type="link" style={{padding: "0px 0px 0px 0px"}} 
              onClick={() => dispatch(uiChangeDrawerView({open: true, view: 'nodes'}))}> 
              My Nodes 
            </Button>
          </Col>
          <Col offset={0} xs={3} sm={3} md={3} lg={3} xl={3} style={{height: "100%", paddingTop: "4px"}}>
            <Button className="hover-yellow" size="large" ghost type="link" style={{padding: "0px 0px 0px 10px"}}
              onClick={() => dispatch(uiChangeDrawerView({open: true, view: 'events'}))}> 
               Events
               {(newEventCount > 0) && (<Badge count={newEventCount} overflowCount={99} 
                style={{marginBottom: "0px", backgroundColor: "green"}}/>)}
            </Button>
          </Col>
          <Col offset={0} xs={3} sm={3} md={3} lg={3} xl={3} style={{height: "100%", paddingTop: "4px"}}>
            <Button className="hover-yellow" size="large" ghost type="link" style={{padding: "0px"}}
              onClick={() => dispatch(uiChangeDrawerView({open: true, view: 'txs'}))}> 
              Txs 
               {(newTxCount > 0) && (<Badge count={newTxCount} overflowCount={99} 
                style={{marginBottom: "0px", backgroundColor: "green"}}/>)}
            </Button>
          </Col>
          
          <Col offset={4} xs={6} sm={6} md={6} lg={6} xl={6} >
            <Row style={{whiteSpace: 'nowrap', lineHeight: "19px", paddingTop: "12px"}}>
              {!web3Error && ( 
                <BlockClock 
                  networkSyncing={networkSyncing} 
                  networkName={(loadingWeb3) ? null : networkName}
                  blockNumber={(loadingWeb3) ? null : blockNumber}/>)}
            </Row>
            {(!!web3Error) ? (
              <Row style={{whiteSpace: 'nowrap', lineHeight: "14px", paddingTop: "8px"}}>
                <span style={{fontSize: "14px", color: "red"}}>
                  {web3Error}
                </span>
              </Row>) : 
              (!web3Error && !!accountError) ? (
              <Row style={{whiteSpace: 'nowrap', lineHeight: "14px", paddingTop: "8px"}}>
                <span style={{fontSize: "14px", color: "red"}}>
                  {accountError}
                </span>
              </Row>) : (
              <Row style={{lineHeight: "14px", whiteSpace: 'nowrap'}}>
                <span style={{fontSize: "14px", color: "#ccc", paddingRight: "4px"}}>
                  Acct:
                </span>
                <span style={{fontSize: "9px", color: "#ffc107", paddingTop: "1px"}}>
                  {account}
                </span>
              </Row>)
            }
          </Col>
        </Row>
      </Header>
    );
  }
}

DappNavbar.propTypes = {
  loadingWeb3: PropTypes.bool,
  web3Error: PropTypes.string,
  networkName: PropTypes.string,
  networkSyncing: PropTypes.bool,
  blockNumber: PropTypes.number,
  loadingAccount: PropTypes.bool,
  mountingAccount: PropTypes.bool,
  account: PropTypes.string,
  accountView: PropTypes.string,
  accountError: PropTypes.string,
  newEventCount: PropTypes.number,
  newTxCount: PropTypes.number
}

export default connect((state) => ({
  loadingWeb3: state.loadingWeb3,
  web3Error: state.web3Error,
  networkName: (!state.loadingWeb3 && !!state.network) ? state.network : '',
  networkSyncing: false,
  blockNumber: (!state.loadingWeb3 && !!state.block) ? state.block.number : undefined,
  loadingAccount: state.loadingAccount,
  account: state.account,
  accountView: state.accountView,
  accountError: state.accountError,
  newEventCount: state.newEventCount,
  newTxCount: state.newTxCount
}))(DappNavbar);

