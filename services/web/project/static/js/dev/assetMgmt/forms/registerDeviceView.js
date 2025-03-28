import FileUpload from '../../utilities/formHelpers/fileUpload.js'
import { toCamelCase, arrToString } from '../../utilities/helpers.js';
import { oldNewCheck, capitalizeWords } from '../../utilities/helpers.js';

class RegisterDevice extends FileUpload {
    // _parentElement = document.querySelector('.register-device');

    initialize(previewHandlers) {
        
        this.type = 'register-device'
        // this._previewType = ['model-name'];

        this.initializeFile();

        // Fields for options
        this._newOptionField = this._form.querySelector('.form__group--vendor-new');
        this._existingOptionField = this._form.querySelector('.form__group--vendor')


        // for toggling between new device and existing device
        this._newOptionBtn = this._form.querySelector('.btn-text--vendor-new');
        this._existingOptionBtn = this._form.querySelector('.btn-text--vendor');
        this._toggleFieldsOptionsArray = [this._newOptionField, this._existingOptionField];
        this._newInput = this._form.querySelector('.form__input--vendor-new')
        this._existingInput = this._form.querySelector('.form__input--vendor')
        this._addHandlerNew();
        this._addHandlerExisting();

        // EXCEL
        this._snField = this._form.querySelector('.form__group--serial-number-new');
        this._atField = this._form.querySelector('.form__group--asset-tag-new');
        this._rmField = this._form.querySelector(`.form__group--remarks-new`);

        this._toggleFieldsExcelArray.push(this._snField, this._atField, this._rmField);
        
        this._elAfterExcel = this._form.querySelector('.form__group--submit--register-device');

        this._headers = ['Serial Number', 'Asset Tag', 'Remarks'];

        // ACTUAL INPUTS FOR VALIDATION
        this._mn = this._form.querySelector('.form__input--model-name')
        this._vendor = this._form.querySelector('.form__input--vendor');
        this._vendorNew = this._form.querySelector('.form__input--vendor-new');
        this._sn = this._form.querySelector('.form__input--serial-number-new')
        this._at = this._form.querySelector('.form__input--asset-tag-new')
        this._rm = this._form.querySelector('.form__input--remarks-new')
        this._resetValuesArray = [this._sn, this._at, this._rm]
        this._valueNew = this._form.querySelector('.form__input--model-value-new')

        // PREVIEW SEARCH
        this._previewArray = [{'type':'model-name','input': this._mn, 'typeName': 'Model Name'}];
        
        this._initializePreview(previewHandlers);

        // SUBMIT
        this._submitBtn = this._form.querySelector('.btn--register-device');
    }

    _generatePreviewMarkup() {
        console.log(this._results);
        return this._results.map((result) => `<div class="preview__result preview--${this._focusedInput}-component" data-preview-value="${result['modelId']}">
            <h3 class="preview__value">${result['modelName']}</h3>
            <h4>${result['deviceType']}</h4>
        </div><hr>`).join('');
    }

    // Check for validation
    getData() {
        
        // no mn
        let valid = true;
        let submitArr = [];
        let innerArr = [];
        const defaultSelect = this._vendor.options[0].textContent

        // model, sn, at
        for (const state of this._previewInputStateArr) {
            console.log(state.previewValue);
            if (state.previewValue === '') {
                valid = false;
                this.renderError(`${state.typeName} not allowed!`);
                return;
            } else {
                submitArr.push(state.previewValue);
            }
        }
        console.log(this._sn.value, this._at.value);

        valid = oldNewCheck.call(this, defaultSelect, this._vendor, this._vendorNew, 'Vendor')
        if(!valid) return;

        // no sn
        if (!this._sn.value) {
            this.renderError('Serial Number cannot be blank!');
            valid = false;
            return;
        }
        // no at
        if (!this._at.value) {
            this.renderError('Asset Tag cannot be blank!');
            valid = false;
            return;
        }

        if(!valid) return;

        submitArr.push(this._vendorNew.value ? '_' + capitalizeWords(this._vendorNew.value.trim()) : this._vendor.value.trim());
        submitArr.push(this._valueNew.value.trim() || 0)
        
        innerArr.push(String(this._sn.value).trim().split(' ')[0].toUpperCase());
        innerArr.push(String(this._at.value).trim().split(' ')[0].toUpperCase());
        // remarks
        innerArr.push(this._rm.value.trim() || '');

        submitArr.push(innerArr);

        console.log(submitArr); 
          
        return submitArr;
    }

    getFileData(rawData) {

        console.log(rawData);

        let finalData = [];
        let valid = true;

        // serial no, asset tag, remarks
        for(const innerObj of rawData) {
            console.log(Object.keys(innerObj).length);
            console.log(innerObj);
            if (!innerObj.serialNumber) {
                this.renderError(`Serial Number cannot be blank!`);
                valid = false;
                return;
            }
            if (!innerObj.assetTag) {
                this.renderError(`Asset Tag cannot be blank!`);
                valid = false;
                return;
            }

            if (Object.keys(innerObj).length !== 3) {
                this.renderError(`Something went wrong when submitting data, please check you did not amend the headers`);;
                valid = false;
                return;
            }

            const innerArr = [String(innerObj.serialNumber).trim().split(' ')[0].toUpperCase(), String(innerObj.assetTag).trim().split(' ')[0].toUpperCase(), innerObj.remarks || '']

            finalData.push(arrToString(innerArr))

            console.log(finalData);
        }

        finalData.unshift(this._valueNew.value.trim() || 0)
        
        const defaultSelect = this._vendor.options[0].textContent
        valid = oldNewCheck.call(this, defaultSelect, this._vendor, this._vendorNew, 'Vendor')
        finalData.unshift(this._vendorNew.value ? '_' + capitalizeWords(this._vendorNew.value.trim()) : this._vendor.value.trim())

        for (const state of this._previewInputStateArr) {
            if (state.previewValue === '') {
                valid = false;
                this.renderError(`${state.typeName} not allowed!`);
                return;
            } else {
                finalData.unshift(state.previewValue);
            }
        }

        if (!valid) return;

        return finalData;
    }
}

export default new RegisterDevice()