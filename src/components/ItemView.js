import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button, Row, Select} from 'antd';
import LazyStepTree from "./LazyStepTree";
import { uiStepSelected, uiNodeSelected, uiItemSelected, 
         uiSecltedItemLastStep, uiToggleCreateModal } from '../actions';

class ItemView extends PureComponent {

  state = {
    item: undefined,
    steps: undefined,
    step: undefined
  }

  componentDidMount() {
    const { cachebase, network, uiSelectedItem } = this.props;

    cachebase.ref(`/itemCache/${network}`)
      .orderByChild('id')
      .equalTo(uiSelectedItem)
      .limitToFirst(1)
      .on('value', this.updateItem);

    cachebase.ref(`/stepCache/${network}`)
      .orderByChild('item')
      .equalTo(uiSelectedItem)
      .on('value', this.updateSteps);
  }

  componentDidUpdate(prevProps, prevState) {
    // only update chart if the data has changed
    const { cachebase, network, uiSelectedItem, uiSelectedStep } = this.props;

    if (prevProps.uiSelectedItem !== uiSelectedItem) {

      this.setState({
        item: undefined, 
        steps: undefined,
        step: undefined
      });

      if (!!prevProps.uiSelectedItem) {
        cachebase.ref(`/itemCache/${network}`)
          .orderByChild('id')
          .equalTo(prevProps.uiSelectedItem)
          .off('value', this.updateItem);

        cachebase.ref(`/stepCache/${network}`)
          .orderByChild('item')
          .equalTo(prevProps.uiSelectedItem)
          .off('value', this.updateSteps);
      }

      if (!!uiSelectedItem) {
        cachebase.ref(`/itemCache/${network}`)
          .orderByChild('id')
          .equalTo(uiSelectedItem)
          .on('value', this.updateItem);

        cachebase.ref(`/stepCache/${network}`)
          .orderByChild('item')
          .equalTo(uiSelectedItem)
          .on('value', this.updateSteps);
      }

    }

    if (prevProps.uiSelectedStep !== uiSelectedStep) {

      this.setState({
        step: undefined
      });

      if (!!prevProps.uiSelectedStep) {
        cachebase.ref(`/stepCache/${network}`)
          .orderByChild('id')
          .equalTo(prevProps.uiSelectedStep)
          .off('value', this.updateStep);
      }

      if (!!uiSelectedStep) {
        cachebase.ref(`/stepCache/${network}`)
          .orderByChild('id')
          .equalTo(uiSelectedStep)
          .on('value', this.updateStep);
      }

    }

  }

  componentWillUnmount() {
    const { cachebase, network, uiSelectedItem, uiSelectedStep } = this.props;

    cachebase.ref(`/itemCache/${network}`)
      .orderByChild('id')
      .equalTo(uiSelectedItem)
      .off('value', this.updateItem);

    cachebase.ref(`/stepCache/${network}`)
      .orderByChild('item')
      .equalTo(uiSelectedItem)
      .off('value', this.updateSteps);

    if (!!uiSelectedStep) {
      cachebase.ref(`/stepCache/${network}`)
        .orderByChild('id')
        .equalTo(uiSelectedStep)
        .off('value', this.updateStep);
    } 


  }

  updateItem = (snapshot) => {
    if (!!snapshot && !!snapshot.val()) {
      const values = Object.values(snapshot.val());
      if (values.length > 0 && !!values[0]) {
        const item = values[0];
        console.log('ItemView, item update: ', item);
        this.setState({item});
      }
    }
  }

  updateSteps = (snapshot) => {
    let steps = [];
    if (!!snapshot && !!snapshot.val()) {
      steps = Object.values(snapshot.val());
      console.log('ItemView, steps update: ', steps);
    }
    this.setState({steps});
  }

  updateStep = (snapshot) => {
    if (!!snapshot && !!snapshot.val()) {
      const values = Object.values(snapshot.val());
      if (values.length > 0 && !!values[0]) {
        const step = values[0];
        console.log('ItemView, step update: ', step);
        this.setState({step});
      }
    }
  }

