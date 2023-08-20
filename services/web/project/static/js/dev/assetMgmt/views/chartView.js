import { COLORSCALE } from '../../utilities/config.js';
import View from "../../utilities/showView.js";
import Chart from 'chart.js/auto';

export default class ChartView extends View {

    // HELPERS
    // FOR DOUGHNUTS
    _filterChartArr(arr) {
        const copiedArr = arr.slice()
        if(arr.length > this._maxArrLen) {
            const othersArr = copiedArr.slice(this._maxArrLen - 1)
            copiedArr.splice(this._maxArrLen - 1, copiedArr.length - (this._maxArrLen - 1))
            const otherCount = othersArr.reduce((others, other) => {
                others += other.value
                return others;
            }, 0)
            copiedArr.push({
                'key': 'Others', 
                'value': otherCount
            })
        }
        console.log(copiedArr);
        return [copiedArr, copiedArr.length]
    }

    // FOR REDUCE AGGREGATIONS
    _groupChartArrRank(parentArr, childArr) {
        const data = childArr;

        console.log(data);

        // Group data by device type
        const groupedData = {};
        data.forEach(item => {
        if (!groupedData[item.device_type]) {
            groupedData[item.device_type] = [];
        }
        groupedData[item.device_type].push(item);
        });

        // parentArr.forEach((parentType) => console.log(parentType.key))

        const groupedArr = parentArr.map((parentType) => groupedData[parentType.key])

        // Find the maximum length among the arrays to determine the number of elements in each sub-array
        const maxLength = Math.max(...groupedArr.map(arr => arr.length));

        // Create the result array of arrays
        const result = Array.from({ length: maxLength }, (_, index) =>
        groupedArr.map(arr => arr[index])
        );

        return result
    }

    // FOR YEARLY AGGREGATIONS
    _groupChartArrYear(parentArr, childArr) {
        const data = childArr;

        console.log(data);

        const firstYear = Math.min(...data.map((obj) => obj.key))

        const currentDate = new Date
        const currentYear = currentDate.getFullYear();

        let yearArr = [];
        for(let i = firstYear; i <= currentYear; i++) {
            yearArr.push(i)
        }

        // Group data by device type
        const groupedData = {};
        data.forEach(item => {
        if (!groupedData[item.device_type]) {
            groupedData[item.device_type] = [];
        }
        groupedData[item.device_type].push(item);
        });

        console.log(groupedData);

        const groupedArr = parentArr.map((parentDeviceType) => {
            // console.log(parentDeviceType);
            return {
                [parentDeviceType.key]: yearArr.map((year) => {
                    // console.log(year);
                    const foundChildDeviceType = groupedData[parentDeviceType.key].find((childDeviceType) => {
                        return parseInt(childDeviceType.key) === parseInt(year)
                    });
                    return foundChildDeviceType?.value || 0;
                })
            }
        })

        return [yearArr, groupedArr]
    }

    // FOR DOUGHNUTS
    doughnutData(oldArr, label, isCurrency = false, suffix = undefined) {

        const tempArr = oldArr

        console.log(tempArr);
        // years
        let arr;
        if (suffix) {
            arr = tempArr.map((el) => ({ ...el, key: String(el.key) + suffix }));
            console.log(arr);
        } else arr = tempArr

        console.log(arr);

        const [realArr, arrLen] = this._filterChartArr(arr)

        return [{
            labels: realArr.map((component) => String(component.key)),
            datasets: [{
            data: realArr.map((component) => String(component.value)),
            hoverOffset: 4,
            backgroundColor: COLORSCALE.slice(0, arrLen),
            }]
        },
        {
            title: function(context) {
                return `${context[0].label}`
            },
            label: function(context) {
                if (isCurrency) console.log(context.formattedValue);
                const value = isCurrency ? parseFloat(context.formattedValue.replaceAll(',', '')).toFixed(2) : context.formattedValue;
                return `${label}${value}`;
            },
        }]
    }

    // FOR AGGREGATION
    popularModelsData(arrs) {

        const [deviceArr, modelArr] = arrs

        const result = this._groupChartArrRank(deviceArr, modelArr)

        return [{
            labels: result[0].map((type) => type.device_type),
            datasets: result.map((innerArr, index) => ({
                label: innerArr.map((data) => data?.model_name),
                data: innerArr.map((data) => data?.model_count || 0),
                backgroundColor: innerArr.map(() => COLORSCALE[index % COLORSCALE.length]),

              })),
        },
        {
            title: function(context) {
                console.log(context);
                const value = context[0].dataset.label[context[0].dataIndex] || '';
                return `Model: ${value}`
            },
            label: function(context) {
                console.log(context);
                return `Count: ${context.formattedValue}`;
            },
        },
        {
            x: {
                ticks: {
                    stepSize: 20, // Set the scale increment for the x-axis
                },
                stacked: true
            },
            y: {
                stacked: true,
                min: 0,
                max: 9,
            }
        },
        {
            enable: true, 
            scrollType: 'vertical', 
            scrollSize: 10,
        }]
    }

