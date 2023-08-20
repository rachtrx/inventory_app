import FileUpload from '../../utilities/formHelpers/fileUpload.js';
import { toCamelCase, arrToString } from '../../utilities/helpers.js';
import { oldNewCheck, capitalizeWords } from "../../utilities/helpers.js";

class CreateUser extends FileUpload {

    initialize() {

        this.type = 'create-user'

        this.initializeFile();

        // Fields for options
        this._newOptionField = this._form.querySelector('.form__group--dept-new');
        this._existingOptionField = this._form.querySelector('.form__group--dept')

        // toggling between new dept and existing dept
        this._newOptionBtn = this._form.querySelector('.btn-text--dept-new')
        console.log(this._newOptionBtn);
        this._existingOptionBtn = this._form.querySelector('.btn-text--dept')
        this._toggleFieldsOptionsArray = [this._newOptionField, this._existingOptionField];
        this._newInput = this._form.querySelector('.form__input--dept-new')
        this._existingInput = this._form.querySelector('.form__input--dept')
        this._addHandlerNew();
        this._addHandlerExisting();

        // EXCEL
        this.initializeFile();

        this._unField = this._form.querySelector(`.form__group--user-name-new`);
        this._rmField = this._form.querySelector(`.form__group--remarks-new`);

        this._toggleFieldsExcelArray.push(this._unField, this._rmField);
        
        this._elAfterExcel = this._form.querySelector(`.form__group--submit--create-user`);

        this._headers = ['Name', 'Remarks']



        // ACTUAL INPUTS FOR VALIDATION
        this._dept = this._form.querySelector('.form__input--dept');
        this._deptNew = this._form.querySelector('.form__input--dept-new');
        this._un = this._form.querySelector('.form__input--user-name-new');
        this._rm = this._form.querySelector('.form__input--remarks-new');

        this._resetValuesArray = [this._un, this._rm]

        // submit button
        this._submitBtn = this._form.querySelector('.btn--create-user');
    }

    // Check for validation
    getData() {

        let valid = true;
        let submitArr = [];
        let innerArr = [];
        const defaultSelect = this._dept.options[0].textContent
        
        valid = oldNewCheck.call(this, defaultSelect, this._dept, this._deptNew, 'Department');
        if (!valid) return;

        // no name
        if (this._un.value === '') {
            this.renderError('Please enter a valid name');
            valid = false;
            return;
        }

        if(!valid) return;

        console.log(this._deptNew.value, this._dept.value);

        submitArr.push(this._deptNew.value ? '_' + capitalizeWords(this._deptNew.value.trim()) : this._dept.value.trim());


        innerArr.push(capitalizeWords(this._un.value.trim()));
        innerArr.push(this._rm.value.trim() || '');

        submitArr.push(innerArr)

        return submitArr;
    }

    getFileData(rawData) {

        let finalData = [];
        let valid = true;

        // serial no, asset tag, remarks
        for(const innerObj of rawData) {
            console.log(innerObj);
            if (!innerObj.userName) {
                this.renderError(`User Name cannot be blank!`);
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

            const innerArr = [capitalizeWords(innerObj.userName), innerObj.remarks || ''];
            console.log(innerArr);

            finalData.push(arrToString(innerArr))
        }

        const defaultSelect = this._dept.options[0].textContent
        valid = oldNewCheck.call(this, defaultSelect, this._dept, this._deptNew, 'Department');
        console.log('hello world');
        console.log(valid);
        if (!valid) return;

        finalData.unshift(this._deptNew.value ? '_' + capitalizeWords(this._deptNew.value.trim()) : this._dept.value.trim())

        console.log(finalData);

        return finalData;
    }
}

export default new CreateUser()