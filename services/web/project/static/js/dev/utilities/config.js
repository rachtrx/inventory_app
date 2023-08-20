import chroma from "chroma-js";

export const TIMEOUT_SEC = 300;
export const PREVIEW_TIMEOUT_BLUR = 100;
export const ASSET_HOMEPAGE_URL = `${window.location.origin}/asset/`
export const RES_PER_PAGE = 30;

// const c1 = 'rgb(255, 99, 132)'
// const c2 = 'rgb(54, 162, 235)'
// const c3 = 'rgb(255, 205, 86)'
// const c4 = 'rgb(75, 192, 192)'
// const c5 = 'rgb(153, 102, 255)'
// const c6 = 'rgb(255, 159, 64)'
// const c7 = 'rgb(0, 128, 128)'
// const c8 = 'rgb(255, 51, 153)'
// const c9 = 'rgb(102, 102, 0)'
// const c10 = 'rgb(128, 0, 128)'
// export const BACKGROUND_COLORS = [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10];

export const dateTimeObject = {
    weekday: 'short',
    hour: 'numeric' || '',
    minute: 'numeric' || '',
    day: 'numeric',
    month: 'short',
    year: '2-digit'
}

const baseColors = ['rgb(255, 99, 132)', 'rgb(25, 196, 166)', 'rgb(54, 162, 235)', 'rgb(255, 165, 63)', 'rgb(255, 245, 143)', 'rgb(181, 130, 211)']

const numberOfAdditionalColors = 5;
export const COLORSCALE = chroma.scale(baseColors).colors(numberOfAdditionalColors);
