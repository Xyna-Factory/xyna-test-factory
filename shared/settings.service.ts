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
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ApiService, RuntimeContext, StartOrderResult } from '@zeta/api';
import { AuthService } from '@zeta/auth';

import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { XoTestProjectSelector, XoTestProjectSelectorArray } from '../usermenu/xo/test-project-selector';


@Injectable({
    providedIn: 'root'
})
export class SettingsService {

    readonly fallbackRtc = RuntimeContext.fromApplication('XynaTestFactoryInfrastructure');
    private readonly _testProjectSelectorSubject = new BehaviorSubject<XoTestProjectSelector>(null);

    needRefreshTestCases = false;
    needRefreshTestCaseChains = false;
    tableRefreshOnFilterChange = false;


    constructor(private readonly apiService: ApiService, private readonly authService: AuthService, private readonly http: HttpClient) {
    }

    get testProjectRtc(): RuntimeContext {
        return this._testProjectSelectorSubject.getValue() ? this._testProjectSelectorSubject.getValue().runtimeContext : null;
    }

    get testProjectSelector(): XoTestProjectSelector {
        return this._testProjectSelectorSubject.getValue();
    }

    set testProjectSelector(value: XoTestProjectSelector) {
        this._testProjectSelectorSubject.next(value);
    }

    get testProject(): Observable<XoTestProjectSelector> {
        return this._testProjectSelectorSubject.asObservable();
    }


    retrieveTestProjects(): Observable<XoTestProjectSelectorArray> {
        const rtc = /*this.testProjectRtc || */this.fallbackRtc;
        const orderType = 'xdev.xtestfactory.infrastructure.gui.GetTestProjects';
        return this.apiService.startOrder(rtc, orderType, null, XoTestProjectSelectorArray, {
            async: false,
            withErrorMessage: true
        }).pipe(
            map(result => {
                // map to TestProjectSelector and remove RTC-information (see OP-3819)
                const selectors = result.output[0] as XoTestProjectSelectorArray;
                selectors.data.forEach(selector => selector.rtc = null);
                return selectors;
            })
        );
    }


    startTestCase(testCaseName: string, testCaseId: number, user?: string): Observable<StartOrderResult> {
        const url = 'runtimeContext/' + this.testProjectRtc.uniqueKey + '/starttestcase';

        const payload = {
            'testCaseId': testCaseId,
            'testCaseName': testCaseName,
            'user': user || this.authService.username
        };

        return this.http.post(url, payload).pipe(
            map((data: any) =>
                ({
                    orderId: data.orderID,
                    output: [],
                    // on error
                    errorMessage: data.errorMessage,
                    stackTrace: data.stackTrace
                })
            )
        );
    }
}
