/*
GSMA ZTC WG MPTCP HAG throughput display graphs developed for Mobile World Congress 2022

Authors: BT and Tessares
Date: 09.02.2022 
*/

google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawLineChart);
google.charts.setOnLoadCallback(drawPieChart);

// Display refresh - used for pausing display
var refreshEnabled = 1;

// Variables used for waiting until callbacks received from both HAGs before updating display
var callbackCount = 0;
const maxCallbackCount = 2;

// Values of 0 & 1 display individual HAG throughput
// Value of 2 (default) shows combined output
var graphSelection = 2;

// HAG URLs
const urls = [
   "http://xxx.xxx.xxx.xxx:port/",
   "http://yyy.yyy.yyy.yyy:port/"
];

// Period with which to retreive throughput data in ms
const samplePeriodMs = 1000;

// Max samples to display @ 1 sample/second
const maxWindow = 120;

// Variables to store sample history for each HAG as well as combined history
var hag1 = {raw: [], Mbps: [['Time', 'Wi-Fi', 'Cellular']]};
var hag2 = {raw: [], Mbps: [['Time', 'Wi-Fi', 'Cellular']]};
var totals = {Mbps: [['Time', 'Wi-Fi', 'Cellular']]};

//
// Line graph options
//
var optionsLine = { 
  chartArea: { 
	left: 50,
	width: '90%'
  },
  title: 'Downlink throughput',
  titleTextStyle: {
	color: 'white',
	fontSize: 20
  },
  backgroundColor: '#2d2d2d',
  legend: { 
	position: 'top',
	alignment: 'end',
	textStyle: {color: 'white'}
  },
  hAxis: {
	title: 'Time [mm:ss]',
	titleTextStyle: {color: 'white'},
	format: 'mm:ss',
	textStyle: {color: 'white'},
	gridlines: {
	  color: 'white',
	  count: 10,
	}
  },
  vAxis: {
	title: "Mbps",
	titleTextStyle: {color: 'white'},
	textStyle: {color: 'white'},
	viewWindow: {
	  min: 0,
	},
  }
};

//
// Pie chart options
//
var optionsPie = {
  title: 'Wi-Fi and Cellular ratio',
  titleTextStyle: {
	color: 'white',
	fontSize: 20
  },
  legend: { 
	position: 'top',
	textStyle: {color: 'white'}
  },
    //is3D: true,
	backgroundColor: '#2d2d2d'
};

//
// Retreive data from both HAGs
//
function getAllData()
{
	if(callbackCount == 0) {
		getData(0);
		getData(1);
	}
	else {
		//console.log("getAllData: ignoring as still waiting for data, count=" + callbackCount);
	}		
}

//
// Retreive data from HAG, process and update graphs if data from both HAGs recieved
//
function getData(index) {
  if(index > urls.length - 1) 
  {
	  console.log("Invalid URL index: " + index);
	  return;
  }
  
  if (refreshEnabled == 1) {
	var xmlhttp = new XMLHttpRequest();

	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			var myArr = JSON.parse(this.responseText);
			//console.log("index="+index+", "+this.responseText);
			timing = new Date(myArr["Timing"]);
			processData(index, [timing, bytesToMbits(parseInt(myArr["Transmitted"]["Wifi"])), bytesToMbits(parseInt(myArr["Transmitted"]["Cell"]))]);
			callbackCount++;
			if(callbackCount == maxCallbackCount) {
				drawLineChart();
				callbackCount = 0;
			}
		}
	};
	xmlhttp.open("GET", urls[index], true);
	xmlhttp.send();
  }
}

function bytesToMbits(bytes) {
  return bytes*8/(1000*1000)
}

//
// Process the data from HAG e.g. update history
//
function processData(index,fetched) {
  if (typeof fetched !== 'undefined'){
	//console.log("processData: index=" + index + ", callbackCount=" + callbackCount);
	updateData(index,fetched[0],fetched[1],fetched[2])
  }
}

//
// Update the line graph usind the data set pointed to by graphSelection
//
function drawLineChart() {
  var dataArray = getDataSet(graphSelection).Mbps;

  if (dataArray.length > 1) {
	var dataTable = google.visualization.arrayToDataTable(dataArray);
	var chart = new google.visualization.AreaChart(document.getElementById('line_chart'));
	chart.draw(dataTable, optionsLine);

	drawPieChart(makeRatio(dataArray))
  }
}

//
// Update the PIE chart
//
function drawPieChart(ratioWifi) {
  var ratioCell = 1 - ratioWifi;
  var pies = google.visualization.arrayToDataTable([
	['Task', 'Hours per Day'],
	['Wi-Fi',     ratioWifi],
	['Cellular',      ratioCell],
  ]);

  var chart = new google.visualization.PieChart(document.getElementById('pie_chart'));

  chart.draw(pies, optionsPie);
}

