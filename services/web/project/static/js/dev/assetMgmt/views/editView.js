import { data } from "autoprefixer";
import { clearEl, opaqueEl, transparentEl } from '../../utilities/helpers.js';
import View from "../../utilities/showView.js";

class EditView extends View {

    addEditHandlers(handler) {
        document.addEventListener("click", (e) => {
            if (e.target.closest('.btn--edit')) {
                this._editBtns = document.querySelectorAll('.btn--edit')
                this._saveBtns = document.querySelectorAll('.btn--save')

                this._focusedEditBtn = e.target
                this._focusedSaveBtn = e.target.parentElement.querySelector('.btn--save')
                console.log(this._focusedSaveBtn);
                handler()
            }
            
            if(e.target.closest('.btn--save')) {
                // make sure that the save buttons match
                if (!this._focusedSaveBtn === e.target) {
                    this.renderError(`Something went wrong!`);
                    return;
                }
                // pass in the value
                let type, data;
                this._dataset = this._focusedSaveBtn.dataset 
                if (this._dataset.locationName) {
                    data = this._dataset.locationName;
                    type = 'location';
                } else if (this._dataset.eventId) {
                    data = this._dataset.eventId;
                    type = 'remark'
                } else if (this._dataset.modelValue){
                    data = this._dataset.modelValue;
                    type = 'value'
                } else return
                handler(type, data, this._focusedRemark.innerHTML)
            }

        })
    }

    renderEdit() {
        this._focusedRemark = this._focusedEditBtn.previousElementSibling || this._focusedEditBtn.parentElement.previousElementSibling;
        console.log(this._focusedRemark);
        this._focusedRemark.contentEditable = true;
        this._focusedRemark.focus()
        this._focusedRemark.classList.add('timeline__editable');

        // hide edits, show save
        this._editBtns.forEach((editBtn) => transparentEl(editBtn));
        opaqueEl(this._focusedSaveBtn)
    }


    renderSave() {
        this._focusedRemark.contentEditable = false;
        this._focusedRemark.classList.remove('timeline__editable');
        this._focusedRemark = undefined;

        // hide edits, show save
        this._editBtns.forEach((editBtn) => opaqueEl(editBtn));
        transparentEl(this._focusedSaveBtn)
    }
}

export default new EditView()