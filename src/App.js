import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Layout, Row, Col, Spin, Modal, Button } from 'antd';
import DappNavbar from "./components/DappNavbar";
import CreateNodeFormModal from "./components/CreateNodeFormModal";
import CreateItemFormModal from "./components/CreateItemFormModal";
import CreateStepFormModal from "./components/CreateStepFormModal";
import RequestStepFormModal from "./components/RequestStepFormModal";
import StepApprovalFormModal from "./components/StepApprovalFormModal";
import RightDrawerView from "./components/RightDrawerView";
import ItemSearch from "./components/ItemSearch";
import ItemView from "./components/ItemView";
import { loadWeb3, uiItemSelected } from './actions';

const { Content, Footer } = Layout;


class App extends Component { 

  componentDidMount() {
    window.addEventListener("beforeunload", this.unmount);
    this.mount();
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.unmount);
    this.unmount();
  }

  mount = () => {
    this.props.dispatch(loadWeb3());
  }

  unmount = () => {
    Modal.destroyAll();
  }

  render() {
    const { loadingWeb3, web3Error, accountError, account, uiSelectedItem, 
            uiSelectedStep, dispatch } = this.props;
    return (
      <Layout>
        <DappNavbar />
        <Layout>
          <Content>
            {!!account && <CreateNodeFormModal />}
            {!!account && <CreateItemFormModal />}
            {!!account && <CreateStepFormModal />}
            {!!account && <RequestStepFormModal />}
            {!!account && <StepApprovalFormModal />}
            <RightDrawerView />
            <Row style={{ margin: "4px", marginTop: "14px", padding:"0px 8px" }}>
              {(loadingWeb3) ? (
                <span><Spin /><span style={{marginLeft: "4px"}}>
                  Waiting for Web3 Provider...
                </span></span>
              ) : (!!web3Error) ? (
                <span>
                  {'App web3 broken :('}
                </span>
              ) : /*(!!accountError) ? (
                <span>
                  {'To use this Dapp, first install and activate a Web3 Provider, such as '}
                  <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer"> 
                    MetaMask
                  </a>
                  {'.'}
                </span>
              ) : */(
                <>
                  <ItemSearch onItemSelected={(id) => dispatch(uiItemSelected({id}))}/>
                  {!!uiSelectedItem && <ItemView />}
                </>
              )}
            </Row>

          </Content>
        </Layout>
        <Footer>

        </Footer>
      </Layout>
    );
  }
}

App.propTypes = {
  loadingWeb3: PropTypes.bool,
  account: PropTypes.string,
  web3Error: PropTypes.string,
  accountError: PropTypes.string,
  uiSelectedItem: PropTypes.string,
  uiSelectedStep: PropTypes.string
}

export default connect((state) => ({
  loadingWeb3: state.loadingWeb3,
  account: state.account,
  web3Error: state.web3Error,
  accountError: state.accountError,
  uiSelectedItem: state.uiSelectedItem,
  uiSelectedStep: state.uiSelectedStep
}))(App);