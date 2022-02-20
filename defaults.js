/*
GSMA ZTC WG MPTCP HAG throughput display graphs developed for Mobile World Congress 2022

Authors: BT and Tessares
Date: 20.02.2022 
*/

//
// HAG URLs
//

const urls = [
   "http://xxx.xxx.xxx.xxx:port/",
   "http://yyy.yyy.yyy.yyy:port/"
];


//
// Chart defaults
//

// HAG names i.e. device names
const hag_label_1 = "MPTCP device";
const hag_label_2 = "Standard device";

// Individual HAG/device charts
const hagLineChartTitle = "Download throughput for ";
const hagPieChartTitle = " split";

const hagChartHeader     = ['Time', 'Wi-Fi', 'Cellular'];
const hagLineChartColours    = ['royalblue','crimson'];
const hagPieChartStyles = [
{color: 'royalblue', textStyle :{color: 'white'}},
{color: 'crimson', textStyle :{color: 'white'}}
];

// Totals charts - combined throughput (wifi+cellular) for each hag
const totalsLineChartTitle = "Total download throughput for each device";
const totalsPieChartTitle = "Average throughput";

const totalsChartHeader  = ['Time', hag_label_1, hag_label_2];
const totalsLineChartColours = ['yellow','orange'];
const totalsPieChartStyles = [
{color: 'yellow', textStyle :{color: 'black'}},
{color: 'orange', textStyle :{color: 'white'}}
];



