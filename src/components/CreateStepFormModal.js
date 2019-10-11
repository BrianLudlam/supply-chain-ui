import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Modal, Form, Select, Input, AutoComplete, Row, Col } from 'antd';
import { uiToggleCreateModal, createSupplyStep } from '../actions';
import { getContract } from '../constants';

import ItemSearch from "./ItemSearch";

const CreateStepFormModal = Form.create({ name: 'create_step_form' })(
  // eslint-disable-next-line
  class extends Component {

    state = {
      precedingItemsList: []
    };

    componentDidUpdate (prevProps) {
      const {uiCreateModalOpen, uiSelectedItem, uiItemLastStep, uiSelectedNode} = this.props;
      if (prevProps.uiCreateModalOpen !== 'step' && uiCreateModalOpen === 'step') {
        if (!!uiSelectedItem && !!uiItemLastStep && uiItemLastStep !== "0") {
          this.appendItem(uiSelectedItem);
        } 
      } 
    }

    appendItem = async (id) => {
      const { cachebase, network } = this.props;
      console.log('appendItem item id: ', id);
      try {
        const snapshot = await 
          cachebase.ref(`/itemCache/${network}`)
          .orderByChild('id')
          .equalTo(id)
          .limitToFirst(1)
          .once("value");
        if (!!snapshot && !!snapshot.val()) {
          const result = Object.values(snapshot.val());
          if (!!result && !!result.length) {
            const item = result[0];
            console.log('appendItem item: ', item);
            if (!!item && !!item.id) {
              let precedingItems = this.props.form.getFieldValue('precedingItems');
              if (!precedingItems) precedingItems = [];
              if (this.state.precedingItemsList.every((one) => one.id !== id)) {
                this.setState((state) => ({precedingItemsList: [...state.precedingItemsList, item]}));
                this.props.form.setFieldsValue({
                  precedingItems: [...precedingItems, item.id]
                });
              }
            }
          }
        }else console.log('appendItem result is null');
      } catch (e) {
        console.error('appendItem failed, e: ', e);
      }

    }

    onItemAdded = async (id, e) => {
      const { accountWeb3, account } = this.props;
      console.log('onItemAdded item: '+ id);
      console.log('onItemAdded e: ', e);
      let item = undefined;
      if (!!e.props && !!e.props.value) {
        item = {
          id: e.props.value,
          name: e.props.text
        };
        console.log('onItemAdded, item: ', item);
      }

      if (!!item && !!item.id) {
        let precedingItems = this.props.form.getFieldValue('precedingItems');
        if (!precedingItems) precedingItems = [];
        if (this.state.precedingItemsList.every((one) => one.id !== id)) {
          this.setState((state) => ({precedingItemsList: [...state.precedingItemsList, item]}));
          this.props.form.setFieldsValue({
            precedingItems: [...precedingItems, item.id]
          });
        }
      }
    }

    getPrecedentLastSteps = async (precedingItems) => {
      const { accountWeb3, account } = this.props;
      const lastSteps = [];
      console.log('getPrecedentLastSteps, precedingItems: ', precedingItems);
      if (!precedingItems || !precedingItems.length) return lastSteps;
      for (let i=0; i< precedingItems.length;i++) {
        const item = precedingItems[i];
        console.log('getPrecedentLastSteps, item: ', item);
        if (!!item) {
          const step = await getContract(accountWeb3).methods.itemLastStep(item).call({from: account});
          lastSteps.push(step.toString());
          console.log('getPrecedentLastSteps, step: ', step.toString());
        }
      }
      console.log('getPrecedentLastSteps, last steps: ', lastSteps);
      return lastSteps;
    }

    validateSupplyStep = async (node, item, precedents) => {
      const { accountWeb3, account } = this.props;

      const valid = await getContract(accountWeb3).methods.validateSupplyStep(
        node, item, precedents
      ).call({from: account});
      console.log('validateSupplyStep, valid: ', valid);
      return (!valid) ? false : true;
    }

    /*
    onItemRemoved = (id) => {
      console.log('onItemRemoved item: '+ id);
      let precedingItems = this.props.form.getFieldValue('precedingItems');
      if (!precedingItems) return;
      this.props.form.setFieldsValue({
        precedingItems: precedingItems.filter((each) => each.id !== id)})
      });
    }
*/
    render() {
      const { uiSelectedNode, uiSelectedItem, uiItemLastStep, uiCreateModalOpen, form, dispatch } = this.props;
      const { getFieldValue, getFieldDecorator } = form;
      const { precedingItemsList } = this.state;

      return (
        <Modal
          visible={uiCreateModalOpen === 'step'}
          centered
          title="Create a new Supply Step?"
          okText={<span style={{color: "#002950"}}>Create</span>}
          cancelText={<span style={{color: "#002950"}}>Cancel</span>}
          onCancel={() => dispatch(uiToggleCreateModal({open: false}))}
          onOk={() => {
            //const form = this.formRef.props.form;
            form.validateFields( async (err, values) => {
              if (!!err) {
                console.log('validateFields Error: ', err); 
                return;
              } else console.log('validateFields values: ', values);

              if(!!values && !!values.name && !!values.desc) {
                const file = { 
                  name: values.name, 
                  desc: values.desc
                };
                console.log('validateFields stepFile: ', file);
                console.log('validateFields uiSelectedNode: ', uiSelectedNode);
                console.log('validateFields uiSelectedItem: ', uiSelectedItem);
                const precedingItems = values.precedingItems || [];
                console.log('validateFields precedingItems: ', precedingItems);
                let precedents = [];
                if (!!precedingItems.length) {
                  precedents = await this.getPrecedentLastSteps(precedingItems);
                }
                console.log('validateFields precedents: ', precedents);

                const valid = await this.validateSupplyStep(
                  uiSelectedNode, 
                  uiSelectedItem, 
                  precedents
                );
                if (valid) {
                  form.resetFields();
                  dispatch(createSupplyStep({file, precedents}));
                  dispatch(uiToggleCreateModal({open: false}));
                } else console.error('validateFields precedingItems invalid');
              } 
              
            });
          }}>
          <Col>
            <Row>{'Create new Supply Step for Supply Item '+uiSelectedItem+' on Supply Node '+uiSelectedNode}</Row>
            <Row><strong>{"Est gas: 115000 gwei"}</strong></Row>
          </Col>
          <Form layout="inline">
            <Form.Item label="Name">
              {getFieldDecorator('name', {
                rules: [{ required: true, message: 'Supply Step name' }],
              })(<Input />)}
            </Form.Item>
            <Form.Item label="Description">
              {getFieldDecorator('desc', {
                rules: [{ required: false, message: 'Supply Step description' }],
              })(<Input />)}
            </Form.Item>
            <Form.Item label="Preceding Steps">
              <ItemSearch onItemSelected={this.onItemAdded}/>

              {getFieldDecorator('precedingItems', {
                rules: [{ required: false, message: 'Please select preceding steps.', type: 'array' }],
              })(

              <Select mode="multiple" 
                style={{ width: "240px", marginTop: "-12px", marginBottom: "4px" }}
                dropdownMatchSelectWidth={false}
                placeholder="No preceding steps.">
                {precedingItemsList.map((step) => 
                  <Select.Option key={step.id} value={step.id} label={step.name}>
                    {step.name}
                  </Select.Option>
                )}
              </Select>
              )}
            </Form.Item>

          </Form>
        </Modal>
      );
    }
  }
);

  //wrappedComponentRef={(formRef) => { this.formRef = formRef; }}

CreateStepFormModal.propTypes = {
  cachebase: PropTypes.object,
  network: PropTypes.string,
  accountWeb3: PropTypes.object,
  account: PropTypes.string,
  uiSelectedNode: PropTypes.string,
  uiSelectedItem: PropTypes.string,
  uiItemLastStep: PropTypes.string,
  uiCreateModalOpen: PropTypes.any
}

export default connect((state) => ({
  cachebase: state.cachebase,
  network: state.network,
  accountWeb3: state.accountWeb3,
  account: state.account,
  uiSelectedNode: state.uiSelectedNode,
  uiSelectedItem: state.uiSelectedItem,
  uiItemLastStep: state.uiItemLastStep,
  uiCreateModalOpen: state.uiCreateModalOpen
}))(CreateStepFormModal);