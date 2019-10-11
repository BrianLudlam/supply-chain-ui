import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button, Row, Select} from 'antd';

class ItemView extends PureComponent {

  state = {
    item: undefined
  }

  componentDidMount() {
    const { cachebase, network, uiSelectedItem } = this.props;

    if (!!uiSelectedItem) {
      cachebase.ref(`/itemCache/${network}`)
        .orderByChild('id')
        .equalTo(uiSelectedItem)
        .limitToFirst(1)
        .on('value', this.updateItem);
    }

  }

  componentDidUpdate(prevProps, prevState) {
    // only update chart if the data has changed
    const { cachebase, network, uiSelectedItem } = this.props;

    if (prevProps.uiSelectedItem !== uiSelectedItem) {

      this.setState({
        item: undefined
      });

      if (!!prevProps.uiSelectedItem) {
        cachebase.ref(`/itemCache/${network}`)
          .orderByChild('id')
          .equalTo(prevProps.uiSelectedItem)
          .off('value', this.updateItem);
      }

      if (!!uiSelectedItem) {
        cachebase.ref(`/itemCache/${network}`)
          .orderByChild('id')
          .equalTo(uiSelectedItem)
          .on('value', this.updateItem);
      }

    }
  }

  componentWillUnmount() {
    const { cachebase, network, uiSelectedItem } = this.props;

    if (!!uiSelectedItem) {
      cachebase.ref(`/itemCache/${network}`)
        .orderByChild('id')
        .equalTo(uiSelectedItem)
        .off('value', this.updateItem);
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

  render () {
    const { uiSelectedItem, dispatch } = this.props;
    const { item } = this.state;

    if (!item)
      return (
        <Row size="small">
          <span style={{color: "#999"}}>{'Loading Item... '+uiSelectedItem}</span>
        </Row>
      );
    else return (
      <>
      <Row size="small">
        <span style={{color: "#999"}}>Item Name:&nbsp;&nbsp;</span>
        {item.name}
      </Row>
      <Row size="small">
        <span style={{color: "#999"}}>Item ID:&nbsp;&nbsp;</span>
        {uiSelectedItem}
      </Row>
      <Row size="small">
        <span style={{color: "#999"}}>Item Root Node:&nbsp;&nbsp;</span>
        {item.node}
      </Row>
      <Row size="small">
        <span style={{color: "#999"}}>Item Description:&nbsp;&nbsp;</span>
      </Row>
      <Row>
        <span style={{paddingLeft: "6px"}}>{item.desc}</span>
      </Row>
      <Row size="small">
        <span style={{color: "#999"}}>Item Steps:&nbsp;&nbsp;</span>
      </Row>
      </>
    );
  }
}

ItemView.propTypes = {
  cachebase: PropTypes.object,
  network: PropTypes.string,
  uiSelectedItem: PropTypes.string
}

export default connect((state) => ({
  cachebase: state.cachebase,
  network: state.network,
  uiSelectedItem: state.uiSelectedItem
}))(ItemView); 
