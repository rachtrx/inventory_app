import View from '../../utilities/showView.js';
import { eventToStatus } from '../../utilities/helpers.js';
import { ASSET_HOMEPAGE_URL } from '../../utilities/config.js';
import icons from 'url:../../../../sprite.svg'
import { dateTimeObject } from '../../utilities/config.js';

class ShowDevice extends View {

    initialize(initFunction) {
        this._parentElement = document.querySelector('.show-device')
        console.log(this._parentElement);
        this._deviceStatus;
        this._addHandlerCloseError();
        initFunction();
    }
    
    _generateMarkup() {
        console.log(this._data);
        const {details, events, pastUsers, currentUser} = this._data;
        console.log(details);
        this._assetId = details.assetId
        this._deviceStatus = details.status;

        return `

        <div class="show-device-overview">
            <div class="show-device-container">
                <h1 class="show-device-details__asset-tag">Asset Tag: ${details.assetTag}</h1>
                <div class="show-device-details">
                    <h4 class="show-device-details__serial-number">Serial Number: ${details.serialNumber}</h4>
                    <h4 class="show-device-details__model-name">Model: ${details.modelName}</h4>
                    <h4 class="show-device-details__device-type">Type: ${details.deviceType}</h4>
                    <h4 class="show-device-details__device-type">Vendor: ${details.vendorName}</h4>
                    <div class="location-edit-component">
                        <h4 class="show-device-details__model-value">Value: </h4>
                        <h4 class="edit-el">${details.modelValue}</h4>
                        <a class="btn btn--edit btn--edit__value">Edit</a>
                        <a class="btn btn--save btn--save__value hidden-visibility" data-model-value="${details.assetId}">Save</a>
                    </div>
                    <div class="location-edit-component">
                        <h4 class="show-device-details__location">Location: </h4>
                        <h4 class="edit-el">${details.location}</h4>
                        <a class="btn btn--edit btn--edit__location">Edit</a>
                        <a class="btn btn--save btn--save__location hidden-visibility" data-location-name="${details.assetId}">Save</a>
                    </div>
                </div>
            </div>

            <div class="show-device-users--past">
                <h2 class="show-device-user-title">PAST USERS</h2>
                <hr />
                ${pastUsers.map((user) => `
                <a class="btn-text--user" href="${ASSET_HOMEPAGE_URL}views/show_user#${user.userId}">
                    <h4 class="show-device-user__name">${user.userName}</h4>
                </a>`).join('')}
            </div>

            <div class="show-device-users--current">
                <h2 class="show-device-user-title">STATUS</h2>
                <hr />
                <div class="show-device-user__status ${details.status === 'loaned' ? 'unavailable' : 'available'}">${eventToStatus(details.status)}</div>
                ${details.status === 'loaned' ? 
                `<div class="show-device-user__name-group">
                    <h3 class="show-device-user__name-title">USER:</h3>
                    <a class="btn-text--user" href="${ASSET_HOMEPAGE_URL}views/show_user#${currentUser.userId}">
                        <h4 class="show-device-user__name">${currentUser.userName}</h4>
                    </a>
                </div>
                <a class="btn-text--return" href="${ASSET_HOMEPAGE_URL}forms/returned_device?asset-tag=${details.assetId}">Return Device</a>` : ''}
            </div>
            <div class="show-device-actions">
                <button class="btn--round btn--bookmark">
                    <svg>
                        <use href="${icons}#icon-bookmark${details.bookmarked === 1 ? '-fill' : ''}"></use>
                    </svg>
                </button>
                ${details.status !== 'condemned' && details.status !== 'loaned' ? `<button class="btn btn--condemn" data-asset-id="${details.assetId}">CONDEMN</button>
                <button class="btn btn--loan" data-asset-id="${details.assetId}">LOAN</button>`: ''}
            </div>
        </div>

        <div class="timeline--show-device">

            ${events.map((ev, id) => {
                console.log(ev);
                if(id % 2 === 0) {
                    return `<div class="timeline__component">
                        <div class="timeline__date timeline__date--right">${ev.eventDate}</div>
                    </div>
                    <div class="timeline__middle">
                        <div class="timeline__point${id === events.length - 1 ? ' timeline__point--bottom' : ''}"></div>
                    </div>
                    <div class="timeline__component timeline__component--bg">
                        ${ev.eventType ? `<h3 class="timeline__title">${details.assetTag} was ${ev.eventType} ${ev.userName ? `by ${ev.userName}` : ''}</h3>` : ''}
                        <p class="timeline__paragraph edit-el">${ev.remarks ?? ''}</p>
                        <div class="timeline-edit-component">
                            <a class="btn btn--edit btn--edit__timeline">Edit</a>${ev.filePath ? `
                            <a class="btn btn--file-download" data-event-id="${ev.eventId}">Download PDF</a>` : ''}
                            <a class="btn btn--save btn--save__timeline hidden-visibility" data-event-id="${ev.eventId}">Save</a>
                        </div>
                    </div>`
                } else {
                return `
                <div class="timeline__component timeline__component--bg">
                    ${ev.eventType ? `<h3 class="timeline__title">${details.assetTag} was ${ev.eventType}</h3>` : ''}
                    <p class="timeline__paragraph edit-el">${ev.remarks ?? ''}</p>
                    <div class="timeline-edit-component">
                        <a class="btn btn--edit btn--edit__timeline">Edit</a>${ev.filePath ? `
                        <a class="btn btn--file-download" data-event-id="${ev.eventId}">Download PDF</a>` : ''}
                        <a class="btn btn--save btn--save__timeline hidden-visibility" data-event-id="${ev.eventId}">Save</a>
                    </div>
                </div>
                <div class="timeline__middle">
                    <div class="timeline__point${id === events.length - 1 ? ' timeline__point--bottom' : ''}"></div>
                </div>
                <div class="timeline__component">
                    <div class="timeline__date">${ev.eventDate}</div>
                </div>`
                }
            }).join('')}

        </div>`
    }

    addActionHandlers(handler) {

        document.addEventListener("click", (e) => {

            if(e.target.closest('.btn--loan')) {
                handler(e.target.dataset.assetId, 'loan');
            }

            if(e.target.closest('.btn--condemn')) {
                console.log(e.target.dataset.assetId);
                handler(e.target.dataset.assetId, 'condemned');
            }

            if(e.target.closest('.btn--return')) {
                console.log(e.target.dataset.assetId);
                handler(e.target.dataset.assetId, 'returned');
            }
        })
    }
}

export default new ShowDevice()