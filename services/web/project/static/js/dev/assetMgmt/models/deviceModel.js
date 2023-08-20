import { AJAX } from '../../utilities/helpers.js';
import { state, resetSearchState, resetState, compareObjectsFilter } from './model.js';
import { createEventObject } from './eventModel.js'
import { ASSET_HOMEPAGE_URL } from '../../utilities/config.js';
import { dateTimeObject } from '../../utilities/config.js';

// LOAD CHARTS
export const getOverview = async function() {
    try {
        const data = await AJAX(`${ASSET_HOMEPAGE_URL}api/devices_overview`)
    
        console.log('hello model');
        return data;
    
        } catch(err) {
            throw err;
        }
    }

export const createDeviceObject = function(device) {
    return {
      assetId: device.asset_id || device.id,
      serialNumber: device.serial_number,
      assetTag: device.asset_tag,
      modelName: device.model_name,
      bookmarked: device.device_bookmarked || device.bookmarked || 0,
      status: device.status,
      vendorName: device.vendor_name,
      modelValue: String(parseFloat(device.model_value).toFixed(2)) || 'Unspecified',
      ...(device.registered_date && {registeredDate: Intl.DateTimeFormat('en-sg', dateTimeObject).format(new Date(device.registered_date))}),
      ...(device.user_name && {userName: device.user_name}),
      ...(device.user_id && {userId: device.user_id}),
      ...(device.user_bookmarked && {userbookmarked: device.user_bookmarked}),
      ...(device.device_type && {deviceType: device.device_type}),
      ...(device.location && {location: device.location}),
      ...(device.device_age && {deviceAge: device.device_age}),
      ...(device.device_type && {deviceType: device.device_type})
    }
}

// LOAD USERS / CHART CLICKED FILTER
export const getDevices = async function() {
try {

    const data = await AJAX(`${ASSET_HOMEPAGE_URL}api/all_devices`)
    if(!data) return
    console.log(data);
    const results = data.map(device => createDeviceObject(device))
    console.log(results);
    
    state.allResults = results;
    resetState(state.allResults)
    console.log(state);

    } catch(err) {
        throw err;
    }
}

export const getFilterDevices = function() {
    const urlSearchParams = new URLSearchParams(window.location.search);

    filters = {}
    for (const [key, value] of urlSearchParams.entries()) {
      if (value === 'All') continue;
      filters[decodeURIComponent(key)] = decodeURIComponent(value);
    }

    const newResults = state.allResults.filter((result) => {
        valid = true;

        
        valid = compareObjectsFilter(filters, result, 'deviceType', 'vendorName', 'status', 'location', 'deviceAge')
        if(!valid) return valid

        if (filters.id)
        valid = result.assetTag?.includes(filters.id.toUpperCase()) || result.serialNumber.includes(filters.id.toUpperCase()) 

        if(!valid) return valid
        
        if (filters.modelName)
        valid = result.modelName?.toUpperCase().includes(filters.modelName.toUpperCase())

        return valid
    })

    console.log(filters);

    resetState(newResults)

}

// INDIVIDUAL DEVICE AND USER
export const getDevice = async function(deviceId) {
    try {
      const data = await AJAX(`${ASSET_HOMEPAGE_URL}api/devices/${deviceId}`)
      const [details, events, pastUsers, currentUser] = data
      console.log(details);
      const finalDetails = details.map(device => createDeviceObject(device))
      const finalEvents = events.map(event => createEventObject(event))
      const finalPastUsers = pastUsers.map(user => ({userId: user.user_id, userName: user.user_name}))
      const finalCurrentUser = currentUser.map(user => ({userId: user.user_id, userName: user.user_name}))
  
      state.object = {
        details: finalDetails[0],
        events: finalEvents,
        pastUsers: finalPastUsers,
        currentUser: finalCurrentUser[0]
      }
  
      console.log(state.object);
    } catch(err) {
      throw err;
    }
}