import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button, Row, Select} from 'antd';
import LazyStepTree from "./LazyStepTree";
import { uiStepSelected, uiToggleCreateModal } from '../actions';

class ItemStepsView extends PureComponent {

  state = {
    steps: undefined
  }

  componentDidMount() {
    const { cachebase, network, uiSelectedItem } = this.props;

    if (!!uiSelectedItem) {
      cachebase.ref(`/stepCache/${network}`)
        .orderByChild('item')
        .equalTo(uiSelectedItem)
        .on('value', this.updateSteps);
    }
    
  }

  componentDidUpdate(prevProps, prevState) {
    // only update chart if the data has changed
    const { cachebase, network, uiSelectedItem } = this.props;

    if (prevProps.uiSelectedItem !== uiSelectedItem) {

      this.setState({
        steps: undefined
      });

      if (!!prevProps.uiSelectedItem) {
        cachebase.ref(`/stepCache/${network}`)
          .orderByChild('item')
          .equalTo(prevProps.uiSelectedItem)
          .off('value', this.updateSteps);
      }

      if (!!uiSelectedItem) {
        cachebase.ref(`/stepCache/${network}`)
          .orderByChild('item')
          .equalTo(uiSelectedItem)
          .on('value', this.updateSteps);
      }

    }

  }

  componentWillUnmount() {
    const { cachebase, network, uiSelectedItem } = this.props;

    if (!!uiSelectedItem) {
      cachebase.ref(`/stepCache/${network}`)
        .orderByChild('item')
        .equalTo(uiSelectedItem)
        .off('value', this.updateSteps);
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

  render () {
    const { uiSelectedItem, uiSelectedStep, uiSelectedItemLastStep, dispatch } = this.props;
    const { steps } = this.state;

    if (!steps)
      return (
        <Row size="small">
          <span style={{color: "#999"}}>{'Loading Item Steps... '}</span>
        </Row>
      );
    else return (
      <>
      <Row style={{ marginTop: "6px" }}>
      <Select
        showSearch
        allowClear
        style={{ width: "180px", marginTop: "-12px", marginBottom: "4px" }}
        dropdownMatchSelectWidth={false}
        loading={!steps}
        placeholder={(!steps) ? "Loading node steps" : "Select a step ("+steps.length+")"}
        notFoundContent="No node steps yet"
        optionFilterProp="children"
        value={uiSelectedStep}
        filterOption={(input, option) =>
          option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
        }
        onChange={(id) => dispatch(uiStepSelected({id}))}>
        {!!steps && !!steps.length && steps.map((step) => (
          <Select.Option key={step.id} value={step.id}>
            {step.name}
          </Select.Option>
        ))}
      </Select>
      <Button type="ghost"
        style={{marginLeft: "6px", color:"#002950", backgroundColor: "#f0f2f5"}}
        onClick={() => dispatch(uiToggleCreateModal({open: 'step'}))}>
        New
      </Button>
      </Row>

      {(!uiSelectedItemLastStep) ? (
        <Row style={{ marginTop: "-6px" }}>Loading item steps...</Row>
      ) : (uiSelectedItemLastStep === '0' && ) ? (
        <Row style={{ marginTop: "-6px" }}>No item steps yet.</Row>
      ) : (
        <Row style={{ marginTop: "-6px" }}><LazyStepTree /></Row>
      )}

      </>
    );
  }
}

ItemStepsView.propTypes = {
  cachebase: PropTypes.object,
  network: PropTypes.string,
  uiSelectedItem: PropTypes.string,
  uiSelectedStep: PropTypes.string,
  uiSelectedItemLastStep: PropTypes.string
}

export default connect((state) => ({
  cachebase: state.cachebase,
  network: state.network,
  uiSelectedItem: state.uiSelectedItem,
  uiSelectedStep: state.uiSelectedStep,
  uiSelectedItemLastStep: state.uiSelectedItemLastStep
}))(ItemStepsView); 
