// APPLIES TO DEVICES, USERS AND HISTORY
import View from "../../utilities/showView.js";

class PaginationView extends View {
    
    initialize() {
        this._parentElement = document.querySelector('.pagination')
        console.log(this._parentElement);
    }

    addHandlerClick(handler, el) {
        console.log(el);

        this._parentElement.addEventListener('click', function(e) {
            const btn = e.target.closest('.btn--inline') // event delegation
            if (!btn) return;

            const goToPage = +btn.dataset.goto 
            
            handler(goToPage);

            el.scrollIntoView({
                behavior: 'smooth', // Optional: Add smooth scrolling animation
                block: 'start'      // Optional: Adjust the scroll position (start, center, end)
            });
        })
    }

    _generateMarkup() {
        console.log(this._data);
        const curPage = this._data.page;
        const numResults = this._data.bookmarked ? this._data.bookmarks.length : this._data.results.length
        const numPages = Math.ceil(numResults / this._data.resultsPerPage);

        // page 1, other pages
        if(curPage === 1 && numPages > 1) {
            // use data attribute to address connection between DOM and code
            return `
            <button data-goto="${curPage + 1}" class="btn--inline pagination__btn--next">
                <span>Page ${curPage + 1}</span>
            </button>`
        }

        // Last page
        if(curPage === numPages && numPages > 1) {
            return `
            <button data-goto="${curPage - 1}" class="btn--inline pagination__btn--prev">
                <span>Page ${curPage - 1}</span>
            </button>`
        }
        // Other page
        if(curPage < numPages) {
            return `
            <button data-goto="${curPage - 1}" class="btn--inline pagination__btn--prev">
            <span>Page ${curPage - 1}</span>
          </button>
          <button data-goto="${curPage + 1}" class="btn--inline pagination__btn--next">
            <span>Page ${curPage + 1}</span>
          </button>`
        }
        // page 1 ONLY
        return '';
    }
}

export default new PaginationView()