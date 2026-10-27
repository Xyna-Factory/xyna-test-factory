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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty, XoTransient } from '@zeta/api';
import { XcAutocompleteDataWrapper, XcBooleanStringDataWrapper, XcFormTemplate, XcFormValidatorNumber, XcIconButtonTemplate, XcIdentityDataWrapper, XoTableColumn, XoTableInfo } from '@zeta/xc';
import { XcCheckboxTemplate, XcFormAutocompleteTemplate, XcFormInputTemplate, XcTemplate } from '@zeta/xc/xc-template/xc-template';


@XoObjectClass(null, 'xdev.xtestfactory.infrastructure.datatypes', 'TestDataSelectorInstance')
export class XoTestDataSelectorInstance extends XoObject {

    static readonly TYPE_BOOLEAN = 'Boolean';
    static readonly TYPE_INTEGER = 'Integer';
    static readonly TYPE_STRING = 'String';
    static readonly TYPE_TESTDATALISTREFERENCE_SIMPLE = 'TestDataListReference_simple';
    static readonly TYPE_TESTDATALISTREFERENCE_COMPLEX = 'TestDataListReference_complex';
    static readonly TYPE_TESTDATALISTREFERENCE_MC = 'TestDataListReference_mc';
    static readonly TYPE_TESTCASEREFERENCE = 'TestCaseReference';

    @XoProperty()
    name: string;

    @XoProperty()
    type: string;

    @XoProperty()
    value: string;

    @XoProperty()
    label: string;

    @XoProperty()
    testDataListRef: string;

    @XoProperty()
    @XoTransient()
    templates: XcTemplate[] = [];

    afterDecode() {
        this.templates = this.getTemplates();
    }

    get firstTemplate() {
        return this.templates[0];
    }

    get lastTemplate() {
        return this.templates[this.templates.length - 1];
    }

    protected getTemplates(): XcTemplate[] {
        let template: XcTemplate;
        let templateIconButton: XcIconButtonTemplate;
        switch (this.type) {
            case XoTestDataSelectorInstance.TYPE_BOOLEAN:
                template = new XcCheckboxTemplate(
                    new XcBooleanStringDataWrapper(
                        ()    => this.value,
                        value => this.value = value
                    )
                );
                break;
            case XoTestDataSelectorInstance.TYPE_INTEGER:
                template = new XcFormInputTemplate(
                    new XcIdentityDataWrapper(
                        ()    => this.value,
                        value => this.value = value
                    ),
                    [XcFormValidatorNumber()]
                );
                break;
            case XoTestDataSelectorInstance.TYPE_STRING:
                template = new XcFormInputTemplate(
                    new XcIdentityDataWrapper(
                        ()    => this.value,
                        value => this.value = value
                    )
                );
                break;
            case XoTestDataSelectorInstance.TYPE_TESTDATALISTREFERENCE_SIMPLE:
                template = new XcFormAutocompleteTemplate(
                    new XcAutocompleteDataWrapper(
                        ()    => this.value,
                        value => this.value = value
                    )
                );
                break;
            case XoTestDataSelectorInstance.TYPE_TESTDATALISTREFERENCE_MC:
                template = new XcFormInputTemplate(
                    new XcIdentityDataWrapper(
                        ()    => this.value,
                        value => this.value = value
                    )
                );
                template.disabled = true;
                templateIconButton = new XcIconButtonTemplate();
                templateIconButton.iconName = 'external';
                break;
            case XoTestDataSelectorInstance.TYPE_TESTDATALISTREFERENCE_COMPLEX:
            case XoTestDataSelectorInstance.TYPE_TESTCASEREFERENCE:
                template = new XcFormInputTemplate(
                    new XcIdentityDataWrapper(
                        ()    => this.label,
                        value => this.label = value
                    )
                );
                template.disabled = true;
                templateIconButton = new XcIconButtonTemplate();
                templateIconButton.iconName = 'external';
                break;
        }
        if (template instanceof XcFormTemplate) {
            template.compact = true;
            template.indicateChanges = true;
        }
        if (template instanceof XcFormAutocompleteTemplate) {
            template.suffix = 'clear';
        }
        return [template, ...(templateIconButton ? [templateIconButton] : [])];
    }
}


@XoArrayClass(XoTestDataSelectorInstance)
export class XoTestDataSelectorInstanceArray extends XoArray<XoTestDataSelectorInstance> {
}


export class XoTestDataSelectorTableInfo extends XoTableInfo {

    afterDecode() {
        const column = new XoTableColumn();
        column.name = 'Value';
        column.path = 'templates';
        this.columns.data.push(column);
    }
}
