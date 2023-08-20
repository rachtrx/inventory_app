import { AJAX } from '../../utilities/helpers.js';
import { ASSET_HOMEPAGE_URL, RES_PER_PAGE } from '../../utilities/config.js';
import { createDeviceObject } from './deviceModel.js';
import { createEventObject } from './eventModel.js';
import { createUserObject, combinedUsers } from './userModel.js';

export const state = {
    page: '',
    object: {},
    search: {
        // results is for the filter, results is for the actual results, cache is for bookmarks
        search: ``,
        results: [],
        bookmarks: [],
        page: 1,
        resultsPerPage: RES_PER_PAGE,
        bookmarked: false,
    },
    allResults: [],
    // FOR `OTHERS`
    labels: {},
    excel: false,
    fileLoaded: false,
    rawFormInputs: [],
    formInputs: [],
    pdfFile: {},
    excelFile: {}
};

export const compareObjectsFilter = function(filterObj, realObj, ...keys) {
  let identical = true;
  // console.log(realObj);

  for (const key of keys) {
      // console.log(key);
      // console.log(filterObj[key], realObj[key]);
      if (!(!filterObj[key] || String(filterObj[key]) === String(realObj[key]))) {
          // console.log(identical);
          identical = false
          break;
      }
  }
  return identical
}

export const clearFilters = function() {
  resetState(state.allResults)
  console.log(state);
}

const resetBookmarks = function() {
    state.search.bookmarked = false;
    state.search.bookmarks = state.search.results.filter((result) => {
      return result.bookmarked === 1 ? true : false
    })
}

export const resetState = function(newResults) {
    state.search.search = ``;
    state.search.results = newResults
    console.log(newResults);
    state.search.page = 1
    resetBookmarks();
    console.log(state.search.results);
}

export const getResultsPage = function(page = state.search.page) {  
  state.search.page = page;

  const start = (page - 1) * RES_PER_PAGE;
  const end = page * RES_PER_PAGE;

  if (state.search.bookmarked) return state.search.bookmarks.slice(start, end)

  else return state.search.results.slice(start, end)
}

// BOOKMARKS
export const addBookmark = async function(details) {
  try { 
    if (details.assetId) {
      await AJAX(`${ASSET_HOMEPAGE_URL}views/show_device`, [details.assetId, `add`]);
    } else if (details.userId) {
      await AJAX(`${ASSET_HOMEPAGE_URL}views/show_user`, [details.userId, `add`]);
    }

    // mark current bookmark
    state.object.details.bookmarked = 1;

  } catch(err) {
    throw err;
  }
}

export const deleteBookmark = async function(details) {
  try { 
    if (details.assetId) {
      await AJAX(`${ASSET_HOMEPAGE_URL}views/show_device`, [details.assetId, `delete`]);
    } else if (details.userId) {
      await AJAX(`${ASSET_HOMEPAGE_URL}views/show_user`, [details.userId, `delete`]);
    }

    // mark current bookmark
    state.object.details.bookmarked = 0;

  } catch(err) {
    throw err;
  }
}
  
export const filterBookmarks = function() {
    if (!state.search.bookmarked) {
        state.search.bookmarked = true;
    } else {
        state.search.bookmarked = false;
    }
}

export const updateEdit = async function(type, id, data) {
  try {
    await AJAX(`${ASSET_HOMEPAGE_URL}api/edit_data`, [type, id, data]);
  } catch(err) {
    throw err;
  }
}

// SECTION FORMS

// LOAD PREVIEW RESULTS
export const loadPreviewResults = async function(query, dataType) {
  try {

    let data;
    let results;

    let order = [];

    switch(dataType) {

      

      case `model-name`:  

        data = await AJAX(`${ASSET_HOMEPAGE_URL}api/models`, query);
        console.log(data);

        results = data.map(model => {
          return {
            deviceType: model.device_type,
            modelName: model.model_name,
            modelId: model.model_id,
          }
        })
        return results;
      // case 
      case `asset-tag`:

        if (state.page === 'loan device' || state.page === 'condemned device') order = 'available'
        else if (state.page === 'returned device') order = 'loaned'
        
        data = await AJAX(`${ASSET_HOMEPAGE_URL}api/devices`, [query, order]);
        
        results = data.map(device => createDeviceObject(device))

        return results;
      
      case `user-name`:
        if (state.page === 'loan device') order = false
        else if (state.page === 'remove user') order = true

        data = await AJAX(`${ASSET_HOMEPAGE_URL}api/users`, [query, order]);
        results =  combinedUsers(data.map(user => createUserObject(user)))
        return results;
      
    }
  } catch(err) {
    throw err;
  }
}
  
export const getPreviewUser = async function(assetId) {
  try {
    const [data, event] = await AJAX(`${ASSET_HOMEPAGE_URL}api/user`, assetId);
    console.log(event);

    const user = {
    userId: data[0].user_id,
    deptName: data[0].dept_name,
    userName: data[0].user_name,
    ...(event[0].event_id && event[0].filepath && {eventId: event[0].event_id, fileName: event[0].filepath}),
    }

    console.log(user);
    return user;
  } catch(err) {
    throw err;
  }
}

export const uploadData = async function(data = state.formInputs) {
  
  try {

    let res;
    console.log(data);

    switch(state.page) {
        case `onboard`:
          console.log(data);
          res = await AJAX(`${ASSET_HOMEPAGE_URL}forms/onboard`, data)
          break;

        case `register model`:
          res = await AJAX(`${ASSET_HOMEPAGE_URL}forms/register_model`, data);
          break;

        case `register device`:
          console.log(data);
          res = await AJAX(`${ASSET_HOMEPAGE_URL}forms/register_device`, data)
          break;

        case `loan device`:
          console.log(data);
          res = await AJAX(`${ASSET_HOMEPAGE_URL}forms/loan_device`, data)
          break;

        case `returned device`:
          res = await AJAX(`${ASSET_HOMEPAGE_URL}forms/returned_device`, data)
          break;

        case `condemned device`:
          res = await AJAX(`${ASSET_HOMEPAGE_URL}forms/condemned_device`, data)
          break;

        case `create user`:
          res = await AJAX(`${ASSET_HOMEPAGE_URL}forms/create_user`, data)
          break;

        case `remove user`:
          res = await AJAX(`${ASSET_HOMEPAGE_URL}forms/remove_user`, data)
          break;

        case `upload pdf`:
          res = await AJAX(`${ASSET_HOMEPAGE_URL}api/upload_pdf`, data, false)
          break;

        default:
          break;
    }

    return res;
  }  catch(err) {
    throw err;
  }
}