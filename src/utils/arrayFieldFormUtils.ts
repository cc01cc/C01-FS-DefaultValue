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

// 全局变量，存储正在监听的字段
import {FieldInfoType, FieldListInTable, TableInfoType, ZTable} from "../type/type";
import {Utils} from "../Utils";
import {bitable, FieldType, IOpenCellValue, IOpenSingleSelect, IRecord} from "@lark-base-open/js-sdk";

/**
 * 自动填充
 * 1. 从 arrayFields 获取字段信息，以及每个字段自动填充的开启状态
 * 2. 若开启，则放入自动填充列表（因为实时刷新，所以不需要考虑关闭）
 * @param tableInfo
 * @param fieldInfo
 * @param arrayFields
 */
export const openAutoInputUtils = async (tableInfo: TableInfoType | undefined, fieldInfo: FieldInfoType, arrayFields: any[]) => {
    // 关闭监听
    // @ts-ignore
    window.off && window.off.constructor === Function && window.off()

    let fieldIdList: string[] = [], defaultValueList: string[] = [], typeList: FieldType[] = [];
    arrayFields.forEach((arrayField) => {
        if (arrayField.autoInput && arrayField.name && arrayField.defaultValue) {
            // console.log('arrayField', arrayField)
            fieldIdList.push(arrayField.name);
            defaultValueList.push(arrayField.defaultValue);
            typeList.push(fieldInfo.fieldMetaList.find(fieldMeta => fieldMeta.id === arrayField.name).type);
        }
    });

    // @ts-ignore
    window.off = tableInfo.table.onRecordAdd(async (event) => {
        const recordList = event.data;
        const toSetTask = recordList.map((recordId) => (getRecordDefaultValue(recordId, fieldIdList, defaultValueList, typeList)));
        await Utils.setRecords(toSetTask, tableInfo);
    })
}

export const getRecordDefaultValue = (recordId: string, fieldIdList: string[], defaultValueList: any[], typeList: FieldType[]): IRecord | undefined => {
    const value = getMulFieldDefaultValue(fieldIdList, defaultValueList, typeList)
    console.log('value', value)
    if (!value) {
        return undefined;
    }
    return {
        recordId,
        fields: value
    }
}
export const getMulFieldDefaultValue = (fieldId: string[], defaultValue: any[], type: FieldType[]) => {
    if (!fieldId || !defaultValue || !type || fieldId.length !== defaultValue.length || fieldId.length !== type.length) {
        return undefined;
    }
    let value: {
        [fieldId: string]: IOpenCellValue;
    } = {};
    for (let i = 0; i < fieldId.length; i++) {
        const temp = getDefaultValue(defaultValue[i], type[i]);
        console.log('temp', temp)
        if (!temp) {
            continue;
        }
        value[fieldId[i]] = temp;  // 将 temp 添加到 value 对象中
    }
    console.log('value getMulFieldDefaultValue', value)
    return value;
}
export const getFieldDefaultValue = (fieldId: string, defaultValue: any, type: FieldType) => {
    const value = getDefaultValue(defaultValue, type);
    if (!value) {
        return undefined;
    }
    return {[fieldId]: value}
}

export const getDefaultValue = (defaultValue: any, type: FieldType): IOpenCellValue | undefined => {

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
            return {id: defaultValue, text: ""} as IOpenSingleSelect
        default:
            break;
    }
    return undefined;
}

export const fetchNewData = async () => {
    // todo 更改表格选项后记得更新 tableActive 等信息

    const tableActive = await bitable.base.getActiveTable();

    const [tempTableList, fields, tableName] = await Promise.all([
        await bitable.base.getTableList(),
        await tableActive.getFieldList(),
        await tableActive.getName(),
    ])

    const tableListPromises = tempTableList.map(async (table) => ({
        iTable: table,
        id: table.id,
        name: await table.getName()
    }));

    const tableList: ZTable[] = await Promise.all(tableListPromises);

    const fieldListPromises = fields.map(async (field) => ({
        [field.id]: {
            name: await field.getName(),
            iField: field,
            iFieldMeta: await field.getMeta()
        }
    }));
    const tempFieldList = Object.assign({}, ...(await Promise.all(fieldListPromises)));

    const tempFieldListInTable: FieldListInTable = {
        table: {
            iTable: tableActive,
            id: tableActive.id,
            name: tableName
        },
        fields: tempFieldList
    }

    return {
        tableActive: tableActive,
        tableList: tableList,
        fieldListInTable: tempFieldListInTable
    }
}
