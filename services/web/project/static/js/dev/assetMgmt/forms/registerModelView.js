import formView from "../../utilities/formHelpers/formView.js";
import { oldNewCheck, capitalizeWords } from "../../utilities/helpers.js";

class CreateDevice extends formView {

    initialize() {

        this.type = 'register-model';

        this._initializeFormView();
        
        // Fields
        this._newOptionField = this._form.querySelector('.form__group--device-type-new');
        this._existingOptionField = this._form.querySelector('.form__group--device-type');
        this._toggleFieldsOptionsArray = [this._newOptionField, this._existingOptionField];

        // for toggling between new device and existing device
        this._newOptionBtn = this._form.querySelector('.btn-text--device-type-new');
        this._existingOptionBtn = this._form.querySelector('.btn-text--device-type');
        this._newInput = this._form.querySelector('.form__input--device-type-new')
        this._existingInput = this._form.querySelector('.form__input--device-type')
        this._addHandlerNew();
        this._addHandlerExisting();

        // ACTUAL INPUTS FOR VALIDATION
        this._dt = this._form.querySelector('.form__input--device-type');
        this._dtNew = this._form.querySelector('.form__input--device-type-new');
        this._modelNew = this._form.querySelector('.form__input--model-name-new');

        // submit button
        this._submitBtn = this._form.querySelector('.btn--register-model');
    }

    // Check for validation
    getData() {
        
        let valid = true;
        let submitArr = []
        let innerArr = [];

        const defaultSelect = this._dt.options[0].textContent

        oldNewCheck.call(this, defaultSelect, this._dt, this._dtNew, 'Device Type')
        if(!valid) return;

        // no model
        if (this._modelNew.value === '') {
            this.renderError('Please enter a valid model name');
            valid = false;
            return;
        }

        if(!valid) return;
        
        // device, model, value
        submitArr.push(this._dtNew.value ? '_' + capitalizeWords(this._dtNew.value.trim()) : this._dt.value.trim())

        innerArr.push(capitalizeWords(this._modelNew.value.trim()))

        submitArr.push(innerArr)

        return submitArr;
    }
}

export default new CreateDevice()