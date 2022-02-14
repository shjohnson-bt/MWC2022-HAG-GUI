/*
GSMA ZTC WG MPTCP HAG throughput display graphs developed for Mobile World Congress 2022

Authors: BT and Tessares
Date: 14.02.2022 
*/


// Display refresh - used for pausing display
var refreshEnabled = 1;

// Variables used for waiting until callbacks received from both HAGs before updating display
var callbackCount = 0;
const maxCallbackCount = 2;

// Values of 0 & 1 display individual HAG throughput
// Value of 2 (default) shows combined output
var graphSelection = 2;

// Period with which to retreive throughput data in ms
const samplePeriodMs = 1000;

// Max samples to display @ 1 sample/second
const maxWindow = 120;

// Variables to store sample history for each HAG as well as combined history
var hag1 = {raw: [], Mbps: [hagChartHeader]};
var hag2 = {raw: [], Mbps: [hagChartHeader]};
var totals = {Mbps: [totalsChartHeader]};

//
var chartsLoaded = false;

//
// Line graph options
//
var optionsLine = { 
  chartArea: { 
	left: 50,
	width: '90%'
  },
  title: totalsLineChartTitle,
  titleTextStyle: {
	color: 'white',
	fontSize: 20
  },
  colors: totalsLineChartColours,
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
  title: totalsPieChartTitle,
  titleTextStyle: {
	color: 'white',
	fontSize: 20
  },
  legend: { 
	position: 'top',
	textStyle: {color: 'white'}
  },
  pieSliceText: 'value',
  backgroundColor: '#2d2d2d',
  slices: totalsPieChartStyles
};

// Callback to indicate we can start drawing graphs
function chartsReadyCallback() {
	chartsLoaded = true;
}

//
// body onload initialsiation function
//
function initialise() {
	google.charts.load('current', {'packages':['corechart']});
	google.charts.setOnLoadCallback(chartsReadyCallback);

	document.querySelector('#lab1').innerHTML = hag_label_1;
	document.querySelector('#lab2').innerHTML = hag_label_2;

	// Start timer to retrieve HAG data
	setInterval(getAllData, samplePeriodMs);
}

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
// Retreive data from HAG, process and update graphs 
// if data from both HAGs recieved
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
// Process the data from HAG e.g. update history and graph (if required)
//
function processData(index,fetched) {
  if (typeof fetched !== 'undefined'){
	//console.log("processData: index=" + index + ", callbackCount=" + callbackCount);
	updateData(index,fetched[0],fetched[1],fetched[2])
  }
}

//
// Update the PIE chart
//
function drawPieChart(dataArray) {
  if(chartsLoaded == false) return;
  
  var ratio1 = 0;
  var ratio2 = 0;

  var label_1 = "Wi-Fi";
  var label_2 = "Cellular";
  if(graphSelection == 2) {
	  label_1 = hag_label_1;
	  label_2 = hag_label_2;
	  var totals = makeTotals(dataArray);
	  ratio1 = totals[0];
	  ratio2 = totals[1];
  }
  else {
	  ratio1 = makeRatio(dataArray);  
	  ratio2 = 1 - ratio1;
  }
  var pies = google.visualization.arrayToDataTable([
	['Task', 'Hours per Day'],
	[label_1, ratio1],
	[label_2, ratio2],
  ]);

  var chart = new google.visualization.PieChart(document.getElementById('pie_chart'));

  chart.draw(pies, optionsPie);
}

//
// Update the line graph usind the data set pointed to by graphSelection
//
function drawLineChart() {
  if(chartsLoaded == false) return;

  var dataArray = getDataSet(graphSelection).Mbps;

  if (dataArray.length > 1) {
	var dataTable = google.visualization.arrayToDataTable(dataArray);
	var chart = new google.visualization.AreaChart(document.getElementById('line_chart'));
	chart.draw(dataTable, optionsLine);
 
	drawPieChart(dataArray);
  }
}

