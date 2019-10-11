import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button, Row, Select } from 'antd';
import { uiNodeSelected, uiToggleCreateModal } from '../actions';

class NodeListView extends PureComponent {

  state = {
    nodes: undefined
  }

  componentDidMount() {
    const { cachebase, network, account } = this.props;

    cachebase.ref(`/nodeCache/${network}`)
      .orderByChild('owner')
      .equalTo(account)
      .on('value', this.updateNodes);
  }

  componentWillUnmount() {
    const { cachebase, network, account } = this.props;

    cachebase.ref(`/nodeCache/${network}`)
      .orderByChild('owner')
      .equalTo(account)
      .off('value', this.updateNodes);
  }

  updateNodes = (snapshot) => {
    let nodes = [];
    if (!!snapshot && !!snapshot.val()) {
      nodes = Object.values(snapshot.val());
      console.log('NodeListView, nodes update: ', nodes);
    }
    this.setState({nodes});
  }

  render () {
    const { uiSelectedNode, dispatch } = this.props;
    const { nodes } = this.state;

    return (
      <>
      <Row style={{ marginTop: "-16px" }}>
      <span style={{color: "#999"}}>My Supply Nodes&nbsp;&nbsp;</span>
      </Row>
      <Row>
      <Select
        showSearch
        allowClear
        style={{ width: "160px", marginTop: "-12px", marginBottom: "4px" }}
        dropdownMatchSelectWidth={false}
        loading={!nodes}
        placeholder={(!nodes) ? "Loading nodes" : "Select a node ("+nodes.length+")"}
        notFoundContent="No nodes yet"
        optionFilterProp="children"
        value={uiSelectedNode}
        filterOption={(input, option) =>
          option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
        }
        onChange={(id) => dispatch(uiNodeSelected({id}))}>
        {!!nodes && !!nodes.length && nodes.map((node) => (
          <Select.Option key={node.id} value={node.id}>
            {node.name}
          </Select.Option>
        ))}
      </Select>
      <Button type="ghost"
        style={{marginLeft: "6px", color:"#002950", backgroundColor: "#f0f2f5"}}
        onClick={() => dispatch(uiToggleCreateModal({open: 'node'}))}>
        New
      </Button>
      </Row>
      </>
    );
  }
}

NodeListView.propTypes = {
  cachebase: PropTypes.object,
  network: PropTypes.string,
  account: PropTypes.string,
  uiSelectedNode: PropTypes.string
}

export default connect((state) => ({
  cachebase: state.cachebase,
  network: state.network,
  account: state.account,
  uiSelectedNode: state.uiSelectedNode
}))(NodeListView); 