    // FOR AGGREGATION
    popularModelValuesData(arrs) {

        const [deviceArr, modelArr] = arrs

        console.log(modelArr);

        const result = this._groupChartArrRank(deviceArr, modelArr)

        console.log(result);

        return [{
            labels: result[0].map((type) => type.device_type),
            datasets: result.map((innerArr, index) => ({
                label: innerArr.map((data) => data?.model_name),
                data: innerArr.map((data) => data?.model_value || 0),
                backgroundColor: innerArr.map(() => COLORSCALE[index % COLORSCALE.length]),
              })),
        },
        {
            title: function(context) {
                // console.log(context);
                const value = context[0].dataset.label[context[0].dataIndex] || '';
                return `Model: ${value}`
            },
            label: function(context) {
                const value = context.parsed.x.toFixed(2);
                return `Cost: $${value}`;
            },
        },
        {
            x: {
                stacked: true
            },
            y: {
                stacked: true,
                min: 0,
                max: 9
            }
        },
        {
            enable: true, 
            scrollType: 'vertical', 
            scrollSize: 10,
        }]
    }

    // FOR AGGREGATION
    topDevicesBudgetData(arrs) {

        const [deviceArr, modelArr] = arrs

        console.log(modelArr);

        const [yearArr, groupedArr] = this._groupChartArrYear(deviceArr, modelArr)

        // console.log(this.totalCostPerYear.find((obj) => obj['key'] === 2009)?.value);

        console.log(yearArr);
        console.log(this.totalCostPerYear);

        const labelsArr = yearArr.map((year) => [`${year}`, `$${parseFloat((this.totalCostPerYear.find((obj) => parseInt(obj['key']) === year))?.value || 0).toFixed(2)}`])

        console.log(labelsArr)

        return [{
            labels: labelsArr,
            datasets: groupedArr.map((deviceType, index) => {
                return {
                    label: Object.keys(deviceType)[0],
                    data: Object.values(deviceType)[0],
                    backgroundColor: COLORSCALE[index % COLORSCALE.length],
                }
            }),
        },
        {
            title: function(context) {
                console.log(context);
                console.log(context[0].dataset.label);
                const value = context[0].dataset.label || '';
                return `Type: ${value}`
            },
            label: function(context) {
                console.log(context);
                const value = context.parsed.y.toFixed(2);
                return `Expenditure: $${value}`;
            },
        },
        {
            x: {
                stacked: true,
                min: 0,
                max: 15
            },
            y: {
                stacked: true
            }
        },
        {
            enable: true, 
            scrollType: 'Horizontal', 
            scrollSize: 16,
        }]
    }

    _renderAggregateBarChart(el, arrs, getDataFunction, indexAxis = "x", display = false) { // popularModelsData


        const [data, callbacks, scales, scrollBar] = getDataFunction(arrs)

        console.log(data, callbacks, scales);
        const chart = new Chart(el, {
            // TYPE OF CHART
            type: 'bar',
            data: data,
            options: {
                layout: {
                    padding: 20
                },
                indexAxis: indexAxis,
                scales: scales,
                plugins: {
                    scrollBar: scrollBar,
                    legend: {
                        display: display
                    },
                    tooltip: {
                        callbacks: callbacks,
                    }
                },
                animation: {
                    animateScale: true,
                },
                onHover: (event, elements) => {
                    const chartElement = event.native.target;
                    if (elements.length > 0) {
                      chartElement.style.cursor = 'pointer';
                    } else {
                      chartElement.style.cursor = 'default';
                    }
                  }
            }
        });
    }

    _renderDoughnutChart(el, arr, getDataFunction, text) {

        const label = text[0]
        const title = text[1]
        const value = text[2]
        const isCurrency = text[3]
        const suffix = text[4]
        console.log(label, title, value, isCurrency, suffix);

        const [data, callbacks] = getDataFunction(arr, label, isCurrency, suffix)

        console.log(text);
        
        console.log(value);

        new Chart(el, {
        // TYPE OF CHART
            type: 'doughnut',
            data: data,
            options: {
                plugins: {
                    tooltip: {
                        enabled: true,
                        callbacks: callbacks,
                    },
                    legend: {
                        display: true,
                        position: 'right',
                        maxWidth: 120,
                        labels: {
                            boxWidth: 10
                        }
                    },
                    doughnutLabel: {
                        labels: [{
                            text: title,
                            color: "black",
                            font: {
                              size: "10",
                              weight: "bold"
                            }
                        },
                        {
                            text: value,
                            color: "black",
                            font: {
                              size: "13",
                              weight: "bold"
                            }
                        }],
                    }
                },
                animation: {
                    animateScale: true,
                },
                onHover: (event, elements) => {
                    const chartElement = event.native.target;
                    if (elements.length > 0) {
                    chartElement.style.cursor = 'pointer';
                    } else {
                    chartElement.style.cursor = 'default';
                    }
                }
            }
        });
    }

    // _renderLineChart(el, oldArr, getDataFunction) {

    //     const [arr, title] = oldArr

    //     const [data, callbacks, scales] = getDataFunction(arr, title)

    //     const chart = new Chart(el, {
    //     // TYPE OF CHART
    //         type: 'line',
    //         data: data,
    //         options: {
    //             layout: {
    //                 padding: 20
    //             },
    //             scales: scales,
    //             plugins: {
    //                 scrollBar: {enable: true, scrollType: 'Horizontal', scrollSize: 10},
    //                 tooltip: {
    //                     enabled: true,
    //                     callbacks: callbacks,
    //                 },
    //                 legend: {
    //                     display: false,
    //                 }
    //             },
    //             animation: {
    //                 animateScale: true,
    //             },
    //             onHover: (event, elements) => {
    //                 const chartElement = event.native.target;
    //                 if (elements.length > 0) {
    //                 chartElement.style.cursor = 'pointer';
    //                 } else {
    //                 chartElement.style.cursor = 'default';
    //                 }
    //             }
    //         }
    //     });
    // }
}


