//import * as myUtils from "./Modularized_Functions/utils.js";
/*import '../libs/chart.umd.js'; // Import Chart.js library
import '../libs/hammer.min.js'; // Import Hammer.js for touch gestures
import '../libs/chartjs-plugin-zoom.min.js'; // Import Chart.js zoom plugin
*/
import Chart from 'chart.js/auto';
import 'hammerjs'; // Import Hammer.js for touch gestures
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(zoomPlugin);

const chartCanvas = document.getElementById("myChart");
const chartCtx = chartCanvas.getContext("2d");
const parentContainer = document.getElementById("chartContainer");
const containerWidth = parentContainer.offsetWidth;
const containerHeight = parentContainer.offsetHeight;
let myChart; // Declare myChart variable to hold the chart instance

const uploadFile = document.getElementById("uploadFile");
let selectedFile;

// On page/app load (default file provided as input to getDat() function)
window.addEventListener('DOMContentLoaded', async () => {
    const default_file = await (await fetch("../csv_data/default_file.csv")).text();
    const datapoints = await getData(default_file); // Call the function to fetch and parse data 
    renderChart(datapoints);
});

// On uploading a new file
uploadFile.addEventListener("change", () => {
            selectedFile = uploadFile.files[0];
            if (!selectedFile) return;

            const reader = new FileReader();
            reader.onload = async () => {
                const csv_data = reader.result;
                const datapoints = await getData(csv_data); // Call the function to fetch and parse data
                if (myChart){
                    myChart.destroy(); // Destroying existing chart instance if any
                }
                renderChart(datapoints);
            };
            reader.onerror = () => console.log("Error reading file");
            reader.readAsText(selectedFile); 
            console.log(`File- ${selectedFile}`);
        });





//chartCanvas.width = parentContainer.offsetWidth;
//chartCanvas.height = parentContainer.offsetHeight;

/*if (window.matchMedia("(orientation: portrait)").matches) {
    // In portrait, the container's width is the desired *height* of the chart,
    // and the container's height is the desired *width*.
    chartCanvas.width = containerHeight;
    chartCanvas.height = containerWidth;
} else {
    // In landscape, or default, follow the container directly
    chartCanvas.width = containerWidth;
    chartCanvas.height = containerHeight;
}*/


async function renderChart(datapoints) {

    const ptRadius = 2; // Set the point radius for the datapoints
    const header_labels = datapoints.headers; // Get the headers from the fetched data
    const colors = ["rgba(241, 59, 59, 1)", "rgba(67, 167, 77, 1)", "rgba(59, 114, 241, 1)", "#ff9800"]; // Define colors for the datasets
    const line_tension = 0.3; // Set the line tension for the chart
    const pointHoverRadius = 6; // Set the point hover radius for better visibility
    const pointHoverBackgroundColor = "rgba(0, 255, 200, 0.4)"; // Set the point hover background color
    const pointHoverBorderWidth = 2; // Set the point hover border width

    myChart = new Chart(chartCtx, {
    type: "line",
    data: {
        labels: datapoints.timestamp_list,
        datasets: [{
            label: header_labels[2], // MP
            data: datapoints.c3_list,

            fill: false,
            pointRadius: ptRadius,
            backgroundColor: colors[0],
            borderColor: colors[0],
            lineTension: line_tension,
            
            pointHoverRadius: pointHoverRadius, // Set the point hover radius
            pointHoverBackgroundColor: pointHoverBackgroundColor, // Set the point hover background color
            pointHoverBorderColor: colors[0], // Set the point hover border color
            pointHoverBorderWidth: pointHoverBorderWidth, // Set the point hover border width
        },
        {
            label: header_labels[3], // PIP
            data: datapoints.c4_list,

            fill: false,
            pointRadius: ptRadius,
            backgroundColor: colors[1],
            borderColor: colors[1],
            lineTension: line_tension,
            
            pointHoverRadius: pointHoverRadius, // Set the point hover radius
            pointHoverBackgroundColor: pointHoverBackgroundColor, // Set the point hover background color
            pointHoverBorderColor: colors[1], // Set the point hover border color
            pointHoverBorderWidth: pointHoverBorderWidth, // Set the point hover border width
        },
        {
            label: header_labels[4], // DIP
            data: datapoints.c5_list,

            fill: false,
            pointRadius: ptRadius,
            backgroundColor: colors[2],
            borderColor: colors[2],
            lineTension: line_tension,

            pointHoverRadius: pointHoverRadius, // Set the point hover radius
            pointHoverBackgroundColor: pointHoverBackgroundColor, // Set the point hover background color
            pointHoverBorderColor: colors[2], // Set the point hover border color
            pointHoverBorderWidth: pointHoverBorderWidth, // Set the point hover border width
        },
        {
            label: "Accuracy Score",
            data: datapoints.acc_score_list,
            
            fill: false,
            pointRadius: ptRadius,
            backgroundColor: "#ff9800",
            borderColor: "rgba(255, 152, 0, 1)",
            
            pointHoverRadius: pointHoverRadius, // Set the point hover radius
            pointHoverBackgroundColor: pointHoverBackgroundColor, // Set the point hover background color
            pointHoverBorderColor: colors[2], // Set the point hover border color
            pointHoverBorderWidth: pointHoverBorderWidth, // Set the point hover border width
            lineTension: 0.4,
        }
    ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false, // When false- Allow the chart to resize with the container (otherwise it will shrunk)
        
        scales: {
            x: { 
                beginAtZero: true,
                ticks: {
                    callback: function(value, index, ticks) {
                        // Display timetamp labels in seconds
                        let currentTime = Math.trunc(datapoints.timestamp_list[index]);///1000);
                        let pastTime = Math.trunc(datapoints.timestamp_list[index-1]);///1000);
                        if (currentTime - pastTime >= 1) {
                            console.log(`Time: ${currentTime}`);
                            return currentTime;
                        }
                    }
                }
            },
            y: {
            beginAtZero: true,
            }
        },
        plugins: {
            tooltip: {
                enabled: true,
                backgroundColor: "#aec7ddff",
                titleColor: "#000000ff",
                titleFont: { weight: 'normal' },
                bodyColor: "#000000ff",
                bodyFont: { weight: 'bold' },
                bodyAlign: "center",
                padding: 8,
                cornerRadius: 2,
                caretSize: 6,
                borderColor: "#000000ff",
                borderWidth: "1",
                yAlign: "bottom",
                 callbacks: {
                    title: function(context) {
                        // You can access data related to the hovered element here
                        const title = (context[0].label);
                        return 'Time(sec): ' + title; // Customize your title here
                    },
                    label: function(context) {
                        // You can access data related to the hovered element here
                        const label = context.dataset.label;
                        if (label === 'Accuracy Score') {
                            return label + ': ' + context.parsed.y + '%'; // Customize your label here
                        }
                        else if (label === 'MP' || label === 'PIP' || label === 'DIP') {
                            return label + ': ' + context.parsed.y + '°'; // Customize your label here
                        }
                    }
                },
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'xy',
                },
                zoom: {
                    mode: 'xy', // Allow zooming in both x and y directions
                    wheel: {
                        enabled: true,
                        speed: 0.06, // Adjust the zoom speed
                    },
                    pinch: {
                        enabled: true,
                    },
                    /*drag: {
                        enabled: true,
                        backgroundColor: 'rgba(28, 177, 247, 0.1)', // Background color for the drag area
                        borderColor: 'rgba(28, 177, 247, 0.5)',
                        borderWidth: 1, // Border width for the drag area
                        threshold: 400, // Minimum distance to trigger a drag
                    },*/

                }
            },
            legend: {
                labels: {
                    filter: function(legendItem, data) {
                        const dataset = data.datasets[legendItem.datasetIndex];
                        // Check if the dataset data is undefined, null, or empty
                        if (!dataset.data || dataset.data.length === 0) {
                            return false;
                        }
                        return true;
                    }
                }
            }
        },
        layout: {
            backgroundColor: "rgba(255, 251, 251, 1.0)" // This does NOT work in Chart.js 3/4
        }
        }
    });
}


