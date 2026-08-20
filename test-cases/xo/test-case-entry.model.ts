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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty, XoTransient, XoUnique } from '@zeta/api';
import { signal } from '@angular/core';
import { XcAutocompleteDataWrapper, XcStringFloatDataWrapper, XcStringIntegerDataWrapper } from '@zeta/xc';


@XoObjectClass(null, 'xdev.xtestfactory.infrastructure.gui.datatypes', 'TestCaseEntry')
export class XoTestCaseEntry extends XoObject {

    static TYPE_SINGLE = 'Single';
    static TYPE_LOAD   = 'Load';
    static TYPE_RATE   = 'Rate';

    @XoProperty()
    @XoUnique()
    iD: number;

    @XoProperty()
    name: string;

    @XoProperty()
    description: string;

    @XoProperty()
    @XoTransient()
    desc: string;

    @XoProperty()
    priority: number;

    @XoProperty()
    author: string;

    @XoProperty()
    responsibleUser: string;

    @XoProperty()
    type: string;

    @XoProperty()
    load: number;

    @XoProperty()
    loadCount: string;

    @XoProperty()
    rate: number;

    @XoProperty()
    rateDuration: number;


    constructor(_ident?: string, iD?: number, name?: string, description?: string, priority?: number, author?: string, responsibleUser?: string, type?: string, load?: number, loadCount?: string, rate?: number, rateDuration?: number) {
        super(_ident);
        this.iD = iD;
        this.name = name;
        this.description = description;
        this.priority = priority;
        this.author = author;
        this.responsibleUser = responsibleUser;
        this.type = type;
        this.load = load;
        this.loadCount = loadCount;
        this.rate = rate;
        this.rateDuration = rateDuration;
    }

    // data wrappers

    priorityDataWrapper = new XcStringIntegerDataWrapper(/** @todo as decorator XoDataWrapper(XcStringIntegerDataWrapper) */
        ()    => this.priority,
        value => this.priority = value
    );

    typeDataWrapper: XcAutocompleteDataWrapper;

    loadDataWrapper = new XcStringIntegerDataWrapper(
        ()    => this.load,
        value => this.load = value
    );

    rateDataWrapper = new XcStringFloatDataWrapper(
        ()    => this.rate,
        value => this.rate = value
    );

    rateDurationDataWrapper = new XcStringIntegerDataWrapper(
        ()    => this.rateDuration,
        value => this.rateDuration = value
    );

    // functions

    isSingle(): boolean {
        return this.type === XoTestCaseEntry.TYPE_SINGLE;
    }

    isLoad(): boolean {
        return this.type === XoTestCaseEntry.TYPE_LOAD;
    }

    isRate(): boolean {
        return this.type === XoTestCaseEntry.TYPE_RATE;
    }

    afterDecode() {
        if (this.description) {
            const maxLength = 100;
            const ellipsis = '...';
            const idx = this.description.indexOf('\n');
            this.desc = idx < 0 ? this.description : this.description.substring(0, idx) + ellipsis;
            if (this.desc.length > maxLength) {
                this.desc = this.desc.substr(0, maxLength) + ellipsis;
            }
        }
        // we have to instantiate the type wrapper after the object has been decoded!
        this.typeDataWrapper = new XcAutocompleteDataWrapper(
            ()    => this.type,
            value => {
                this.type = value;
                if (this.type !== XoTestCaseEntry.TYPE_LOAD) {
                    this.load      = undefined;
                    this.loadCount = undefined;
                }
                if (this.type !== XoTestCaseEntry.TYPE_RATE) {
                    this.rate         = undefined;
                    this.rateDuration = undefined;
                }
            },
            [
                {name: signal(XoTestCaseEntry.TYPE_SINGLE), value: XoTestCaseEntry.TYPE_SINGLE},
                {name: signal(XoTestCaseEntry.TYPE_LOAD),   value: XoTestCaseEntry.TYPE_LOAD},
                {name: signal(XoTestCaseEntry.TYPE_RATE),   value: XoTestCaseEntry.TYPE_RATE}
            ]
        );
    }
}


@XoArrayClass(XoTestCaseEntry)
export class XoTestCaseEntryArray extends XoArray<XoTestCaseEntry> {
}
