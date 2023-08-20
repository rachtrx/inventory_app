import FileUpload from '../../utilities/formHelpers/fileUpload.js';
import { hideEl, opaqueEl, clearEl, excelToJSDate, capitalizeWords } from "../../utilities/helpers";
import { dateTimeFormat } from "../../utilities/config";
import { ASSET_HOMEPAGE_URL } from '../../utilities/config';

class OnboardView extends FileUpload {

    initialize() {
        console.log('hello');
        this._parentElement = document.querySelector('.form--onboard')
        this.type = 'onboard'
        this.renderOnboardWarning()
        console.log('rendering');
        this.initializeFile(false);
    }

    renderOnboardWarning() {
        const markup = `
        <button class="btn--close-modal">&times;</button>
            <div class="onboard-warning-container">
                    <h3>Warning:</h3> 
                    <ul>
                        <li>This feature allows you to register devices based on the actual registered date.</li>
                        <li>If the device is new, using normal device registration is highly recommended.</li>
                        <li>This feature should only be used when the data is completely clean</li>
                    </ul>
                    <a class="btn-text btn-text--register-device" href="${ASSET_HOMEPAGE_URL}forms/register_device">Back to normal registration</a>
                </div>
            </div>`

        console.log(this._popupFields);

        opaqueEl( ...this._popupFields);
        clearEl(this._popupWindowEl)

        this._popupWindowEl.insertAdjacentHTML('afterbegin', markup)
    }

    // 1ST SUBMIT BTN
    addHandlerConfirm(handler) {
        document.addEventListener('click', (e) => {
            if(e.target.closest('.btn--preview')) {
                e.preventDefault();
                handler();
            }
        })
    }

    _checkChildAcrossParents = function(obj, parent, child) {

        let newParent = true
        let newChild = true

        // if modelsObj length is not 0, directly add the model below
        if (Object.keys(obj).length !== 0) {
            
            for (const [key, value] of Object.entries(obj)) {
                
                // if parent exists
                if (key === parent) newParent = false;
                
                // check if model name exists in other device type
                if (value.includes(child)) {
                    if(key !== parent) {
                        return `${child} already exists in ${key}, cannot be added to ${parent}`
                    }
                    else newChild = false; // to do nothing later if model name already exists
                }
            }
        }

        if (newChild) {
            if (newParent) obj[parent] = [child]
            else obj[parent].push(child)
        }

        return;
    }

    validateFileData(data) {

        // contain device type and model names, with their value
        // eg { 'Laptop' : ['Asus A1412', ...], ...}
        const modelsObj = {}
        
        // contain dept and users
        const usersObj = {}

        // const loanArr = []
        // const registerArr = []
        
        const vendorArr = []
        const snArr = []
        const atArr = []
       
        const dtSet = new Set()
        const deptSet = new Set()

        let valid = true

        const deviceArr = data.map((device) => {

            if (valid === false) return;

            console.log(Object.keys(device).length);

            if (Object.keys(device).length !== 14) {
                {
                    valid = false;
                    return;
                }
            }

            console.log(device);
            const deviceObj = {}

            deviceObj.modelValue = Number.isFinite(device.modelValue) && device.modelValue || 0
            deviceObj.status = 'registered'
            deviceObj.bookmarked = device.bookmarked || 0
            deviceObj.location = String(device.location).trim() || 'unknown'
            deviceObj.registeredRemarks = String(device.registeredRemarks).trim() || ''
            
            // SHORTEN ALL SN AND ASSET TAG AND CHECK FOR DUPLICATES
            if (!device.registeredDate) {
                throw Error(`${device.assetTag}: Registered Date is missing`)

            }
            // console.log(device.registeredDate);
            deviceObj.registeredDate = excelToJSDate(device.registeredDate)
            // console.log(deviceObj.registeredDate);

            if (!device.vendorName) {
                throw Error(`${device.assetTag}: Vendor is missing`)

            }
            deviceObj.vendorName = capitalizeWords(String(device.vendorName).trim())
            if (!vendorArr.includes(deviceObj.vendorName)) {
                vendorArr.push(deviceObj.vendorName)

            }

            if (!device.serialNumber) {
                throw Error(`${device.assetTag}: Serial Number is missing`)

            }
            deviceObj.serialNumber = String(device.serialNumber).trim().split(' ')[0].toUpperCase();
            if (snArr.includes(deviceObj.serialNumber)) {
                throw Error(`${device.assetTag}: Duplicate Serial Number`)

            }
            snArr.push(deviceObj.serialNumber)

            if (!device.assetTag) {
                throw Error(`${device.assetTag}: Asset Tag is missing`)

            }
            deviceObj.assetTag = String(device.assetTag).trim().split(' ')[0].toUpperCase();
            if (atArr.includes(deviceObj.assetTag)) {
                throw Error(`${device.assetTag}: Duplicate Asset Tag`)

            }
            atArr.push(deviceObj.assetTag)

            if (!device.deviceType) {
                throw Error(`${device.assetTag}: Device Type Missing`)
            }
            
            if (!device.modelName) {
                throw Error(`${device.assetTag}: Model name is missing`)
            }

            deviceObj.deviceType = capitalizeWords(String(device.deviceType).trim())
            dtSet.add(deviceObj.deviceType)
            deviceObj.modelName = capitalizeWords(String(device.modelName).trim())

            const errMsg = this._checkChildAcrossParents(modelsObj, deviceObj.deviceType, deviceObj.modelName)
            if(errMsg) throw Error(`${device.assetTag}: ${errMsg}`)

            // DONE FILTERED DEVICE TYPES (done with modelsObj)
            
            // CHECK FOR USER - status LOANED otherwise REGISTERED, CHECK FOR LOAN DATE IF THERE IS USER, CANT HAVE LOAN DATE IF NO USER
            if (device.deptName && !device.userName || device.loanedDate && ! device.userName) {
                throw Error(`Loaning ${device.assetTag} without user name`)
            }

            if (device.userName) {
                if (!device.loanedDate) {
                    throw Error(`${device.assetTag}: No Loan Date`)
    
                }
                if (!device.deptName) {
                    throw Error(`${device.assetTag}: No department name`)
    
                }
                if (device.loanedDate < device.registeredDate) {
                    throw Error(`${device.assetTag}: Loan date cannot be before register date`)
                }
                deviceObj.userName = capitalizeWords(String(device.userName).trim())
                deviceObj.deptName = capitalizeWords(String(device.deptName).trim())
                deviceObj.loanedDate = excelToJSDate(device.loanedDate)
                deviceObj.loanedRemarks = device.loanedRemarks || ''
                deptSet.add(deviceObj.deptName)

                const errMsg = this._checkChildAcrossParents(usersObj, deviceObj.deptName, deviceObj.userName)
                if(errMsg) throw Error(`${device.assetTag}: ${errMsg}`)
                deviceObj.status = 'loaned'
            }

            return deviceObj
        })

        const dtArr = [...dtSet]
        const deptArr = [...deptSet]

        console.log(deviceArr, modelsObj, usersObj, vendorArr);

        if (valid === false) return

        return [[deviceArr, modelsObj, usersObj, vendorArr], [snArr, atArr, dtArr, deptArr]]
    }

