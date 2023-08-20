import * as model from '../models/model.js';
import * as deviceModel from '../models/deviceModel.js';
import * as userModel from '../models/userModel.js';
import * as eventModel from '../models/eventModel.js';
import * as excelModel from '../models/excelModel.js';
import { controlDownloadPDF, controlPreviewResults, controlSelectPreview, controlClosePreview } from './assetFormController.js';

import devicesView from '../views/devicesView.js';
import usersView from '../views/usersView.js'
import showDevice from '../views/showDeviceView.js';
import showUser from '../views/showUserView.js';
import historyView from '../views/historyView.js'
import paginationView from '../views/paginationView.js';
import editView from '../views/editView.js';
import baseView from '../views/baseView.js';
import { ASSET_HOMEPAGE_URL } from '../../utilities/config.js';

const controlExportExcel = async function() {
    try {
        await excelModel.exportExcel()
    } catch(err) {
        throw err;
    }
}

const controlShowDashboard = async function() {
    try {
        const overview = await deviceModel.getOverview();
        baseView.initializeChart(overview);
        console.log(overview);


    } catch(err) {
        console.log(err);
    }
}

const controlClearFilters = function(viewObject) {
    const url = window.location.href;
    const urlWithoutQueryString = url.split('?')[0];
    window.history.replaceState({}, document.title, urlWithoutQueryString);
    
    model.clearFilters(); // very IMPT

    viewObject.render(model.getResultsPage());
    viewObject.updateNumResults(model.state.search.results.length);
    paginationView.render(model.state.search)
}

const controlShowDevices = async function() {
    try {
        await deviceModel.getDevices();
        
        devicesView.render(model.getResultsPage());
        devicesView.updateNumResults(model.state.search.results.length);
        paginationView.render(model.state.search);

    } catch(err) {
        console.log(err);
    }
}

const controlFilterDevices = function() {
    deviceModel.getFilterDevices();
    devicesView.render(model.getResultsPage())
    devicesView.updateNumResults(model.state.search.results.length)
    paginationView.render(model.state.search)
    model.state.search.bookmarked ? devicesView.setBookmarkSvg('show') : devicesView.setBookmarkSvg('hide')
}

// NORMAL
const controlShowUsers = async function() {
    try {
        await userModel.getUsers();
        usersView.renderDeviceCount(model.state.deviceCount)
        usersView.render(model.getResultsPage())
        usersView.updateNumResults(model.state.search.results.length)
        console.log(model.state.search.results);
        paginationView.render(model.state.search)
        
    } catch(err) {
        console.log(err);
    }
}

// FILTER
const controlFilterUsers = function() {
    userModel.getFilterUsers();

    usersView.render(model.getResultsPage())
    console.log(model.state.search.results);
    usersView.updateNumResults(model.state.search.results.length)
    paginationView.render(model.state.search)
    model.state.search.bookmarked ? usersView.setBookmarkSvg('show') : usersView.setBookmarkSvg('hide')
}

// HISTORY
const controlShowEvents = async function() {
    try {
        await eventModel.getEvents()
        historyView.render(model.getResultsPage())
        historyView.renderEvents(model.state.search.results)
        // debugger;
        historyView.updateNumResults(model.state.search.results.length)

        paginationView.render(model.state.search)

    } catch(err) {
        console.log(err);
    }
}

const controlFilterEvents = function() {
    eventModel.getFilterEvents();

    historyView.render(model.getResultsPage())
    historyView.updateNumResults(model.state.search.results.length)
    paginationView.render(model.state.search)
}

const controlFilterBookmarks = function(viewObject) {
        
    model.filterBookmarks()
    viewObject.render(model.getResultsPage())
    paginationView.render(model.state.search)
    console.log(model.state.search.results.length);
    viewObject.updateNumResults(model.state.search.bookmarks.length)
    model.state.search.bookmarked ? viewObject.setBookmarkSvg('show') : viewObject.setBookmarkSvg('hide')
}

// PAGINATION
const controlPagination = function(goToPage) {
    // render new results
    const page = model.state.page

    switch(page) {

        // VIEW DEVICES
        case `devices`:
            devicesView.render(model.getResultsPage(goToPage));
            break;

        // DEVICE HISTORY
        case `history`:
            historyView.render(model.getResultsPage(goToPage));
            break;


            // VIEW USERS
        case `users`:
            console.log(model.state.search.results.length);
            usersView.render(model.getResultsPage(goToPage));
            break;
    }
  
    // render new pagination buttons
    paginationView.render(model.state.search)
}


const controlShowDevice = async function() {

    try {
        const deviceId = window.location.hash.slice(1);
        await deviceModel.getDevice(deviceId);
        showDevice.render(model.state.object)
    } catch(err) {
        console.log(err);
    }
}

const controlShowUser = async function() {
    try {
        const userId = window.location.hash.slice(1);
        await userModel.getUser(userId);
        showUser.render(model.state.object)
    } catch(err) {
        console.log(err);
    }
}

