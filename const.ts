/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2023 Xyna GmbH, Germany
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */
import { StartOrderOptions, StartOrderResult } from '@zeta/api';
import { I18nParam, I18nService } from '@zeta/i18n';


export const RIGHT_TEST_FACTORY = 'xmcp.xfm.testFactory';

export function extractError(err: StartOrderResult | string | { message: string;[key: string]: any }, i18nService?: I18nService): string {

    let msg = i18nService ? i18nService.translate('unexpected error') : 'unexpected error';

    if (typeof err === 'string') {
        return err;
    }

    if (err && typeof (err as StartOrderResult).errorMessage === 'string') {
        msg = err.errorMessage;
        return msg;
    }

    if (err && (err as { message: string }).message) {
        return (err as { message: string }).message;
    }

    return msg;
}

export const OPTIONS_WITH_ERROR: StartOrderOptions = {
    async: false,
    withErrorMessage: true
};

export function GET_IMPORT_TEST_PROJECT_MSG(i18n: I18nService, orderId: string): { message: string; header: string } {
    const param: I18nParam = { key: '${orderId}', value: orderId };
    const msg = 'The import may take a while. Please check the Process Monitor (${orderId}). Test Project is selectable after the process.';
    return {
        message: i18n.translate(msg, param),
        header: i18n.translate('Attention')
    };
}

export function GET_DUPLICATE_TEST_PROJECT_MSG(i18n: I18nService, orderId: string): { message: string; header: string } {
    const param: I18nParam = { key: '${orderId}', value: orderId };
    const msg = 'The duplication may take a while. Please check the Process Monitor (${orderId}). Test Project is selectable after the process.';
    return {
        message: i18n.translate(msg, param),
        header: i18n.translate('Attention')
    };
}
