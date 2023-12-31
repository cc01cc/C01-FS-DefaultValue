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

import {
    bitable,
    FieldType,
    IField,
    IFieldMeta,
    IFieldMeta as FieldMeta,
    ISelectFieldOption,
    ISingleSelectField,
    ITable,
    ITableMeta
} from "@lark-base-open/js-sdk";
import {RefObject, useEffect, useMemo, useRef, useState} from "react";
import {Button, Col, Form, Row, Spin, Toast} from "@douyinfe/semi-ui";
import {useTranslation} from 'react-i18next';
import {fill} from "./utils/FillDefaultValue";
import {Utils} from "./utils/Utils";
import ArrayFieldForm from "./components/ArrayFieldForm";

/** 支持填入默认值的字段 */
const f = [FieldType.SingleSelect]
/** 表格，字段变化的时候刷新插件 */
export default function Ap() {
    const [key, setKey] = useState<string | number>(0);
    const [tableList, setTableList] = useState<ITable[]>([])
    // 绑定过的tableId
    const bindList = useRef<Set<string>>(new Set())

    const refresh = useMemo(() => (() => {
        const t = new Date().getTime();
        setKey(t)
    }), [])

    useEffect(() => {
        bitable.base.getTableList().then((list) => {
            setTableList(list);
        });
        const deleteOff = bitable.base.onTableDelete(() => {
            setKey(new Date().getTime())
        });
        const addOff = bitable.base.onTableAdd(() => {
            setKey(new Date().getTime())
            bitable.base.getTableList().then((list) => {
                setTableList(list);
            });
        });
        return () => {
            deleteOff();
            addOff();
        }
    }, [])

    useEffect(() => {
        if (tableList.length) {
            tableList.forEach((table) => {
                if (bindList.current.has(table.id)) {
                    return
                }
                table.onFieldAdd(refresh);
                table.onFieldDelete(refresh);
                table.onFieldModify(refresh);
                bindList.current.add(table.id)
            })
        }
    }, [tableList])


    // return <InputDefaultValue key={key}></InputDefaultValue>
    return <ArrayFieldForm></ArrayFieldForm>
}

