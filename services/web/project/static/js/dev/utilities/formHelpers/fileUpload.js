import { showEl, toggleFields, resetInputs, hideEl, opaqueEl, clearEl, transparentEl } from "../helpers.js";
import PreviewView from "./previewView.js";
import icons from 'url:../../../../sprite.svg'

export default class FileUpload extends PreviewView {

    initializeFile(buttons = true) {
        this._initializeFormView();
        
        this._fileInput = document.querySelector('.file__input');
        // fileEl displayed when loaded, hidden when use normal or close btn is clicked
        this._fileEl = this._form.querySelector('.form__file-view');
        this._fileName = this._form.querySelector('.form__file--view__file')
        
        // split into 2 functions to cater for onboarding
        if(buttons)
        this._initializeExcelBtns();
        
    }
    
    _initializeExcelBtns() {
        this._excelField = this._form.querySelector(`.form__group--excel`);
        this._toggleFieldsExcelArray = [this._excelField];
        
        this._excelBtnField = this._form.querySelector('.form__group--use-excel');
        this._normalBtnField = this._form.querySelector('.form__group--use-normal');
        
        this._useExcelBtn = this._form.querySelector(`#${this.type}-excel-btn`);
        this._useNormalBtn = this._form.querySelector(`#${this.type}-normal-btn`);
    }

    addHandlerNormalOption(handler) {
        this._useNormalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // this.excelState = false;
            console.log('normal handler clicked');
            handler(this);

            // create device, condemn device, create user, remove user
            if(this.type === 'condemned-device' || this.type === 'remove-user') {
                // show the input for previews
                if (this._previewInputStateArr) {
                    this._previewInputStateArr.forEach((state) => showEl(state.previewInputEl))
                }
            }
        })
    }

    addHandlerExcelOption(handler) {
        this._useExcelBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // TOREVIEW clear inputs
            resetInputs(this._resetValuesArray)


            // TOREVIEW register-device should keep the model name preview. clear the input for previews and remove selected previews,  cant just select register-device because create-user does not have the previewArray
            if(this.type === 'condemned-device' || this.type === 'remove-user') {
                // remove selected previews
                this.removePreviews();
                // reset preview values
                if (this._previewInputStateArr) {
                    this._resetPreviewValues();
                }
            }

            // update url.
            history.pushState({}, '', `${window.location.pathname}`);

            handler(this)
        })   
    }

    addHandlerFileTemplate(handler) {
        document.addEventListener('click', (e) => {
            if(e.target.closest('.btn--file-template')) {
                console.log(e.target);
                e.preventDefault();
                handler()
            }
        })
    }
    
    addHandlerUploadFile() {
        document.addEventListener('click', (e) => {
            if(e.target.closest('.btn--file-upload')) {
                console.log(e.target);
                e.preventDefault();
                this._fileInput.click()
            }
        })
    }

    addHandlerFileLoaded(handler) {
        document.addEventListener("change", (e) => {
            if(e.target === this._fileInput) {
                console.log(e);
                handler(this, this._fileInput.files[0])
            }
        })
    }

    addHandlerRemoveFile(handler) {
        document.addEventListener('click', (e) => {
            if(e.target.closest('.btn--remove-file')) {
                e.preventDefault();
                console.log('closing excel');
                handler(this);
            }
        })
    };

    renderFileName(loaded, filename) {
        // 2 cases where !loaded = true: clicking on close, and when data fails the check
        if (loaded !== true) {
            this._fileName.innerHTML = '';
            hideEl(this._fileEl)
            showEl(document.querySelector('.btn--file-upload'))
        } else {
            console.log(this._fileName);
            this._fileName.innerHTML = filename
            showEl(this._fileEl);
            hideEl(document.querySelector('.btn--file-upload'))
        }

        // reset the value so that same workflow happens when user clicks same file
        this._fileInput.value = null;
    }

    renderNormal() {

        toggleFields('hidden', ...this._toggleFieldsExcelArray, this._excelBtnField, this._normalBtnField);
        hideEl(this._fileEl)
        return;
    }

    renderExcel() {
  
        toggleFields('hidden', ...this._toggleFieldsExcelArray, this._excelBtnField, this._normalBtnField);
    }

    showBypassBtn() {
        opaqueEl(document.querySelector('.form__group--submit--pdf-bypass'))
    }

    hideBypassBtn() {
        transparentEl(document.querySelector('.form__group--submit--pdf-bypass'))
    }

    renderPDFForm(page) {

        const markup = `
        <button class="btn--close-modal">&times;</button>
        <div class="window-pdf">${page === 'loan device' || page === 'returned device' && !this._eventId ? `
        <button class="btn btn--file-template">Generate Form</button>` : `<button class="btn btn--file-download btn--file-download--pdf" data-event-id="${this._eventId}">Download Form</button>`}
            <input type="file" id="pdf-file" class="file__input hidden" accept=".pdf">
            <button class="btn btn--file-upload">Upload File</button>
            <div class="form__file-view hidden">
                <span class="form__file--view__file"></span>
                <svg class="btn--remove-file"><use href="${icons}#icon-circle-with-cross"></use></svg>
            </div>
            <div class="form__group--submit--pdf-bypass">
                <a class="btn-text btn-text--bypass">Submit without form</a>
            </div>
            <div class="form__group--submit--pdf">
                <button class="btn btn--pdf">Submit</button>
            </div>
        </div>`

        opaqueEl(...this._popupFields);
        clearEl(this._popupWindowEl)

        this._popupWindowEl.insertAdjacentHTML('afterbegin', markup)

        this._submitBtn = document.querySelector('.btn--pdf')
        this._fileInput = document.querySelector('.file__input');
        // fileEl displayed when loaded, hidden when use normal or close btn is clicked
        this._fileEl = document.querySelector('.form__file-view');
        console.log(this._fileEl);
        this._fileName = document.querySelector('.form__file--view__file')
        console.log(this._fileName);
    }
}