//
// Calculate ratio of data for Pie chart
//
function makeRatio(dataArray) {
  if(dataArray === 'undefined' || dataArray.length <= 1) return 0;
  
  const red1 = (accumulator, item) => { return accumulator + item[1]; };
  var tot1 = dataArray.slice(1).reduce(red1, 0);
  const red2 = (accumulator, item) => { return accumulator + item[2]; };
  var tot2 = dataArray.slice(1).reduce(red2, 0);

  var ratio = tot1/(tot1+tot2)
  if (isNaN(ratio)) { ratio = 1 }

  return ratio;
}

//
// Calculate ratio of data for Pie chart
//
function makeTotals(dataArray) {
  if(dataArray === 'undefined' || dataArray.length <= 1) return [0,0];
  
  const reducer1 = (accumulator, item) => { return accumulator + item[1]; };
  var tot1 = parseFloat((dataArray.slice(1).reduce(reducer1, 0)/dataArray.length).toFixed(1));
  const reducer2 = (accumulator, item) => { return accumulator + item[2]; };
  var tot2 = parseFloat((dataArray.slice(1).reduce(reducer2, 0)/dataArray.length).toFixed(1));

  return [tot1,tot2];
}

//
// Update:
//   - individual HAG history
//   - calculate Mbps and store
//   - update combinde graph history/Mbps
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
	ds.Mbps.splice(0,1,hagChartHeader);
  }
  
  var totalThroughput = wifiMbps + cellMbps;
  // Now update totals
  if(callbackCount == 0) {
	  // Add totals from first HAG to respond
	  if(index == 0) totals.Mbps.push([sec,totalThroughput,0]);
	  else totals.Mbps.push([sec,0,totalThroughput]);
  }
  else {
	  // Add values from second hag to previously stored above
	  if(index == 0) totals.Mbps[totals.Mbps.length-1][1] += totalThroughput;
	  else totals.Mbps[totals.Mbps.length-1][2] += totalThroughput;
	  
	  //console.log("total="+totals.Mbps[totals.Mbps.length-1][1]);
	  
      if (totals.Mbps.length >= maxWindow) {
	    totals.Mbps.shift(); // This removes the header line, being the first element
		// restore header on top of oldest data value 
		totals.Mbps.splice(0,1,totalsChartHeader);
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
// Control the graph selection depending on which hag/device has been selected
// If an attempt to deselect both hags is made, then the previously unselected
// hag will be selected i.e. there will always be at least one hag selected
//
function selectHag(sel) {
	var hag1 = document.querySelector('#hag1');
	var hag2 = document.querySelector('#hag2');
	
	if(!hag1.checked && !hag2.checked) {
		if(sel=="1") {
			hag2.checked = true;
			graphSelection = 1;
		}
		else 
		{
			hag1.checked=true;
			graphSelection = 0;
		}
	}
	else if(hag1.checked && hag2.checked) {
		graphSelection = 2;
	}
	else if(hag2.checked) {
		graphSelection = 1;
	}
	else {
		graphSelection = 0;
	}
	
	if(hag1.checked) 
	{
		document.querySelector('#lab1').style.color = "White";
		document.querySelector('#hag1').style.background = "White";
	}
	else {
		document.querySelector('#lab1').style.color = "Grey";
		document.querySelector('#hag2').style.background = "Grey";
	}
	if(hag2.checked) document.querySelector('#lab2').style.color = "White";
	else document.querySelector('#lab2').style.color = "Grey";
	
	updateGraphOptions();
	
	//console.log("Clicked: " + sel + " Status:" + hag1.checked + ":" + hag2.checked + " GraphSelection=" + graphSelection);
}

function updateGraphOptions()
{
	switch(graphSelection) {
		case 0:
		case 1:
			optionsLine.title  = hagLineChartTitle + (graphSelection==0?hag_label_1:hag_label_2);
			optionsLine.colors = hagLineChartColours;
			optionsPie.title  = (graphSelection==0?hag_label_1:hag_label_2) + hagPieChartTitle;
			optionsPie.slices = hagPieChartStyles;
			optionsPie.pieSliceText = "percentage";
		    break;
		case 2:
		default:
			optionsLine.title  = totalsLineChartTitle;
			optionsLine.colors = totalsLineChartColours;
			optionsPie.title  = totalsPieChartTitle;
			optionsPie.slices = totalsPieChartStyles;
			optionsPie.pieSliceText = "value";
			break;
	}
	
	drawLineChart();
}
