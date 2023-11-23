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

import {FieldListInTable, ZField, ZTable} from "../type/type";
import {Utils} from "./Utils";
import {
    bitable,
    FieldType,
    IField,
    IFieldMeta,
    IOpenCellValue,
    IOpenNumber,
    IOpenPhone,
    IOpenSegment,
    IOpenSegmentType,
    IOpenSingleSelect,
    IRecord,
    ITable
} from "@lark-base-open/js-sdk";
import {Toast} from "@douyinfe/semi-ui";

/**
 * 自动填充
 * 1. 从 arrayFields 获取字段信息，以及每个字段自动填充的开启状态
 * 2. 若开启，则放入自动填充列表（因为实时刷新，所以不需要考虑关闭）
 * @param table
 * @param fields
 * @param arrayFields
 */
export const openAutoInputUtils = async (table: ITable, fields: ZField[], arrayFields: any[]) => {
    // 关闭监听
    // @ts-ignore
    window.off && window.off.constructor === Function && window.off()

    let fieldIdList: string[] = [], defaultValueList: string[] = [], typeList: FieldType[] = [];
    // 查找需要自动添加记录的字段
    arrayFields.forEach((arrayField) => {
        const fieldMeta = fields.find(fieldMeta => fieldMeta.id === arrayField.name);
        if (arrayField.autoInput && arrayField.name && arrayField.defaultValue && fieldMeta) {
            // console.log('arrayField', arrayField)
            fieldIdList.push(arrayField.name);
            defaultValueList.push(arrayField.defaultValue);
            typeList.push(fieldMeta.iFieldMeta.type);
        }
    });
    // 若没有字段开启自动填充，则返回，不再开启监听
    if (!fieldIdList || !fieldIdList.length) {
        return;
    }

    // @ts-ignore
    window.off = table.onRecordAdd(async (event) => {
        const recordList = event.data;
        const toSetTask = recordList.map((recordId) => (getRecordDefaultValue(recordId, fieldIdList, defaultValueList, typeList)));
        await Utils.setRecordsUtils(toSetTask, table);
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

export const getDefaultValue = (defaultValue: any, type: FieldType): IOpenCellValue => {
    console.log('defaultValue', defaultValue)
    switch (type) {
        // TODO 支持更多类型
        case FieldType.Number:
            if (isNaN(Number(defaultValue))) {
                Toast.error('数字格式错误')
                return null
            }
            return defaultValue as IOpenNumber
        // case FieldType.Rating:
        case FieldType.Phone:
            return typeof defaultValue === 'string' ? defaultValue as IOpenPhone : null
        case FieldType.Currency:
        // case FieldType.Checkbox:
        //     return typeof defaultValue ==='boolean'? defaultValue as IOpenCheckbox : null
        case FieldType.MultiSelect:
            return defaultValue.map((id: string) => ({id, text: ""})) as IOpenSingleSelect[]
        case FieldType.Text:
            // console.log('number', restFormValue)
            return [{type: IOpenSegmentType.Text, text: defaultValue}] as IOpenSegment[]
        // case FieldType.Text:
        //   console.log('text', restFormValue)
        //   value = [{type: IOpenSegmentType.Text, text: String(getRandom({max, min, ...restFormValue}))}]
        //   break;
        case FieldType.SingleSelect:
            return {id: defaultValue, text: ""} as IOpenSingleSelect
        default:
            return null;
    }
}

export const fetchNewData = async (chosenTable: ITable): Promise<{
    tableActive: ITable,
    tableList: ZTable[],
    fieldListInTable: FieldListInTable,
}> => {
    /** 支持填入默认值的字段 */
    const supportFieldType = [FieldType.SingleSelect, FieldType.MultiSelect, FieldType.Text, FieldType.Number, FieldType.Phone]

    const [tempTableList, fields, tableName] = await Promise.all([
        await bitable.base.getTableList(),
        await chosenTable.getFieldList(),
        await chosenTable.getName(),
    ])

    const tableListPromises = tempTableList.map(async (table) => ({
        iTable: table,
        id: table.id,
        name: await table.getName()
    }));

    const tableList: ZTable[] = await Promise.all(tableListPromises);

    const fieldListPromises = fields.map(async (field) => ({
        id: field.id,
        name: await field.getName(),
        iField: field,
        iFieldMeta: await field.getMeta()
    }));
    const tempFieldList: { id: string; name: string; iField: IField<any, any, any>; iFieldMeta: IFieldMeta; }[] = await Promise.all(fieldListPromises);

    const tempFieldListInTable: FieldListInTable = {
        table: {
            iTable: chosenTable,
            id: chosenTable.id,
            name: tableName
        },
        // 筛选符合支持填入默认值的字段
        fields: tempFieldList.filter((field) => supportFieldType.includes(field.iFieldMeta.type))
    }

    return {
        tableActive: chosenTable,
        tableList: tableList,
        fieldListInTable: tempFieldListInTable,
    }
}

// 定义一个类来管理事件监听
export class AutoInputManager {
    private static instance: AutoInputManager | null = null;
    private table: ITable;
    private fields: ZField[];
    private arrayFields: any[];
    private listener: (() => void) | null = null;

    private constructor(table: ITable, fields: ZField[], arrayFields: any[]) {
        this.table = table;
        this.fields = fields;
        this.arrayFields = arrayFields;
    }

    public static getInstance(table: ITable, fields: ZField[], arrayFields: any[]): AutoInputManager {
        if (!AutoInputManager.instance) {
            AutoInputManager.instance = new AutoInputManager(table, fields, arrayFields);
        }
        return AutoInputManager.instance;
    }

    public updateFields(fields: ZField[], arrayFields: any[]) {
        this.fields = fields;
        this.arrayFields = arrayFields;

        // 可以在这里添加逻辑来重新配置或重启事件监听器
        // 比如关闭当前监听器并重新打开一个新的
        this.close();
        this.open();
    }
    // 开启事件监听
    public open() {
        if (this.listener) {
            // 已经有一个监听器在运行了
            return;
        }

        let fieldIdList: string[] = [], defaultValueList: string[] = [], typeList: FieldType[] = [];
        this.arrayFields.forEach((arrayField) => {
            const fieldMeta = this.fields.find(fieldMeta => fieldMeta.id === arrayField.name);
            if (arrayField.autoInput && arrayField.name && arrayField.defaultValue && fieldMeta) {
                fieldIdList.push(arrayField.name);
                defaultValueList.push(arrayField.defaultValue);
                typeList.push(fieldMeta.iFieldMeta.type);
            }
        });

        if (!fieldIdList.length) {
            return;
        }

        this.listener = this.table.onRecordAdd(async (event) => {
            const recordList = event.data;
            const toSetTask = recordList.map((recordId) => (getRecordDefaultValue(recordId, fieldIdList, defaultValueList, typeList)));
            await Utils.setRecordsUtils(toSetTask, this.table);
        });
    }

    // 关闭事件监听
    public close() {
        if (this.listener) {
            this.listener();
            this.listener = null;
        }
    }
}

