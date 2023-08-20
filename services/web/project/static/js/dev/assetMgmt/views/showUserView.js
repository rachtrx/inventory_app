import View from '../../utilities/showView.js';
import { eventToStatus } from '../../utilities/helpers.js';
import { ASSET_HOMEPAGE_URL, dateTimeObject } from '../../utilities/config.js';
import icons from 'url:../../../../sprite.svg'

class ShowUser extends View {

    initialize(initFunction) {
        this._parentElement = document.querySelector('.show-user')
        console.log(this._parentElement);
        this._addHandlerCloseError();
        initFunction();
    }
    
    _generateMarkup() {
        
        const {details, events, pastDevices, currentDevices} = this._data;
        this._userId = details.userId;
        console.log(details.userId);
        console.log(currentDevices);
        console.log(events);

        return `

        <div class="show-user-overview">
            <div class="show-user-details">
                <h1 class="show-user-details__name">${details.userName}</h1>
                <h2 class="show-user-details__dept">${details.deptName}</h2>
            </div>

            <div class="show-user-devices--past">
                <h2 class="show-user-device-title">PAST DEVICES</h2>
                <hr />
                <div class="scroll-window">
                ${pastDevices.map((device) => `
                    <a class="btn-text--device" href="${ASSET_HOMEPAGE_URL}views/show_device#${device.assetId}">
                        <h3 class="show-user-device__asset-tag">${device.assetTag}</h3>
                        <h5 class="show-user-device__model-name">${device.modelName}</h5>
                    </a>`)}
                </div>
            </div>

            <div class="show-user-devices--current">
                <h2 class="show-user-device-title">CURRENT DEVICES</h2>
                <hr />
                <div class="scroll-window">
                ${currentDevices.map((device) => `
                    <div class="scroll-window--current-device">
                        <a href="${ASSET_HOMEPAGE_URL}views/show_device#${device.assetId}" class="btn-text--device">
                            <h3 class="btn-text--device__asset-tag">${device.assetTag}</h3>
                            <h5 class="btn-text--device__model-name">${device.modelName}</h5>
                        </a>
                        <a class="btn-text--return" href="${ASSET_HOMEPAGE_URL}forms/returned_device?asset-tag=${device.assetId}">Return Device</a>
                    </div>`)}
                </div>
            </div>
            <div class="show-user-actions">
                <button class="btn--round btn--bookmark">
                    <svg>
                        <use href="${icons}#icon-bookmark${details.bookmarked === 1 ? '-fill' : ''}"></use>
                    </svg>
                </button>
                ${currentDevices.length === 0 && details.hasResigned !== 1 ? `<button class="btn btn--resign" data-user-id="${details.userId}">Resign</button>` : ''}
                ${details.hasResigned !== 1 ? `<button class="btn btn--loan" data-user-id="${details.userId}">Loan Device</button>` : ''}
            </div>
        </div>

        <div class="timeline--show-user">

            ${events.map((ev, id) => {
                if(id % 2 === 0) {
                    return `<div class="timeline__component">
                        <div class="timeline__date timeline__date--right">${ev.eventDate}</div>
                    </div>
                    <div class="timeline__middle">
                        <div class="timeline__point${id === events.length - 1 ? ' timeline__point--bottom' : ''}"></div>
                    </div>
                    <div class="timeline__component timeline__component--bg">
                        ${ev.eventType ? `<h3 class="timeline__title">${ev.assetTag || 'User'} was ${ev.eventType}</h3>` : ''}
                        <p class="timeline__paragraph">${ev.remarks ?? ''}</p>
                        <div class="timeline-edit-component">
                            <a class="btn btn--edit btn--edit__timeline">Edit</a>${ev.filePath ? `
                            <a class="btn btn--file-download" data-event-id="${ev.eventId}">Download PDF</a>` : ''}
                            <a class="btn btn--save btn--save__timeline hidden-visibility" data-event-id="${ev.eventId}">Save</a>
                        </div>
                    </div>`
                } else {
                return `
                <div class="timeline__component timeline__component--bg">
                    ${ev.eventType ? `<h3 class="timeline__title">${ev.assetTag || 'User'} was ${ev.eventType}</h3>` : ''}
                    <p class="timeline__paragraph">${ev.remarks ?? ''}</p>
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

            if(e.target.closest('.btn--resign')) {
                handler(e.target.dataset.userId, 'remove');
            }

            if(e.target.closest('.btn--loan')) {
                handler(e.target.dataset.userId, 'loan');
            }

            if(e.target.closest('.btn--return')) {
                console.log(e.target.dataset.assetId);
                handler(e.target.dataset.assetId, 'returned');
            }
        })
        
    }
}

export default new ShowUser()