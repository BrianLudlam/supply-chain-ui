import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Modal, Form, Input, Select, Radio, Row, Col } from 'antd';
import { uiToggleCreateModal, createSupplyNode } from '../actions';

const CreateNodeFormModal = Form.create({ name: 'create_node_form' })(
  // eslint-disable-next-line
  class extends Component {
    render() {
      const { uiCreateModalOpen, form, dispatch } = this.props;
      const { getFieldValue, getFieldDecorator } = form;

      return (
        <Modal
          visible={uiCreateModalOpen === 'node'}
          centered
          title="Create a new Supply Node?"
          okText={<span style={{color: "#002950"}}>Create</span>}
          cancelText={<span style={{color: "#002950"}}>Cancel</span>}
          onCancel={() => dispatch(uiToggleCreateModal({open: false}))}
          onOk={() => {
            //const form = this.formRef.props.form;
            form.validateFields((err, values) => {
              if (!!err) {
                console.log('validateFields Error: ', err); 
                return;
              } else console.log('validateFields values: ', values);
              if(!!values && !!values.name && !!values.desc) {
                const file = { 
                  name: values.name, 
                  desc: values.desc
                };
                console.log('validateFields file: ', file);
                dispatch(createSupplyNode({file}));
              } 
              form.resetFields();
              dispatch(uiToggleCreateModal({open: false}));
            });
          }}>
          <Col>
            <Row>{'Create node...'}</Row>
            <Row><strong>{"Est gas: 115000 gwei"}</strong></Row>
          </Col>
          <Form layout="inline">
            <Form.Item label="Name">
              {getFieldDecorator('name', {
                rules: [{ required: true, message: 'Supply Node name' }],
              })(<Input />)}
            </Form.Item>
            <Form.Item label="Description">
              {getFieldDecorator('desc', {
                rules: [{ required: true, message: 'Supply Node description' }],
              })(<Input />)}
            </Form.Item>
          </Form>
        </Modal>
      );
    }
  }
);

  //wrappedComponentRef={(formRef) => { this.formRef = formRef; }}

CreateNodeFormModal.propTypes = {
  uiCreateModalOpen: PropTypes.any
}

export default connect((state) => ({
  uiCreateModalOpen: state.uiCreateModalOpen
}))(CreateNodeFormModal);