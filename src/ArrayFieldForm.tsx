/*
 *    Copyright 2023. cc01cc
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

import React, {useEffect, useRef, useState} from 'react';
import {ArrayField, Button, Form} from '@douyinfe/semi-ui';
import {IconMinusCircle, IconPlusCircle} from '@douyinfe/semi-icons';
import useTableFieldState from "./hooks/useTableFieldState";

function ArrayFieldForm() {
    const {
        tableInfo,
        fieldInfo,
        setTableInfo,
        setFieldInfo,
        options,
        setOptions
    } = useTableFieldState();
    const [data, setData] = useState<{ name: string, defaultValue: string; }[]>();
    const formApi = useRef<any>();


    useEffect(() => {
        setData([
            {name: 'Engineer', defaultValue: 'Engineer'},
            {name: 'Designer', defaultValue: 'Designer'},
        ])
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