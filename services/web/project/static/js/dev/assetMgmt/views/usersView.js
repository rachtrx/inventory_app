import { eventToStatus, clearEl } from '../../utilities/helpers.js';
import { ASSET_HOMEPAGE_URL, BACKGROUND_COLORS } from '../../utilities/config.js';
import View from '../../utilities/showView.js';
import icons from 'url:../../../../sprite.svg'
import { setFormData } from '../../utilities/helpers.js';

class UsersView extends View {

    initialize(initFunction) {
        this._parentElement = document.querySelector('.users-grid')
        this._numResults = document.querySelector('.users-filter__count')
        // this._initializeLoadEvents();
        this._bookmarksBtn = document.querySelector('.btn-filter--bookmarks')
        this.setBookmarkSvg('hide')
        this._scrollStartEl = document.querySelector('.users-grid')
        initFunction();

        this._form = document.querySelector('.users-filter')
    }

    addHandlerExportExcel(handler) {
        document.querySelector('.btn--export-excel--users').addEventListener('click', () => {
            handler();
        })
    }
    
    _generateMarkup() {
        return this._data.map((user) => `
            <div class="card--users" data-user-id="${user.userId}">
                <a class="card--users__details" href="${ASSET_HOMEPAGE_URL}views/show_user#${user.userId}">
                    <h2 class="card--users__details--name">${user.userName}</h2>
                    <h5 class="card--users__details--dept">${user.deptName}</h5>
                </a>

                <div class="card--users__devices">
                    <h3 class="card--users__devices-header">Devices</h3>
                    <div class="scroll-window">
                        ${user.devices ? user.devices.map((device) => 
                        `<div class="scroll-window--current-device">
                            <a class="btn-text--device" href="${ASSET_HOMEPAGE_URL}views/show_device#${device.assetId}">
                                <span class="card--users__devices--asset-tag">${device.assetTag}</span>
                                <span class="card--users__devices--device-model">${device.modelName}</span>
                            </a>
                            <a class="btn-text--return" href="${ASSET_HOMEPAGE_URL}forms/returned_device?asset-tag=${device.assetId}">Return Device</a>
                        </div>`).join('') : ''}
                    </div>
                </div>

                <button class="btn--round btn--round--absolute">
                    <svg>
                        <use href="${icons}#icon-bookmark${user.bookmarked === 1 ? '-fill' : ''}"></use>
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

        setFormData(formData, 'deptName')
        setFormData(formData, 'deviceCount')
        setFormData(formData, 'userName')
        

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

    renderDeviceCount(countArr) {
        this._deviceCountEl = document.querySelector('.form__input--device-count')

        const markup = `<option selected>All</option>` + countArr.map((count) => `<option>${count}</option>`).join('')

        this._deviceCountEl.innerHTML = markup
    }
}

export default new UsersView()