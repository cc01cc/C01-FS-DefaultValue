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

import {Toast} from "@douyinfe/semi-ui";
import {IField, IFieldMeta, ITable, ITableMeta} from "@lark-base-open/js-sdk";
import {Utils} from "./Utils";
import {useTranslation} from "react-i18next";

export const fill = async (tableInfo: {
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
                           defaultValue: any) => {
    if (!fieldInfo?.field) {
        const {t} = useTranslation();
        Toast.error(t('field.choose'));
        return;
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
            [fieldId]: defaultValue,
        }
    }))

    await Utils.setRecords(toSetTask, tableInfo);
}

export const fillByIndex = async (tableInfo: {
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
                                  index: number,
                                  defaultValue: any) => {
    if (!fieldInfo?.fieldList[index]) {
        const {t} = useTranslation();
        Toast.error(t('field.choose'));
        return;
    }

    /** 空的单元格行id */
    const recordIdList = new Set((await tableInfo?.table.getRecordIdList()));
    const fieldValueList = (await fieldInfo.fieldList[index].getFieldValueList()).map(({record_id}) => record_id);
    const fieldId = fieldInfo.fieldList[index].id;
    fieldValueList.forEach((id) => {
        recordIdList.delete(id!)
    })

    const toSetTask = [...recordIdList].map((recordId) => ({
        recordId,
        fields: {
            [fieldId]: defaultValue,
        }
    }))

    await Utils.setRecords(toSetTask, tableInfo);
}
