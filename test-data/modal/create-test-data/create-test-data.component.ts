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
import { Component, Injector } from '@angular/core';

import { ApiService } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcAutocompleteDataWrapper, XcDialogComponent, XcOptionItem, XcOptionItemString } from '@zeta/xc';

import { Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { extractError, OPTIONS_WITH_ERROR } from '../../../const';
import { SettingsService } from '../../../shared/settings.service';
import { XoTestData } from '../../../test-cases/xo/test-data.model';
import { XoTestDataMetaData } from '../../xo/test-data-meta-data.model';


export interface CreateTestDataComponentData {
    i18nService: I18nService;
    testDataMetaData: XoTestDataMetaData;
}


@Component({
    selector: 'create-test-data',
    templateUrl: './create-test-data.component.html',
    styleUrls: ['./create-test-data.component.scss'],
    standalone: false
})
export class CreateTestDataComponent extends XcDialogComponent<boolean, CreateTestDataComponentData> {

    readonly testData: XoTestDataMetaData;
    readonly testDataDefinitionSubject = new Subject<XcOptionItem<string>[]>();
    readonly testDataDefinitionDataWrapper = new XcAutocompleteDataWrapper(
        ()    => this.testData.testDataFullQualifiedStorableName,
        value => this.testData.testDataFullQualifiedStorableName = value,
        this.testDataDefinitionSubject.asObservable()
    );

    errorMessage: string;
    loading = true;
    saving = false;
    note = '';


    constructor(injector: Injector, private readonly apiService: ApiService, private readonly settings: SettingsService) {
        super(injector);

        this.testData = this.injectedData.testDataMetaData
            ? this.injectedData.testDataMetaData.cloneWithZeroId()
            : new XoTestDataMetaData();

        // asynchronously update data wrapper
        const subtypes = new Array<XcOptionItem>();
        this.apiService.getSubtypes(
            this.settings.testProjectRtc,
            [{
                fqn: XoTestData.fqn,
                rtc: this.settings.testProjectRtc
            }]
        ).forEach(observables => observables
            .pipe(
                finalize(() => {
                    this.loading = false;
                    this.testDataDefinitionSubject.next(subtypes);
                })
            ).subscribe(
                structureTypeList => structureTypeList
                    .filter(structureType => !structureType.typeAbstract && !structureType.typeFqn.equals(XoTestData.fqn))
                    .forEach(structureType => subtypes.push(XcOptionItemString(structureType.typeFqn.encode()))),
                error => console.error(error)
            )
        );
    }


    get testDataObjectPlaceHolder() {
        return this.loading
            ? this.injectedData.i18nService.translate('Loading ...')
            : this.injectedData.i18nService.translate('Please select ...');
    }


    save() {
        this.saving = true;

        const orderType = 'xdev.xtestfactory.infrastructure.actions.StoreTestDataMetaDataWithoutStoreParameter';
        this.apiService.startOrder(this.settings.testProjectRtc, orderType, this.testData, null, OPTIONS_WITH_ERROR).pipe(
            finalize(() => this.saving = false)
        ).subscribe(
            response => {
                if (response.errorMessage) {
                    this.note = this.injectedData.i18nService.translateErrorCode(response.errorMessage);
                } else {
                    this.dismiss(true);
                }
            },
            error => this.note = extractError(error)
        );
    }
}
