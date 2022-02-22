/*
GSMA ZTC WG MPTCP HAG throughput display graphs developed for Mobile World Congress 2022

Authors: BT and Tessares
Date: 14.02.2022 
*/

///////////////////////////////////////////////////////////////////////////////////
// Constants and variable declaration/definition
//////////////////////////////////////////////////////////////////////////////////

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

// Max number of samples to store ~ 1 sample per second
const maxWindowSamples = 60*60;

// Minimum 'zoom-in' window size in milliseconds 
const minWindowSizeMs = 20*samplePeriodMs;

// Window size in ms during live updates
const liveWindowSizeMs = 2*60*samplePeriodMs;

// Variables to store sample history for each HAG as well as combined history
var hag1, hag2, totals;

// Google chart objects
var dashboard, chartSliderWrapper, lineChartWrapper;

//
var chartsLoaded = false;

var lastStateRange;

// Restrict the frequency with which PIE chart update calculations are performed
// when invoked from the chart wrapper slider
var nextUpdateTimeMs = Date.now();
var updateIntervalMs = 400;

// Last HTTP request time
var lastRequestTimeMs = 0;


// Pre-populate data structures for testing
const testing = false;

///////////////////////////////////////////////////////////////////////////////////
// Functions
//////////////////////////////////////////////////////////////////////////////////

//
// body onload initialsiation function
//
function initialise() {
	google.charts.load('current', {'packages':['corechart', 'controls']});
	google.charts.setOnLoadCallback(chartsReadyCallback);

	document.querySelector('#lab1').innerHTML = hag_label_1;
	document.querySelector('#lab2').innerHTML = hag_label_2;

	if(testing) {
		// Populate arrays for testing
		loadData();
	}

	// Start timer to retrieve HAG data
	setInterval(getAllData, samplePeriodMs);
}

//
// Fill arrays with data
// - used to speed up testing for graph behaviour with full windows 
// 
function loadData()
{
	hag1 = {raw: [], Mbps: [hagChartHeader]};
	hag2 = {raw: [], Mbps: [hagChartHeader]};
	totals = {raw: [], Mbps: [totalsChartHeader]};
		
	var thisDate;
	var w1 = 15000;
	var w2 = 4;
	var c1 = 12200;
	var c2 = 10002;
	
	var startDateMs = Date.now() - 60*60*1000;
	
	var startDate = new Date(startDateMs);
	hag1.raw.push([startDate, w1, c1]);
	hag2.raw.push([startDate, w2, c2]);
	totals.raw.push([startDate,w1+c1,w2+c2]);
	
	for(i=1; i<=maxWindowSamples; i++) {
		thisDate = new Date(startDateMs + i*1000);
		w1 += (10+2*Math.random());
		c1 += (8+2*Math.random());
		w2 += (0.0001*Math.random());
		c2 += 0;

		hag1.raw.push([thisDate, w1, c1]);
		hag2.raw.push([thisDate, w2, c2]);
		totals.raw.push([thisDate,w1+c1,w2+c2]);

		// 1 second interval, so don't need to divide by time
		hag1.Mbps.push([thisDate, w1-hag1.raw[i-1][1], c1-hag1.raw[i-1][2]]);
		hag2.Mbps.push([thisDate, w2-hag2.raw[i-1][1], c2-hag2.raw[i-1][2]]);
		
		totals.Mbps.push(
			[
			 thisDate, 
			 (w1-hag1.raw[i-1][1]) + (c1-hag1.raw[i-1][2]),
			 (w2-hag2.raw[i-1][1]) + (c2-hag2.raw[i-1][2])
			]
		);
	}
	
	lastRequestTimeMs = thisDate;
}

// Callback to indicate we can start drawing graphs
function chartsReadyCallback() {
	dashboard = new google.visualization.Dashboard(document.querySelector('#lc_dashboard'));
    chartSliderWrapper = new google.visualization.ControlWrapper(controlWrapperOptions);
    lineChartWrapper = new google.visualization.ChartWrapper(chartWrapperOptions);
	dashboard.bind(chartSliderWrapper,lineChartWrapper);

    google.visualization.events.addListener(chartSliderWrapper, 'statechange', sliderStateChangeHandler);

	chartsLoaded = true;
}