    renderConfirmationPage(inputs, serverData) {

        const [deviceArr, modelsObj, usersObj, vendorArr] = inputs;
        const [curDtArr, curModelArr, curDeptArr, curUserArr, curVendorArr] = serverData
        console.log(deviceArr, modelsObj, usersObj, vendorArr);
        console.log(curDtArr, curModelArr, curDeptArr, curUserArr, curVendorArr);
        console.log(Object.keys(modelsObj));

        const markup = `
        <button class="btn--close-modal">&times;</button>
        <div class="window-onboard">
            <div class="window-component--devices">
                <h3 class="window-header-devices"><span class="onboard-data-new">${deviceArr.length}</span> new devices will be added:</h3>
                <div class="window-dropdown">
                    <ul class="window-dropdown--devices">
                    ${deviceArr.map((device) => `<li class="onboard-data onboard-data-new">${device.assetTag}</li>`).join('')}
                    </ul>
                </div>
            </div>
            <div class="window-component--models">
                <h3 class="window-header-models"><span class="onboard-data-new-parent">${Object.keys(modelsObj).length - curDtArr.length}</span> new device types and <span class="onboard-data-new">${Object.values(modelsObj).reduce((count, arr) => {
                    count += arr.length;
                    return count;
                }, 0) - curModelArr.length}</span> new models will be added: </h3>
                <div class="window-dropdown">${Object.keys(modelsObj).map((deviceType) => `<h4 ${curDtArr.includes(deviceType) ? '' : 'class="onboard-data-new-parent"'}>${deviceType}</h4><ul>${modelsObj[deviceType].map((model) => `<li class="onboard-data ${curModelArr.includes(model) ? '': 'onboard-data-new'}">${model}</li>`).join('')}</ul>`).join('')}</div>
            </div>
            <div class="window-component--users">
                <h3 class="window-header-users"><span class="onboard-data-new-parent">${Object.keys(usersObj).length - curDeptArr.length}</span> new departments and <span class="onboard-data-new">${Object.values(usersObj).reduce((count, arr) => {
                    count += arr.length;
                    return count;
                }, 0) - curUserArr.length}</span> new users will be added: </h3>
                <div class="window-dropdown">${Object.keys(usersObj).map((deptName) => `<h4 ${curDeptArr.includes(deptName) ? '' : 'class="onboard-data-new-parent"'}>${deptName}</h4><ul>${usersObj[deptName].map((user) => `<li class="onboard-data ${curUserArr.includes(user) ? '': 'onboard-data-new'}">${user}</li>`).join('')}</ul>`).join('')}</div>
            </div>
            <div class="window-component--vendors">
                <h3 class="window-header-vendors"><span class="onboard-data-new">${vendorArr.length - curVendorArr.length}</span> new vendors will be added: </h3>
                <div class="window-dropdown">
                    <ul>
                    ${vendorArr.map((vendor) => `<li class="onboard-data ${curVendorArr.includes(vendor) ? '' : 'onboard-data-new'}">${vendor}</li>`).join('')}
                    </ul>
                </div>
            </div>

            <div class="form__group--submit form__group--submit--onboard">
                <button class="btn btn--submit btn--onboard">Submit</button>
            </div>
        </div>`

        opaqueEl( ...this._popupFields);
        clearEl(this._popupWindowEl)

        this._popupWindowEl.insertAdjacentHTML('afterbegin', markup)

        this._submitBtn = document.querySelector('.btn--onboard')
    }
}

export default new OnboardView()