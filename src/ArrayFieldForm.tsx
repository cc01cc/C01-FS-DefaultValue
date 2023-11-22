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
import useTableFieldState from "./hooks/useTableFieldState";
import {
    bitable,
    FieldType,
    IField,
    IFieldMeta,
    IOpenCellValue,
    IOpenSingleSelect,
    ISelectFieldOption,
    ISingleSelectField,
    ITable
} from "@lark-base-open/js-sdk";
import {debounce} from 'lodash';
import {fillByIndex} from "./FillDefaultValue";
import {useTranslation} from "react-i18next";
import {fetchNewData, openAutoInputUtils} from "./utils/arrayFieldFormUtils";
import {FieldListInTable, ZTable} from "./type/type";

function ArrayFieldForm() {
    const {
        tableInfo,
        fieldInfo,
        setTableInfo,
        setFieldInfo,
    } = useTableFieldState();
    const {t} = useTranslation();
    const [key, setKey] = useState<string | number>(0);
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


    // 创建防抖函数
    const debouncedSetArrayFields = useCallback(debounce(setArrayFields, 5000), []);
    const debouncedSetFormStatus = useCallback(debounce(setFormStatus, 5000), []);

    /**
     * 监听表单变化
     */
    const ComponentUsingFormState = () => {
        const formState = useFormState();
        useEffect(() => {
            debouncedSetArrayFields([...(formState.values.field || [])]);
        }, [formState.values.field]);
        debouncedSetFormStatus(formState);
        if (formState.values.table && tableInfo && tableInfo.table && Object.keys(tableInfo.table).length !== 0) {
            // 将表单状态保存到本地
            localStorage.setItem('formStatus', JSON.stringify(formStatus));
            console.log('tableInfo ComponentUsingFormState', tableInfo)
            console.log('tableInfo table', tableInfo.table, tableInfo.table === undefined, tableInfo.table === null,)
            localStorage.setItem('fieldInfo', JSON.stringify(fieldInfo));
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

        async function init() {
            // 刷新时添加加载状态
            setLoading(true)
            setLoadingContent('获取数据中')

            // todo 更改表格选项后记得更新 tableActive 等信息
            const newData = await fetchNewData();
            setTableActive(newData.tableActive);
            setTableList(newData.tableList);
            setFieldListInTable(newData.fieldListInTable);
        }

        init().catch((e) => {
            Toast.error('table.err')
            console.error(e)
        });
    }, []);
    useEffect(() => {
        if (loading) {
            setLoading(false);
        }
        console.log('new fieldListInTable', fieldListInTable);
    }, [fieldListInTable]);

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
        const newData = await fetchNewData();
        setTableActive(newData.tableActive);
        setTableList(newData.tableList);
        setFieldListInTable(newData.fieldListInTable);

        // 初始化可选字段数组列表，数组长度为表字段数量，初始时，每个元素包含所有字段
        const fields = fieldListInTable?.fields;
        console.log('fields', fields)
        const fill = new Array(fields?.length).fill(fields?.map(({name, id}) => ({name, id})));
        setFieldListCanChooseList(fill)
        setLoading(false)
    }

    /**
     * 复用上一次的记录
     */
    const useLastRecord = () => {

    }

    /**
     * 监听数组字段变化，更新可选字段列表
     */
    useEffect(() => {
        // 1. 遍历 arrayFields，获取每个字段的 id
        // 2. 遍历 fieldInfo.fieldMetaList，生成 tempFieldListCanChoose
        // 3. 将 tempFieldListCanChoose 赋值给对应的 tempFieldListCanChooseList 的元素
        // 4. 将 tempFieldListCanChooseList 赋值给 fieldListCanChooseList
        const tempFieldListCanChoose = fieldInfo?.fieldMetaList.filter(({id}) => {
                for (let i = 0; i < arrayFields.length; i++) {
                    const field = arrayFields[i].name;
                    if (!field) {
                        // console.log(i, 'field is undefined')
                        continue;
                    }
                    // 将当前字段的 id 加入 tempFieldListCanChoose
                    if (!fieldInfo) {
                        Toast.error('获取字段信息失败')
                        return;
                    }
                    if (id === field) {
                        return false;
                    }
                }
                return true;
            }
        ).map(({id, name}) => ({id, name}));
        const specialFieldListCanChooseList = new Array(fieldInfo?.fieldMetaList.length).fill(fieldInfo?.fieldMetaList.map(({name, id}) => ({name, id})));
        // 将已经选择的字段添加到各自的候选框中
        arrayFields.forEach((field, index) => {
            let specialFieldListCanChoose = tempFieldListCanChoose ? [...tempFieldListCanChoose] : [];
            const findField = fieldInfo?.fieldMetaList.find(({id}) => id === field.name);
            if (findField && findField.id && findField.name) {
                specialFieldListCanChoose?.push({id: findField.id, name: findField.name});
            }
            if (!specialFieldListCanChoose) {
                return
            }
            specialFieldListCanChooseList[index] = specialFieldListCanChoose
        })
        setFieldListCanChooseList([...specialFieldListCanChooseList])
    }, [arrayFields])

    useEffect(() => {
        const fetchData = async () => {
            if (!tableInfo || !fieldInfo) {
                return;
            }
            await openAutoInputUtils(tableInfo, fieldInfo, arrayFields);
        };

        fetchData();
    }, [arrayFields]);


    const onSelectField = async (selectedId: any, index: number) => {
        setLoading(true)
        setLoadingContent('获取字段信息中')
        setOptionsList(undefined)
        // console.log('selectedId', selectedId)
        const {fieldMetaList} = fieldInfo!
        const chosenFieldMeta = fieldMetaList.find(({id}) => selectedId === id)!
        const tempOptionsList = optionsList || new Array(fieldMetaList.length)
        if (chosenFieldMeta.type === FieldType.SingleSelect) {
            // getOptions(fieldInfo).then(setOptions);
            const singleSelectField = await tableInfo?.table.getField<ISingleSelectField>(chosenFieldMeta.id as string);
            const iSelectFieldOptions = await singleSelectField?.getOptions();
            // console.log("iSelectFieldOptions", iSelectFieldOptions);
            if (iSelectFieldOptions) {
                tempOptionsList[index] = iSelectFieldOptions;
            }
        }
        setOptionsList([...tempOptionsList])
        setLoading(false)
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
        setFieldListCanChooseList(fill)
        // localStorage.setItem('tableInfo', JSON.stringify(tableInfo));
        // console.log('tableInfoJSON',JSON.stringify(tableInfo))
        // console.log('get local tableInfo', localStorage.getItem('tableInfo'))
        setLoading(false)
        // console.log('tableInfo', tableInfo)
        // console.log('tableInfo.table', tableInfo.table.id)
    }
    const clickFill = async (index: any) => {
        const defaultValue = await getCellValue(optionsList, arrayFields, index, fieldInfo, setLoading, t) as IOpenCellValue
        if (!defaultValue) {
            Toast.error('获取默认值失败')
            return
        }
        await fillByIndex(tableInfo, fieldInfo, arrayFields, index, defaultValue);

    }
    /**
     * 开启自动填充
     * 1. 若 opened 为 true 将字段添加到监听对象并开启自动填充
     * 2. 若 opened 为 false 将字段移除监听对象列表
     * @param opened
     * @param index
     */
    const openAutoInput = async (opened: boolean, index: number) => {
        // await openAutoInputUtils(tableInfo, arrayFields)
        // console.log("opened", opened);
        // if (opened) {
        //     const defaultValue = await getCellValue(optionsList, arrayFields, index, fieldInfo, setLoading, t) as IOpenCellValue
        //     console.log("defaultValue", defaultValue);
        //     // @ts-ignore
        //     window.off && window.off.constructor === Function && window.off()
        //     if (!fieldInfo) {
        //         Toast.error('获取字段信息失败')
        //         return
        //     }
        //     const field = fieldInfo.fieldList.find((field) => field.id === arrayFields[index].name)
        //     if (!field) {
        //         const {t} = useTranslation();
        //         Toast.error(t('field.choose'));
        //         return;
        //     }
        //     const fieldId = field.id;
        //     // @ts-ignore
        //     window.off = tableInfo.table.onRecordAdd(async (ev) => {
        //         const recordList = ev.data;
        //         console.log("recordList", recordList);
        //         const toSetTask = recordList.map((recordId) => ({
        //             recordId,
        //             fields: {
        //                 [fieldId]: defaultValue,
        //             }
        //         }));
        //         console.log("toSetRecord", toSetTask);
        //         await Utils.setRecords(toSetTask, tableInfo);
        //     })
        // } else {
        //     // 关闭监听
        //     // @ts-ignore
        //     window.off && window.off.constructor === Function && window.off()
        // }
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
                    <Form.Select style={{width: 200}} onSelect={onSelectTable} label='Table' field="table">
                        {
                            Array.isArray(tableList) && tableList.map(({id, name}) =>
                                <Form.Select.Option key={id} value={id}
                                                    defaultValue={tableActive && tableActive.id}>{name}</Form.Select.Option>)
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
                            <Button onClick={() => {
                                if (arrayFields.length < fieldListCanChooseList.length) {
                                    add();
                                } else {
                                    Toast.error('字段数量已达上限')
                                }
                            }} icon={<IconPlusCircle/>} theme='light'>添加字段</Button>
                            {
                                arrayFields.map(({field, key, remove}, i) => (
                                    <div key={key} style={{width: '100%', display: 'flex'}}>
                                        <Form.Select
                                            field={`${field}[name]`}
                                            label={`字段名`}
                                            style={{width: 120, marginRight: 20}}
                                            onSelect={(selectedId) => onSelectField(selectedId, i)}
                                        >
                                            {
                                                fieldListCanChooseList && fieldListCanChooseList[i] && fieldListCanChooseList[i].map(({id, name}) =>
                                                    <Form.Select.Option
                                                        key={id}
                                                        value={id}>{name}</Form.Select.Option>)
                                            }
                                        </Form.Select>
                                        <Form.Select
                                            field={`${field}[defaultValue]`}
                                            label={`默认值`}
                                            style={{width: 120}}
                                            // onChange={onSelectOption}
                                            disabled={!optionsList || optionsList.length === 0}
                                        >
                                            {
                                                optionsList && optionsList[i] && optionsList[i].map(({id, name}) =>
                                                    <Form.Select.Option key={id}
                                                                        value={id}>{name || "null"}</Form.Select.Option>)
                                            }
                                        </Form.Select>
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
                                            onChange={(opened) => openAutoInput(opened, i)}
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

// 不同类型的单元格，获取属于它们对应的单元格的值
const getCellValue = async (optionsList: ISelectFieldOption[][] | undefined, arrayFields: any, index: number, fieldInfo: {
    field: IField | undefined;
    fieldMeta: IFieldMeta | undefined;
    fieldList: IField[];
    fieldMetaList: IFieldMeta[]
} | undefined, setLoading: any, t: any) => {
    if (!optionsList) {
        Toast.error('请先获取选项')
        return
    }
    const type = fieldInfo?.fieldMetaList.find(({id}) => id === arrayFields[index].name)?.type
    if (!type) {
        Toast.error('获取字段类型失败')
        return
    }

    const option = arrayFields[index].defaultValue;
    console.log('arrayFields', arrayFields)
    if (!option || !optionsList[index] || !optionsList[index].some(option => option)) {
        Toast.error(t('option.error'));
        return;
    }
    let value = null;
    setLoading(true);
    console.log('option', option)
    switch (type) {
        // TODO 支持更多类型
        // case FieldType.Number:
        // case FieldType.Rating:
        // case FieldType.Currency:
        // case FieldType.Text:
        //   // console.log('number', restFormValue)
        //   value = getRandom({ max, min, ...restFormValue })
        //   break;
        // case FieldType.Text:
        //   console.log('text', restFormValue)
        //   value = [{type: IOpenSegmentType.Text, text: String(getRandom({max, min, ...restFormValue}))}]
        //   break;
        case FieldType.SingleSelect:
            value = {id: option, text: ""} as IOpenSingleSelect
            break;
        default:
            break;
    }
    setLoading(false);
    console.log('value', value)
    return value;
}