# MWC2022-HAG-GUI
**Web pages for displaying data throughput from two HAGs**

This UI combines the throughput data from two HAGs and provides two display options:
- Single device (HAG) display, where the realtime line and pie charts show the throughput and % Wi-Fi/cellular split
- Two device (HAG) display, where the line graph shows the overall throughput for each device and the pie chart shows the throughput ratios between the two devices

Controls are provided to stop and start the graph update and to select the display mode

**Installation:**
- Copy the files to the local filing system on the device that will be displaying the GUI. Ensure that the file directory heirarchy is maintained.
- Update the HAG urls and associated ports at the top of the file `defaults.js`
- Chart text and colours can also be modified in `defaults.js`

**Running:**
- Open the file `MWC2022-HAG-Thoughput.html` in the local web browser (only MS Edge tested)
