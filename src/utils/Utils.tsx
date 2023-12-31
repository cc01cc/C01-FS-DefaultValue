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
import {ITable} from "@lark-base-open/js-sdk";

export class Utils {
    static async setRecords(toSetTask: any, tableInfo: any) {
        let successCount = 0;
        // console.log("toSetTask", toSetTask.length);
        const step = 500;
        // console.log("toSetTask", toSetTask)
        for (let index = 0; index < toSetTask.length; index += step) {
            Toast.info("已填充" + toSetTask.length + "条记录")
            const element = toSetTask.slice(index, index + step);
            const sleep = element.length
            // console.log('element', element)
            await tableInfo?.table.setRecords(element).then(() => {
                successCount += element.length;
            }).catch((e: any) => {
                console.error(e)
            });
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve('')
                }, sleep);
            })
        }
    }

    static async setRecordsUtils(toSetTask: any, table: ITable) {
        let successCount = 0;
        // console.log("toSetTask", toSetTask.length);
        const step = 500;
        // console.log("toSetTask", toSetTask)
        for (let index = 0; index < toSetTask.length; index += step) {
            const element = toSetTask.slice(index, index + step);
            const sleep = element.length
            // console.log('element', element)
            await table.setRecords(element).then(() => {
                successCount += element.length;
            }).catch((e: any) => {
                console.error(e)
            });
            Toast.info("已填充" + successCount + "条记录")
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve('')
                }, sleep);
            })
        }
    }
}
