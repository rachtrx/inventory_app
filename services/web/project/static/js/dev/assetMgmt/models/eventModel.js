import { ASSET_HOMEPAGE_URL } from '../../utilities/config.js';
import { AJAX } from '../../utilities/helpers.js';
import { state, resetSearchState, resetState, compareObjectsFilter } from './model.js';
import { dateTimeObject } from '../../utilities/config.js';

export const createEventObject = function(event) {
    return {
        eventDate: Intl.DateTimeFormat('en-sg', dateTimeObject).format(new Date(event.event_date)),
        eventId: event.event_id,
        ...(event.asset_id && {assetId: event.asset_id}),
        ...(event.event_type && {eventType: event.event_type}),
        ...(event.user_id && {userId: event.user_id}),
        ...(event.remarks && {remarks: event.remarks}),
        ...(event.asset_tag && {assetTag: event.asset_tag}),
        ...(event.user_name && {userName: event.user_name}),
        ...(event.serial_number && {serialNumber: event.serial_number}),
        ...(event.device_type && {deviceType: event.device_type}),
        ...(event.model_name && {modelName: event.model_name}),
        ...(event.filepath && {filePath: event.filepath}),
    }
}

// HISTORY
export const getEvents = async function() {
  try {
    const data = await AJAX(`${ASSET_HOMEPAGE_URL}api/all_events`)
    const results = (data.map(event => createEventObject(event)))

    console.log(results);
    // TODO
    state.allResults = results
    resetState(state.allResults);

  } catch(err) {
    throw err;
  }
}

export const getFilterEvents = function() {
  const urlSearchParams = new URLSearchParams(window.location.search);

  filters = {}
  for (const [key, value] of urlSearchParams.entries()) {
    if (value === 'All') continue;
    filters[decodeURIComponent(key)] = decodeURIComponent(value);
  }

  const newResults = state.allResults.filter((result) => {
      valid = true;
      console.log(result);
      
      valid = compareObjectsFilter(filters, result, 'deviceType', 'eventType')
      if(!valid) return valid

      if (filters.id)
        valid = result.assetTag?.includes(filters.id.toUpperCase()) || result.serialNumber.includes(filters.id.toUpperCase()) 

      if(!valid) return valid
      
      if (filters.modelName)
        valid = result.modelName?.toUpperCase().includes(filters.modelName.toUpperCase())

      if(!valid) return valid

      if (filters.userName)
      valid = result.userName?.toLowerCase().includes(filters.userName.toLowerCase())

      return valid
  })

  console.log(filters);

  resetState(newResults)

}