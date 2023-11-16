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

export class Utils {
    static async setRecords(toSetTask: any, tableInfo: any, setLoading: any, setLoadingContent: any, t: any) {
        let successCount = 0;
        console.log("toSetTask", toSetTask.length);
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
    }
}
