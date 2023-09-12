import { IFieldMeta as FieldMeta, IWidgetField, IWidgetTable, TableMeta, bitable, FieldType, IOpenSegmentType } from "@lark-base-open/js-sdk";
import { useEffect, useState, useRef, useMemo } from "react";
import { Form, Toast, Spin, Col, Row, Button, Tooltip } from "@douyinfe/semi-ui";
import { useTranslation } from 'react-i18next';
import { IconHelpCircle } from '@douyinfe/semi-icons';



/** 支持填入随机数的字段 */
const f = [FieldType.Number, FieldType.Rating, FieldType.Currency, FieldType.Text]
/** 表格，字段变化的时候刷新插件 */
export default function Ap() {
  const [key, setKey] = useState<string | number>(0);
  const [tableList, setTableList] = useState<IWidgetTable[]>([])
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


  return <Randomize key={key}></Randomize>
}

/** 随机字符串支持的字段 */
const randomChartsSupportField = [FieldType.Text]

function Randomize() {
  const { t } = useTranslation();
  const [type, setType] = useState('number')
  const [loading, setLoading] = useState(false)
  const [loadingContent, setLoadingContent] = useState('')
  const [tableInfo, setTableInfo] = useState<{
    /** 当前所选的table,默认为打开插件时的table */
    table: IWidgetTable,
    /** 当前所选table的元信息 */
    tableMeta: TableMeta
    /** 所有的table元信息 */
    tableMetaList: TableMeta[],
    /** 所有table的实例 */
    tableList: IWidgetTable[]
  }>();
  const [fieldInfo, setFieldInfo] = useState<{
    /**当前所选field的实例 */
    field: IWidgetField | undefined
    /** 当前所选field的元信息 */
    fieldMeta: FieldMeta | undefined
    /** tableInfo.table的所有field实例 */
    fieldList: IWidgetField[],
    /** tableInfo.table的所有field元信息 */
    fieldMetaList: FieldMeta[]
  }>()

  const formApi = useRef<any>()

  useEffect(() => {
    async function init() {
      const selection = await bitable.base.getSelection();
      if (selection.tableId) {
        const [tableRes, tableMetaListRes, tableListRes] = await Promise.all([
          bitable.base.getTableById(selection.tableId),
          bitable.base.getTableMetaList(),
          bitable.base.getTableList()
        ])
        setTableInfo({
          table: tableRes,
          tableMeta: tableMetaListRes.find(({ id }) => tableRes.id === id)!,
          tableMetaList: tableMetaListRes.filter(({ name }) => name),
          tableList: tableListRes
        });
        // 清空其他选项
        formApi.current.setValues({
          'table': tableRes.id,
          'type': type,
          'minLength': 11,
          'maxLength': 11,
          'chartsRange': '0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM!@#$%^&*()-+',
          'excludeWords': `["Oo0","iIlL1"]`
        })

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


  /** 选择table的时候更新tableInfo和fieldInfo */
  const onSelectTable = async (t: any) => {
    if (tableInfo) {
      // 单选
      setLoading(true)
      const { tableList, tableMetaList } = tableInfo
      const choosedTable = tableList.find(({ id }) => id === t)!;
      const choosedTableMeta = tableMetaList.find(({ id }) => id === t)!;
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
  }

  const onSelectField = (f: any) => {
    if (!tableInfo?.table) {
      Toast.error(t('table.choose'));
      return;
    } else {
      const { fieldMetaList, fieldList } = fieldInfo!
      const choosedField = fieldList.find(({ id }) => f === id)!
      const choosedFieldMeta = fieldMetaList.find(({ id }) => f === id)!;
      setFieldInfo({
        ...fieldInfo,
        field: choosedField,
        fieldMeta: choosedFieldMeta
      } as any)
    }
  }

  const fieldMetas = (Array.isArray(fieldInfo?.fieldMetaList) &&
    // 等待切换table的时候，拿到正确的fieldList
    fieldInfo?.fieldList[0]?.tableId === tableInfo?.table.id &&
    fieldInfo?.fieldMetaList.filter(({ type: _type }) => {
      if (type === 'number') return f.includes(_type);
      if (type === 'charts') return randomChartsSupportField.includes(_type)
    })) || [];

  const fill = async () => {
    if (!fieldInfo?.field) {
      Toast.error(t('field.choose'));
      return;
    }
    const { max, min, useInt, type, ...restFormValue } = formApi.current.getValues();


    // 定长度
    restFormValue.minLength = restFormValue.maxLength


    if (type === 'number') {
      if (max === undefined || min === undefined) {
        Toast.error(t('value.choose'));
        return;
      }
    }
    if (type === 'charts') {
      if (restFormValue.maxLength === undefined || restFormValue.minLength === undefined) {
        Toast.error(t('value.choose'));
        return;
      }
      if (restFormValue.chartsRange === undefined) {
        Toast.error(t("charts.not.empty"));
        return;
      }
      try {
        const newValue = JSON.parse(String(restFormValue.chartsRange))
        restFormValue.chartsRange = typeof newValue === 'number' ? String(newValue) : newValue
      } catch (error) {
        console.error(error)
      }
      try {
        if (restFormValue.excludeWords) {
          restFormValue.excludeWords = JSON.parse(restFormValue.excludeWords)
        }
      } catch (error) {
        Toast.error('排除字段必须为数组')
        return;
      }
    }

    let getRandom: any = getRandomFloat
    if (useInt) {
      getRandom = getRandomInt
    }
    if (type === 'charts') {
      getRandom = randomCharts
    }
    // 不同类型的单元格，获取属于它们对应的单元格的值
    let getCellValue: () => any = () => null;

    setLoading(true);
    switch (fieldInfo?.fieldMeta?.type) {
      case FieldType.Number:
      case FieldType.Rating:
      case FieldType.Currency:
        getCellValue = () => getRandom({ max, min, ...restFormValue })
        break;
      case FieldType.Text:
        getCellValue = () => ([{ type: IOpenSegmentType.Text, text: String(getRandom({ max, min, ...restFormValue })) }])
        break;
      default:
        break;
    }

    /** 空的单元格行id */
    const recordIdList = new Set((await tableInfo?.table.getRecordIdList()));
    const fieldValueList = (await fieldInfo.field.getFieldValueList()).map(({ record_id }) => record_id);
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
    const sleep = 500
    for (let index = 0; index < toSetTask.length; index += step) {
      const element = toSetTask.slice(index, index + step);
      await tableInfo?.table.setRecords(element).then(() => {
        successCount += element.length;
        setLoadingContent(t('success.num', { num: successCount }))
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
    <Spin style={{ height: '100vh' }} tip={loadingContent} size="large" spinning={loading}>
      <div>{t('table.info')}</div>
      <Form wrapperCol={{ span: 17 }}
        labelPosition='left'
        labelAlign='right'
        labelCol={{ span: 6 }}
        getFormApi={(e: any) => formApi.current = e}>
        <Form.Select style={{ width: '100%' }} label={t('choose.mode')} field="type"
          onChange={(v) => {
            setType(v as any);
            formApi.current.setValue('field', undefined);
            setFieldInfo({
              ...fieldInfo,
              field: undefined,
              fieldMeta: undefined
            } as any)
          }}>
          <Form.Select.Option value={'number'}>{t("number.mode")}</Form.Select.Option>
          <Form.Select.Option value={'charts'}>{t("password.mode")}</Form.Select.Option>
        </Form.Select>

        <Form.Select style={{ width: '100%' }} onChange={onSelectTable} label='Table' field="table">
          {
            Array.isArray(tableInfo?.tableMetaList) && tableInfo?.tableMetaList.map(({ id, name }) => <Form.Select.Option key={id} value={id}>{name}</Form.Select.Option>)
          }
        </Form.Select>
        <Form.Select style={{ width: '100%' }} onChange={onSelectField} label={t('label.field')} field="field">
          {
            fieldMetas.map(({ id, name }) => <Form.Select.Option key={id} value={id}>{name}</Form.Select.Option>)
          }
        </Form.Select>

        {type === 'number' && <>
          <Form.Input style={{ width: '100%' }} type="Number" label={t('label.max')} field="max">
          </Form.Input>
          <Form.Input style={{ width: '100%' }} type="Number" label={t('label.min')} field="min">
          </Form.Input>
        </>}
        {<div style={{ display: type === 'charts' ? 'block' : 'none' }}>
          <Form.InputNumber max={100} min={4} style={{ width: '100%' }} type="Number" label={t("max.length.3")} field="maxLength">
          </Form.InputNumber>
          {/* 
                    <Form.InputNumber min={4} style={{ width: '100%' }} type="Number" label={t('长度最小值')} field="minLength">
                    </Form.InputNumber>
                    */}
          <Form.TextArea
            spellCheck="false"
            label={{
              text: t("chart.random"),
              extra: <Tooltip content={<p style={{ whiteSpace: 'pre-wrap' }}>{t("chart.random.extra")}</p>}><IconHelpCircle style={{ color: 'var(--semi-color-text-2)' }} /></Tooltip>
            }}
            field="chartsRange">

          </Form.TextArea>
          {/* 
                    <Form.TextArea
                        spellCheck="false"
                        label={{
                            text: '排除掉某些词',
                            extra: <Tooltip content={<p style={{ whiteSpace: 'pre-wrap' }}>{`格式如 ["abc","123"] \n随机值包含本字段数组中某个元素的时候，该随机值将会重新生成；为避免陷入死循环，尝试5次失败后，随机值将为空。\n使用数组的时候注意切换到英文的逗号`}</p>}><IconHelpCircle style={{ color: 'var(--semi-color-text-2)' }} /></Tooltip>
                        }}
                        field="excludeWords">
                    </Form.TextArea> 
                    */}
        </div>}
        {type === 'number' && <Form.Checkbox
          label={
            <div
              style={{
                marginTop: '-6px'
              }}
            >
              {t('fill.btn')}
            </div>
          } field="useInt">

        </Form.Checkbox>}
        <Row>
          <Col span={6}></Col>
          <Col span={18}>
            <Button theme="solid" type="primary" className="bt1" onClick={fill}>
              {t('fill.btn2')}
            </Button>
          </Col>
        </Row>
      </Form>
    </Spin>
  </div>
}

function getRandomFloat({ min, max }: { min: number, max: number }) {
  const _max = Math.max(min, max);
  const _min = Math.min(min, max)
  return Math.random() * (_max - _min) + _min;
}

function getRandomInt({ min, max }: { min: number, max: number }) {
  const _max = Math.max(min, max);
  const _min = Math.min(min, max)
  min = Math.ceil(_min);
  max = Math.floor(_max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


/** 从chartsRange中生成一个随机字符串
 * 当chartsRange是一个数组的时候，该随机字符串由maxLengh - minLength 个数组单元组成
 * 当chartsRange是一个字符串的时候，该随机字符串由maxLength - minLength个字符串组成
 * 当生成的字符串包含excludeWords中的元素时，重新生成字符串，最多重试5次；如果5次之后依然还是重复的，则返回null
 */
function randomCharts({
  maxLength,
  minLength,
  chartsRange,
  excludeWords
}: {
  maxLength: number,
  minLength: number,
  chartsRange: string | string[],
  excludeWords: string[]
}) {
  /** 生成的字符串的长度/数组单元个数 */
  const strLength = maxLength === minLength ? maxLength : getRandomInt({ max: maxLength, min: minLength });
  const chartsRangeLength = chartsRange.length - 1
  let str = ''
  for (let index = 0; index < strLength; index++) {
    let addWord = chartsRange[getRandomInt({ max: chartsRangeLength, min: 0 })];
    let hasExcludedWords = false;

    if (Array.isArray(excludeWords) && excludeWords.length) {
      for (let i = 0; i < 5; i++) { // 5次重试
        const index = getRandomInt({ max: chartsRangeLength, min: 0 })
        addWord = chartsRange[index];
        if (excludeWords.some((v) => (str + addWord).includes(v))) {
          hasExcludedWords = true;
        } else {
          hasExcludedWords = false;
          break;
        }
      }
      if (hasExcludedWords) {
        return null;
      }
    }
    str += addWord

  }
  return str || null
}
