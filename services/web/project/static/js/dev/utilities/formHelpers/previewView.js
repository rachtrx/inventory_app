import { showEl, hideEl, clearEl, transparentEl } from '../helpers.js'
import { PREVIEW_TIMEOUT_BLUR } from '../config.js'
import FormView from './formView.js'
import icons from '../../../../sprite.svg'

export default class PreviewView extends FormView {

    _initializePreview(previewHandlers) {
        // create an array to keep a counter of a maximum of 1 event listener for each element

        const [searchHandler, previewSelectHandler, closePreviewHandler] = previewHandlers

        this._previewInputStateArr = this._previewArray.map((state) => {
            return {
            'eventListenerCount': 0,
            'previewInputType': state.type,
            'previewInputEl': state.input,
            'previewValue': '',
            'typeName': state.typeName
            }
        });

        // TODO
        this._multiplePreviews = this._previewInputStateArr.length

        this._addHandlerPreviewSearch(searchHandler)
        this._addHandlerPreview(previewSelectHandler, closePreviewHandler)
    }

    // PREVIEWS
    _addHandlerPreviewSearch(handler) {
        
        // HIDE PREVIEW WINDOWS
        const hidePreview = function(e) {
            if (e.target.tagName !== 'A' && this._previewWindowEl && !this._previewWindowEl.classList.contains('hidden-visibility')) {
                console.log('problem');
                e.preventDefault();
                setTimeout(() => {
                    console.log('coming in');
                    console.log(document.activeElement);
                    console.log(this._previewInputEl);
                    if ((document.activeElement.classList.contains('form__input') && document.activeElement !== this._previewInputEl || !document.activeElement.classList.contains('form__input')) && !document.activeElement.classList.contains('preview__result--invalid')) {
                        console.log('closing');
                        clearEl(this._previewEl);
                        transparentEl(this._previewWindowEl);
                        this._validatePreviewInput();
                        this._focusedInput === undefined;
                    }
                }, PREVIEW_TIMEOUT_BLUR);
            }
        }

        document.querySelector('.content').addEventListener('click', hidePreview.bind(this));
        document.querySelector('.content').addEventListener('focus', hidePreview.bind(this));


        // FOCUS INPUT AND KEYSTROKE
        this._previewInputStateArr.forEach((previewInputState, i) => {

            previewInputState.previewInputEl.addEventListener('focus', (e) => {
                
                e.preventDefault();
                this._newPreviewInput = this._previewInputStateArr[i].previewInputType

                console.log(this._focusedInput, this._newPreviewInput);

                if(this._focusedInput !== undefined && this._focusedInput !== this._newPreviewInput) {
                    clearEl(this._previewEl);
                    transparentEl(this._previewWindowEl);
                    this._validatePreviewInput();
                }

                this._focusedInput = this._newPreviewInput;
                
                this._previewInputEl = previewInputState.previewInputEl;
                console.log(this._previewInputEl);
                console.log(previewInputState.previewInputEl.parentElement);
                this._previewEl = this._previewInputEl.parentElement.querySelector(`.preview--${previewInputState.previewInputType}`)
                console.log(`.preview--${previewInputState.previewInputType}`);
                console.log(this._previewEl);
                this._previewWindowEl = this._previewEl.closest('.form-dropdown');
                console.log(this._focusedInput);
                if(this._previewInputEl.value) handler(this, this._focusedInput);
                }
            );

            previewInputState.previewInputEl.addEventListener('keyup', (e) => { 
                e.preventDefault();
                handler(this, this._focusedInput);
            })
        }
    )}

    // clicked preview
    _addHandlerPreview(selectHandler, closeHandler) {

        this._previewInputStateArr.forEach((state) => {
            document.addEventListener('click', (e) => {
                if(e.target.closest(`.btn--close-preview--${state.previewInputType}`)) {
                    e.preventDefault();
                    this._closePreviewBtn = e.target.closest('.btn--close-preview')
                    console.log('closing prev');
                    closeHandler(this);
                }
                else if(e.target.closest(`.preview--${state.previewInputType}`)) {
                    e.preventDefault();
                    selectHandler(this, e.target);
                }
            })
        })
    }

    _validatePreviewInput() {
        this._previewInputEl.style.borderBottom = '3px solid #f6bdc0';
    }

    getPreviewQuery() {
        const query = this._previewInputEl.value; 
        return query;
    }

    renderPreviewResults(results) {

        clearEl(this._previewEl);

        if (!results || (Array.isArray(results) && results.length === 0)) return;

        // CONVERT TO CLASS PROPERTY
        this._results = results;
        const markup = this._generatePreviewMarkup();

        this._previewEl.insertAdjacentHTML('afterbegin', markup);
    }

    // Device filter form will be using its own function
    renderPreview(el) {
        
        // get selected element and insert into input
        this._selectedPreviewEl = el.closest(`.preview--${this._focusedInput}-component`);
        if (this._selectedPreviewEl.classList.contains('preview__result--invalid')) {
            return; 
        }

        this._previewInputEl.value = '';

        this._previewInputEl.insertAdjacentElement('afterend', this._selectedPreviewEl);

        // add close button
        this._selectedPreviewEl.insertAdjacentHTML('beforeend', `<svg class="btn--close-preview btn--close-preview--${this._focusedInput}" data-input-type="${this._focusedInput}"><use href="${icons}#icon-circle-with-cross"></use></svg>`);

        this._updatekeyValue(this._focusedInput, this._selectedPreviewEl.dataset.previewValue)

        this._updatePreviewFunctionality(true)
    }

    _updatePreviewState(curinputType, newPreviewValue) {
        this._previewInputStateArr.forEach((state) => {
            state.previewInputType === curinputType ? state.previewValue = newPreviewValue : state.previewValue = state.previewValue
        })
    }
        
