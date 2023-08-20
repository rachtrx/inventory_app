import * as XLSX from 'xlsx/xlsx.mjs'

import { AJAX } from '../../utilities/helpers.js';
import { state, resetSearchState, resetState } from './model.js';
import { ASSET_HOMEPAGE_URL } from '../../utilities/config.js';

const filterExcelHeaders = function(excludedColumns) {
    const data = state.allResults;
    console.log(data);

    const filteredDatas = data.map((obj) => {
    const filteredData = {};
    for (let header in obj) {
        if (!excludedColumns.includes(header)) {
        filteredData[header] = obj[header]
        }
    }
    return filteredData;
    })
    return filteredDatas;
}

const getExcelDetails = function() {
    let data;
    const curPage = state.page

    switch(curPage) {
        case 'onboard':
            // skip user info
            data = [{'deviceType': '', 'modelName': '', 'modelValue': '', 'vendorName': '', 'serialNumber': '', 'assetTag': '', 'registeredDate': '', 'registeredRemarks': '', 'location':'', 'bookmarked': '', 'userName': '', 'deptName': '', 'loanedDate': '', 'loanedRemarks': ''}]
            return [data, 'Onboard Devices', 'Inventory_Onboard.xlsx']

        case 'devices':
            data = filterExcelHeaders(['assetId', 'userId'])
            return [data, 'All Devices', 'Devices_Inventory.xlsx']

        case 'history':
            data = filterExcelHeaders(['eventId', 'userId', 'assetId'])
            return [data, 'All Events', 'Events_Inventory.xlsx']

        case 'users':
            console.log('hello');
            data = filterExcelHeaders(['devices', 'userId'])
            return [data, 'All Users', 'Users_Inventory.xlsx']

        case 'register device':
            data = [{'serialNumber': '', 'assetTag': '', 'remarks': ''}]
            return [data, 'Register Devices', 'Register_Devices.xlsx']

        case 'condemned device':
            data = [{'assetTag': '', 'remarks': ''}]
            return [data, 'Condemn Devices', 'Condemn_Devices.xlsx']

        case 'create user':
            data = [{'userName': '', 'remarks': ''}]
            return [data, 'New Users', 'New_Users.xlsx']

        case 'remove user':
            data = [{'userName': '', 'remarks': ''}]
            return [data, 'Remove Users', 'Remove_Users.xlsx']

        default:
            return;
    }
}

export const exportExcel = async function() {
    try {
        console.log('getting excel');
        const [data, sheetName, bookName] = getExcelDetails()

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);
        
        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        
        // Generate the Excel file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Create a download link and trigger the download
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = bookName;
        downloadLink.click();
        
        // Clean up the object URL
        URL.revokeObjectURL(downloadLink.href);
    } catch(err) {
        throw err;
    }
}

export const readExcel = async function(file) {
    
    const fileReader = new FileReader();

    fileReader.readAsArrayBuffer(file)

    const loadData = () => {
    return new Promise((resolve, reject) => {
        fileReader.onload = function(e) {
        console.log(fileReader.result);
        console.log(e);
    
        const data = new Uint8Array(fileReader.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
        console.log(sheetData);
        resolve(sheetData);
        };
    
        fileReader.onerror = function(err) {
        console.log(fileReader.error);
        reject(err);
        };
    });
    };
    
    try {
        const sheetData = await loadData();
        return sheetData;
    } catch (err) {
        console.error(err);
    }
}

export const validateObnboardData = async function(data) {
    try {
        if (!data) return
        console.log(data);
        const filteredData = await AJAX(`${ASSET_HOMEPAGE_URL}api/check_onboard`, data)
        console.log(filteredData);

        return filteredData
    } catch(err) {
        throw err;
    }
}