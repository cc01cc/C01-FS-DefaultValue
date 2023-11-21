import React, {useEffect, useRef, useState} from 'react';
import {ArrayField, Button, Form} from '@douyinfe/semi-ui';
import {IconMinusCircle, IconPlusCircle} from '@douyinfe/semi-icons';
import {IField, IFieldMeta as FieldMeta, ISelectFieldOption, ITable, ITableMeta} from "@lark-base-open/js-sdk";

function ArrayFieldForm() {
    const [tableInfo, setTableInfo] = useState<{
        /** 当前所选的table,默认为打开插件时的table */
        table: ITable,
        /** 当前所选table的元信息 */
        tableMeta: ITableMeta
        /** 所有的table元信息 */
        tableMetaList: ITableMeta[],
        /** 所有table的实例 */
        tableList: ITable[]
    }>();
    const [fieldInfo, setFieldInfo] = useState<{
        /**当前所选field的实例 */
        field: IField | undefined
        /** 当前所选field的元信息 */
        fieldMeta: FieldMeta | undefined
        /** tableInfo.table的所有field实例 */
        fieldList: IField[],
        /** tableInfo.table的所有field元信息 */
        fieldMetaList: FieldMeta[]
    }>()
    const [options, setOptions] = useState<ISelectFieldOption[]>();

    const [data, setData] = useState<{ name: string, defaultValue: string; }[]>();
    const formApi = useRef<any>();

    useEffect(() => {
        setData([
            {name: 'Engineer', defaultValue: 'Engineer'},
            {name: 'Designer', defaultValue: 'Designer'},
        ])

        // console.log(formApi.getValues)
    }, []);
    // 复用上一次的记录
    const useLastRecord = () => {
        formApi.current.setValues({
            field: [
                {name: 'Engineer', defaultValue: 'Engineer'},
                {name: 'Designer', defaultValue: 'Designer'},
            ]
        })
    }
    const onSelectField = async (value: any) => {
        console.log(value)
        console.log('formState: ', formApi.current.formState)
        console.log('formApi: ', formApi.current)
        console.log('values: ', formApi.current.getValues)
    }
    const onSelectTable = async (t: any) => {
        if (tableInfo) {
            // 单选
            const {tableList, tableMetaList} = tableInfo
            const chosenTable = tableList.find(({id}) => id === t)!;
            const chosenTableMeta = tableMetaList.find(({id}) => id === t)!;
            setTableInfo({
                ...tableInfo,
                table: chosenTable,
                tableMeta: chosenTableMeta
            });
            const [fieldMetaList, fieldList] = await Promise.all([chosenTable.getFieldMetaList(), chosenTable.getFieldList()])

            setFieldInfo({
                fieldList,
                fieldMetaList,
                field: undefined,
                fieldMeta: undefined
            });
            formApi.current.setValues({
                table: chosenTable.id
            })
        }
        console.log("tableInfo", tableInfo);
    }

    return (
        <Form
            wrapperCol={{span: 20}}
            labelCol={{span: 100}}
            style={{width: 500}}
            labelPosition='top'
            // labelWidth='100px'
            allowEmpty
            getFormApi={(a: any) => formApi.current = a}
            onChange={(formState: any) => formApi.current.formState = formState}
        >
            <div style={{display: 'flex', alignItems: 'center'}}>
                <Form.Select style={{width: 200}} onChange={onSelectTable} label='Table' field="table">
                    {
                        Array.isArray(tableInfo?.tableMetaList) && tableInfo?.tableMetaList.map(({id, name}) =>
                            <Form.Select.Option key={id} value={id}>{name}</Form.Select.Option>)
                    }
                </Form.Select>
                <Button
                    theme="solid"
                    type="primary"
                    className="bt1"
                    onClick={useLastRecord}
                    style={{margin: 12, alignSelf: 'flex-end'}}
                >
                    {"复用上一次记录"}
                </Button>
            </div>


            <ArrayField field='field' initValue={data}>
                {({add, arrayFields, addWithInitValue}) => (
                    <React.Fragment>
                        <Button onClick={add} icon={<IconPlusCircle/>} theme='light'>添加字段</Button>
                        {
                            arrayFields.map(({field, key, remove}, i) => (
                                <div key={key} style={{width: '100%', display: 'flex'}}>
                                    <Form.Select
                                        field={`${field}[name]`}
                                        label={`字段名`}
                                        style={{width: 120, marginRight: 20}}
                                        onChange={onSelectField}
                                        optionList={[
                                            {label: 'Engineer', value: 'Engineer'},
                                            {label: 'Designer', value: 'Designer'},
                                        ]}
                                    >
                                    </Form.Select>
                                    <Form.Select
                                        field={`${field}[defaultValue]`}
                                        label={`默认值`}
                                        style={{width: 120}}
                                        optionList={[
                                            {label: 'Engineer', value: 'Engineer'},
                                            {label: 'Designer', value: 'Designer'},
                                        ]}
                                    >
                                    </Form.Select>
                                    <Button
                                        theme="solid"
                                        type="primary"
                                        className="bt1"
                                        // onClick={clickFill}
                                        style={{margin: 12, alignSelf: 'flex-end'}}
                                    >
                                        {"填充"}
                                    </Button>

                                    <Form.Switch
                                        field="autoInput"
                                        label={{text: '自动填充', width: '100%'}}
                                        // noLabel={true}
                                        checkedText='开'
                                        uncheckedText='关'
                                        // onChange={(v) => openAutoInput(v)}
                                    />

                                    <Button
                                        type='danger'
                                        theme='borderless'
                                        icon={<IconMinusCircle/>}
                                        onClick={remove}
                                        style={{margin: 12, alignSelf: 'flex-end'}}
                                    />
                                </div>
                            ))
                        }
                    </React.Fragment>
                )}
            </ArrayField>

            <div style={{display: 'flex', marginTop: 20}}>

                <Form.Switch
                    field="autoInput"
                    labelPosition={"left"}
                    labelWidth={100}
                    label={'全部自动填充'}
                    // noLabel={true}
                    checkedText='开'
                    uncheckedText='关'
                    // onChange={(v) => openAutoInput(v)}
                />
                <Button
                    theme="solid"
                    type="primary"
                    className="bt1"
                    // onClick={clickFill}
                    style={{margin: 12, alignSelf: 'flex-end'}}
                >
                    {"全部填充"}
                </Button>
                <Button
                    htmlType="reset"
                    style={{margin: 12, alignSelf: 'flex-end'}}
                >重置</Button>
            </div>
            {/*<ComponentWithFormState />*/}
        </Form>
    );
}

export default ArrayFieldForm;