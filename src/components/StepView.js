import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button, Row, Select} from 'antd';
import { uiStepSelected, uiNodeSelected, uiItemSelected, 
         uiItemLastStep, uiToggleCreateModal } from '../actions';

class StepView extends PureComponent {

  state = {
    step: undefined
  }

  componentDidMount() {
    const { cachebase, network, uiSelectedStep } = this.props;

    if (!!uiSelectedStep) {
      cachebase.ref(`/stepCache/${network}`)
      .orderByChild('id')
      .equalTo(uiSelectedStep)
      .on('value', this.updateStep);
    }
    
  }

  componentDidUpdate(prevProps, prevState) {
    // only update chart if the data has changed
    const { cachebase, network, uiSelectedStep } = this.props;

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
    const { cachebase, network, uiSelectedStep } = this.props;

    cachebase.ref(`/stepCache/${network}`)
      .orderByChild('id')
      .equalTo(uiSelectedStep)
      .off('value', this.updateStep);

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
    const { account, uiSelectedItem, uiSelectedStep, uiItemLastStep,
            stepNodeRequests, stepNodeApprovals, nodeStepApprovals, 
            nodeStepRequests, nodes, dispatch } = this.props;
    const { step } = this.state;

    if (!step)
      return (
        <Row size="small">
          <span style={{color: "#999"}}>{'Loading Step '+uiSelectedStep}</span>
        </Row>
      );
    else return (
      <>
      <Row size="small">
        <span style={{color: "#999"}}>Step Name:&nbsp;&nbsp;</span>
        {step.name}
      </Row>
      <Row size="small">
        <span style={{color: "#999"}}>Step ID:&nbsp;&nbsp;</span>
        {uiSelectedStep}
      </Row>
      <Row size="small">
        <span style={{color: "#999"}}>Step Node:&nbsp;&nbsp;</span>
        {step.node}
      </Row>
      <Row size="small">
        <span style={{color: "#999"}}>Step Item:&nbsp;&nbsp;</span>
        {step.item}
      </Row>
      <Row size="small">
        <span style={{color: "#999"}}>Step Description:&nbsp;&nbsp;</span>
      </Row>
      <Row>
        <span style={{paddingLeft: "6px"}}>{step.desc}</span>
      </Row>
      {(!!step.precedents && !!step.precedents.length) ? (
        <Row>
          <span style={{color: "#999"}}>Precedents:&nbsp;&nbsp;</span>
          <span style={{paddingLeft: "6px"}}>{step.precedents.map((step) => (
            <span key={step} style={{paddingLeft: "2px"}}>{'Step '+step}</span>
          ))}</span>
        </Row>
      ) : (
        <Row>
          <span style={{color: "#999"}}>No Precedents</span>
        </Row>
      )}

      {!!account && (!stepNodeApprovals['$'+step.id] || !stepNodeApprovals['$'+step.id].length) && (
          <Row size="small">
            <span style={{color: "#999"}}>Append Step:&nbsp;&nbsp;</span>
          </Row>
      )}
      
      {!!account && (!stepNodeApprovals['$'+step.id] || !stepNodeApprovals['$'+step.id].length) && (

        (step.id === uiItemLastStep) ? (
          nodes.map((node) => (
            (node === step.node) ? (

              <Row key={node} size="small"><Button type="link"
                style={{marginLeft: "6px", color:"green"}}
                onClick={() => {
                  const item = uiSelectedItem;
                  dispatch(uiNodeSelected({id: node}));
                  dispatch(uiItemSelected({id: item}));
                  dispatch(uiStepSelected({id: step.id}));
                  dispatch(uiItemLastStep({stepId: step.id}));
                  dispatch(uiToggleCreateModal({open: 'step'}));
                }}>
                {'Append Step on My Node '+node}
              </Button></Row>

            ) : (!!nodeStepApprovals['$'+step.id] && 
              !!nodeStepApprovals['$'+step.id].includes(node)) ? (

              <Row key={node} size="small"><Button type="link"
                style={{marginLeft: "6px", color:"green"}}
                onClick={() => {
                  const item = uiSelectedItem;
                  dispatch(uiNodeSelected({id: node}));
                  dispatch(uiItemSelected({id: item}));
                  dispatch(uiStepSelected({id: step.id}));
                  dispatch(uiItemLastStep({stepId: step.id}));
                  dispatch(uiToggleCreateModal({open: 'step'}));
                }}>
                {'Append Step on Node '+node}
              </Button></Row>
            
            ) : (!!nodeStepRequests['$'+step.id] && 
              !!nodeStepRequests['$'+step.id].includes(node)) ? (

              <Row key={node} size="small">{'Request Sent for Node '+node}</Row>
            
            ) : (
              <Row key={node} size="small"><Button type="link"
                style={{marginLeft: "6px", color:"orange"}}
                onClick={() => {
                  const item = uiSelectedItem;
                  dispatch(uiNodeSelected({id: node}));
                  dispatch(uiItemSelected({id: item}));
                  dispatch(uiStepSelected({id: step.id}));
                  dispatch(uiItemLastStep({stepId: step.id}));
                  dispatch(uiToggleCreateModal({open: 'request'}));
                }}>
                {'Request Append Step on Node '+node}
              </Button></Row>
            )
          ))
        ) : (
          <Row size="small"><span style={{paddingLeft: "6px", color:"red"}}>Not Item Last Step</span></Row>
        )
      )}

      {(!!account && step.id === uiItemLastStep && nodes.includes(step.node) && 
            !!stepNodeRequests['$'+step.id] && !!stepNodeRequests['$'+step.id].length) && (
          <Row size="small">
            <span style={{color: "#999"}}>Supply Step Requests:&nbsp;&nbsp;</span>
          </Row>
      )}
      
      {(!!account && step.id === uiItemLastStep && nodes.includes(step.node) && 
            !!stepNodeRequests['$'+step.id] && !!stepNodeRequests['$'+step.id].length) && (
        stepNodeRequests['$'+step.id].map((node) => (
          <Row key={node} size="small"><Button type="link"
            style={{marginLeft: "6px", color:"green"}}
            onClick={() => {
              const item = uiSelectedItem;
              dispatch(uiNodeSelected({id: node}));
              dispatch(uiItemSelected({id: item}));
              dispatch(uiStepSelected({id: step.id}));
              dispatch(uiItemLastStep({stepId: step.id}));
              dispatch(uiToggleCreateModal({open: 'approval'}));
            }}>
            {(!!stepNodeApprovals['$'+step.id] &&
              stepNodeApprovals['$'+step.id].includes(node)) ? (
            'Node '+node+' Request Accepted' 
            ) : (
            'Node '+node+' Request NOT Accepted' 
            )} 
          </Button></Row>

        ))
      )}
      </>
    );
  }
}

StepView.propTypes = {
  account: PropTypes.string,
  cachebase: PropTypes.object,
  network: PropTypes.string,
  nodes: PropTypes.array,
  stepNodeApprovals: PropTypes.object,
  stepNodeRequests: PropTypes.object,
  nodeStepApprovals: PropTypes.object,
  nodeStepRequests: PropTypes.object,
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
  uiSelectedItem: state.uiSelectedItem,
  uiSelectedStep: state.uiSelectedStep,
  uiItemLastStep: state.uiItemLastStep
}))(StepView); 
