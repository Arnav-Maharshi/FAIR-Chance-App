//import * as myUtils from "./Modularized_Functions/utils.js";

const chartCanvas = document.getElementById("myChart");
const chartCtx = chartCanvas.getContext("2d");
let myChart; // Declare myChart variable to hold the chart instance

renderChart(); // Call the function to render the chart

async function renderChart() {
    const datapoints = await getData(); // Call the function to fetch and log data

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
            data: datapoints.MP_list,

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
            data: datapoints.PIP_list,

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
            data: datapoints.DIP_list,

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

        }
    ]
    },
    options: {
        //responsive: true,
        //maintainAspectRatio: false,
        scales: {
            x: { 
                beginAtZero: true,
                ticks: {
                    callback: function(value, index, ticks) {
                        // Display timetamp labels in seconds
                        let currentTime = Math.trunc(datapoints.timestamp_list[index]/1000);
                        let pastTime = Math.trunc(datapoints.timestamp_list[index-1]/1000);
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
                        const title = (context[0].label/1000).toFixed(2); // Convert milliseconds to seconds and format to 2 decimal places
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
            }
        },
        layout: {
            backgroundColor: "rgba(255, 251, 251, 1.0)" // This does NOT work in Chart.js 3/4
        }
        }
    });
}


async function getData() {
    const frames_list = [];
    const timestamp_list = [];
    const MP_list = [];
    const PIP_list = [];
    const DIP_list = [];
    const acc_score_list = [];
    const url = '../js/ms_data3.csv';
    const response = await fetch(url);
    const tabledata = await response.text();
    //console.log(tabledata);

    const lines = tabledata.split('\n');
    console.log(`Lines: ${lines}`);
    const headers = lines[0].split(',');
    console.log(`Headers: ${headers}`);
    const data = lines.slice(1);
    console.log(`Data: ${data}`);

    data.forEach(row => {
        const column = row.split(',');
        const frames = column[0];
        const timestamp = column[1]; // Assuming the second column is the timestamp
        const MP = column[2];
        const PIP = column[3];
        const DIP = column[4];
        const acc_score = column[5];

        frames_list.push(frames);
        timestamp_list.push(timestamp);
        MP_list.push(MP);
        PIP_list.push(PIP);
        DIP_list.push(DIP);
        acc_score_list.push(acc_score);
    });

    console.log(`frames: ${frames_list}`);
    console.log(`MP: ${MP_list}`);
    console.log(`PIP: ${PIP_list}`);
    console.log(`DIP: ${DIP_list}`);
    console.log(`acc_score: ${acc_score_list}`);

    return { headers, frames_list, timestamp_list, MP_list, PIP_list, DIP_list, acc_score_list };
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