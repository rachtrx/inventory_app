import { eventToStatus, hideEl, showEl } from '../../utilities/helpers.js';
import { ASSET_HOMEPAGE_URL } from '../../utilities/config.js';
import icons from 'url:../../../../sprite.svg'
import PreviewView from '../../utilities/formHelpers/previewView.js';
import { setFormData } from '../../utilities/helpers.js';

class DevicesView extends PreviewView {

    initialize(initFunction, previewHandlers) {

        this._parentElement = document.querySelector('.devices-grid');
        this._numResults = document.querySelector('.devices-filter__count')
        initFunction();
        this._bookmarksBtn = document.querySelector('.btn-filter--bookmarks')
        this.setBookmarkSvg('hide')
        this._scrollStartEl = document.querySelector('.devices-grid')

        this._mn = document.querySelector('.form__input--model-name')

        // Model preview SEARCH
        this._previewArray = [{'type':'model-name','input': this._mn, 'typeName': 'Model Name'}];

        this._initializePreview(previewHandlers);

        // submit filter
        this._form = document.querySelector('.devices-filter')

        console.log(this._parentElement);
    }

    addHandlerExportExcel(handler) {
        document.querySelector('.btn--export-excel--devices').addEventListener('click', () => {
            handler();
        })
    }
    
    _generateMarkup() {
        // FILTER BAR + CARDS
        console.log(this._data);
        return this._data.map((device) => `
        <div class="card--devices data-asset-id="${device.assetId}">
            <a class="card--devices__details" href="${ASSET_HOMEPAGE_URL}views/show_device#${device.assetId}">
                <h2 class="card--devices__details--asset-tag">${device.assetTag}</h2>
                <h5 class="card--devices__details--serial-number">${device.serialNumber}</h5>
                <h5 class="card--devices__details--model-name">${device.modelName}</h5>
            </a>
            
            <div class="card--devices__status">
                <h3 class="card--devices__status-header">Status</h3>
                <span class="card--devices__status--status ${device.status === 'loaned' ? 'unavailable' : 'available'}">${eventToStatus(device.status)}</span>
                ${device.status === 'loaned' ? `<h4 class="card--devices__status-header--user">User</h4>
                <a class="btn-text--user" href="${ASSET_HOMEPAGE_URL}views/show_user#${device.userId}">
                    <span class="card--devices__status--user">${device.userName}</span>
                </a>` : ''}
            </div>

             
            <button class="btn--round btn--round--absolute">
                <svg>
                    <use href="${icons}#icon-bookmark${device.bookmarked === 1 ? '-fill' : ''}"></use>
                </svg>
            </button>

        </div>`).join('')
    }

    addHandlerFilter(handler) {
        this._form.addEventListener("submit", (e) => {
        console.log('prevent');
        e.preventDefault(); // Prevent default form submission behavior

        const form = e.target;
        const formData = new FormData(form);

        setFormData(formData, 'modelName')
        setFormData(formData, 'id')
        setFormData(formData, 'status', 'on loan', 'loaned')
        

        const updatedParams = new URLSearchParams(formData);

        // Replace the URL search parameters with the updated ones
        for (const [key, value] of formData.entries()) {
            updatedParams.delete(key)
            updatedParams.append(encodeURIComponent(key), encodeURIComponent(value));
        }
    
        // Create a new URL with the updated parameters
        const currentURL = window.location.href;
        const newURL = currentURL.split('?')[0] + '?' + updatedParams.toString();
    
        // Update the URL without reloading the page
        history.replaceState({}, '', newURL);

        handler()
        })
    }
}

export default new DevicesView()