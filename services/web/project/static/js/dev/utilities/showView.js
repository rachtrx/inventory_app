import { clearEl, opaqueEl, transparentEl } from "./helpers.js";
import icons from 'url:../../../sprite.svg'

export default class View {

    _overlayEl = document.querySelector('.overlay');
    _popupWindowEl = document.querySelector('.window');
    _popupFields = [this._overlayEl, this._popupWindowEl]

    renderError(errMsg) {
        console.log('hi');
        
        const markup = `
        <button class="btn--close-modal">&times;</button>
        <h3 class="error-window-header"></h3>
        <h5 class="error-window-message"></h5>`
        
        opaqueEl( ...this._popupFields);
        clearEl(this._popupWindowEl)
        this._popupWindowEl.insertAdjacentHTML('afterbegin', markup)
        const popupHeaderEl = document.querySelector('.error-window-header');
        const popupMessageEl = document.querySelector('.error-window-message');
        popupHeaderEl.textContent = 'Error!'
        popupMessageEl.textContent = errMsg;
    }

    _addHandlerCloseError() {
        console.log(this._popupFields); 

        document.addEventListener('click', this._closeErrorCallback.bind(this));
    }

    _closeErrorCallback(e) {
        if(e.target.closest('.btn--close-modal')) {
            console.log(e.target);
            transparentEl(...this._popupFields);
        }
        if(!e.target.closest('.window') && document.querySelector('.btn--close-modal')) {
            console.log(e.target);
            transparentEl(...this._popupFields);
        }
    }

    render(data) {
        if (!data) return;
        
        this._data = data;
        const markup = this._generateMarkup();

        console.log(this._parentElement);
        clearEl(this._parentElement)

        // INSERT DATA
        this._parentElement.insertAdjacentHTML('beforeend', markup);
    }

    updateNumResults(numResults) {
        console.log('updating');
        console.log(this._numResults);
        console.log(this._numResults.innerHTML);
        this._numResults.innerHTML = `${numResults} results found`
    }

    addEditHandlers(handler) {
        ["deviceLoaded", "userLoaded"].forEach((ev) => document.addEventListener(ev, () => {
            this._editBtns = document.querySelectorAll('.btn--timeline__edit')
            this._editBtns.forEach((btn) => btn.addEventListener('click', (e) => {
                console.log('hello');
                this.editRemarks(e)
                handler(e)
            }))
        }))
    }

    editRemarks(e) {
        this._focusedRemark = e.target.previousElementSibling;
        this._focusedRemark.contentEditable = true;
        this._focusedRemark.classList.add('timeline__editable');

        this._editBtns.forEach((editBtn) => transparentEl(editBtn));
        opaqueEl(e.target)
        e.target.innerHTML = 'Save'

    }

    // can only add and remove bookmark from individual page view
    addHandlerAddBookmark(handler) {
        this._parentElement.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn--bookmark') // event delegation: btn--bookmark did not exist yet
            if (!btn) return;
            handler(this);
        })
    }

    update(data) {
        // dont make sense
        // if (!data || (Array.isArray(data) && data.length === 0)) return this.renderError();

        this._data = data;
        const newMarkup = this._generateMarkup(); // generate markup but not render it; compare with current HTML
        
        // convert markup string to a DOM object living in memory
        const newDOM = document.createRange().createContextualFragment(newMarkup); // virtual DOM that is not on page but in memory
        const newElements = Array.from(newDOM.querySelectorAll('*'));
        const curElements = Array.from(this._parentElement.querySelectorAll('*'));

        newElements.forEach((newEl, i) => {
            const curEl = curElements[i];
            // console.log(curEl, newEl.isEqualNode(curEl)); // isEqualNode checks if contents are the same

            // change text
            if(!newEl.isEqualNode(curEl) && newEl.firstChild?.nodeValue.trim() !== '') { // text node is the 1st child node of the element!!
                curEl.textContent = newEl.textContent;
            }

            // change attributes
            if(!newEl.isEqualNode(curEl)) // .attributes returns an object of attributes, we can create an attribute array (with each attribute being an object with name and value properties)
                Array.from(newEl.attributes).forEach(attr => curEl.setAttribute(attr.name, attr.value))
        })
    }

    addHandlerFilterBookmark(handler) {
        this._bookmarksBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handler(this)
        })
    }

    setBookmarkSvg(mode) {

            const markup = `
            <svg>
                <use href="${icons}#icon-bookmark${mode === 'show' ? '-fill' : ''}"></use>
            </svg>
            <span class="filter-bookmarks__text">Bookmarks</span>`

            this._bookmarksBtn.style.opacity = mode === 'show' ? '1' : '0.5'
            clearEl(this._bookmarksBtn)
            this._bookmarksBtn.insertAdjacentHTML('afterbegin', markup)
    }

    addHandlerDownloadFile(handler) {
        document.addEventListener('click', (e) => {
            if(e.target.closest('.btn--file-download')) {
                e.preventDefault()
                handler(e.target.closest('.btn--file-download').dataset.eventId);
            }
        })
    }

    // filter for devices, users, history
    addHandlerClearFilter(handler) {
        this._form.addEventListener("reset", () => handler(this))
    }
}