async function getData(csv_data) {
    const frames_list = [];
    const timestamp_list = [];
    const c3_list = [];
    const c4_list = [];
    const c5_list = [];
    const c6_list = [];
    const c7_list = [];
    /* const url = await selectedFile; //'../csv_data/ms_data3.csv';
    const response = await fetch(url);
    const tabledata = await fileContent.text();
    console.log(tabledata); */
    
    
    console.log("File Content after func:", csv_data);

    const lines = csv_data.split('\n');//tabledata.split('\n');
    console.log(`Lines: ${lines}`);
    const headers = lines[0].split(',');
    console.log(`Headers: ${headers}`);
    const data = lines.slice(1);
    console.log(`Data: ${data}`);

    data.forEach(row => {
        const column = row.split(',');
        const frames = column[0];
        const timestamp = column[1]; // Assuming the second column is the timestamp
        

        frames_list.push(frames);
        timestamp_list.push(timestamp);

        if (headers[2]==="MP") {
            const MP = column[2];
            const PIP = column[3];
            const DIP = column[4];
            const acc_score = column[5];

            c3_list.push(MP);
            c4_list.push(PIP);
            c5_list.push(DIP);
            c6_list.push(acc_score);
        } 
        else if (headers[3]==="AccScore") {
            const some_finger = column[2];
            const acc_score = column[3];

            c3_list.push(some_finger);
            c4_list.push(acc_score);
        }
        else {
            const indexF = column[2];
            const middleF = column[3];
            const ringF = column[4];
            const littleF = column[5];
            const acc_score = column[6];

            c3_list.push(indexF);
            c4_list.push(middleF);
            c5_list.push(ringF);
            c6_list.push(littleF);
            c7_list.push(acc_score);
        }
    });

    console.log(`frames: ${frames_list}`);
    console.log(`MP: ${c3_list}`);
    console.log(`PIP: ${c4_list}`);
    console.log(`DIP: ${c5_list}`);
    console.log(`acc_score: ${c6_list}`);

    return { headers, frames_list, timestamp_list, c3_list, c4_list, c5_list, c6_list, c7_list };
}

function resetChartZoom() {
    if (myChart) {
        myChart.resetZoom();
    } else {
        console.error("Chart instance not found.");
    }
}

function zoomIn() {
    if (myChart) {
        myChart.zoom(1.3); // Zoom in by 30%
    } else {
        console.error("Chart instance not found.");
    }
}   

function zoomOut() {
    if (myChart.getZoomLevel() > 1.0) { // Only zoom out if already zoomed in
        myChart.zoom(0.7); // Zoom out by 30%
    } else {
        console.error("Chart instance not found.");
    }
}

window.resetChartZoom = resetChartZoom;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;