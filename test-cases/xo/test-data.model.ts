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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty, XoReadonly } from '@zeta/api';


@XoObjectClass(null, 'xdev.xtestfactory.infrastructure.storables', 'TestData')
export class XoTestData extends XoObject {

    @XoProperty()
    @XoReadonly()
    iD: number;

    @XoProperty()
    @XoReadonly()
    parentTestDataMetaData: XoObject;

    @XoProperty()
    @XoReadonly()
    nextToBeDrawn: boolean;

    @XoProperty()
    @XoReadonly()
    used: boolean;


    cloneWithZeroId(): this {
        const clone = this.clone();
        // set id direclty, because is decorated with @XoReadonly and therefore has no setter
        clone.data[XoTestData.getAccessorMap().iD] = 0;
        return clone;
    }
}


@XoArrayClass(XoTestData)
export class XoTestDataArray extends XoArray<XoTestData> {
}
