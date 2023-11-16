/*
 * Copyright 2023 cc01cc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Toast} from "@douyinfe/semi-ui";
import {FieldType, IField, IFieldMeta, ISelectFieldOption, ITable, ITableMeta} from "@lark-base-open/js-sdk";

const fill = async (tableInfo: {
                        table: ITable;
                        tableMeta: ITableMeta;
                        tableMetaList: ITableMeta[];
                        tableList: ITable[]
                    } | undefined,
                    fieldInfo: {
                        field: IField | undefined;
                        fieldMeta: IFieldMeta | undefined;
                        fieldList: IField[];
                        fieldMetaList: IFieldMeta[]
                    } | undefined,
                    options: ISelectFieldOption[] | undefined,
                    formApi: any,
                    setLoading: any,
                    setLoadingContent: any,
                    t: any) => {
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
export default fill;