//
// Control wrapper slider has moved so stop graph and update pie chart if necessary
//
function sliderStateChangeHandler(e) {		
	if(refreshEnabled == 1) stopStartGraph(true);

    // Restrict the frequency of updates to improve performance
    var now = Date.now();
    if(now < nextUpdateTimeMs) return;
	nextUpdateTimeMs = now + updateIntervalMs;
	
	var state = chartSliderWrapper.getState();
	
    if(!areEqual(state.range, lastStateRange)) {		
	    //console.log("Different start=" + state.range.start + " end=" + state.range.end);

		lastStateRange.start = state.range.start;
		lastStateRange.end = state.range.end;
		
		var dataArray = getDataSet(graphSelection).raw;
		drawPieChart(getRangeSubset(dataArray, lastStateRange.start, lastStateRange.end));
	}
}

//
// Determine if control wrapper slider start and end points are the same
//
function areEqual(range1, range2) {
	if(range1.start == null || range1.end == null || range2.start == null || range2.end == null) return false;
	if(Math.trunc(range1.start.getTime()/1000) != Math.trunc(range2.start.getTime()/1000)) return false;
	if(Math.trunc(range1.end.getTime()/1000) != Math.trunc(range2.end.getTime()/1000)) return false;

	return true;
}

//
// Retreive data from both HAGs
//
function getAllData()
{
	if((lastRequestTimeMs == 0) ||
	   (Date.now() - lastRequestTimeMs) >  maxWindowSamples*samplePeriodMs)
	{
		if(lastRequestTimeMs != 0) console.log(new Date() + ": data is out of date - purging...");
		
		// Initialise data first time round or...
		// browser tab might have been sleeping, so purge data
		hag1 = {raw: [], Mbps: [hagChartHeader]};
		hag2 = {raw: [], Mbps: [hagChartHeader]};
		totals = {raw: [], Mbps: [totalsChartHeader]};	
		
		lastStateRange = {'start':null, 'end':null}; 
	}

	lastRequestTimeMs = Date.now();

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
  if(chartsLoaded == false || dataArray == null) return;
  
  var ratio1, ratio2;
  var label_1, label_2;
  var totalsUnits;

  var volume1 = dataArray[dataArray.length-1][1] - dataArray[0][1];
  var volume2 = dataArray[dataArray.length-1][2] - dataArray[0][2];

  if(volume1 < 0 || volume2 < 0) {
	  console.log("drawPieChart: Warning - negative data, vol1=" + volume1 + ", vol2=" + volume2 +
		", len=" + dataArray.length);
	volume1 = volume2 = 1;
  }
  
  if(graphSelection == 2) {
	  // Total throughput for each HAG
	  label_1 = hag_label_1;
	  label_2 = hag_label_2;

      var intervalMs = dataArray[dataArray.length-1][0].getTime() - dataArray[0][0].getTime();
	  if(intervalMs > 0) {
		  ratio1 = 1000*volume1/intervalMs;
		  ratio2 = 1000*volume2/intervalMs;
	  }
	  else {
		  ratio1 = ratio2 = 0;
	  }
	  
	  if(ratio1 > 1.0 || ratio2 > 1.0) {
		  totalsUnits = "Mbps";
	  }
	  else if(ratio1 > 0.001 || ratio2 > 0.001) {
		  ratio1 *= 1000;
		  ratio2 *= 1000;
		  totalsUnits = "Kbps";
	  }
	  else if(ratio1 > 0.000001 || ratio2 > 0.000001) {
		  ratio1 *= 1000000;
		  ratio2 *= 1000000;
		  totalsUnits = "bps";
	  }
	  else {
		  // Ensure totals chart displays something
		  ratio1 = ratio2 = 0.01;
		  totalsUnits = "bps";
	  }  
  }
  else {
	  label_1 = "Wi-Fi";
	  label_2 = "Cellular";
	  ratio1 = volume1/(volume1 + volume2);  
	  ratio2 = 1 - ratio1;
  }
  
  var pies = google.visualization.arrayToDataTable([
	['Device', 'Throughput'],
	[label_1, ratio1],
	[label_2, ratio2],
  ]);

  // Set units appropriately for totals graph
  if(graphSelection == 2) {
	  const formatter = new google.visualization.NumberFormat({suffix: totalsUnits, fractionDigits: 1});
	  formatter.format(pies, 0);
	  formatter.format(pies, 1);
  }
  var chart = new google.visualization.PieChart(document.getElementById('pie_chart'));

  chart.draw(pies, optionsPie);
}

