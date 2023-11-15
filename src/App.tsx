import {
    IFieldMeta as FieldMeta,
    ITableMeta,
    bitable,
    FieldType,
    ISingleSelectField, IField, ITable, ISelectFieldOption
} from "@lark-base-open/js-sdk";
import {useEffect, useState, useRef, useMemo} from "react";
import {Form, Toast, Spin, Col, Row, Button} from "@douyinfe/semi-ui";
import {useTranslation} from 'react-i18next';

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


    return <InputDefaultValue key={key}></InputDefaultValue>
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

    const fieldMetas = (Array.isArray(fieldInfo?.fieldMetaList) &&
        // 等待切换table的时候，拿到正确的fieldList
        fieldInfo?.fieldList[0]?.tableId === tableInfo?.table.id &&
        fieldInfo?.fieldMetaList.filter(({type: _type}) => {
            return f.includes(_type);
        })) || [];

    const fill = async () => {
        if (!fieldInfo?.field) {
            Toast.error(t('field.choose'));
            return;
        }
        const {option} = formApi.current.getValues();
        console.log("option", option);

        if (!option || !options || !options.some(option => option)) {
            Toast.error(t('option.error'));
            return;
        }

        // 不同类型的单元格，获取属于它们对应的单元格的值
        let getCellValue: () => any = () => null;
        setLoading(true);
        switch (fieldInfo?.fieldMeta?.type) {
            // case FieldType.Number:
            // case FieldType.Rating:
            // case FieldType.Currency:
            // case FieldType.Text:
            //   // console.log('number', restFormValue)
            //   getCellValue = () => getRandom({ max, min, ...restFormValue })
            //   break;
            // case FieldType.Text:
            //   console.log('text', restFormValue)
            //   getCellValue = () => ([{type: IOpenSegmentType.Text, text: String(getRandom({max, min, ...restFormValue}))}])
            //   break;
            case FieldType.SingleSelect:
                // TODO
                getCellValue = () => ({id: option, text: ""})
                break;
            default:
                break;
        }

        /** 空的单元格行id */
        const recordIdList = new Set((await tableInfo?.table.getRecordIdList()));
        const fieldValueList = (await fieldInfo.field.getFieldValueList()).map(({record_id}) => record_id);
        const fieldId = fieldInfo.field.id;
        fieldValueList.forEach((id) => {
            recordIdList.delete(id!)
        })

        const toSetTask = [...recordIdList].map((recordId) => ({
            recordId,
            fields: {
                [fieldId]: getCellValue(),
            }
        }))

        let successCount = 0;
        const step = 500;
        for (let index = 0; index < toSetTask.length; index += step) {
            Toast.info(t(toSetTask.length))
            const element = toSetTask.slice(index, index + step);
            const sleep = element.length

            await tableInfo?.table.setRecords(element).then(() => {
                successCount += element.length;
                setLoadingContent(t('success.num', {num: successCount}))
            }).catch((e) => {
                console.error(e)
            });
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve('')
                }, sleep);
            })
        }

        setLoading(false)
        setLoadingContent('')
    }

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
                <Form.Select style={{ width: '100%' }} label={t('label.option')} field="option" disabled={!options || options.length === 0} >
                    {
                        options?.map(({ id, name }) => <Form.Select.Option key={id} value={id}>{name || "null"}</Form.Select.Option>)
                    }
                </Form.Select>

                <Row>
                    <Col span={6}></Col>
                    <Col span={18}>
                        <Button theme="solid" type="primary" className="bt1" onClick={fill}>
                            {t('fill.btn')}
                        </Button>
                    </Col>
                </Row>
            </Form>
        </Spin>
    </div>
}
