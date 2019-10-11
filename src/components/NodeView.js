import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button, Row, Select} from 'antd';
import { uiItemSelected, uiToggleCreateModal } from '../actions';

class NodeView extends PureComponent {

  state = {
    node: undefined,
    items: undefined
  }

  componentDidMount() {
    const { uiSelectedNode, cachebase, network } = this.props;

    cachebase.ref(`/nodeCache/${network}`)
      .orderByChild('id')
      .equalTo(uiSelectedNode)
      .limitToFirst(1)
      .on('value', this.updateNode);

    cachebase.ref(`/itemCache/${network}`)
      .orderByChild('node')
      .equalTo(uiSelectedNode)
      .on('value', this.updateItems);
  }

  componentDidUpdate(prevProps, prevState) {
    // only update chart if the data has changed
    const { uiSelectedNode, cachebase, network } = this.props;

    if (prevProps.uiSelectedNode !== uiSelectedNode) {
      this.setState({
        node: undefined,
        items: undefined
      });

      cachebase.ref(`/nodeCache/${network}`)
        .orderByChild('id')
        .equalTo(prevProps.uiSelectedNode)
        .limitToFirst(1)
        .off('value', this.updateNode);

      cachebase.ref(`/itemCache/${network}`)
        .orderByChild('node')
        .equalTo(prevProps.uiSelectedNode)
        .off('value', this.updateItems);

      cachebase.ref(`/nodeCache/${network}`)
        .orderByChild('id')
        .equalTo(uiSelectedNode)
        .limitToFirst(1)
        .on('value', this.updateNode);

      cachebase.ref(`/itemCache/${network}`)
        .orderByChild('node')
        .equalTo(uiSelectedNode)
        .on('value', this.updateItems);
    }
  }

  componentWillUnmount() {
    const { uiSelectedNode, uiSelectedItem, cachebase, network } = this.props;

    cachebase.ref(`/nodeCache/${network}`)
      .orderByChild('id')
      .equalTo(uiSelectedNode)
      .limitToFirst(1)
      .off('value', this.updateNode);

    cachebase.ref(`/itemCache/${network}`)
      .orderByChild('node')
      .equalTo(uiSelectedNode)
      .off('value', this.updateItems);
  }

  updateNode = (snapshot) => {
    if (!!snapshot && !!snapshot.val()) {
      const values = Object.values(snapshot.val());
      if (values.length > 0 && !!values[0]) {
        const node = values[0];
        console.log('NodeView, node update: ', node);
        this.setState({node});
      }
    }
  }

  updateItems = (snapshot) => {
    let items = [];
    if (!!snapshot && !!snapshot.val()) {
      items = Object.values(snapshot.val());
      console.log('NodeView, node items update: ', items);
    }
    this.setState({items});
  }

  render () {
    const { uiSelectedNode, uiSelectedItem, uiItemLastStep, dispatch } = this.props;
    const { node, items } = this.state;

    if (!node)
      return (
        <Row size="small">
          <span style={{color: "#999"}}>{'Loading Node '+uiSelectedNode}</span>
        </Row>
      );
    else return (
      <>
      <Row size="small">
        <span style={{color: "#999"}}>Node Name:&nbsp;&nbsp;</span>
        {node.name}
      </Row>
      <Row size="small" style={{marginTop: "1px"}}>
        <span style={{color: "#999"}}>Node Description:&nbsp;&nbsp;</span>
      </Row>
      <Row>
        <span style={{paddingLeft: "6px"}}>{node.desc}</span>
      </Row>
      <Row size="small">
        <span style={{color: "#999"}}>Node Origin Items:&nbsp;&nbsp;</span>
      </Row>

      <Row style={{ marginTop: "6px" }}>
      <Select
        showSearch
        allowClear
        style={{ width: "180px", marginTop: "-12px", marginBottom: "4px" }}
        dropdownMatchSelectWidth={false}
        loading={!items}
        placeholder={(!items) ? "Loading node items" : "Select an item ("+items.length+")"}
        notFoundContent="No node items yet"
        optionFilterProp="children"
        value={uiSelectedItem}
        filterOption={(input, option) =>
          option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
        }
        onChange={(id) => dispatch(uiItemSelected({id}))}>
        {!!items && !!items.length && items.map((item) => (
          <Select.Option key={item.id} value={item.id}>
            {item.name}
          </Select.Option>
        ))}
      </Select>
      <Button type="ghost"
        style={{marginLeft: "6px", color:"#002950", backgroundColor: "#f0f2f5"}}
        onClick={() => dispatch(uiToggleCreateModal({open: 'item'}))}>
        New
      </Button>
      </Row>
      </>
    );
  }
}

NodeView.propTypes = {
  cachebase: PropTypes.object,
  network: PropTypes.string,
  uiSelectedNode: PropTypes.string,
  uiSelectedItem: PropTypes.string,
  uiItemLastStep: PropTypes.string
}

export default connect((state) => ({
  cachebase: state.cachebase,
  network: state.network,
  uiSelectedNode: state.uiSelectedNode,
  uiSelectedItem: state.uiSelectedItem,
  uiItemLastStep: state.uiItemLastStep,
}))(NodeView); 