//
// Update the line graph usind the data set pointed to by graphSelection
//
function drawLineChart() {
  if(chartsLoaded == false) return;

  var dataSet = getDataSet(graphSelection);

  if (dataSet.Mbps.length > 1) {
	var dataTable = google.visualization.arrayToDataTable(dataSet.Mbps);
	dashboard.draw(dataTable);
	  
	var start, end;
	if(refreshEnabled == 1) {
		// Recalculate view as data has been added
		end = dataSet.Mbps[dataSet.Mbps.length-1][0];

		// Try and ensure that the start slider is easily selectable
		// If browser puts tab to sleep, there could be a large time interval
		// between successive points
		if(dataSet.Mbps.length-1 > liveWindowSizeMs/samplePeriodMs) {
			start = dataSet.Mbps[dataSet.Mbps.length - 1 -Math.floor(liveWindowSizeMs/samplePeriodMs)][0]; 
		}
		else {
			start = dataSet.Mbps[1][0];
		}

		var newState = {
			'range': {
				'start': start, 
				'end': end
			}
		};
		chartSliderWrapper.setState(newState);
	}
	else if(lastStateRange.start == null || lastStateRange.end == null) {
		var currentState = chartSliderWrapper.getState();
		start = currentState.range.start;
		end = currentState.range.end;
	}
	else {
		// Preserve window if switching between device and total views
		start = lastStateRange.start;
		end = lastStateRange.end;
	}
	//console.log("drawLineChart: start ep=" + start + ", end ep=" + end);
	drawPieChart(getRangeSubset(dataSet.raw, start, end));
  }
}

