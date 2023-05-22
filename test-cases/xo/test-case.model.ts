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
import { XoObject, XoObjectClass, XoProperty, XoUnique } from '@zeta/api';

import { XoTestDataSelector } from './test-data-selector.model';


@XoObjectClass(null, 'xdev.xtestfactory.infrastructure.storables', 'TestCase')
export class XoTestCase extends XoObject {

    @XoProperty()
    @XoUnique()
    iD: number;

    @XoProperty()
    name: string;

    @XoProperty()
    description: string;

    @XoProperty(XoTestDataSelector)
    testDateSelector: XoTestDataSelector;

    @XoProperty()
    testProcessReference: string;


    afterDecode() {
        super.afterDecode();
        if (!this.testDateSelector) {
            this.testDateSelector = new XoTestDataSelector().decode();
        }
    }
}
