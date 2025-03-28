import { toCamelCase, arrToString } from '../../utilities/helpers.js';
import FileUpload from '../../utilities/formHelpers/fileUpload.js'

class loanDevice extends FileUpload {
    // _parentElement = document.querySelector('.register-device');

    initialize(previewHandlers) {
        this.type = 'loan-device';
        // this._previewType = [, ];

        this._initializeFormView();

        // ACTUAL INPUTS FOR VALIDATION
        console.log(this);
        this._at = this._form.querySelector('.form__input--asset-tag')
        this._un = this._form.querySelector('.form__input--user-name')
        this._rm = this._form.querySelector('.form__input--remarks-new')

        // PREVIEW SEARCH
        this._previewArray = [{'type': 'asset-tag', 'input': this._at, 'typeName': 'Asset Tag'}, {'type': 'user-name', 'input': this._un, 'typeName': 'User Name'}];

        this._initializePreview(previewHandlers);

        // SUBMIT
        this._submitBtn = this._form.querySelector('.btn--loan-pdf');
    }

    _generatePreviewMarkup() {

        // class is for styling the preview, dataset is for getting value
        if (this._focusedInput === 'asset-tag') {
            return this._results.map((result) =>
            `<div class="${result['status'] === 'condemned' ? 'preview__result--invalid preview__result--invalid-condemned' : result['status'] === 'loaned' ? 'preview__result--invalid preview__result--invalid-loan' : 'preview__result'} preview--${this._focusedInput}-component" data-preview-value="${result['assetId']}" tabindex="0">
                <h3 class="preview__value--asset-tag">${result['assetTag']}</h3>
                <h4 class="preview__value--model-name">${result['modelName']}</h4>
                <h5 class="preview__value--serial-number">${result['serialNumber']}</h5>
                </div><hr>`).join('');
        } else if (this._focusedInput === 'user-name') {
            console.log(this._results);
            return this._results.map((result) => `<div class="${result['hasResigned'] !== 0 ? 'preview__result--invalid preview__result--invalid-has-resigned' : 'preview__result'} preview--${this._focusedInput}-component" data-preview-value="${result['userId']}" tabindex="0">
            <h3 class="preview__value--user-name">${result['userName']}</h3>
            <h4 class="preview__value--dept-name">${result['deptName']}</h4>
            </div><hr>`).join('');
        }
    }

    // Check for validation
    getData() {

        let valid = true;
        let submitArr = []
        let innerArr = [];
        
        console.log(this._previewInputStateArr);

        // asset tag, username
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

        submitArr.push(innerArr)
        return submitArr;
    }
}

export default new loanDevice()