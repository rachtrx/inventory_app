import { TIMEOUT_SEC } from './config.js';

const timeout = function (s) {
    return new Promise(function (_, reject) {
      setTimeout(function () {
        reject(new Error(`Request took too long! Timeout after ${s} second`));
      }, s * 1000);
    });
  };
  
export const AJAX = async function (url, uploadData = undefined, header = true, blob = false) {
    try {

        if(uploadData)
        console.log(...uploadData);
        console.log(url);

        const fetchPro = uploadData ? header ? 
          fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },      
          body: JSON.stringify(uploadData),
          })
        : fetch(url, {
          method: 'POST',   
          body: uploadData,
          }) 
        : fetch(url);
        console.log(url);

        const res = await Promise.race([fetchPro, timeout(TIMEOUT_SEC)]);

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(`${errData.error}`);
        }

        if (res.redirected) {
          console.log('redirected');
          window.location.href = res.url; // Redirect the user to the new location  
        } else { // return the data
          console.log(header);
          const data = blob === false ? await res.json() : await res.blob()
          return data;
        }
        
    } catch (err) {
        throw err;
    }
};

export const clearEl = function(...els) {
  els.forEach((el) => el.innerHTML = '');
}

export const hideEl = function(...els) {
  els.forEach((el) => el.classList.add('hidden'));
}

export const showEl = function(...els) {
  els.forEach((el) => el.classList.remove('hidden'));
}

export const transparentEl = function(...els) {
  els.forEach((el) => el.classList.add('hidden-visibility'))
}

export const opaqueEl = function(...els) {
  els.forEach((el) => el.classList.remove('hidden-visibility'))
}

export const resetInputs = function(inputArr) {
  inputArr.forEach((input) => input.value = '')
}

// TOGGLING SINGLE CLASS FOR MULTIPLE FIELDS
export const addFields = function(toggleClass, ...fields) {
    fields.forEach((field) => field.classList.add(toggleClass));
}

export const removeFields = function(toggleClass, ...fields) {
  fields.forEach((field) => field.classList.remove(toggleClass));
}

export const toggleFields = function(toggleClass, ...fields) {
  fields.forEach((field) => field.classList.toggle(toggleClass));
}

export const arrToString = function(arr) {
  return arr.map((el) => el.toString())
}

export const toCamelCase = function(text) {
    return text.includes('-') ? text.split('-').map((word, i) => i !== 0 ? word[0].toUpperCase() + word.slice(1) : word).join('') : text
}

// export const getCurrentMainUrl = function() {
//   const href = window.location.href;
//   const hrefWithoutHash = href.split('#')[0];
//   const curUrl = hrefWithoutHash.split('?')[0];
//   return curUrl;
// }

export const eventToStatus = function(event) {

  let status;

  switch(event) {

    case 'registered':
      status = 'REGISTERED'
      break;

    case 'loaned':
      status = 'ON LOAN'
      break;

    case 'available':
      status = 'AVAILABLE'
      break;

    case 'condemned':
      status = 'CONDEMNED'
      break;
  }

  return status;
}

// export const eventToEvent = function(event) {

//   let status;

//   switch(event) {

//     case 'registered':
//       status = 'registered'
//       break;

//     case 'loaned':
//       status = 'loaned'
//       break;

//     case 'returned':
//       status = 'returned'
//       break;

//     case 'condemned':
//       status = 'condemned'
//       break;
//   }

//   return status;
// }

export const oldNewCheck = function(defaultSelect, oldInput, newInput, name) {
  // Both selected
  if (oldInput.value !== defaultSelect && newInput.value) {
      this.renderError('Please do not display both fields');
      return false;
  } 
  // no vendor selected
  if (newInput.value === '' && oldInput.value === defaultSelect) {
    console.log('reject');
      this.renderError(`${name} cannot be blank!`);
      return false;
  }
  return true;
}

export const excelToJSDate = function(date) {
    newDate = new Date(Math.round((date - 25569)*86400*1000)).toISOString();
    return newDate;
}

export const setFormData = function(formData, key, oldValue = '', newValue = 'All') {
  if(formData.get(key) === oldValue)
  formData.set(key, newValue)
}

export const capitalizeWords = function(str) {
  return str.replace(/\b\w/g, (match) => match.toUpperCase());
}