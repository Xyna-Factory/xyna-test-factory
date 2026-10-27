// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
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
import { XoObject, XoObjectClass, XoProperty } from '@zeta/api';


@XoObjectClass(null, 'xdev.xtestfactory.infrastructure.datatypes', 'TestDataSelector')
export class XoTestDataSelector extends XoObject {

    @XoProperty()
    selector1: string;

    @XoProperty()
    selector2: string;

    @XoProperty()
    selector3: string;

    @XoProperty()
    selector4: string;

    @XoProperty()
    selector5: string;

    @XoProperty()
    selector6: string;

    @XoProperty()
    selector7: string;

    @XoProperty()
    selector8: string;

    @XoProperty()
    selector9: string;

    @XoProperty()
    selector10: string;

    @XoProperty()
    selector11: string;

    @XoProperty()
    selector12: string;

    @XoProperty()
    selector13: string;

    @XoProperty()
    selector14: string;

    @XoProperty()
    selector15: string;

    @XoProperty()
    selector16: string;

    @XoProperty()
    selector17: string;

    @XoProperty()
    selector18: string;

    @XoProperty()
    selector19: string;

    @XoProperty()
    selector20: string;


    selectors: string[] = [];

    afterDecode() {
        super.afterDecode();

        this.selectors.push(
            this.selector1,
            this.selector2,
            this.selector3,
            this.selector4,
            this.selector5,
            this.selector6,
            this.selector7,
            this.selector8,
            this.selector9,
            this.selector10,
            this.selector11,
            this.selector12,
            this.selector13,
            this.selector14,
            this.selector15,
            this.selector16,
            this.selector17,
            this.selector18,
            this.selector19,
            this.selector20
        );
    }
}
