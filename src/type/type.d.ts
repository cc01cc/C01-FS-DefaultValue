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

import {IField, IFieldMeta, ITable, ITableMeta} from "@lark-base-open/js-sdk";

export type FieldInfoType = {
    /**当前所选field的实例 */
    field: IField | undefined
    /** 当前所选field的元信息 */
    fieldMeta: FieldMeta | undefined
    /** tableInfo.table的所有field实例 */
    fieldList: IField[],
    /** tableInfo.table的所有field元信息 */
    fieldMetaList: FieldMeta[]
}

export type TableInfoType = {
    table: ITable;
    tableMeta: ITableMeta;
    tableMetaList: ITableMeta[];
    tableList: ITable[]
}
export type FieldListInTable = {
    table: {
        iTable: ITable;
        id: string;
        name: string;
    };
    fields: ZField[]
}

export type ZField = {
    id: string;
    name: string;
    iField: IField;
    iFieldMeta: IFieldMeta;
}
export type ZTable = {
    iTable: ITable;
    id: string;
    name: string;
}