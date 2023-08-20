import { toCamelCase, arrToString } from '../../utilities/helpers.js';
import FileUpload from '../../utilities/formHelpers/fileUpload.js';

class ReturnedDevice extends FileUpload {
    // _parentElement = document.querySelector('.register-device');

    initialize(previewHandlers) {
        this.type = 'returned-device';
        // this._previewType = [, ];

        this._initializeFormView();

        // ACTUAL INPUTS FOR VALIDATION
        this._at = this._form.querySelector('.form__input--asset-tag')
        this._rm = this._form.querySelector('.form__input--remarks-new')

        // PREVIEW SEARCH
        this._previewArray = [{'type': 'asset-tag', 'input': this._at, 'typeName': 'Asset Tag'}];

        this._initializePreview(previewHandlers);

        // GET USER FROM SELECTED DEVICE
        this._previewLoadedEvent = new Event("previewLoaded");
        this._insertUserLocationEl = this._form.querySelector('.form__group--user-name--returned-device')

        // SUBMIT
        this._submitBtn = this._form.querySelector('.btn--returned-pdf');

        
    }

    _generatePreviewMarkup() {

        // class is for styling the preview, dataset is for getting value
        // check that it is only on loan
        console.log(this._results);

        return this._results.map((result) => `<div class="${result['status']} ${result['status'] === 'available' ? 'preview__result--invalid preview__result--invalid-available' : result['status'] === 'condemned' ? 'preview__result--invalid preview__result--invalid-condemned' : 'preview__result'} preview--${this._focusedInput}-component" data-preview-value="${result['assetId']}" tabindex="0">
            <h3 class="preview__value--asset-tag">${result['assetTag']}</h3>
            <h4 class="preview__value--model-name">${result['modelName']}</h4>
            <h5 class="preview__value--serial-number">${result['serialNumber']}</h5>
            </div><hr>`).join('');
    }

    // RENDER THE USER AUTOMATICALLY
    addHandlerGetUser(handler) {
        this._form.addEventListener("previewLoaded", () => {
            const assetTag = this._selectedPreviewEl.dataset.previewValue
            console.log(assetTag);
            handler(assetTag);
        })
    }

    renderUser(user) {
        const markup = `<div class="preview__result preview--user-name selected" data-preview-value="${user['userId']}">
        <h3 class="preview__value--user-name">${user['userName']}</h3>
        <h4 class="preview__value--dept-name">${user['deptName']}</h4>
        </div>`

        this._eventId = user.eventId
        this._fileName = user.fileName

        this._insertUserLocationEl.insertAdjacentHTML('afterbegin', markup)
        this._insertUserLocationEl.style.padding = '2rem';
    }

    // Check for validation
    getData() {

        let valid = true;
        let submitArr = [];
        let innerArr = [];

        for (const state of this._previewInputStateArr) {
            if (state.previewValue === '') {
                valid = false;
                this.renderError(`${state.typeName} cannot be blank!`);
                break;  // Break out of the loop when a condition is met
            } else {
                innerArr.push(state.previewValue);
            }
        }
        
        // user wasnt found
        if(!valid || !this._insertUserLocationEl.innerHTML) {   
            this.renderError('There was an error returning the device');
            return;
        }

        const userValue = this._insertUserLocationEl.querySelector('.preview__result').dataset.previewValue;
        innerArr.push(userValue);
        innerArr.push(this._rm.value.trim() || '');

        submitArr.push(innerArr);
        console.log(submitArr);
        
        return submitArr;
    }
}

export default new ReturnedDevice()