const controlEdit = async function(type, id = undefined, data = undefined) {

    try {
        // id and data only passed if save btn was clicked
        if(!id && !data) {
            editView.renderEdit();
        } else {
            editView.renderSave();
            console.log(id, data);
            await model.updateEdit(type, id, data)
        }
    } catch(err) {
        console.log(err);
    }
}

const controlUpdateBookmark = async function(viewObject) {
    try {// add/remove bookmark
        console.log(model.state.object.details);
        if(!model.state.object.details.bookmarked) await model.addBookmark(model.state.object.details);
        else await model.deleteBookmark(model.state.object.details);

        // update view
        viewObject.update(model.state.object);
        console.log(model.state.object.details.bookmarked);
    } catch(err) {
        console.log(err);
    }
}

// FOR CONDEMN, LOAN and RETURN device
const controlDeviceActions = function(assetId, action) {
    window.location.href = `${ASSET_HOMEPAGE_URL}forms/${action}_device?asset-tag=${assetId}`
} 

const controlUserActions = function(id, action) {
    if(action === 'remove') {
        window.location.href = `${ASSET_HOMEPAGE_URL}forms/${action}_user?user-name=${id}`
    } else if(action === 'loan') {
        console.log('whats gg on');
        window.location.href = `${ASSET_HOMEPAGE_URL}forms/${action}_device?user-name=${id}`
    } else if(action === 'returned') {
        // DIFFERENT FOR RETURN
        window.location.href = `${ASSET_HOMEPAGE_URL}forms/${action}_device?asset-tag=${id}`
    }
} 

const init = function() {
    ['hashchange', 'load', 'popstate'].forEach(ev => window.addEventListener(ev, () => initializePage(ev)));
}

const initializePage = async function(ev) {
    // debugger;
    // const mainUrl = getCurrentMainUrl();

    const previewHandlers = [controlPreviewResults, controlSelectPreview, controlClosePreview]

    switch(window.location.pathname) {

        case `/asset/`:
            baseView.initialize(controlShowDashboard)
            break;

        // VIEW DEVICES
        case `/asset/views/devices`:

            // after the oage loads, get the data from the API
            // will be listening for closePreview, but does not return a result since it never renders the close button
            devicesView.initialize(controlShowDevices, previewHandlers);
            paginationView.initialize()
            paginationView.addHandlerClick(controlPagination, devicesView._scrollStartEl)
            model.state.page = 'devices'
            model.state.search.bookmarked = false;
            devicesView.addHandlerExportExcel(controlExportExcel)
            devicesView.addHandlerFilter(controlFilterDevices); // instead of add handler search
            devicesView.addHandlerClearFilter(controlClearFilters);
            devicesView.addHandlerFilterBookmark(controlFilterBookmarks);
                
            if(ev === 'popstate') {
                window.location.reload
            }
            break;

            // SHOW DEVICE: MIGHT BE DIFFICULT
        case `/asset/views/show_device`:
            model.state.page = 'device'
            showDevice.initialize(controlShowDevice);
            showDevice.addActionHandlers(controlDeviceActions);
            showDevice.addHandlerAddBookmark(controlUpdateBookmark)
            showDevice.addHandlerDownloadFile(controlDownloadPDF)
            editView.addEditHandlers(controlEdit);
            break;

            // DEVICE HISTORY
        case `/asset/views/history`:
            model.state.page = 'history'
            historyView.initialize(controlShowEvents, previewHandlers);
            paginationView.initialize()
            paginationView.addHandlerClick(controlPagination, historyView._scrollStartEl)
            historyView.addHandlerExportExcel(controlExportExcel)
            historyView.addHandlerFilter(controlFilterEvents);
            historyView.addHandlerClearFilter(controlClearFilters);
            historyView.addHandlerRedirect()
            
            break;


            // VIEW USERS
        case `/asset/views/users`:
            model.state.page = 'users';
            usersView.initialize(controlShowUsers);
            paginationView.initialize()
            paginationView.addHandlerClick(controlPagination, usersView._scrollStartEl)
            model.state.search.bookmarked = false;
            usersView.addHandlerExportExcel(controlExportExcel)
            usersView.addHandlerFilter(controlFilterUsers)
            usersView.addHandlerClearFilter(controlClearFilters);
            usersView.addHandlerFilterBookmark(controlFilterBookmarks)

            if(ev === 'popstate') {
                window.location.reload
            }
            break;

            // SHOW USER: MIGHT BE DIFFICULT
        case `/asset/views/show_user`:
            model.state.page = 'user'
            showUser.initialize(controlShowUser);
            showUser.addActionHandlers(controlUserActions);
            showUser.addHandlerDownloadFile(controlDownloadPDF)
            showUser.addHandlerAddBookmark(controlUpdateBookmark)
            editView.addEditHandlers(controlEdit);
            break;
    }   
}

init();