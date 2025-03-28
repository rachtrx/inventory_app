import FileUpload from '../../utilities/formHelpers/fileUpload.js';
import { toCamelCase, arrToString, capitalizeWords } from '../../utilities/helpers.js';

class CondemnedDevice extends FileUpload {

    initialize(previewHandlers) {
        
        this.type = 'condemned-device';

        this.initializeFile();

        this._atField = this._form.querySelector(`.form__group--asset-tag`);
        this._rmField = this._form.querySelector(`.form__group--remarks-new`);

        this._toggleFieldsExcelArray.push(this._atField, this._rmField);
        this._elAfterExcel = this._form.querySelector(`.form__group--submit--condemned-device`);

        this._headers = ['Asset Tag', 'Remarks']

        // ACTUAL INPUTS FOR VALIDATION
        this._at = this._form.querySelector('.form__input--asset-tag')
        this._rm = this._form.querySelector('.form__input--remarks-new')
        this._resetValuesArray = [this._at, this._rm]

        this._previewArray = [{'type': 'asset-tag', 'input': this._at, 'typeName': 'Asset Tag'}];

        this._initializePreview(previewHandlers);

        // SUBMIT
        this._submitBtn = this._form.querySelector('.btn--condemned-device');
    }

    _generatePreviewMarkup() {

        // class is for styling the preview, dataset is for getting value
        // check that it is only on loan
        return this._results.map((result) => `<div class="${result['status'] === 'loaned' ? 'preview__result--invalid preview__result--invalid-loan' : result['status'] === 'condemned' ? 'preview__result--invalid preview__result--invalid-condemned' : 'preview__result'} preview--${this._focusedInput}-component" data-preview-value="${result['assetId']}" tabindex="0">
            <h3 class="preview__value">${result['assetTag']}</h3>
            <h4>${result['modelName']}</h4>
            <h5>${result['serialNumber']}</h5>
            </div><hr>`).join('');
    }

    // TODO return an array of single object instead
    getData() {

        let valid = true;
        let submitArr = [];
        let innerArr = [];
        console.log(this._previewInputStateArr);

        for (const state of this._previewInputStateArr) {
            if (state.previewValue === '') {
                valid = false;
                this.renderError(`${state.typeName} cannot be blank!`);
                break;  // Break out of the loop when a condition is met
            } else {
                innerArr.push(state.previewValue);
            }
        }
          
        if (!valid) return;

        // remarks
        innerArr.push(this._rm.value.trim() || '');

        submitArr.push(innerArr);

        return submitArr;
    }

    getFileData(rawData) {

        let finalData = [];
        let valid = true

        // asset tag, remarks
        for(const innerObj of rawData) {
            if (!innerObj.assetTag) {
                this.renderError(`Asset Tag cannot be blank!`);
                valid = false;
                return;
            } 
            if (Object.keys(innerObj).length !== 2) {
                {
                    this.renderError(`Something went wrong when submitting data, please check you did not amend the headers`);;
                    valid = false;
                    return;
                }
            }

            const innerArr = [innerObj.assetTag, innerObj.remarks || '']

            console.log(innerArr);

            finalData.push(arrToString(innerArr))
        };

        
          
        if (!valid) {
            this.renderError(`Something went wrong when submitting data, please check you did not amend the headers`);;
            return;
        }

        return finalData;
    }
}

export default new CondemnedDevice()