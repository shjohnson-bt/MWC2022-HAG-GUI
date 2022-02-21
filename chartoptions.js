/*
GSMA ZTC WG MPTCP HAG throughput display graphs developed for Mobile World Congress 2022

Authors: BT and Tessares
Date: 19.02.2022 
*/

//
// Area Chart options
//
var chartWrapperOptions = {
  chartType: 'AreaChart',
  containerId: 'lc',
  options: { 
	  chartArea: { 
		left: 50,
		width: '90%'
	  },
	  title: totalsLineChartTitle,
	  titleTextStyle: {
		color: 'white',
		fontSize: 18
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
		textPosition: 'in',
		viewWindow: {
		  min: 0,
		},
	  }
	}
};
	
//
// Chart Range Filter options
//	
var controlWrapperOptions = {
  controlType: 'ChartRangeFilter',
  containerId: 'lc_control',
  options: {
	filterColumnLabel: 'Time',
	ui: {
	  minRangeSize : minWindowSizeMs,
	  chartType: 'AreaChart',
	  chartOptions: {
		chartArea: {
			left: 50,
			width: '90%',
			height: 20
		},
		colors: totalsLineChartColours, 
		backgroundColor: '#2d2d2d',
		lineWidth: '1',
		hAxis: {'baselineColor': 'none'}
	  },
	  chartView: {
		columns: [0, 1, 2]
	  }
	}
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
    alignment: 'center',
	position: 'top',
	textStyle: {color: 'white'}
  },
  pieSliceText: 'value',
  backgroundColor: '#2d2d2d',
  slices: totalsPieChartStyles
};
