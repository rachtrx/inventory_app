import { jsPDF } from 'jspdf';
import { state, resetSearchState, resetState, uploadData } from './model.js';
import { AJAX } from '../../utilities/helpers.js';
import { ASSET_HOMEPAGE_URL } from "../../utilities/config";

const getFileName = function() {
        // Get the current date
    const currentDate = new Date();

    // Get the day, month, and year from the current date
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();

    // Render the date as a string in the format "ddmmyyyy"
    const formattedDate = `${day}${month}${year}`;

    const formattedName = state.object.userName.split(' ').join('-')

    return `${state.object.assetTag}_${formattedName}_${formattedDate}_${state.page === 'loan device' ? 'L' : 'R'}.pdf`.replace( /[<>:"\/\\|?*]+/g, '' );
}

export const generatePDF = function() {
    console.log('bye');
    const doc = new jsPDF();

    const pageWidth = 160
    const inputLeft = 22
    const inputRight = 130
    const lineHeight = 10
    const loanSigHeight = 217
    const returnSigHeight = 246
    const userSig = 74
    const itSig = 130
    const boxHeight = 15
    const officialWidth = 30

    doc.addImage("../../static/img/gos-badge.png", "PNG", 170, 5, 26, 20);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(30);
    doc.text("Equipment Loan Form", 40, 22);

    doc.setFontSize(15)
    doc.text("Particulars", 20, 35);
    doc.text("Item to loan", 20, 65);
    doc.setTextColor(255, 0, 0).text("For Return Use", 20, 213 + lineHeight*2);

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    
    doc.text("THE FOLLOWING GUIDELINES APPLY TO EQUIPMENT ON LOAN TO EMPLOYEE:", 20, 146)

    doc.setFontSize(11)
    doc.text("Date\nof loan: ", 20, loanSigHeight - 2)
    doc.text("Signature:", userSig, loanSigHeight)
    doc.text("Authorizing\nSignature:", itSig, loanSigHeight - 2)

    doc.text("Date\nof return: ", 20, returnSigHeight - 2)
    doc.text("Signature:", userSig, returnSigHeight)
    doc.text("Authorizing\nSignature:", itSig, returnSigHeight - 2)

    doc.setFont("Helvetica", "normal");
    doc.text(`Name: ${state.object.userName}`, inputLeft, 42)
    doc.text("Email: __________________________________", inputLeft, 42 + lineHeight)
    doc.text(`Designation: ${state.object.deptName}`, inputRight, 42)
    doc.text("Mobile No: _______________", inputRight, 42 + lineHeight)

    doc.text(`Model: ${state.object.modelName}`, inputLeft, 72)
    doc.text("Hostname: _______________________________", inputLeft, 72 + lineHeight)
    doc.text(`Serial Number: ${state.object.serialNumber}`, inputRight, 72)
    doc.text(`Asset Tag: ${state.object.assetTag}`, inputRight, 72 + lineHeight)
    doc.text("Loan details:", inputLeft, 72 + lineHeight * 2)
    doc.text("Purpose of loan:", inputLeft, 72 + lineHeight * 2 + 25)
    doc.text("Return details:", inputLeft, returnSigHeight + lineHeight + 2)

    doc.setLineWidth(0.5);
    doc.line(20, loanSigHeight + lineHeight, 20 + 170, loanSigHeight + lineHeight);

    doc.rect(40, loanSigHeight - 9, officialWidth, boxHeight)
    doc.rect(userSig + 21, loanSigHeight - 9, officialWidth, boxHeight)
    doc.rect(itSig + 23, loanSigHeight - 9, officialWidth, boxHeight)

    doc.rect(40, returnSigHeight - 9, officialWidth, boxHeight)
    doc.rect(userSig + 21, returnSigHeight - 9, officialWidth, boxHeight)
    doc.rect(itSig + 23, returnSigHeight - 9, officialWidth, boxHeight)
    
    doc.rect(inputLeft, 72 + lineHeight*2 + 3, pageWidth, boxHeight);
    doc.rect(inputLeft, 72 + lineHeight*2 + 28, pageWidth, boxHeight);
    doc.rect(inputLeft, returnSigHeight + lineHeight + 5, pageWidth, boxHeight);

    doc.setFontSize(10)
    text = "\u2022 The undersigned must agree to accept financial responsibility for loss or damage of any equipment provided by Grace Orchard School.\n" +

    "\u2022 The equipment is to be used for Grace Orchard School’s work-related activities.\n" +
    
    "\u2022 The employee is responsible for safeguarding the equipment while it is in his or her possession. If the equipment is missing due to the negligence of the staff, the person will have to pay for the replacement equipment.\n" +
    
    "\u2022 If the equipment is stolen, immediately notify your Reporting Officer (RO) & the person in charge of the loan.\n" +
    
    "\u2022 The staff will have to make a police report regarding the theft within 48 hours.\n" +
    
    "\u2022 The equipment should be returned to the custody of Grace Orchard School once the purpose for its loan has been completed or should the employee terminate employment with Grace Orchard School.\n" +
    
    "\u2022 The employee is required to respond to the yearly inventory check by Corporate Office.\n" +
    
    "\u2022 Any other software to be downloaded into the school laptop issued to you must be approved by IT department.\n"

    // splitTextToSize takes your string and turns it in to an array of strings,
    // each of which can be displayed within the specified maxLineWidth.
    const textLines = doc.splitTextToSize(text, pageWidth);

    // doc.text can now add those lines easily; otherwise, it would have run text off the screen!
    doc.text(textLines, inputLeft, 146 + 5);

    const pdfBlob = doc.output('blob');

    // Create a download link and simulate click event to trigger download
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getFileName()}`;
    a.click();
    URL.revokeObjectURL(url);
}

function renameFile(originalFile, newName) {
    return new File([originalFile], newName, {
        type: originalFile.type,
        lastModified: originalFile.lastModified,
    });
}

export const submitPDF = async function(bypass) {
    const originalPage = [...state.page]

    try {

        // amend pdf file name, leave this here as it relies on the page
        const newFileName = getFileName()
        
        // required in case file name is appended multiple times

        const data = [...state.rawFormInputs];

        if(bypass === true) data.unshift(false)
        else data.unshift(newFileName)

        state.formInputs = data;

        // send the filepath to the server
        console.log(state.formInputs);
        
        assetId = await uploadData() // this uploads state.formInputs

        if(bypass) {
            return assetId;
        }
        
        // rename file if it got corrupted
        if(state.pdfFile.name !== newFileName)
        state.pdfFile = renameFile(state.pdfFile, newFileName)

        // CHANGE THE PAGE
        const originalPage = state.page
        state.page = 'upload pdf'
        const formData = new FormData()
        formData.append('pdf_file', state.pdfFile)

        await uploadData(formData)

        state.page = originalPage
        return assetId

    } catch(err) {
        state.page = originalPage
        throw(err)
    }
}

export const downloadPDF = async function(eventId) {
    try {

        let filename;
        if(state.page === 'returned device') {
            filename = getFileName()
            console.log(filename);
        } else {
            filename = await AJAX(`${ASSET_HOMEPAGE_URL}api/get_filename`, eventId)
            console.log(filename);
        }

        const blob = await AJAX(`${ASSET_HOMEPAGE_URL}api/download_pdf`, eventId, true, true);
        console.log(blob); 
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}`; // You can specify a custom file name here
        a.click();
        URL.revokeObjectURL(url);

    } catch(err) {
        throw(err)
    }
}