    // TODO what exactly does clearEls do??
    _updatePreviewFunctionality(clearEls = false) {
        // update the value of the preview value
        this._updatePreviewState(this._focusedInput, this._selectedPreviewEl.dataset.previewValue)

        console.log(window.location.search);
        console.log(this._previewInputStateArr.map((state) => state.previewValue));
        
        // this._form.querySelector(`.btn--close-preview--${this._focusedInput}`).addEventListener('click', this.closePreview.bind(this));

        // hide window and input, and clear preview suggestions
        hideEl(this._previewInputEl);
        
        if(clearEls) {    
            clearEl(this._previewEl);
            transparentEl(this._previewWindowEl);
        }

        // styles
        this._selectedPreviewEl.classList.add('selected');

        // tell handler to get the current user
        if (this.type === 'returned-device') {
            this._form.dispatchEvent(this._previewLoadedEvent);
        }
    }


    closePreview() {

        console.log(this._closePreviewBtn);
        const closingInputEl = this._closePreviewBtn.parentElement.parentElement.querySelector('.form__input');
        console.log(closingInputEl);
        showEl(closingInputEl);
        const closingPreviewEl = this._closePreviewBtn.closest(`.preview__result`);
        closingPreviewEl.remove();
        console.log(closingPreviewEl);
        // closingInputEl.value = '';

        this._updatePreviewState(this._closePreviewBtn.dataset.inputType, '')
        this._updatekeyValue(this._closePreviewBtn.dataset.inputType, '')


        // window.location.hash = ''
        this._focusedInput = undefined;

        if (this.type === 'returned-device') {
            clearEl(this._insertUserLocationEl);
            this._insertUserLocationEl.style.padding = '0rem';
            this._eventId = undefined
            this._fileName = undefined
        }
    }

    renderAutoDevicePreview(data) {

        document.querySelector('.preview__result.preview--asset-tag.selected')?.remove();
        document.querySelector('.preview__result.preview--user-name.selected')?.remove();

        this._focusedInput = 'asset-tag'
        this._previewInputEl = this._at;
        this._previewInputEl.focus();

        // device is the details
        const {assetId, assetTag, modelName, serialNumber} = data;

        const markup = 
        `<div class="preview__result preview--${this._focusedInput}" data-preview-value="${assetId}">
            <h3 class="preview__value--asset-tag">${assetTag}</h3>
            <h4 class="preview__value--model-name">${modelName}</h4>
            <h5 class="preview__value--serial-number">${serialNumber}</h5>
        </div>`

        this._previewInputEl.insertAdjacentHTML('afterend', markup);
        this._selectedPreviewEl = this._form.querySelector(`.preview--${this._focusedInput}`)

        this._selectedPreviewEl.insertAdjacentHTML('beforeend', `<svg class="btn--close-preview btn--close-preview--${this._focusedInput}" data-input-type="${this._focusedInput}"><use href="${icons}#icon-circle-with-cross"></svg>`);

        this._updatePreviewFunctionality();
    }

    renderAutoUserPreview(data) {

        document.querySelector('.preview__result.preview--user-name.selected')?.remove();

        this._focusedInput = 'user-name'
        this._previewInputEl = this._un;
        console.log(this._un);
        this._previewInputEl.focus();

        // user is the details
        console.log(data);
        const {deptName, userId, userName} = data;

        const markup = 

        `<div class="preview__result preview--${this._focusedInput}" data-preview-value="${userId}">
            <h3 class="preview__value--user-name">${userName}</h3>
            <h4 class="preview__value--dept-name">${deptName}</h4>
        </div>`

        this._previewInputEl.insertAdjacentHTML('afterend', markup);
        this._selectedPreviewEl = this._form.querySelector(`.preview--${this._focusedInput}`)

        this._selectedPreviewEl.insertAdjacentHTML('beforeend', `<svg class="btn--close-preview btn--close-preview--${this._focusedInput}" data-input-type="${this._focusedInput}"><use href="${icons}#icon-circle-with-cross"></svg>`);

        this._updatePreviewFunctionality();
    }

    _updatekeyValue(key, value) {

        if (this.type === 'register-device') return;

        // get current key values in url
        const searchParams = new URLSearchParams(window.location.search)

        console.log(searchParams.toString());

        if (value === '') {
            searchParams.delete(key)
        } else {
            key === 'asset-tag' ? searchParams.set('asset-tag', value) : searchParams.set('user-name', value)
        }

        const newURL = `${window.location.pathname}?${searchParams.toString()}`;

        history.pushState({}, '', newURL);
    }

    removePreviews() {
        document.querySelectorAll('.selected')?.forEach((el) => el.remove())
    }

    // FOR EXCEL
    _resetPreviewValues() {
        this._previewInputStateArr.forEach((state) => {
            state.previewInputEl.value = '';
            state.previewValue = '';
            state._focusedInput = undefined;
        })
    }

    showInputPreviews() {
        this._previewInputStateArr.forEach(state => {
            showEl(state.previewInputEl)
        }) 
    }



    // FOR HISTORY AND DEVICES
    _generatePreviewMarkup() {

        return this._results.map((result) => `<div class="preview__result preview--${this._focusedInput}-component" data-preview-value="${encodeURIComponent(result['modelName'])}">
            <h3 class="preview__value small-font">${result['modelName']}</h3>
        </div><hr>`).join('');
    }

    renderBasicPreview(clickedEl) {
        console.log(clickedEl);

        const el = clickedEl.classList.contains('preview__value') ? clickedEl : clickedEl.querySelector('.preview__value')

        this._previewInputEl.value = el.innerHTML
    }
}