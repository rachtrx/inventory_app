import { opaqueEl, clearEl, toggleFields } from '../helpers.js'
import View from '../showView.js';
import icons from 'url:../../../../sprite.svg'

export default class FormView extends View {

    // RENDER AND CLOSE ERROR

    _initializeFormView() {
        console.log(this._overlayEl);
        this._addHandlerCloseError();
        this._form = document.querySelector(`.form--${this.type}`);
    }

    renderSpinner() {
        console.log(this._popupFields);
        opaqueEl(...this._popupFields);
        clearEl(this._popupWindowEl)

        const markup = `
            <div class="spinner">
                <svg>
                    <use href="${icons}#icon-loader"></use>
                </svg>
            </div>`;
        this._popupWindowEl.insertAdjacentHTML('afterbegin', markup)
    }

    // FORMS

    // OPTION FOR NEW DEVICE / DEPARTMENT
    _addHandlerNew() {
        this._newOptionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleFields('hidden', ...this._toggleFieldsOptionsArray)
            this._existingInput.selectedIndex = 0;
        })
    }

    _addHandlerExisting() {
        this._existingOptionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleFields('hidden', ...this._toggleFieldsOptionsArray);
            this._newInput.value = '';
        })
    }

    // SUBMIT
    addHandlerSubmit(handler) {
        console.log('heloooo');
        document.addEventListener('click', (e) => {
            if(e.target.closest('.btn--submit')) {
                console.log('no idea'); 
                e.preventDefault();
                console.log('submit clicked, going to validate');
                handler(this);
            }
        })
    }

    addHandlerSubmitPDF(handler) {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn--pdf')) {
                e.preventDefault()
                handler(this)
            }
            else if (e.target.closest('.btn-text--bypass')) {
                e.preventDefault()
                handler(this, true)
            }
        })
    }

    getFormDetails() {
        console.log('HELLo');
        return {
            assetTag: document.querySelector('.preview__value--asset-tag').innerHTML,
            modelName: document.querySelector('.preview__value--model-name').innerHTML,
            serialNumber: document.querySelector('.preview__value--serial-number').innerHTML,
            userName: document.querySelector('.preview__value--user-name').innerHTML,
            deptName: document.querySelector('.preview__value--dept-name').innerHTML,
        }
    }

    renderResubmit(assetId, page, curUrl, homeUrl) {

        const resubmitUrl = curUrl.split('?')[0];

        const redirectUrl = `${homeUrl}views/show_device#${assetId}`

        const markup = `
        <div class="window-resubmit">
            <div class="window-resubmit-result">Success!</div>
            <a class="btn btn--resubmit" href="${resubmitUrl}">${page === 'loan device' ? 'Loan another device' : 'Return another device'}</a>
            <a class="btn btn--continue" href="${redirectUrl}">Continue</a>
        </div>`

        opaqueEl(...this._popupFields);
        clearEl(this._popupWindowEl);

        this._popupWindowEl.insertAdjacentHTML('afterbegin', markup)

        this._resubmitBtn = document.querySelector('.btn--resubmit');
        this._continueBtn = document.querySelector('.btn--continue')

        document.removeEventListener('click', this._closeErrorCallback)
    }
}



