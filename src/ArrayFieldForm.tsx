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
import {ArrayField, Button, Form, Spin, Toast, useFormState} from '@douyinfe/semi-ui';
import {IconMinusCircle, IconPlusCircle} from '@douyinfe/semi-icons';
import useTableFieldState from "./hooks/useTableFieldState";
import {bitable} from "@lark-base-open/js-sdk";

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
    const [loading, setLoading] = useState(false)
    const [loadingContent, setLoadingContent] = useState('')

    const [fieldListCanChoose, setFieldListCanChoose] = useState<{ name: string, id: string; }[][]>([]);
    // const [optionListCanChoose, setOptionListCanChoose] = useState<any>([]);
    let arrayFields: any = [];
    const ComponentUsingFormState = () => {
        const formState = useFormState();
        console.log("formState", formState);
        arrayFields = formState.values.field;
        return null;
    };
    /**
     * 初始化
     */
    useEffect(() => {
        setData([
            {name: 'Engineer', defaultValue: 'Engineer'},
            {name: 'Designer', defaultValue: 'Designer'},
        ])

        async function init() {

        }

        init().catch((e) => {
            Toast.error('table.err')
            console.error(e)
        });
    }, []);

    /**
     * 获取新数据
     * 1. 获取表信息
     * 2. 获取字段信息
     * 3. 清空历史记录
     * 4. 清空本地缓存
     * 4. 初始化可选字段列表
     */
    const fetchNewInfo = async () => {
        // 刷新时添加加载状态
        setLoading(true)
        setLoadingContent('刷新数据中')
        const selection = await bitable.base.getSelection();
        console.log("selection", selection);
        if (!selection.tableId) {
            Toast.error('table.err')
            return;
        }
        // 清空历史记录
        formApi.current.reset();

        // 清空本地缓存
        localStorage.clear();
        // 获取表信息
        const [tableRes, tableMetaListRes, tableListRes] = await Promise.all([
            bitable.base.getTableById(selection.tableId),
            bitable.base.getTableMetaList(),
            bitable.base.getTableList()
        ])
        setTableInfo({
            table: tableRes,
            tableMeta: tableMetaListRes.find(({id}) => tableRes.id === id)!,
            tableMetaList: tableMetaListRes.filter(({name}) => name),
            tableList: tableListRes
        });

        // 获取字段信息
        const fieldMetaList = await tableRes.getFieldMetaList();
        const fieldList = await tableRes.getFieldList();
        setFieldInfo({
            fieldList,
            fieldMetaList,
            field: undefined,
            fieldMeta: undefined
        })

        // 初始化可选字段数组列表，数组长度为表字段数量，初始时，每个元素包含所有字段
        const fill = new Array(fieldMetaList.length).fill(fieldMetaList.map(({name, id}) => ({name, id})));
        console.log('fill', fill)
        setFieldListCanChoose(fill)
        setLoading(false)
        console.log('fieldListCanChoose', fieldListCanChoose)
    }

    /**
     * 复用上一次的记录
     */
    const useLastRecord = () => {
        formApi.current.setValues({
            field: [
                {name: 'Engineer', defaultValue: 'Engineer'},
                {name: 'Designer', defaultValue: 'Designer'},
            ]
        })
    }
    const onSelectField = async (selectedId: any, fieldIndex: number) => {
        console.log('value', selectedId)
        console.log('fieldIndex', fieldIndex)
        // 当选择一个字段时
        if (selectedId) {
            // 从其他fieldListCanChoose数组中删除这个字段
            fieldListCanChoose.forEach((list, index) => {
                if (index !== fieldIndex) {
                    const fieldIndex = list.findIndex(({id}) => id === selectedId);
                    if (fieldIndex !== -1) {
                        list.splice(fieldIndex, 1);
                    }
                }
            });
        } else {
            if (!fieldInfo) {
                Toast.error('获取字段信息失败')
                return;
            }
            // 当取消选择时，将这个字段添加回去
            const field = fieldInfo.fieldMetaList.find(({id}) => id === selectedId);
            fieldListCanChoose.forEach(list => {
                if (!field) {
                    Toast.error('添加候选字段失败')
                    return;
                }
                list.push(field);
            });
        }
    }
    const onSelectTable = async (t: any) => {
        setLoading(true);
        setLoadingContent('获取表信息中')
        if (!tableInfo) {
            Toast.error('获取表信息失败')
            return;
        }
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

        if (!fieldInfo) {
            Toast.error('获取字段信息失败')
            return
        }
        const fill = new Array(fieldInfo.fieldMetaList.length).fill(fieldMetaList.map(({name, id}) => ({name, id})));
        console.log('fill', fill)
        setFieldListCanChoose(fill)
        setLoading(false)
    }

    return (
        <Spin style={{height: '100vh'}} tip={loadingContent} size="large" spinning={loading}>
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
                    <Button
                        theme="solid"
                        type="primary"
                        className="bt1"
                        onClick={fetchNewInfo}
                        style={{margin: 12, alignSelf: 'flex-end'}}
                    >
                        {"刷新数据"}
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
                                            onChange={(selectedId) => onSelectField(selectedId, i)}
                                        >
                                            {
                                                fieldListCanChoose[i].map(({id, name}) => <Form.Select.Option key={id}
                                                                                                              value={id}>{name}</Form.Select.Option>)
                                            }
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
                                            field={`${field}[autoInput]`}
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
                <ComponentUsingFormState/>
            </Form>
        </Spin>
    );
}

export default ArrayFieldForm;