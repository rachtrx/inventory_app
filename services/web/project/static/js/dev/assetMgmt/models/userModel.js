import { AJAX } from '../../utilities/helpers.js';
import { state, resetSearchState, resetState, compareObjectsFilter } from './model.js';
import { createEventObject } from './eventModel.js';
import { ASSET_HOMEPAGE_URL } from '../../utilities/config.js';
import { dateTimeObject } from '../../utilities/config.js';

// TODO CHECK IF bookmarked IS UNDEFINED IF IT IS ZERO (0)
export const createUserObject = function(user) {
    return {
        userId: user.user_id || user.id,
        userName: user.user_name,
        deptName: user.dept_name,
        bookmarked: user.user_bookmarked || user.bookmarked || 0,
        hasResigned: user.has_resigned || 0,
        ...(user.asset_tag && user.model_name && user.asset_id && user.device_bookmarked !== undefined && {
            device: {
              assetTag: user.asset_tag,
              modelName: user.model_name,
              assetId: user.asset_id,
              bookmarked: user.device_bookmarked,
            }
          }
        ),
      }
  }

  // function takes an array of users and filters them based on whether they already have a device
export const combinedUsers = function(usersArray) {
  return usersArray.reduce((users, user) => {
    // existingUser will return the user if found
      const existingUser = users.find((filteredUser) => filteredUser.userId === user.userId);
    if (existingUser) {
      // User already exists, add the device details to the existing user's users array
      existingUser.devices.push(user.device);
      existingUser.deviceCount = user.device ? existingUser.deviceCount++ : existingUser.deviceCount
    } else {
      // TODO check on the count
      // Create a new user object with the device details
      const newUser = {
        userId: user.userId,
        userName: user.userName,
        deptName: user.deptName,
        bookmarked: user.bookmarked || 0,
        hasResigned: user.hasResigned || 0,
        ...(user.device && {devices: [user.device]}),
        deviceCount: user.device ? 1 : 0,
      }
      users.push(newUser);
    }
    return users;
  }, []);
}

// LOAD USERS
export const getUsers = async function() {
  try {
    const data = await AJAX(`${ASSET_HOMEPAGE_URL}api/all_users`)
    if (!data) return
    const results = combinedUsers(data.map(user => createUserObject(user)))
    console.log(results);
    // TODO IMPROVE
    state.allResults = results;
    resetState(state.allResults);
    console.log(state);

    state.deviceCount = [...new Set(results.map((user) => user.deviceCount))].sort((a, b) => a - b);
    console.log(state.deviceCount);

  } catch(err) {
    throw err;
  }
}

export const getFilterUsers = function() {
  const urlSearchParams = new URLSearchParams(window.location.search);

  filters = {}
  for (const [key, value] of urlSearchParams.entries()) {
    if (value === 'All') continue;
    filters[decodeURIComponent(key)] = decodeURIComponent(value);
  }

  const newResults = state.allResults.filter((result) => {
      valid = true;
      
      valid = compareObjectsFilter(filters, result, 'deptName', 'deviceCount')
      if(!valid) return valid

      if (filters.userName)
      valid = result.userName?.toLowerCase().includes(filters.userName.toLowerCase())

      return valid
  })

  console.log(filters);

  resetState(newResults)

}

export const getUser = async function(userId) {
    try {
      const data = await AJAX(`${ASSET_HOMEPAGE_URL}api/users/${userId}`)
      const [details, events, pastDevices, currentDevices] = data
      console.log(currentDevices);
      const finalDetails = details.map(user => createUserObject(user))
      const finalEvents = events.map(event => createEventObject(event))
      const finalPastDevices = pastDevices.map(device => ({assetId: device.asset_id, assetTag: device.asset_tag, modelName: device.model_name}))
      const finalCurrentDevices = currentDevices.map(device => ({assetId: device.asset_id, assetTag: device.asset_tag, modelName: device.model_name}))
  
      state.object = {
        details: finalDetails[0],
        events: finalEvents,
        pastDevices: finalPastDevices,
        currentDevices: finalCurrentDevices
      }
  
      console.log(state.object);
    } catch(err) {
      throw err;
    }
  }