  render () {
    const { account, uiSelectedNode, uiSelectedItem, uiSelectedStep, uiItemLastStep,
            stepNodeRequests, stepNodeApprovals, nodeStepApprovals, 
            nodeStepRequests, nodes, dispatch } = this.props;
    const { item, steps, step } = this.state;

    if (!item)
      return (
        <Row size="small" style={{ marginTop: "8px"}}>
          <span style={{color: "#999"}}>{'Loading Item '+uiSelectedItem}</span>
        </Row>
      );
    else return (
      <>
      <Row size="small" style={{ marginTop: "8px"}}>
        <span style={{color: "#999"}}>Item Name:&nbsp;&nbsp;</span>
        {item.name}
      </Row>
      <Row size="small">
        <span style={{color: "#999"}}>Item Description:&nbsp;&nbsp;</span>
      </Row>
      <Row>
        <span style={{paddingLeft: "6px"}}>{item.desc}</span>
      </Row>
      <Row size="small" style={{ marginBottom: "6px"}}>
        <span style={{color: "#999"}}>Item Steps:&nbsp;&nbsp;</span>
      </Row>

      {(!uiItemLastStep) ? (
        <Row size="small">Loading item last step...</Row>
      ) : (!account) ? (
        <Row size="small">Login to add a step</Row>
      ) : (!nodes || !nodes.length) ? (
        <Row size="small">Create a Node to add a step</Row>
      ) : (!uiSelectedNode) ? (
        <Row size="small">Select a Node to add a step</Row>
      ) : (uiSelectedNode === item.node && uiItemLastStep === '0') ? (
        <Row size="small">
          <Button type="ghost" size='small'
            style={{color:"#002950", backgroundColor: "#f0f2f5"}}
            onClick={() => dispatch(uiToggleCreateModal({open: 'step'}))}>
            {'Add First Step on Node '+uiSelectedNode}
          </Button>
        </Row>
      ) : (uiSelectedNode === item.node) ? (
        <Row size="small">
          <Button type="ghost" size='small'
            style={{color:"#002950", backgroundColor: "#f0f2f5"}}
            onClick={() => dispatch(uiToggleCreateModal({open: 'step'}))}>
            {'Append Last Step on Node '+uiSelectedNode}
          </Button>
        </Row>
      ) : (uiItemLastStep !== '0' && !!nodeStepApprovals['$'+uiItemLastStep] && 
            !!nodeStepApprovals['$'+uiItemLastStep].includes(uiSelectedNode)) ? (
        <Row size="small">
          <Button type="ghost" size='small'
            style={{color:"#002950", backgroundColor: "#f0f2f5"}}
            onClick={() => dispatch(uiToggleCreateModal({open: 'step'}))}>
            {'Append Last Step on Node '+uiSelectedNode}
          </Button>
        </Row>
      ) : (uiItemLastStep !== '0' && !!nodeStepRequests['$'+uiItemLastStep] && 
            !!nodeStepRequests['$'+uiItemLastStep].includes(uiSelectedNode)) ? (
        <Row size="small">
          {'Request sent to append Last Step on Node '+uiSelectedNode}
        </Row>
      ) : (
        <Row size="small">
          <Button type="link" style={{color:"orange"}}
            onClick={() => dispatch(uiToggleCreateModal({open: 'request'}))}>
            {'Request to append Last Step on Node '+uiSelectedNode}
          </Button>
        </Row>
      )}

      {!!uiItemLastStep && uiItemLastStep !== "0" && (
        <Row><LazyStepTree /></Row>
      )}

      {!!uiSelectedStep && !!step && (
        <>
        <Row size="small">
          <span style={{color: "#999"}}>Step Name:&nbsp;&nbsp;</span>
          {step.name}
        </Row>
        <Row size="small">
          <span style={{color: "#999"}}>Step Description:&nbsp;&nbsp;</span>
        </Row>
        <Row>
          <span style={{paddingLeft: "6px"}}>{step.desc}</span>
        </Row>

        {(step.id === uiItemLastStep && nodes.includes(step.node) && 
            !!stepNodeRequests['$'+step.id] && !!stepNodeRequests['$'+step.id].length) && (
          <Row size="small">
            <span style={{color: "#999"}}>Supply Step Requests:&nbsp;&nbsp;</span>
          </Row>
        )}

        {(step.id === uiItemLastStep && nodes.includes(step.node) && 
            !!stepNodeRequests['$'+step.id] && !!stepNodeRequests['$'+step.id].length) && (
          stepNodeRequests['$'+step.id].map((node) => (
            (!!stepNodeApprovals['$'+step.id] &&
              stepNodeApprovals['$'+step.id].includes(node)) ? (
            <Row key={node} size="small"><Button type="link"
              style={{marginLeft: "6px", color:"green"}}
              onClick={() => dispatch(uiToggleCreateModal({open: 'approval', data: { node, approval: true }}))}>
              'Node '+node+' Request Accepted' 
            </Button></Row>
            ) : (
            <Row key={node} size="small"><Button type="link"
              style={{marginLeft: "6px", color:"green"}}
              onClick={() => dispatch(uiToggleCreateModal({open: 'approval', data: { node, approval: false }}))}>
              'Node '+node+' Request NOT Accepted' 
            </Button></Row>
            )
          ))
        )}

        </>
      )}
      </>
    );
  }
}

ItemView.propTypes = {
  account: PropTypes.string,
  cachebase: PropTypes.object,
  network: PropTypes.string,
  nodes: PropTypes.array,
  stepNodeApprovals: PropTypes.object,
  stepNodeRequests: PropTypes.object,
  nodeStepApprovals: PropTypes.object,
  nodeStepRequests: PropTypes.object,
  uiSelectedNode: PropTypes.string,
  uiSelectedItem: PropTypes.string,
  uiSelectedStep: PropTypes.string,
  uiItemLastStep: PropTypes.string
}

export default connect((state) => ({
  account: state.account,
  cachebase: state.cachebase,
  network: state.network,
  nodes: state.nodes,
  stepNodeApprovals: state.stepNodeApprovals,
  stepNodeRequests: state.stepNodeRequests,
  nodeStepApprovals: state.nodeStepApprovals,
  nodeStepRequests: state.nodeStepRequests,
  uiSelectedNode: state.uiSelectedNode,
  uiSelectedItem: state.uiSelectedItem,
  uiSelectedStep: state.uiSelectedStep,
  uiItemLastStep: state.uiItemLastStep
}))(ItemView); 
