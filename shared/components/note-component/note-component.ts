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
import { Component, Input } from '@angular/core';

import { XDSIconName } from '@zeta/xc';

import { XTFFocusCandidateRef } from '../../directives/xtf-focus-candidate.directive';


@Component({
    selector: 'note-component',
    templateUrl: './note-component.html',
    styleUrls: ['./note-component.scss'],
    standalone: false
})
export class NoteComponent {

    private _note = '';
    get note(): string {
        return this._note;
    }

    @Input()
    set note(value: string) {
        this._note = value;
        if (value) {
            this.noteBoxFocusCandidateRef.focus();
        }
    }

    @Input('icon-name')
    iconName = XDSIconName.MSGWARNING;

    noteBoxFocusCandidateRef = XTFFocusCandidateRef.getInstance();

    XDSIconName = XDSIconName;

}
