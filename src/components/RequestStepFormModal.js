import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Modal, Form, Input, Select, Radio, Row, Col } from 'antd';
import { uiToggleCreateModal, sendTx } from '../actions';
import { requestSupplyStepTx } from '../constants';


const RequestStepFormModal = Form.create({ name: 'request_step_form' })(
  // eslint-disable-next-line
  class extends Component {
    render() {
      const { uiSelectedItem, uiSelectedStep, uiSelectedNode, uiCreateModalOpen, form, dispatch } = this.props;
      const { getFieldValue, getFieldDecorator } = form;

      return (
        <Modal
          visible={uiCreateModalOpen === 'request'}
          centered
          title={"Request Access to append Supply Step "+uiSelectedStep+" for Supply Item "+uiSelectedItem+", on Supply Node "+uiSelectedNode+" ?"}
          okText={<span style={{color: "#002950"}}>Request</span>}
          cancelText={<span style={{color: "#002950"}}>Cancel</span>}
          onCancel={() => dispatch(uiToggleCreateModal({open: false}))}
          onOk={() => {
            //const form = this.formRef.props.form;
            form.validateFields((err, values) => {
              if (!!err) {
                console.log('validateFields Error: ', err); 
                return;
              } else console.log('validateFields values: ', values);

              dispatch(sendTx(requestSupplyStepTx({ step: uiSelectedStep, node: uiSelectedNode })));
              form.resetFields();
              dispatch(uiToggleCreateModal({open: false}));
            });
          }}>
          <Col>
            <Row>{' '}</Row>
            <Row><strong>{"Est gas: 115000 gwei"}</strong></Row>
          </Col>
        </Modal>
      );
    }
  }
);

  //wrappedComponentRef={(formRef) => { this.formRef = formRef; }}

RequestStepFormModal.propTypes = {
  uiCreateModalOpen: PropTypes.any,
  uiSelectedNode: PropTypes.string,
  uiSelectedItem: PropTypes.string,
  uiSelectedStep: PropTypes.string
}

export default connect((state) => ({
  uiCreateModalOpen: state.uiCreateModalOpen,
  uiSelectedNode: state.uiSelectedNode,
  uiSelectedItem: state.uiSelectedItem,
  uiSelectedStep: state.uiSelectedStep
}))(RequestStepFormModal);