function InputDefaultValue() {
    const {t} = useTranslation();
    const [loading, setLoading] = useState(false)
    const [loadingContent, setLoadingContent] = useState('')
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
    const formApi = useRef<any>()


    useEffect(() => {
        async function init() {
            const selection = await bitable.base.getSelection();
            console.log("selection", selection);
            if (selection.tableId) {
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

                const fieldMetaList = await tableRes.getFieldMetaList();
                const fieldList = await tableRes.getFieldList();
                setFieldInfo({
                    fieldList,
                    fieldMetaList,
                    field: undefined,
                    fieldMeta: undefined
                })
            }
        }

        init().catch((e) => {
            Toast.error(t('table.err'))
            console.error(e)
        });
    }, [])


    /** chosenField */
    const onSelectTable = async (t: any) => {
        if (tableInfo) {
            // 单选
            setLoading(true)
            const {tableList, tableMetaList} = tableInfo
            const choosedTable = tableList.find(({id}) => id === t)!;
            const choosedTableMeta = tableMetaList.find(({id}) => id === t)!;
            setTableInfo({
                ...tableInfo,
                table: choosedTable,
                tableMeta: choosedTableMeta
            });
            const [fieldMetaList, fieldList] = await Promise.all([choosedTable.getFieldMetaList(), choosedTable.getFieldList()])

            setFieldInfo({
                fieldList,
                fieldMetaList,
                field: undefined,
                fieldMeta: undefined
            });
            setLoading(false)
            formApi.current.setValues({
                table: choosedTable.id
            })
        }
        console.log("tableInfo", tableInfo);
    }
    const onSelectField = async (f: any) => {
        setOptions(undefined);
        if (!tableInfo?.table) {
            Toast.error(t('table.choose'));
            return;
        } else {
            const {fieldMetaList, fieldList} = fieldInfo!
            const chosenField = fieldList.find(({id}) => f === id)!
            const chosenFieldMeta = fieldMetaList.find(({id}) => f === id)!;
            setFieldInfo({
                ...fieldInfo,
                field: chosenField,
                fieldMeta: chosenFieldMeta
            } as any)
            console.log("fieldInfo", fieldInfo);
            console.log("chosenField", chosenField);
            if (chosenFieldMeta.type === FieldType.SingleSelect) {
                // getOptions(fieldInfo).then(setOptions);
                const singleSelectField = await tableInfo.table.getField<ISingleSelectField>(chosenFieldMeta.id as string);
                const iSelectFieldOptions = await singleSelectField?.getOptions();
                console.log("iSelectFieldOptions", iSelectFieldOptions);
                if (iSelectFieldOptions) {
                    setOptions(iSelectFieldOptions);
                }
            } else {
                setOptions(undefined);
            }
        }
    }
    const onSelectOption = async () => {
        // 关闭开关
        formApi.current.setValue('autoInput', false);
        await openAutoInput(false);
    }
    const clickFill = async (f: any) => {
        const defaultValue = await getCellValue(options, formApi, setLoading, fieldInfo, t)

        await fill(tableInfo, fieldInfo, defaultValue);
    }
    const openAutoInput = async (v: boolean) => {
        console.log("v", v);
        if (v) {
            const defaultValue = await getCellValue(options, formApi, setLoading, fieldInfo, t)
            // @ts-ignore
            window.off && window.off.constructor === Function && window.off()
            if (!fieldInfo || !fieldInfo.field) {
                console.error("error")
                return;
            }
            const fieldId = fieldInfo.field.id;
            // @ts-ignore
            window.off = tableInfo.table.onRecordAdd(async (ev) => {
                const recordList = ev.data;
                console.log("recordList", recordList);
                const toSetTask = recordList.map((recordId) => ({
                    recordId,
                    fields: {
                        [fieldId]: defaultValue,
                    }
                }));
                console.log("toSetRecord", toSetTask);
                console.log("toSeask", toSetTask);
                await Utils.setRecords(toSetTask, tableInfo);
            })
        } else {
            // 关闭监听
            // @ts-ignore
            window.off && window.off.constructor === Function && window.off()
        }
    }

    const fieldMetas = (Array.isArray(fieldInfo?.fieldMetaList) &&
        // 等待切换table的时候，拿到正确的fieldList
        fieldInfo?.fieldList[0]?.tableId === tableInfo?.table.id &&
        fieldInfo?.fieldMetaList.filter(({type: _type}) => {
            return f.includes(_type);
        })) || [];


    return <div>
        <Spin style={{height: '100vh'}} tip={loadingContent} size="large" spinning={loading}>
            <div>{t('table.info')}</div>
            <Form wrapperCol={{span: 17}}
                  labelPosition='left'
                  labelAlign='right'
                  labelCol={{span: 6}}
                  getFormApi={(e: any) => formApi.current = e}>


                <Form.Select style={{width: '100%'}} onChange={onSelectTable} label='Table' field="table">
                    {
                        Array.isArray(tableInfo?.tableMetaList) && tableInfo?.tableMetaList.map(({id, name}) =>
                            <Form.Select.Option key={id} value={id}>{name}</Form.Select.Option>)
                    }
                </Form.Select>
                <Form.Select style={{width: '100%'}} onChange={onSelectField} label={t('label.field')} field="field">
                    {
                        fieldMetas.map(({id, name}) => <Form.Select.Option key={id}
                                                                           value={id}>{name}</Form.Select.Option>)
                    }
                </Form.Select>
                <Form.Select style={{width: '100%'}} label={t('label.option')} onChange={onSelectOption} field="option"
                             disabled={!options || options.length === 0}>
                    {
                        options?.map(({id, name}) => <Form.Select.Option key={id}
                                                                         value={id}>{name || "null"}</Form.Select.Option>)
                    }
                </Form.Select>

                <Row>
                    <Col span={6}></Col>
                    <Col span={10}>
                        <Button theme="solid" type="primary" className="bt1" onClick={clickFill}>
                            {t('fill.btn')}
                        </Button>
                    </Col>
                </Row>
                <Row>
                    <Col span={300}>
                        <Form.Switch field="autoInput" label={{text: '自动填充新记录', width: '100%'}} checkedText='开'
                                     uncheckedText='关' onChange={(v) => openAutoInput(v)}/>
                    </Col>
                </Row>
            </Form>
        </Spin>
    </div>
}

// 不同类型的单元格，获取属于它们对应的单元格的值
const getCellValue = async (options: ISelectFieldOption[] | undefined, formApi: RefObject<any>, setLoading: any, fieldInfo: {
    field: IField | undefined;
    fieldMeta: IFieldMeta | undefined;
    fieldList: IField[];
    fieldMetaList: IFieldMeta[]
} | undefined, t: any) => {
    const {option} = formApi.current.getValues();
    console.log("option", option);

    if (!option || !options || !options.some(option => option)) {
        Toast.error(t('option.error'));
        return;
    }
    let value = null;
    setLoading(true);
    switch (fieldInfo?.fieldMeta?.type) {
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
            value = {id: option, text: ""}
            break;
        default:
            break;
    }
    setLoading(false);
    return value;
}
