import { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import Modal from "antd/es/modal";
import Button from "antd/es/button";
import Form from "antd/es/form";
import Select from "antd/es/select";
import Input from "antd/es/input";
import type { ICollection, ICollectionGroup } from "~lib/new/CollectionManager";

interface IModalSaveProps {
  open: boolean;
  onSave: Function;
  collections: ICollection[];
  collectionGroups: ICollectionGroup[];
}

export default forwardRef(function ModalSave(props: IModalSaveProps) {
  const {
    onSave,
    collections,
    collectionGroups
  } = props;
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);

  const toggle = () => {
    setOpen(!open);
  }

  useImperativeHandle(null, () => ({
    toggle
  }))

  return (
    <Modal
      title="保存到收藏"
      open={open}
      onCancel={toggle}
      footer={[
        <Button key="save" type="primary" onClick={() => {
          const _formData = form.getFieldsValue(true);
          onSave && onSave(_formData);
        }}> 保存 </Button>,
      ]}
    >
      <div style={{height: 6}} />
      <Form
        form={form}
        // size="small"
        layout="horizontal"
        onFinish={(values) => {
          console.log('Success:', values);
        }}
        onValuesChange={(changedValues, allValues) => {
          console.log(changedValues, allValues);
        }}
      >
        <Form.Item label="选择收藏夹" name="cid" initialValue="" >
          <Select
            placeholder="创建收藏夹"
            options={[{label: '新建收藏夹', value: ''}].concat(collections.map(_ => ({
              label: _.name || '未命名',
              value: _.id
            })))}
          />
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.id !== currentValues.id}
        >
          {({ getFieldValue }) =>
            !getFieldValue('id') ? (
              <Form.Item name="name" label="收藏夹名称">
                <Input />
              </Form.Item>
            ) : null
          }
        </Form.Item>

        <Form.Item label="选择分组" name="cgid" initialValue="" >
          <Select
            placeholder="创建分组"
            options={[{label: '新建分组', value: ''}].concat(collectionGroups.map(_ => ({
              label: _.name || '未命名',
              value: _.id
            })))}
          />
        </Form.Item>
      </Form>
    </Modal>

  );
})
