	/*
GSMA ZTC WG MPTCP HAG throughput display graphs developed for Mobile World Congress 2022

Authors: BT and Tessares
Date: 21.02.2022 
*/


const delimiter = ",";

function saveit() {
	var d = new Date();
	export_csv(
	    "raw-data-" + 
		d.getUTCFullYear() + 
		(d.getUTCMonth() + 1).toString().padStart(2,0) + 
		d.getDate().toString().padStart(2,0) +
		d.getHours().toString().padStart(2,0) + 
		d.getMinutes() + 
		d.getSeconds() + 
		".csv");
}

function export_csv(fileName) 
{
	
	const arrayHeader = [
		"Time", 
		"w1_raw", "c1_raw", "w1_mbps", "c1_mbps", 
		"w2_raw", "c2_raw", "w2_mbps", "c2_mbps", 
		"t1_raw", "t2_raw", "t1_mbps", "t2_mbps"
	];

	let header = arrayHeader.join(delimiter) + '\n';
	let csvData = new Blob([header], { type: 'text/csv' }); 
	
    var allData = [];
	for(i=0; i<hag1.raw.length-1; i++)
	{
		var csv = "";
		if(i==0) {
			csv += hag1.raw[i][0].getTime() + delimiter;
			csv += hag1.raw[i][1] + delimiter + hag1.raw[i][2] + delimiter;
			csv += "0" + delimiter + "0" + delimiter;
			csv += hag2.raw[i][1] + delimiter + hag2.raw[i][2] + delimiter;
			csv += "0" + delimiter + "0" + delimiter;
			csv += totals.raw[i][1] + delimiter + totals.raw[i][2] + delimiter;
			csv += "0" + delimiter + "0" + delimiter;
			csv += '\n';
		} 
		else {
			csv += hag1.raw[i][0].getTime() + delimiter;
			csv += hag1.raw[i][1] + delimiter + hag1.raw[i][2] + delimiter;
			csv += hag1.Mbps[i][1] + delimiter + hag1.Mbps[i][2] + delimiter;
			csv += hag2.raw[i][1] + delimiter + hag2.raw[i][2] + delimiter;
			csv += hag2.Mbps[i][1] + delimiter + hag2.Mbps[i][2] + delimiter;
			csv += totals.raw[i][1] + delimiter + totals.raw[i][2] + delimiter;
			csv += totals.Mbps[i][1] + delimiter + totals.Mbps[i][2] + delimiter;
			csv += '\n';
		}
		
		csvData = new Blob([csvData, csv], { type: 'text/csv' }); 
	}

	let csvUrl = URL.createObjectURL(csvData);

	let hiddenElement = document.createElement('a');
	hiddenElement.href = csvUrl;
	hiddenElement.target = '_blank';
	hiddenElement.download = fileName;
	hiddenElement.click();
}		