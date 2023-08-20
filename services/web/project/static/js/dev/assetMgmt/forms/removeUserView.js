import FileUpload from '../../utilities/formHelpers/fileUpload.js'
import { toCamelCase, arrToString } from '../../utilities/helpers.js';

class RemoveUser extends FileUpload {

    initialize(previewHandlers) {
        
        this.type = 'remove-user';


        // EXCEL
        this.initializeFile();

        this._unField = this._form.querySelector(`.form__group--user-name`);
        this._rmField = this._form.querySelector(`.form__group--remarks-new`);

        this._toggleFieldsExcelArray.push(this._unField, this._rmField);
        
        this._elAfterExcel = this._form.querySelector(`.form__group--submit--remove-user`);

        this._headers = ['Name', 'Remarks']

        // ACTUAL INPUTS FOR VALIDATION
        this._un = this._form.querySelector('.form__input--user-name')
        console.log(this._un);
        this._rm = this._form.querySelector('.form__input--remarks-new');
        this._resetValuesArray = [this._un, this._rm]

        this._previewArray = [{'type': 'user-name', 'input': this._un, 'typeName': 'User Name'}];

        this._initializePreview(previewHandlers);

        // SUBMIT
        this._submitBtn = this._form.querySelector('.btn--remove-user');
    }

    _generatePreviewMarkup() {

        console.log(this._results);
        console.log(this._focusedInput);

        // class is for styling the preview, dataset is for getting value
        // check that user is not resigned already and is not loaning anything
        return this._results.map((result) => `<div class="${result['hasResigned'] === 1 ? 'preview__result--invalid preview__result--invalid-has-resigned' : result['devices'] ? 'preview__result--invalid preview__result--invalid-has-device' : 'preview__result'} preview--${this._focusedInput}-component" data-preview-value="${result['userId']}" tabindex="0">
            <h3 class="preview__value">${result['userName']}</h3>
            <h4>${result['deptName']}</h4>
            </div><hr>`).join('');
    }

    getData() {

        let valid = true;
        let submitArr = [];
        let innerArr = [];
        console.log(this._previewInputStateArr);

        for (const state of this._previewInputStateArr) {
            if (state.previewValue === '') {
                valid = false;
                this.renderError(`${state.typeName} cannot be blank!`);
                return;
            } else {
                innerArr.push(state.previewValue);
            }
        }
          
        if (!valid) return;

        innerArr.push(this._rm.value.trim() || '');

        submitArr.push(innerArr);

        return submitArr;
    }

    getFileData(rawData) {

        let finalData = [];
        let valid = true

        // serial no, asset tag, remarks
        for(const innerObj of rawData) {
            if (!innerObj.userName) {
                this.renderError(`User Name cannot be blank!`);
                valid = false;
                return;
            } 

            if (Object.keys(innerObj).length !== 2) {
                {
                    this.renderError(`Something went wrong when submitting data`);;
                    valid = false;
                    return;
                }
            }

            const innerArr = [innerObj.userName, innerObj.remarks || '']

            finalData.push(arrToString(innerArr))
        }
        if (!valid) {
            this.renderError(`Something went wrong when submitting data`);;
            return;
        }

        return finalData;
    }
}

export default new RemoveUser()