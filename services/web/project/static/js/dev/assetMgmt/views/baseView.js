import ChartView from './chartView.js';
import Chart from 'chart.js/auto';
import { eventToStatus, hideEl, showEl } from '../../utilities/helpers.js';
import { ASSET_HOMEPAGE_URL } from '../../utilities/config.js';
import icons from 'url:../../../../sprite.svg'
import ChartjsPluginScrollBar from 'chartjs-plugin-scroll-bar';
import DoughnutLabel from "chartjs-plugin-doughnutlabel-v3";

class BaseView extends ChartView {

    initialize(initFunction) {
        initFunction() // controlShowDashboard
        Chart.register(DoughnutLabel, ChartjsPluginScrollBar);

        this._maxArrLen = 10
        this._popularDevicesCountChart = document.getElementById('popularDevicesCount');
        this._popularDevicesValueChart = document.getElementById('popularDevicesValue');
        this._popularModelsCountChart = document.getElementById('popularModelsCount');
        this._popularModelsValueChart = document.getElementById('popularModelsValue');
        this._devicesStatusChart = document.getElementById('devicesStatus');
        this._devicesAgeChart = document.getElementById('devicesAge');
        this._devicesAgeChart = document.getElementById('devicesAge');
        this._usersChart = document.getElementById('users');
        this._usersLoanChart = document.getElementById('usersLoan');
        this._budgetChart = document.getElementById('budget')
    }

    initializeChart(overview) {

        const data = overview
        const num = 100
        console.log(String(num.toFixed(2)));

        this.topDevices = data[0]
        this.topDevicesValue = data[1]
        this.topModels = data[2]
        this.topModelsValue = data[3]
        this.devicesStatus = data[4]
        this.devicesAge = data[5]
        this.users = data[6]
        this.usersLoan = data[7]
        this.costPerYear = data[8];
        this.totalCostPerYear = data[9]

        const totals = this._aggregate(this.topDevices, this.topDevicesValue, this.users, this.usersLoan);

        this.totalDevices = totals[0]
        this.totalDeviceValue = totals[1].toFixed(2)
        this.totalUsers = totals[2]
        this.totalLoan = totals[3]

        const avgs = this._average(this.devicesAge)
        this.avgAge = avgs[0]

        const percents = this._percentageLoan(this.devicesStatus)
        this.percentLoan = percents[0]


        // DEVICE AND DEVICE VALUES
        this._renderDoughnutChart(this._popularDevicesCountChart, this.topDevices, this.doughnutData.bind(this), ['Count: ', 'Total Devices', this.totalDevices]);
        this._renderDoughnutChart(this._popularDevicesValueChart, this.topDevicesValue, this.doughnutData.bind(this), ['Value: $', 'Total Value', `$${this.totalDeviceValue}`, true]);

        // MODEL AND MODEL VALUES
        this._renderAggregateBarChart(this._popularModelsCountChart, [this.topDevices, this.topModels], this.popularModelsData.bind(this), "y");
        this._renderAggregateBarChart(this._popularModelsValueChart, [this.topDevicesValue, this.topModelsValue], this.popularModelValuesData.bind(this), "y")

        // STATUS AND AGES
        this._renderDoughnutChart(this._devicesStatusChart, this.devicesStatus, this.doughnutData.bind(this), ['Count: ', 'Availability', this.percentLoan])
        this._renderDoughnutChart(this._devicesAgeChart, this.devicesAge, this.doughnutData.bind(this), ['Count: ', "Average Age", `${this.avgAge} years`, false, " years"], )
        this._renderDoughnutChart(this._usersChart, this.users, this.doughnutData.bind(this), ['Users: ', 'Total Users', this.totalUsers])
        this._renderDoughnutChart(this._usersLoanChart,this.usersLoan, this.doughnutData.bind(this), ['Devices: ', 'Total Devices', this.totalLoan])

        this._renderAggregateBarChart(this._budgetChart, [this.topDevices, this.costPerYear], this.topDevicesBudgetData.bind(this), "x", true)
    }

    _aggregate(...arr) {
        const aggregateArr = []
        arr.forEach((innerArr) => {
            const total = innerArr.reduce((counter, el) => {
                counter += el.value
                return counter
            }, 0)
            aggregateArr.push(total)
        })
        console.log(aggregateArr);
        return aggregateArr
    }

    _average(...arr) {
        const avgArr = []
        arr.forEach((innerArr) => {
            const totalCount = this._aggregate(innerArr)
            console.log(totalCount);
            const avg = innerArr.reduce((counter, el) => {
                if (innerArr.length !== 0)
                    counter += (el.key * (el.value / totalCount))
                return counter
            }, 0)
            avgArr.push(avg.toFixed(2))
        })
        return avgArr
    }

    _percentageLoan(...arr) {
        const percentArr = []
        arr.forEach((innerArr) => {
            const totalCount = this._aggregate(innerArr)
            console.log(totalCount);
            const percent = innerArr.reduce((counter, el) => {
                if (el.key !== 'loaned') return counter
                console.log(el);
                return counter += el.value / totalCount * 100
            }, 0)
            percentArr.push(`${(100 - percent).toFixed(2)}%`)
        })
        return percentArr
    }

}

export default new BaseView()