//
// Returns a subset of the array based on the start and end dates
// - Tries to guess initial indices to minimize search through large array
//
function getRangeSubset(da, startDate, endDate)
{
	if(da.length > 1) {
		var initialStartIndex, initialEndIndex;
		var startIndex, endIndex;

		try {
			// Estimate start position - assumes 1 sample per second.
			initialStartIndex = Math.trunc((startDate.getTime() - da[1][0].getTime())/1000);
			if(initialStartIndex <= 0) {
				startIndex = 0;
			}
			else {
				if(initialStartIndex > da.length - 1) initialStartIndex = da.length -2;

				if(startDate > da[initialStartIndex][0])
				   for(startIndex=initialStartIndex; (startIndex < da.length -1) && (startDate > da[startIndex][0]); startIndex++);
				else
				   for(startIndex=initialStartIndex; (startIndex > 0) && (da[startIndex][0] >= startDate); startIndex--);
			}
			
			// startDate and endDates are generated using Mbps graphs, so start index must be 
			// one sample earlier for raw data
			if(startIndex > 0) startIndex--;
			
			// Estimate end position - assumes 1 sample per second.
			initialEndIndex = (da.length-1) - Math.trunc((da[da.length-1][0].getTime() - endDate.getTime())/1000);
			if(initialEndIndex > da.length -1) {
				endIndex == da.length - 1;
			}
			else {
				if(initialEndIndex < 1) initialEndIndex = 1;
			
				if(endDate > da[initialEndIndex][0])
				   for(endIndex=initialEndIndex; (endIndex < da.length -1) && (endDate > da[endIndex][0]); endIndex++);
				else
				   for(endIndex=initialEndIndex; (endIndex > 1) && (da[endIndex][0] >= endDate); endIndex--);
			}
			
		   	//console.log("getSubset start ind=" + startIndex + ", end ind=" + endIndex + ", length=" + da.length);
			return da.slice(startIndex, endIndex);
		}
		catch(err) {
			console.log("getRangeSubset: exception: " + err);
			console.log("getRangeSubset: da.len=" + da.length + 
				",iniStart=" + initialStartIndex + ", iniEnd=" + initialEndIndex +
				",startInd=" + startIndex + ", endInd=" + endIndex);
		}
	}
	return null;
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
  ds.raw.push([sec,wifi,cell]);

  // Only need last values
  //if (ds.raw.length > 1) ds.raw.shift();
  
  if (ds.Mbps.length >= maxWindowSamples) {
	ds.raw.shift();
	  
	ds.Mbps.shift(); // This removes the header line, being the first element
	// restore header on top of oldest data value 
	ds.Mbps.splice(0,1,hagChartHeader);
  }
  
  // Now update totals
  var totalData = wifi + cell; 
  if(callbackCount == 0) {
	  if(index == 0) totals.raw.push([sec,totalData,0]);
	  else totals.raw.push([sec,0,totalData]);
  }
  else {
	  if(index == 0) totals.raw[totals.raw.length-1][1] += totalData;
	  else totals.raw[totals.raw.length-1][2] += totalData;
  }

  if(ds.raw.length > 0) {
	  var totalThroughput = wifiMbps + cellMbps; 

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
		  
		  if (totals.Mbps.length >= maxWindowSamples) {
			totals.raw.shift();
			totals.Mbps.shift(); // This removes the header line, being the first element
			// restore header on top of oldest data value 
			totals.Mbps.splice(0,1,totalsChartHeader);
		  }  
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
function stopStartGraph(stop) {
  if (refreshEnabled == 1 || stop == true) {
	refreshEnabled = 0;
	document.querySelector('#playImage').innerHTML = '<img src="img/play.png" class="play blink">';
	document.querySelector('#playTooltTip').innerText = 'Start graph update';
	
	// Enable pan and zoom in line chart when not updating
	lineChartWrapper.setOption('explorer.axis', 'horizontal');
	lineChartWrapper.setOption('explorer.keepInBounds', true);
	lineChartWrapper.setOption('explorer.maxZoomIn', 0.1);
	lineChartWrapper.setOption('explorer.maxZoomOut', 1);
  }
  else {
	refreshEnabled = 1;
	document.querySelector('#playImage').innerHTML = '<img src="img/pause.png" class="pause">';
	document.querySelector('#playTooltTip').innerText = 'Pause graph update';

	// Disable pan and zoom in line chart when updating	
	lineChartWrapper.setOption('explorer', null);
  }
}

// 
// Click event handler for graph dashboard - used to stop and start the display
//
function onClick() {
	stopStartGraph();
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
	
	if(hag1.checked) document.querySelector('#lab1').style.color = "White";
	else document.querySelector('#lab1').style.color = "Grey";
	
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
			lineChartWrapper.setOption('title', hagLineChartTitle + (graphSelection==0?hag_label_1:hag_label_2));
			lineChartWrapper.setOption('colors', hagLineChartColours);
			chartSliderWrapper.setOption('ui.chartOptions.colors', hagLineChartColours);
			optionsPie.title  = (graphSelection==0?hag_label_1:hag_label_2) + hagPieChartTitle;
			optionsPie.slices = hagPieChartStyles;
			optionsPie.pieSliceText = "percentage";
		    break;
		case 2:
		default:
			lineChartWrapper.setOption('title', totalsLineChartTitle);
			lineChartWrapper.setOption('colors', totalsLineChartColours);
			chartSliderWrapper.setOption('ui.chartOptions.colors', totalsLineChartColours);
			optionsPie.title  = totalsPieChartTitle;
			optionsPie.slices = totalsPieChartStyles;
			optionsPie.pieSliceText = "value";
			break;
	}
	
	drawLineChart();
}
