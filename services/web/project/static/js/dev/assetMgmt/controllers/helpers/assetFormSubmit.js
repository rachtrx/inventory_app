import * as model from '../../models/model.js';
import * as pdfFormModel from '../../models/pdfFormModel.js'
import * as excelModel from '../../models/excelModel.js'

import returnedDevice from '../../forms/returnedDeviceView.js';
import loanDevice from '../../forms/loanDeviceView.js';
import onboardView from '../../forms/onboardView.js';

import { ASSET_HOMEPAGE_URL } from '../../../utilities/config.js';

// validate functions mainly save the data into rawFormInputs

const validateExcelData = async function(viewObject) {

    try {
        if(!model.state.excelFile.name) throw Error('No file selected')
    
        const excelData = await excelModel.readExcel(model.state.excelFile)
        console.log(excelData);
    
        // raw form inputs is still needed for PDF forms
        model.state.rawFormInputs = viewObject.getFileData(excelData)
        if(!model.state.rawFormInputs) throw Error('Data could not be processed');
    } catch(err) {
        throw err;
    }

}
   
const validatePlainData = function(viewObject) {
    // SECTION NOT USING EXCEL
    console.log('not using excel');
    model.state.rawFormInputs = viewObject.getData();
    if(!model.state.rawFormInputs) throw Error('Data could not be processed');
}

// SECTION for loan and submit, data is processed and submitted only later, through the model
// 1st submit
export const controlLoanConfirmation = function() {
    model.state.rawFormInputs = []

    validatePlainData(loanDevice)

    loanDevice.renderPDFForm(model.state.page) // render pdf page to download/generate
    model.state.object = loanDevice.getFormDetails() // prepare pdf fields
}

export const controlReturnConfirmation = function() {
    model.state.rawFormInputs = []
    validatePlainData(returnedDevice)
    model.state.rawFormInputs.unshift(returnedDevice._eventId) // unshift the event_id to download the form
    returnedDevice.renderPDFForm(model.state.page)
    model.state.object = returnedDevice.getFormDetails()
}

// 2nd submit
export const controlPDFSubmit = async function(viewObject, bypass = false) {

    try {

        if(!model.state.rawFormInputs) {
            viewObject.renderError('Something went wrong!')
            return;
        }

        viewObject.renderSpinner()
        const assetId = await pdfFormModel.submitPDF(bypass) // returns assetId to redirect if needed. this will set the filename, unshift the filename, upload the data (1st cycle), and if bypass = false, submit the file (2nd cycle). could not submit both together due to a bug

        // with asset_id returned, can choose to resubmit or redirect
        viewObject.renderResubmit(assetId, model.state.page, window.location.href, ASSET_HOMEPAGE_URL)

    } catch(err) {
        viewObject.renderError(err)
        console.log(err);
    }
}

// SECTION for onboard forms
// 1st submit
export const controlOnboardConfirmation = async function() {

    try {
        if(model.state.fileLoaded !== true || !model.state.excelFile.name) throw Error('No file selected')

        const excelData = await excelModel.readExcel(model.state.excelFile)
    
        // CLIENT SIDE VALIDATION
        const clientData = onboardView.validateFileData(excelData)
        if(!clientData) {
            onboardView.renderError('Something went wrong when submitting data, please check you did not amend the headers')
            return
        }

        model.state.formInputs = clientData[0]

        onboardView.renderSpinner()
        // FLATTEN THE 2 ARRAYS AND SEND TO SERVER FOR SERVER SIDE VALIDATION (via API)
        const serverData = await excelModel.validateObnboardData(clientData.flat())

        onboardView.renderConfirmationPage(model.state.formInputs, serverData)
    } catch(err) {
        console.log(err);
        onboardView.renderError(err.message)
        model.state.formInputs = []
    }
}
// 2nd submit
export const controlOnboardSubmit = async function() {
    onboardView.renderSpinner()
    console.log(model.state.formInputs);
    await model.uploadData();
    return;
}

// SECTION all other forms
export const controlNormalSubmit = async function(viewObject) {
    // let data;
    try {

        model.state.rawFormInputs = []
        // const type = viewObject.type
        let data;

        if(model.state.excel === true) {
            validateExcelData(viewObject, data)
            data = [...model.state.rawFormInputs];
            if (!data) return;
            data.unshift(true);
        } else {
            validatePlainData(viewObject, data) 
            data = [...model.state.rawFormInputs];
            data.unshift(false)
        }

        model.state.formInputs = data; // rawforminputs was needed because there were bugs where unshift occured multiple times

        // upload data
        viewObject.renderSpinner();
        await model.uploadData();
        
    } catch(err) {
        viewObject.renderError(err)
        console.log(err);
    }
}