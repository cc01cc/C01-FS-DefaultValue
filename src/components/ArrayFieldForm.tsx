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

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ArrayField, Button, Form, Spin, Toast, useFormState} from '@douyinfe/semi-ui';
import {IconMinusCircle, IconPlusCircle} from '@douyinfe/semi-icons';
import {bitable, FieldType, ICommonSelectFieldProperty, ISelectFieldOption, ITable} from "@lark-base-open/js-sdk";
import {debounce} from 'lodash';
import {AutoInputManager, fetchNewData, getDefaultValue} from "../utils/arrayFieldFormUtils";
import {FieldListInTable, ZField, ZTable} from "../type/type";
import {fillByIndex} from "../utils/FillDefaultValue";


function ArrayFieldForm() {
    const [data, setData] = useState<{
        name: string,
        defaultValue: string;
    }[]>();
    const formApi = useRef<any>();
    const [loading, setLoading] = useState(false)
    const [loadingContent, setLoadingContent] = useState('')
    const [fieldListCanChooseList, setFieldListCanChooseList] = useState<{
        id: string,
        name: string
    }[][]>([]);
    const [arrayFields, setArrayFields] = useState<{
        name: string,
        defaultValue: string,
        autoInput: boolean
    }[]>([]);
    const [optionsList, setOptionsList] = useState<ISelectFieldOption[][]>();
    const [formStatus, setFormStatus] = useState<any>();

    const [tableActive, setTableActive] = useState<ITable>();
    const [tableList, setTableList] = useState<ZTable[]>([])
    const [fieldListInTable, setFieldListInTable] = useState<FieldListInTable>()
    const formRef = useRef()!

    // 创建防抖函数
    const debouncedSetArrayFields = useCallback(debounce(setArrayFields, 200), []);
    const debouncedSetFormStatus = useCallback(debounce(setFormStatus, 200), []);

    /**
     * 监听表单变化
     */
    const ComponentUsingFormState = () => {
        const formState = useFormState();
        useEffect(() => {
            debouncedSetArrayFields([...(formState.values.field || [])]);
        }, [formState.values.field]);
        debouncedSetFormStatus(formState);
        if (formState.values.table) {
            // 将表单状态保存到本地
            localStorage.setItem('formStatus', JSON.stringify(formStatus));
            localStorage.setItem('fieldListInTable', JSON.stringify(fieldListInTable));
            localStorage.setItem('tableActive', JSON.stringify(tableActive));
            localStorage.setItem('tableList', JSON.stringify(tableList));
            localStorage.setItem('optionsList', JSON.stringify(optionsList));
        }
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

        init().catch((e) => {
            Toast.error('初始化失败，请尝试刷新数据')
            console.error(e)
        });

        async function init() {
            // 刷新时添加加载状态
            setLoading(true)
            setLoadingContent('初始化')

            const newData = await fetchNewData(await bitable.base.getActiveTable());
            const tempTableActive = newData.tableActive;
            const tempTableList = newData.tableList;
            const tempFieldListInTable = newData.fieldListInTable;
            setTableActive(tempTableActive);
            setTableList(tempTableList);
            setFieldListInTable(tempFieldListInTable);

            const fieldListInTableJSON = localStorage.getItem('fieldListInTable');
            const tableActiveJSON = localStorage.getItem('tableActive');
            const tableListJSON = localStorage.getItem('tableList');

            if (fieldListInTableJSON === JSON.stringify(tempFieldListInTable) &&
                tableActiveJSON === JSON.stringify(tempTableActive) &&
                tableListJSON === JSON.stringify(tempTableList) &&
                localStorage.getItem('formStatus')) {
                setLoadingContent('加载本地缓存')
                const formStatus = JSON.parse(localStorage.getItem('formStatus') || '');
                setFormStatus(formStatus);
                // console.log('formStatus', formStatus);
                formApi.current.setValue('table', formStatus.values.table);
                formApi.current.setValue('field', formStatus.values.field);
                formApi.current.setValue('autoInput', formStatus.values.autoInput);
                setOptionsList(JSON.parse(localStorage.getItem('optionsList') || ''));
                // console.log('formApi', formApi.current.getValues())
            }

        }
    }, []);
    useEffect(() => {
        if (loading) {
            setLoading(false);
        }
    }, [fieldListInTable]);
    useEffect(() => {
        // console.log('new fieldListCanChooseList', fieldListCanChooseList);
    }, [fieldListCanChooseList]);

    const fields = fieldListInTable?.fields as ZField[];
    /**
     * 获取新数据
     * 1. 获取表信息
     * 2. 获取字段信息
     * 3. 清空历史记录
     * 4. 清空本地缓存
     * 4. 初始化可选字段列表
     */
    const fetchNewInfo = async () => {
        const tableActiveId = formStatus.values.table;
        await fetchNewInfoWithTable(tableActiveId)
    }
    const fetchNewInfoWithTable = async (tableId: string) => {
        // 刷新时添加加载状态
        setLoading(true)
        setLoadingContent('刷新数据中')

        const selection = await bitable.base.getSelection();
        // console.log("selection", selection);
        if (!selection.tableId) {
            Toast.error('table.err')
            return;
        }
        // 清空历史记录
        formApi.current.reset();

        // 清空本地缓存
        localStorage.clear();

        let tableActive;
        if (tableId) {
            tableActive = await bitable.base.getTable(tableId);
        } else {
            tableActive = await bitable.base.getActiveTable();
        }
        console.log('tableActive', tableActive);
        const newData = await fetchNewData(tableActive);
        setTableActive(newData.tableActive);
        setTableList(newData.tableList);
        setFieldListInTable(newData.fieldListInTable);

        // 初始化可选字段数组列表，数组长度为表字段数量，初始时，每个元素包含所有字段
        const fill = new Array(fields?.length).fill(fields?.map(({name, id}) => ({name, id})));
        setFieldListCanChooseList(fill)
        setLoading(false)
    }
    /**
     * 监听数组字段变化，更新可选字段列表
     */
    useEffect(() => {
        // 1. 遍历 arrayFields，获取每个字段的 id
        // 2. 遍历 fieldInfo.fieldMetaList，生成 tempFieldListCanChoose
        // 3. 将 tempFieldListCanChoose 赋值给对应的 tempFieldListCanChooseList 的元素
        // 4. 将 tempFieldListCanChooseList 赋值给 fieldListCanChooseList
        const tempFieldListCanChoose = fields?.filter(({id}) => {
                for (let i = 0; i < arrayFields.length; i++) {
                    const field = arrayFields[i].name;
                    if (!field) {
                        // console.log(i, 'field is undefined')
                        continue;
                    }
                    // 将当前字段的 id 加入 tempFieldListCanChoose
                    if (id === field) {
                        return false;
                    }
                }
                return true;
            }
        ).map(({id, name}) => ({id, name}));
        const specialFieldListCanChooseList = new Array(fields?.length).fill(fields?.map(({name, id}) => ({name, id})));
        // 将已经选择的字段添加到各自的候选框中
        arrayFields.forEach((field, index) => {
            let specialFieldListCanChoose = tempFieldListCanChoose ? [...tempFieldListCanChoose] : [];
            // console.log('fieldListInTable?.fields', fields, field)
            const findField = fields?.find(({id}) => id === field.name);
            // console.log('findField', findField)
            if (findField && findField.id && findField.name) {
                specialFieldListCanChoose?.push({id: findField.id, name: findField.name});
            }
            if (!specialFieldListCanChoose) {
                return
            }
            specialFieldListCanChooseList[index] = specialFieldListCanChoose
        })
        // console.log('specialFieldListCanChooseList', specialFieldListCanChooseList)
        setFieldListCanChooseList([...specialFieldListCanChooseList])
    }, [arrayFields])

    useEffect(() => {
            const fetchData = async () => {
                if (!tableActive) {
                    return
                }
                const manager = AutoInputManager.getInstance(tableActive, fields, arrayFields);
                manager.updateFields(fields, arrayFields); // 更新字段
                manager.open(); // 开启监听
            };
            fetchData();
        }, [arrayFields]
    );

    const onSelectField = async (selectedId: any, index: number) => {
        setLoading(true)
        setLoadingContent('获取字段信息中')
        formApi.current.setValue(`field[${index}].defaultValue`, undefined);
        // console.log('selectedId', selectedId)
        const chosenField = fields?.find(({id}) => selectedId === id)!
        if (chosenField.iFieldMeta.type === FieldType.SingleSelect || chosenField.iFieldMeta.type === FieldType.MultiSelect) {
            // 如果已经存在 optionsList 则覆盖，只需修改字段对应的 option 即可，不用整个 optionList；若不存在，则新建
            // todo 考虑字段增减情况下的同步问题
            const tempOptionsList = optionsList || new Array(arrayFields.length)
            setOptionsList(undefined)
            const property = chosenField.iFieldMeta.property as ICommonSelectFieldProperty;
            const iSelectFieldOptions = property.options;
            // console.log("iSelectFieldOptions", iSelectFieldOptions);
            if (iSelectFieldOptions) {
                tempOptionsList[index] = iSelectFieldOptions;
            }
            setOptionsList([...tempOptionsList])
        }
        setLoading(false)
    }
    const onSelectTable = async (t: any) => {
        if (t === tableActive?.id) {
            console.log('已加载');
            return;
        }

        setLoading(true);
        setLoadingContent('获取表信息中')
        console.log('t', t)
        await fetchNewInfoWithTable(t)
        setLoading(false)
    }

    const clickFill = async (index: any) => {
        setLoading(true)
        setLoadingContent('正在填充...')
        const type = fields.find(({id}) => id === arrayFields[index].name)?.iFieldMeta.type as FieldType;
        const defaultValue = arrayFields[index].defaultValue;
        console.log('arrayFields', arrayFields[index])
        // console.log('type', type, defaultValue)
        // Toast.info(`正在填充默认值「${defaultValue}」`)
        const formatDefaultValue = getDefaultValue(defaultValue, type)
        if (!formatDefaultValue || !tableActive) {
            Toast.error('获取默认值失败')
            setLoading(false)
            return
        }
        await fillByIndex(tableActive, fields, arrayFields, index, formatDefaultValue);
        setLoading(false)
    }
    const clickFillAll = async () => {
        setLoading(true)
        setLoadingContent('正在填充...')
        for (let i = 0; i < arrayFields.length; i++) {
            await clickFill(i);
        }
        setLoading(false)
    }
    const clickAutoInputAll = async (opened: boolean) => {
        if (opened) {
            for (let i = 0; i < arrayFields.length; i++) {
                formApi.current.setValue(`field[${i}].autoInput`, true);
            }
        } else {
            for (let i = 0; i < arrayFields.length; i++) {
                formApi.current.setValue(`field[${i}].autoInput`, false);
            }
            // 关闭监听
            // @ts-ignore
            window.off && window.off.constructor === Function && window.off()
        }
    }
    const optionListRemove = (index: number) => {
        const tempOptionsList = optionsList
        if (tempOptionsList) {
            tempOptionsList.splice(index, 1);
            setOptionsList([...tempOptionsList])
        }
    }
    return (
        <Spin style={{height: '100vh'}} tip={loadingContent} size="large" spinning={loading}>
            <Form
                wrapperCol={{span: 10}}
                labelCol={{span: 50}}
                style={{width: 600}}
                labelPosition='top'
                // labelWidth='100px'
                allowEmpty
                getFormApi={(a: any) => formApi.current = a}
                onChange={(formState: any) => formApi.current.formState = formState}
                render={({formState, formApi, values}) => (
                    <>
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <Form.Select style={{width: 160}} onSelect={onSelectTable} label='Table' field="table">
                                {
                                    Array.isArray(tableList) && tableList.map(({id, name}) =>
                                        <Form.Select.Option key={id} value={id}
                                                            defaultValue={tableActive && tableActive.id}>{name}</Form.Select.Option>)
                                }
                            </Form.Select>
                        </div>

                        <ArrayField field='field' initValue={data}>
                            {({add, arrayFields, addWithInitValue}) => (
                                <React.Fragment>
                                    <Button onClick={() => {
                                        if (arrayFields.length < fieldListCanChooseList.length) {
                                            add();
                                        } else {
                                            Toast.error('字段数量已达上限')
                                        }
                                    }} icon={<IconPlusCircle/>} theme='light'
                                            style={{marginTop: 20}}>添加字段</Button>

                                    {
                                        arrayFields.map(({field, key, remove}, i) => {
                                            const tempFormStateValue = formState.values
                                            let fieldElement: any;
                                            let zField;
                                            if (tempFormStateValue.field) {
                                                fieldElement = tempFormStateValue.field[i];
                                            }
                                            if (fieldElement) {
                                                zField = fields.find(({id}) => id === fieldElement.name);
                                            }
                                            // console.log('zField', zField)
                                            return (
                                                <div key={key} style={{width: '100%', display: 'flex'}}>
                                                    <Form.Select
                                                        field={`${field}[name]`}
                                                        label={`字段名`}
                                                        style={{width: 160, marginRight: 20}}
                                                        onSelect={(selectedId) => onSelectField(selectedId, i)}
                                                    >
                                                        {
                                                            fieldListCanChooseList && fieldListCanChooseList[i] && fieldListCanChooseList[i].map(({
                                                                                                                                                      id,
                                                                                                                                                      name
                                                                                                                                                  }) =>
                                                                <Form.Select.Option
                                                                    key={id}
                                                                    value={id}>{name}</Form.Select.Option>)
                                                        }
                                                    </Form.Select>
                                                    {
                                                        fieldElement && zField ?
                                                            (
                                                                (() => {
                                                                    switch (zField.iFieldMeta.type) {
                                                                        case FieldType.SingleSelect:
                                                                            return (
                                                                                <Form.Select
                                                                                    field={`${field}[defaultValue]`}
                                                                                    label={`默认值`}
                                                                                    style={{width: 160}}
                                                                                    disabled={!optionsList || optionsList.length === 0}
                                                                                >
                                                                                    {
                                                                                        optionsList && optionsList[i] && optionsList[i].map(({
                                                                                                                                                 id,
                                                                                                                                                 name
                                                                                                                                             }) =>
                                                                                            <Form.Select.Option key={id}
                                                                                                                value={id}>{name || "null"}</Form.Select.Option>)
                                                                                    }
                                                                                </Form.Select>
                                                                            );
                                                                        case FieldType.MultiSelect:
                                                                            return (
                                                                                <Form.Select
                                                                                    field={`${field}[defaultValue]`}
                                                                                    multiple
                                                                                    // placeholder='请选择业务线'
                                                                                    label={`默认值`}
                                                                                    style={{width: 160}}
                                                                                    disabled={!optionsList || optionsList.length === 0}
                                                                                >
                                                                                    {
                                                                                        optionsList && optionsList[i] && optionsList[i].map(({
                                                                                                                                                 id,
                                                                                                                                                 name
                                                                                                                                             }) =>
                                                                                            <Form.Select.Option key={id}
                                                                                                                value={id}>{name || "null"}</Form.Select.Option>)
                                                                                    }
                                                                                </Form.Select>
                                                                            )
                                                                        // case FieldType.Checkbox:
                                                                        //     return(
                                                                        //         <Form.Checkbox
                                                                        //             value="false"
                                                                        //             field={`${field}[defaultValue]`}
                                                                        //             style={{width: 160, marginTop: 10}}
                                                                        //             label={`默认值`}
                                                                        //         />
                                                                        //     )
                                                                        case FieldType.Text:
                                                                        case FieldType.Number:
                                                                        case FieldType.Phone:

                                                                            return (
                                                                                <Form.Input
                                                                                    field={`${field}[defaultValue]`}
                                                                                    label={`默认值`}
                                                                                    style={{width: 160}}/>
                                                                            );
                                                                        default:
                                                                            // Toast.error("不支持此类型字段");
                                                                            return null
                                                                    }
                                                                })()
                                                            ) : null
                                                    }
                                                    <Button
                                                        theme="solid"
                                                        type="primary"
                                                        className="bt1"
                                                        onClick={() => clickFill(i)}
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
                                                    />
                                                    <Button
                                                        type='danger'
                                                        theme='borderless'
                                                        icon={<IconMinusCircle/>}
                                                        onClick={() => {
                                                            remove();
                                                            optionListRemove(i);
                                                        }}
                                                        style={{margin: 12, alignSelf: 'flex-end'}}
                                                    />
                                                </div>
                                            );
                                        })
                                    }
                                </React.Fragment>
                            )}
                        </ArrayField>

                        <div style={{display: 'flex', marginTop: 20}}>

                            <Button
                                onClick={clickFillAll}
                                style={{marginRight: 12, marginBottom: 20, alignSelf: 'flex-end'}}
                            >
                                {"批量填充"}
                            </Button>
                            <Form.Switch
                                field="autoInput"
                                labelPosition={"left"}
                                label={{text: '批量自动', width: '120%'}}
                                checkedText='开'
                                uncheckedText='关'
                                style={{marginRight: 12, marginBottom: 12, alignSelf: 'flex-end'}}
                                onChange={clickAutoInputAll}
                            />

                            <Button
                                type='danger'
                                onClick={fetchNewInfo}
                                style={{width: 100, marginRight: 12, marginBottom: 20, alignSelf: 'flex-end'}}
                            >
                                {"刷新数据"}
                            </Button>
                            <Button
                                type='danger'
                                htmlType="reset"
                                style={{marginRight: 12, marginBottom: 20, alignSelf: 'flex-end'}}
                            >重置</Button>
                        </div>
                        <ComponentUsingFormState/>

                    </>
                )}
            >

            </Form>
        </Spin>
    );
}

export default ArrayFieldForm;
