import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Tree } from 'antd';
import { uiStepSelected, uiToggleCreateModal } from '../actions';

const { TreeNode } = Tree;

class LazyStepTree extends PureComponent {
  state = {
    treeData: undefined
  };

  componentDidMount() {
    const { cachebase, network, uiItemLastStep } = this.props;

    cachebase.ref(`/stepCache/${network}`)
      .orderByChild('id')
      .equalTo(uiItemLastStep)
      .limitToFirst(1)
      .on('value', this.updateStep);

  }

  componentDidUpdate(prevProps, prevState) {
    // only update chart if the data has changed
    const { cachebase, network, uiItemLastStep } = this.props;

    if (prevProps.uiItemLastStep !== uiItemLastStep) {
      if (!!prevProps.uiItemLastStep) {
        cachebase.ref(`/stepCache/${network}`)
          .orderByChild('id')
          .equalTo(prevProps.uiItemLastStep)
          .limitToFirst(1)
          .off('value', this.updateStep);
      }

      if (!!uiItemLastStep) {
        cachebase.ref(`/stepCache/${network}`)
          .orderByChild('id')
          .equalTo(uiItemLastStep)
          .limitToFirst(1)
          .on('value', this.updateStep);
      }
    }

  }

  componentWillUnmount() {
    const { cachebase, network, uiItemLastStep } = this.props;

    cachebase.ref(`/stepCache/${network}`)
      .orderByChild('id')
      .equalTo(uiItemLastStep)
      .limitToFirst(1)
      .off('value', this.updateStep);
  }

  updateStep = (snapshot) => {
    if (!!snapshot && !!snapshot.val()) {
      const values = Object.values(snapshot.val());
      if (values.length > 0 && !!values[0]) {
        const step = values[0];
        console.log('ItemView, step update: ', step);
        const treeData = [{ 
          title: step.name, 
          key: '0', 
          isLeaf: (!step.precedents || !step.precedents.length),
          precedingSteps: undefined,
          ...step
        }]
        this.setState({treeData});
      }
    }
  }

  onLoadData = (treeNode) => new Promise(async (resolve) => {
    const { cachebase, network } = this.props;

    console.log('treeNode', treeNode);
    if (!!treeNode.props.dataRef.precedingSteps) {
      console.log('treeNode precedingSteps already loaded ', treeNode.props.dataRef.precedingSteps);
      resolve();
      return;
    } else console.log('loading precedingSteps...');

    const precedingSteps = [];
    if (!treeNode.props.isLeaf && !!treeNode.props.dataRef.precedents && 
        !!treeNode.props.dataRef.precedents.length) {
      for (let i=0; i<treeNode.props.dataRef.precedents.length; i++) {
        const stepId = treeNode.props.dataRef.precedents[i];
        const snapshot = await cachebase.ref(`/stepCache/${network}`)
          .orderByChild('id')
          .equalTo(stepId)
          .limitToFirst(1)
          .once('value');
        const values = Object.values(snapshot.val());
        if (values.length > 0 && !!values[0]) {
          const step = values[0];
          console.log('loaded step: ', step);

          precedingSteps.push({
            title: step.name, 
            key: treeNode.props.eventKey+'-'+i, 
            isLeaf: (!step.precedents || !step.precedents.length),
            precedingSteps: undefined,
            ...step
          });
        }
        
      }
    }

    console.log('loaded precedingSteps: ', precedingSteps);

    treeNode.props.dataRef.precedingSteps = precedingSteps;

    this.setState({
      treeData: [...this.state.treeData],
    });
    resolve();
  });

  renderTreeNodes = (steps) =>
    steps.map((step) => {
      if (!!step.precedingSteps && !!step.precedingSteps.length) {
        return (
          <TreeNode title={step.title} key={step.key} dataRef={step}>
            {this.renderTreeNodes(step.precedingSteps)}
          </TreeNode>
        );
      } else if (!!step.precedingSteps) {//empty
        return (
          <TreeNode title={step.title} key={step.key} dataRef={step} isLeaf={true} />
        );
      } else {//not loaded
        return(
          <TreeNode title={step.title} key={step.key} dataRef={step} />
        );
      }
      
    });

  stepSelected = (step, e) => {
    const { dispatch } = this.props;
    console.log('stepSelected, e: ', e);
    let id = undefined;
    if (!!e.selectedNodes && !!e.selectedNodes.length && 
        !!e.selectedNodes[0]) {
      id = e.selectedNodes[0].props.dataRef.id;
      console.log('stepSelected, id: ', id);
    }
    dispatch(uiStepSelected({id}));
  }


  render() {
    const { treeData } = this.state;

    console.log('state ',this.state);
    return (!treeData || !treeData.length) ? (
      <span>Loading tree...</span>
    ) : (
      <Tree loadData={this.onLoadData} onSelect={this.stepSelected} showLine>
        {this.renderTreeNodes(treeData)}
      </Tree>
    );
  }
}

LazyStepTree.propTypes = {
  cachebase: PropTypes.object,
  network: PropTypes.string,
  uiItemLastStep: PropTypes.string
}

export default connect((state) => ({
  cachebase: state.cachebase,
  network: state.network,
  uiItemLastStep: state.uiItemLastStep
}))(LazyStepTree); 