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
import { Injectable } from '@angular/core';

import { environment } from '@environments/environment';
import { ApiService, RuntimeContext, StartOrderOptions, StartOrderResult, Xo, XoClassInterface, XoObject, XoObjectClass, XoProperty, XoUnique } from '@zeta/api';
import { getSubdirectory } from '@zeta/base';
import { XcDialogService } from '@zeta/xc';

import { Observable, Subject } from 'rxjs';


const CROSS_ORIGIN = false;
const CROSS_HOST = 'localhost';
const UPLOAD_URL_PATH = 'upload';
const DOWNLOAD_URL_PATH = 'download?p0=';

export enum ImportStatus {
    ChoseFile = 'choseFile',
    ImportDone = 'importDone'
}


export class ImportResult {
    constructor(
        public status: ImportStatus,
        public fileId: XoManagedFileID = null,
        public fileName = ''
    ) { }
}



/**
 * ManagedFileId - class
 * - should be hidden because it was not needed by the user (true for import/export)
 * since upload() was introduced to the service, this is not the case anymore.
 */

@XoObjectClass(null, 'xdev.xtestfactory.infrastructure.datatypes', 'ManagedFileID')
export class XoManagedFileID extends XoObject {

    @XoProperty()
    @XoUnique()
    iD: string;
}



@Injectable()
/**
 * ImexService delivers a possibility to export from, import or just upload files to the
 * Xyna Black Edition File-WebService
 * Note:
 * This File-WebService only allows same origin requests - you can't use this service running locally or somewhere else
 */
export class ImexService {

    constructor(private readonly apiService: ApiService, private readonly dlgService: XcDialogService) { }

    /**
     * Method opens a file dialog, uploads the selected file to the xyna file webservice. When upload was successful
     * it starts the specified workflow/ordertype
     * @param rtc - the current RuntimeContext
     * @param wf - the import workflow (path + . + name)
     * @param input - the part of the workflow's input variables except the ManagedFileId,
     * which will be automatically added to the payload as the last input parameter
     */
    import(rtc: RuntimeContext, wf: string, input?: Xo[], output?: XoClassInterface | XoClassInterface[], async = false): Observable<StartOrderResult> {

        const subj = new Subject<StartOrderResult>();
        const optionsWithError: StartOrderOptions = {
            async,
            withErrorMessage: true
        };

        this.upload().subscribe({
            next: result => {
                if (result.status === ImportStatus.ImportDone) {
                    const mfid = result.fileId;
                    input = input || ([] as Xo[]);
                    input.push(mfid);
                    this.apiService.startOrder(rtc, wf, input, output, optionsWithError).subscribe({
                        next: sor => {
                            if (sor && !sor.errorMessage) {
                                subj.next(sor);
                            } else {
                                subj.error(sor.errorMessage);
                            }
                        },
                        error: error => subj.error(error),
                        complete: () => subj.complete()
                    });
                }
            },
            error: error => subj.error(error),
            complete: () => { /* DO NOT complete "subj" here, because the async startOrder needs to complete it. Here would be to soon. */ }
        });

        return subj.asObservable();
    }


    /**
     * Method opens a file dialog, uploads the selected file to the xyna file webservice and returns the ManagedFileId via an Observable
     * @returns Observable<ImportResult>
     */
    upload(): Observable<ImportResult> {
        const subject: Subject<ImportResult> = new Subject();
        let fileName = '';

        /**
         * selected file was sucessfully uploaded and we start the workflow
         * @param {ProgressEvent} - EVENT
         */
        const uploadHandler = (event) => {
            const result = event.currentTarget.responseText;
            const match = result.match(new RegExp('stored with id (\\d*)'));
            if (match && match.length > 1) {
                const mfid = new XoManagedFileID();
                mfid.iD = match[1];
                subject.next(new ImportResult(ImportStatus.ImportDone, mfid, fileName));
                subject.complete();
            } else {
                const err = 'could not extract managed file id from server response, which was \'' + result + '\'';
                subject.error(err);
                subject.complete();
            }
        };

        /**
         * error with the upload
         */
        const uploadErrorHandler = (event) => {
            subject.error('upload error');
            subject.complete();
        };

        this.browse().subscribe(
            file => {
                // Dateiname merken
                fileName = file.name;

                subject.next(new ImportResult(ImportStatus.ChoseFile));

                const fd = new FormData();
                fd.append('hint', 'File:none:upload');
                fd.append('file', file);

                const xhr = new XMLHttpRequest();
                xhr.onload = uploadHandler;
                xhr.onerror = uploadErrorHandler;

                // as long as the project runs locally, we need to hardcode the host name
                // we can not use relative urls
                const subdirectory = getSubdirectory(environment.zeta.url);
                if (CROSS_ORIGIN) {
                    xhr.open('POST', CROSS_HOST + '/' + subdirectory + UPLOAD_URL_PATH);
                } else {
                    xhr.open('POST', '/' + subdirectory + UPLOAD_URL_PATH);
                }
                xhr.send(fd); // starts the "upload"
            }
        );

        return subject.asObservable();
    }


    /**
     * Note: Because the cancelation of the native file selection dialog is undetectable
     * there is no guarantee that the Observable completes
     */
    browse(): Observable<File> {
        const subject: Subject<File> = new Subject();
        const fileInput = document.createElement('INPUT');

        const changeHandler = (event) => {
            document.body.removeChild(fileInput);

            // selects the first file even if more than one file was selected
            const file = event.currentTarget.files[0];
            subject.next(file);
            subject.complete();
        };

        (fileInput as HTMLInputElement).type = 'file';
        fileInput.onchange = changeHandler;
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        // opens an operating system file select dialog
        fileInput.click();
        return subject.asObservable();
    }


    /**
     * exports a file generated by a workflow/ordertype
     * @param rtc - the current RuntimeContext
     * @param wf - the export workflow (path + . + name)
     * @param payload - payload (input parameters) of the workflow,
     */
    export(rtc: RuntimeContext, wf: string, input?: Xo | Xo[], output?: XoClassInterface<Xo> | XoClassInterface<Xo>[], async = false): Observable<StartOrderResult> {     //  XoObject[])

        const subj = new Subject<StartOrderResult>();

        const winHandler = (startOrderResult: StartOrderResult) => {

            if (startOrderResult && !startOrderResult.errorMessage) {

                const sorOutput = (startOrderResult) ? startOrderResult.output[0] : null;
                const managedFileId = sorOutput ? sorOutput.data.iD : null;

                if (managedFileId !== null) {
                    const subdirectory = getSubdirectory(environment.zeta.url);
                    if (CROSS_ORIGIN) {
                        window.location.href = CROSS_HOST + '/' + subdirectory + DOWNLOAD_URL_PATH + managedFileId;
                    } else {
                        window.location.href = '/' + subdirectory + DOWNLOAD_URL_PATH + managedFileId;
                    }

                    subj.next(startOrderResult);
                } else {
                    subj.error(startOrderResult.errorMessage);
                }

            } else {
                subj.error(startOrderResult.errorMessage);
            }
            subj.complete();
        };

        const failHandler = (EX) => {
            const ex = (EX && EX.cause && EX.name) ? EX.cause.replace(EX.name, '$') : '$';
            subj.error(ex);
            subj.complete();
        };

        const optionsWithError: StartOrderOptions = {
            async,
            withErrorMessage: true
        };

        this.apiService.startOrder(rtc, wf, input, output, optionsWithError).subscribe({
            next: sor => winHandler(sor),
            error: error => failHandler(error),
            complete: () => subj.complete()
        });


        return subj.asObservable();
    }

}
