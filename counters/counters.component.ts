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
import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '@zeta/api';
import { I18nParam, I18nService } from '@zeta/i18n';
import { RouteComponent } from '@zeta/nav';
import { XcDialogService, XcFormDirective, XcSelectionModel, XDSIconName, XoRemappingTableInfoClass, XoTableInfo } from '@zeta/xc';

import { filter } from 'rxjs/operators';

import { OPTIONS_WITH_ERROR } from '../const';
import { SettingsService } from '../shared/settings.service';
import { XcTableInfoRemoteTableDataSource } from '../shared/table-info-remote-table-data-source';
import { AddCounterComponent } from './modal/add-counter/add-counter.component';
import { XoCounterEntry, XoCounterEntryArray } from './xo/counter-entry.model';
import { XoCounterId } from './xo/counter-id.model';


@Component({
    selector: 'app-counters',
    templateUrl: './counters.component.html',
    styleUrls: ['./counters.component.scss'],
    standalone: false
})
export class CountersComponent extends RouteComponent {

    dsCounters: XcTableInfoRemoteTableDataSource<XoCounterEntry>;
    counterEdit: XoCounterEntry = null;

    @ViewChild(XcFormDirective, {static: false})
    form: XcFormDirective;

    counterId = '';

    counter: XoCounterEntry;
    isTestprojectSelected = false;


    constructor(
        private readonly apiService: ApiService,
        private readonly settingsService: SettingsService,
        private readonly dialogService: XcDialogService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly i18nService: I18nService,
        private readonly router: Router
    ) {
        super();

        this.dsCounters = new XcTableInfoRemoteTableDataSource(this.apiService, null, this.settingsService.testProjectRtc, 'xdev.xtestfactory.infrastructure.gui.GetCounters');
        this.dsCounters.output = XoCounterEntryArray;
        this.dsCounters.tableInfoClass = XoRemappingTableInfoClass(XoTableInfo, XoCounterEntry);
        this.dsCounters.actionElements = [
            {
                onAction: counterEntry => {
                    this.dialogService.custom(
                        AddCounterComponent,
                        {
                            i18nService: this.i18nService,
                            counterEntry: counterEntry
                        }
                    ).afterDismiss().pipe(
                        filter(created => created)
                    ).subscribe(() => {
                        if (this.dsCounters.selectionModel) {
                            this.dsCounters.selectionModel.clear();
                        }
                        this.dsCounters.refresh();
                    });
                },
                tooltip: this.i18nService.translate('Duplicate selected Entry'),
                class: XDSIconName.COPY,
                iconName: XDSIconName.COPY
            },
            {
                onAction: counterEntry => {
                    this.dialogService.confirm(
                        this.i18nService.translate('Delete'),
                        this.i18nService.translate('Delete $0?', <I18nParam>{ key: '$0', value: counterEntry.name })
                    ).afterDismiss().pipe(
                        filter(result => result)
                    ).subscribe(() => {
                        const current = new XoCounterId();
                        current.iD = counterEntry.iD;

                        this.apiService.startOrder(this.settingsService.testProjectRtc, 'xdev.xtestfactory.infrastructure.actions.DeleteCounterWithoutStoreParameter', current, null, OPTIONS_WITH_ERROR)
                            .subscribe(response => {
                                if (response.errorMessage) {
                                    this.dialogService.error(this.i18nService.translateErrorCode(response.errorMessage));
                                }
                                this.dsCounters.refresh();
                            });
                    });
                },
                tooltip: this.i18nService.translate('Delete selected Entry'),
                class: XDSIconName.DELETE,
                iconName: XDSIconName.DELETE
            }
        ];
        this.dsCounters.refreshOnFilterChange = settingsService.tableRefreshOnFilterChange;
        this.dsCounters.selectionModel.selectionChange.subscribe(this.counterSelectionChange.bind(this));

        settingsService.testProject.subscribe(selector => {
            if (selector && selector.rtc !== null) {
                this.isTestprojectSelected = true;
                this.dsCounters.rtc = selector.runtimeContext;
                this.dsCounters.resetTableInfo();
                this.dsCounters.refresh();
            } else {
                this.dsCounters.clear();
            }
        });
    }

    private counterSelectionChange(model: XcSelectionModel<XoCounterEntry>) {
        const selection = model.selection[0] || null;

        if (this.counter !== selection) {
            this.counter = selection;
            this.counterEdit = selection ? selection.clone() : null;
            this.counterId = '';
            if (this.counter) {
                // reset form inputs as pristine
                if (this.form) {
                    this.form.markAsPristine();
                }
            }
            this.navigateToId();
        }
    }

    private navigateToId() {
        void this.router.navigate(['../' + (this.counter ? this.counter.iD : '')], { relativeTo: this.activatedRoute });
    }

    createCounter() {
        this.dialogService.custom(
            AddCounterComponent,
            {
                i18nService: this.i18nService,
                counterEntry: new XoCounterEntry()
            }
        ).afterDismiss().pipe(
            filter(created => created)
        ).subscribe(() => {
            if (this.dsCounters.selectionModel) {
                this.dsCounters.selectionModel.clear();
            }
            this.dsCounters.refresh();
        });
    }

    refresh() {
        this.dsCounters.refresh();
    }

    close() {
        console.log(this.dsCounters.selectionModel);
        this.dsCounters.selectionModel.clear();
    }

    get invalid(): boolean {
        return this.form ? this.form.invalid : false;
    }

    updateCounter() {
        const orderType = 'xdev.xtestfactory.infrastructure.actions.UpsertCounterWithUniquenessCheck';
        const input = new XoCounterEntry();
        input.iD = this.counterEdit.iD;
        input.name = this.counterEdit.name;
        input.increment = this.counterEdit.increment;
        input.nextValue = this.counterEdit.nextValue;
        input.description = this.counterEdit.description;

        this.apiService.startOrder(this.settingsService.testProjectRtc, orderType, input, null, OPTIONS_WITH_ERROR).subscribe(
            result => {
                if (result.errorMessage) {
                    this.dialogService.error(this.i18nService.translateErrorCode(result.errorMessage));
                } else {
                    this.dsCounters.selectionModel.clear();
                    this.dsCounters.refresh();
                }
            },
            error => {
                this.dialogService.error(error);
            }
        );
    }
}