//
// Calculate ratio of Wi-Fi to Cellular data for Pie chart
//
function makeRatio(dataArray) {
  const reducerWifi = (accumulator, item) => { return accumulator + item[1]; };
  var wifi = dataArray.slice(1).reduce(reducerWifi, 0);
  const reducerCell = (accumulator, item) => { return accumulator + item[2]; };
  var cell = dataArray.slice(1).reduce(reducerCell, 0);

  var ratio = wifi/(wifi+cell)
  if (isNaN(ratio)) { ratio = 1 }

  return ratio;
}

//
// Update:
//   - individual HAG history
//   - calculate Mbps and store
//   - update combined graph history/Mbps
//
function updateData(index, sec, wifi, cell) {
 
  var ds = getDataSet(index);
  var cellMbps = 0;
  var wifiMbps = 0;
  
  // if wifi && cell >0
  if (ds.raw.length > 0) {
	var interval = (sec-ds.raw[ds.raw.length-1][0])/1000 // per seconds
	cellMbps = (cell-ds.raw[ds.raw.length-1][2])/interval;
	if (cellMbps<0) {cellMbps = 0}
	wifiMbps = (wifi-ds.raw[ds.raw.length-1][1])/interval;
	if (wifiMbps<0) {wifiMbps = 0}

	ds.Mbps.push([sec, wifiMbps, cellMbps]);
	//console.log("index="+index+",wifiMbps="+wifiMbps);
  }
  // Could make this more efficient as don't need to store all raw data
  ds.raw.push([sec,wifi,cell]);
  
  if (ds.raw.length >= maxWindow) {
	ds.raw.shift();
	ds.Mbps.shift(); // This removes the header line, being the first element
	// restore header on top of oldest data value 
	ds.Mbps.splice(0,1,['Time', 'Wi-Fi', 'Cellular']);
  }
  
  // Now update totals
  if(callbackCount == 0) {
	  // Store values of first hag to respond
	  totals.Mbps.push([sec,wifiMbps,cellMbps]);
  }
  else {
	  // Add values from second hag to previously stored above
  	  totals.Mbps[totals.Mbps.length-1][1] += wifiMbps;
	  totals.Mbps[totals.Mbps.length-1][2] += cellMbps;
	  //console.log("total="+totals.Mbps[totals.Mbps.length-1][1]);
	  
      if (totals.Mbps.length > maxWindow) {
	    totals.Mbps.shift(); // This removes the header line, being the first element
		// restore header on top of oldest data value 
		totals.Mbps.splice(0,1,['Time', 'Wi-Fi', 'Cellular']);
      }  
  }
}

//
// Return the appropriate data set for updating graphs
//
function getDataSet(ind)
{
  var ds;
  switch(ind) {
	  case 0: {ds = hag1; break;}
	  case 1: {ds = hag2; break;}
	  default: {ds = totals;}
  }
  return ds;
}

// Start timer to retrieve HAG data
var interval = setInterval(getAllData, samplePeriodMs);


//////////////////////////////////////////////////////////////
// GUI controls
//////////////////////////////////////////////////////////////

//
// Control the graph update when play/pause button pressed
//
function stopStartGraph() {
  if (refreshEnabled == 1) {
	refreshEnabled = 0;
	document.querySelector('#playImage').innerHTML = '<img src="img/play.png" class="play">';
	document.querySelector('#playTooltTip').innerText = 'Start graph update';
  }
  else {
	refreshEnabled = 1;
	document.querySelector('#playImage').innerHTML = '<img src="img/stop.png" class="stop">';
	document.querySelector('#playTooltTip').innerText = 'Pause graph update';
  }
}

//
// Control the graph selection depending on which device has been selected
// If an attempt to deselect both devices is made, then the previously unselected
// device will be selected i.e. there will always be at least one device selected
//
function selectDevice(sel) {
	var dev1 = document.querySelector('#device1');
	var dev2 = document.querySelector('#device2');
	
	if(!dev1.checked && !dev2.checked) {
		if(sel=="1") {
			dev2.checked = true;
			graphSelection = 1;
		}
		else 
		{
			dev1.checked=true;
			graphSelection = 0;
		}
	}
	else if(dev1.checked && dev2.checked) {
		graphSelection = 2;
	}
	else if(dev2.checked) {
		graphSelection = 1;
	}
	else {
		graphSelection = 0;
	}
	
	if(dev1.checked) document.querySelector('#lab1').style.color = "White";
	else document.querySelector('#lab1').style.color = "Grey";

	if(dev2.checked) document.querySelector('#lab2').style.color = "White";
	else document.querySelector('#lab2').style.color = "Grey";
	
	//console.log("Clicked: " + sel + " Status:" + dev1.checked + ":" + dev2.checked + " GraphSelection=" + graphSelection);
}
