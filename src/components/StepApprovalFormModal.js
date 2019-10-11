import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Modal, Form, Input, Switch, Row, Col } from 'antd';
import { uiToggleCreateModal, sendTx } from '../actions';
import { approveSupplyNodeTx } from '../constants';


const StepApprovalFormModal = Form.create({ name: 'step_approval_form' })(
  // eslint-disable-next-line
  class extends Component {
    render() {
      const { uiSelectedItem, uiSelectedStep, uiCreateModalOpen, uiCreateModalData, 
              form, dispatch } = this.props;
      const { getFieldValue, getFieldDecorator } = form;

      let node = undefined;
      let approval = false;
      if (!!uiCreateModalData) {
        node = uiCreateModalData.node;
        approval = uiCreateModalData.approval;
      }
      
      return (
        <Modal
          visible={uiCreateModalOpen === 'approval'}
          centered
          title={"Approve Supply Step access to Supply Node "+node+" ?"}
          okText={<span style={{color: "#002950"}}>Set Approval</span>}
          cancelText={<span style={{color: "#002950"}}>Cancel</span>}
          onCancel={() => dispatch(uiToggleCreateModal({open: false}))}
          onOk={() => {
            //const form = this.formRef.props.form;
            form.validateFields((err, values) => {
              if (!!err) {
                console.log('validateFields Error: ', err); 
                return;
              } else console.log('validateFields values: ', values);

              const approved = (!!values && !!values.approval);
              dispatch(sendTx(approveSupplyNodeTx({ step: uiSelectedStep, node, approved })));
              form.resetFields();
              dispatch(uiToggleCreateModal({open: false}));
            });
          }}>
          <Col>
            <Row>{' '}</Row>
            <Row><strong>{"Est gas: 115000 gwei"}</strong></Row>
          </Col>
          <Form layout="inline">
            <Form.Item label="Approval">
              {getFieldDecorator('approval', { valuePropName: 'checked', initialValue: approval, })(<Switch />)}
            </Form.Item>
          </Form>
        </Modal>
      );
    }
  }
);

  //wrappedComponentRef={(formRef) => { this.formRef = formRef; }}

StepApprovalFormModal.propTypes = {
  uiCreateModalOpen: PropTypes.any,
  uiSelectedItem: PropTypes.string,
  uiSelectedStep: PropTypes.string,
  uiCreateModalData: PropTypes.any
}

export default connect((state) => ({
  uiCreateModalOpen: state.uiCreateModalOpen,
  uiCreateModalData: state.uiCreateModalData,
  uiSelectedItem: state.uiSelectedItem,
  uiSelectedStep: state.uiSelectedStep
}))(StepApprovalFormModal);