import { eventToEvent, setFormData } from '../../utilities/helpers.js';
import { ASSET_HOMEPAGE_URL } from '../../utilities/config.js';
import { dateTimeObject } from '../../utilities/config.js';
import PreviewView from '../../utilities/formHelpers/previewView.js';
import { setFormData } from '../../utilities/helpers.js';

class HistoryView extends PreviewView {

    initialize(initFunction, previewHandlers) {
        this._eventElArr = document.querySelectorAll('.history-event')
        this._parentElement = document.querySelector('.table-body')
        console.log(this._parentElement);
        // this._eventLoadedEvent = new Event("eventLoaded");
        this._numResults = document.querySelector('.history-filter__count')
        // this._initializeLoadEvents();
        this._scrollStartEl = document.querySelector('.table')
        initFunction();

        this._mn = document.querySelector('.form__input--model-name')

        // Model preview SEARCH
        this._previewArray = [{'type':'model-name','input': this._mn, 'typeName': 'Model Name'}];

        this._initializePreview(previewHandlers);

        // submit filter
        this._form = document.querySelector('.history-filter')
    }

    addHandlerFilter(handler) {
        this._form.addEventListener("submit", (e) => {
        console.log('prevent');
        e.preventDefault(); // Prevent default form submission behavior

        const form = e.target;
        const formData = new FormData(form);

        setFormData(formData, 'modelName')
        setFormData(formData, 'id')
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

    addHandlerExportExcel(handler) {
        document.querySelector('.btn--export-excel--history').addEventListener('click', () => {
            handler();
        })
    }

    addHandlerRedirect() {
        this._parentElement.addEventListener('click', (e) => {
            const userId = e.target.closest('.table-data--person_name')?.dataset.userId
            if(!userId) {
                const assetId = e.target.closest('.table-data').dataset.assetId
                if(!assetId) {
                    const userId = e.target.closest('.table-data').dataset.userId
                    window.location.href = `${ASSET_HOMEPAGE_URL}views/show_user#${userId}`
                    return;
                } else {
                    window.location.href = `${ASSET_HOMEPAGE_URL}views/show_device#${assetId}`
                    return;
                }
            } else {
                window.location.href = `${ASSET_HOMEPAGE_URL}views/show_user#${userId}`
            }
        })
    }
    
    renderEvents() {
        this._eventDes = this._data.reduce((eventArr, event) => { 
            if(eventArr.length < 4 && event.eventType === 'loaned' || event.eventType === 'returned')
            eventArr.push(`
            <span class="history-event__datetime">${event.eventDate}</span>
            <p class="history-event__description">${event.assetTag} (S/N ${event.serialNumber}) was ${event.eventType} ${event.userName ? `by ${event.userName}` : 'by Admin'}</p>`)
            return eventArr
        }, [])

        console.log(this._eventDes);

        this._eventElArr.forEach((eventEl, i) => eventEl.innerHTML = this._eventDes[i])
    }

    _generateMarkup() {
        return this._data.map((event) => {
            return `
            <tr class="table-data" ${event.assetId ? `data-asset-id="${event.assetId}">` : `data-user-id="${event.userId}">`}
                <td data-cell="asset tag" class="table-data--asset_tag">${event.assetTag || '-'}</td>
                <td data-cell="serial number" class="table-data--serial_number">${event.serialNumber || '-'}</td>
                <td data-cell="device type" class="table-data--device_type">${event.deviceType || '-'}</td>
                <td data-cell="model name" class="table-data--model_name">${event.modelName || '-'}</td>
                <td data-cell="event type" class="table-data--event_type">${event.eventType}</td>
                <td data-cell="person name" class="table-data--person_name" data-user-id="${event.userId}">${event.userName || '-'}</td>
                <td data-cell="event date" class="table-data--event_date">${Intl.DateTimeFormat('en-sg', dateTimeObject).format(new Date(event.eventDate))}</td>
            </tr>`}).join('')
    }
}

export default new HistoryView()