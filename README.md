# MWC 2022 GSMA ZTC Web GUI

## Web pages for displaying data throughput from two HAGs

This UI combines the throughput data from two HAGs and provides two display options:
- Single device (HAG) display, where the realtime line and pie charts show the throughput and % Wi-Fi/cellular split
- Two device (HAG) display, where the line graph shows the overall throughput for each device and the pie chart shows the throughput ratios between the two devices

Controls are provided to stop and start the graph update and to select the display mode

### Installation
* Copy the files to the local filing system on the device that will be displaying the GUI. Ensure that the file directory heirarchy is maintained.
* Update the HAG urls and associated ports at the top of the file `defaults.js`
* Chart text and colours can also be modified in `defaults.js`

### Running
* Open the file `MWC2022-HAG-Thoughput.html` in the local web browser (only MS Edge tested)

### Viewing history
The UI runs in 'live view' mode initially, where data is periodically retreived from the two HAGs. The main graph shows the throughput 
for a window on the total data collected - the default window size is 60 seconds. The slider graph below the main graph shows the entire 
data collected and the two sliders, control what proportion of this data is visible in the main graph. The pie chart calculation is 
performed on the data between the two sliders (_and not on what is visible in the main graph_).

Enabling the 'history view' can be done in the following ways:
* click on the pause button
* click on the main graph
* drag one of the sliders
* drag the view portal

To move the view portal without changing the portal size, simply drag on the area between the two sliders. Additionally pan (drag) and
zoom (mouse wheel) is possible when the mouse is over the main graph. This does not change the pie chart calculation or adjust the view portal size.

Switching between HAGs and totals view should preserve the view portal.

In the 'history view' data collection from the HAGs is stopped and so the graph is not updated.  

To return to 'live view' simply click play button, or click on the main graph.
