'use strict';


// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');
const axios = require('axios');

class CmiTa extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: 'cmi-ta',
		});
		this.on('ready', this.onReady.bind(this));
		//this.on('stateChange', this.onStateChange.bind(this));
		this.on('objectChange', this.onObjectChange.bind(this));
		// this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}
	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		//this.log.info('config option1: ' + this.config.option1);
		//this.log.info('config option2: ' + this.config.option2);
		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
		if (!this.config.IP) {
			this.log.error(`Server IP is empty - please check instance configuration of ${this.namespace}`);
			return;
		}
		if (!this.config.UserName || !this.config.Password) {
			this.log.error(`User name and/or user password empty - please check instance configuration of ${this.namespace}`);
			return;
		}
		this.log.info(`Configured server: "${this.config.IP}:${this.config.Port}" - Connecting with user: "${this.config.UserName}"`);
		await this.setObjectNotExistsAsync('Config.Port', {
			type: 'state',
			common: {
				name: 'Port',
				type: 'number',
				role: 'value',
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync('DeviceInfo.Version', {
			type: 'state',
			common: {
				name: 'Version',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync('DeviceInfo.Device', {
			type: 'state',
			common: {
				name: 'Device',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync('Config.IP', {
			type: 'state',
			common: {
				name: 'IP',
				type: 'string',
				role: 'value',
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync('Config.CanBusId', {
			type: 'state',
			common: {
				name: 'CanBusId',
				type: 'number',
				role: 'value',
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync('Config.Option1', {
			type: 'state',
			common: {
				name: 'Option1',
				type: 'string',
				role: 'value',
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync('DeviceInfo.Timestamp', {
			type: 'state',
			common: {
				name: 'Timestamp',
				type: 'number',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync('DeviceInfo.Status', {
			type: 'state',
			common: {
				name: 'Status',
				type: 'string',
				role: 'value',
				read: true,
				write: false,
			},
			native: {},
		});
		this.log.debug('CAN:   ' + this.config.CanBusId.toString());
		this.log.debug('IP:   ' + this.config.IP);
		this.log.debug('Port:   ' + this.config.Port);
		this.log.debug('Opt.:   ' + this.config.Option1);
		await this.setStateAsync('Config.IP', { val: this.config.IP, ack: true });
		await this.setStateAsync('Config.Port', { val: this.config.Port, ack: true });
		await this.setStateAsync('Config.CanBusId', { val: this.config.CanBusId, ack: true });
		await this.setStateAsync('Config.Option1', { val: this.config.Option1, ack: true });
		const webAddr = (await this.buildWebAddress()).toString();
		this.log.debug('Web-Adresse lautet: ' + webAddr);
		const jsonString = await this.getstoveValues(webAddr);
		//const jsonString = JSON.parse('{ "Header":{ "Version":7, "Device":"7f", "Timestamp":1705061541 }, "Data":{ "Inputs":[ { "Number":1, "AD":"A", "Value":{ "Value":62.2, "Unit":"1" } }, { "Number":2, "AD":"A", "Value":{ "Value":46.9, "Unit":"1" } }, { "Number":3, "AD":"A", "Value":{ "Value":2.4, "Unit":"1" } }, { "Number":4, "AD":"A", "Value":{ "Value":1.7, "Unit":"1" } }, { "Number":5, "AD":"A", "Value":{ "Value":52.2, "Unit":"1" } }, { "Number":6, "AD":"A", "Value":{ "Value":22.1, "Unit":"1" } }, { "Number":7, "AD":"A", "Value":{ "Value":35.2, "Unit":"1" } }, { "Number":8, "AD":"A", "Value":{ "Value":26.7, "Unit":"1" } }, { "Number":9, "AD":"A", "Value":{ "Value":42.5, "Unit":"1" } }, { "Number":10, "AD":"A", "Value":{ "Value":32.9, "Unit":"1" } }, { "Number":11, "AD":"A", "Value":{ "Value":33.6, "Unit":"1" } }, { "Number":12, "AD":"A", "Value":{ "Value":0, "Unit":"3" } }, { "Number":13, "AD":"A", "Value":{ "Value":43.7, "Unit":"1" } }, { "Number":14, "AD":"A", "Value":{ "Value":43.9, "Unit":"1" } }, { "Number":15, "AD":"A", "Value":{ "Value":0, "Unit":"3" } }, { "Number":16, "AD":"D", "Value":{ "Value":0, "Unit":"43" } }], "Outputs":[ { "Number":1, "AD":"D", "Value":{ "Value":0, "Unit":"43" } }, { "Number":2, "AD":"D", "Value":{ "Value":1, "Unit":"43" } }, { "Number":4, "AD":"D", "Value":{ "Value":0, "Unit":"43" } }, { "Number":5, "AD":"D", "Value":{ "Value":1, "Unit":"43" } }, { "Number":6, "AD":"D", "Value":{ "Value":0, "Unit":"43" } }, { "Number":7, "AD":"D", "Value":{ "Value":0, "Unit":"43" } }, { "Number":13, "AD":"A", "Value":{ "State":0, "Value":0.0, "Unit":"8" } }], "DL-Bus":[ { "Number":2, "AD":"A", "Value":{ "Value":16.4, "Unit":"46", "RAS":"0" } }, { "Number":3, "AD":"A", "Value":{ "Value":18.9, "Unit":"1" } }, { "Number":4, "AD":"A", "Value":{ "Value":0.00004, "Unit":"53" } }, { "Number":5, "AD":"A", "Value":{ "Value":901, "Unit":"0" } }]}, "Status":"OK", "Status code":0 }');
		const typJson = {'7f':{'Device':'CoE','Suport':'No'},'80':{'Device':'UVR1611','Suport':'Yes'},'81':{'Device':'CAN-MT','Suport':'No'},'82':{'Device':'CAN-I/O44','Suport':'No'},'83':{'Device':'CAN-I/O35','Suport':'No'},'84':{'Device':'CAN-BC','Suport':'No'},'85':{'Device':'CAN-EZ','Suport':'No'},'86':{'Device':'CAN-TOUCH','Suport':'No'},'87':{'Device':'UVR16x2','Suport':'Yes'},'88':{'Device':'RSM610','Suport':'Yes'},'89':{'Device':'CAN-I/O45','Suport':'Yes'},'8A':{'Device':'CMI','Suport':'No'},'8B':{'Device':'CAN-EZ2','Suport':'Yes'},'8C':{'Device':'CAN-MTx2','Suport':'Yes'},'8D':{'Device':'CAN-BC2','Suport':'Yes'},'8E':{'Device':'UVR65','Suport':'Yes'},'8F':{'Device':'CAN-EZ3','Suport':'Yes'},'91':{'Device':'UVR610','Suport':'Yes'},'9"':{'Device':'UVR67','Suport':'Yes'},'A3':{'Device':'BL-NET','Suport':'No'}};
		const opttionsJson = {'I':'Inputs','O':'Outputs','D':'DL-Bus','Sg':'General','Sd':'Date','St':'Time','Ss':'Sun','La':'Logging Analog','Ld':'Logging Digital'};
		//const jsonString.data = jsonString.data;
		this.log.debug(jsonString.Status);
		//this.log.debug('Value1: ' + jsonString.data.Data.Inputs.Number1.Value.Value);
		this.log.debug('Version:   ' + jsonString.Header.Version.toString());
		const devNumber = parseInt(jsonString.Header.Device);
		this.log.debug('Devicenumber:    ' + devNumber.toString());
		const boolSupport = typJson[devNumber].Suport;

		const deviceName = typJson[devNumber].Device;
		this.log.debug('Device is Supported:   ' + boolSupport);
		if(boolSupport == 'No'){
			this.log.error('Device ' + deviceName + ' is not supported');
		}
		await this.setStateChangedAsync('DeviceInfo.Version', { val: jsonString.Header.Version, ack: true });
		this.log.debug('Device :   ' + deviceName);
		await this.setStateChangedAsync('DeviceInfo.Device', { val: devNumber, ack: true });
		//this.log.debug(jsonString.Header.Timestamp);
		await this.setStateChangedAsync('DeviceInfo.Timestamp', { val: parseInt(jsonString.Header.Timestamp), ack: true });
		//this.log.debug(jsonString.Status);
		await this.setStateChangedAsync('DeviceInfo.Status', { val: jsonString.Status, ack: true });		//await this.setStateChangedAsync('Inputs.1.Value', { val: jsonString.data.Data.Inputs.Number[1].Value.Value, ack: true });
		//this.log.debug(jsonString.data.count);

		if(jsonString.Status == 'OK')
		{
			this.config.Option1.split(',').forEach(optValue => {
				this.WriteDataPoints(jsonString.Data.Inputs,opttionsJson[optValue]);
			});
			if(this.config.Option1.includes('I')){
				//await this.WriteDataPoints(jsonString.Data.Inputs,'Inputs');
			}
			if(this.config.Option1.includes('O')){
				//await this.WriteDataPoints(jsonString.Data.Outputs,'Outputs');
			}
			if(this.config.Option1.includes('D')){
				//this.log.debug(jsonString.Data['DL-Bus'][2].Value.Value);
				//this.log.debug(JSON.stringify(jsonString.Data['DL-Bus']));
				//await this.WriteDataPoints(jsonString.Data['DL-Bus'],'DL-Bus');
			}
		}
		else if(jsonString.Status == 'NODE ERROR'){
			this.log.error('Can not find CMI. Maybe wrong parrameter?: ' + jsonString.Status);
		}
		else if(jsonString.Status == 'TOO MANY REQUESTS'){
			this.log.error('Can not read from CMI: ' + jsonString.Status + 'Please try later');
		}
		else{
			this.log.error('Can not read from CMI: ' + jsonString.Status);
		}
		//this.log.debug(JSON.stringify(jsonString));
		//const responseJson = this.getstoveValues(webAddr);
	}
	onUnload(callback) {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);

			callback();
		} catch (e) {
			callback();
		}
	}

	onObjectChange(){
		this.log.debug('Somthing changed');
	}

	async getstoveValues(webAddr) {
		try {
			//json von API-Seite holen
			//this.log.debug(webAddr);
			const response2 = await axios.get(webAddr);
			// in response steht jetzt die Antwort
			// wenn du sie außerhalb der Funktion nutzen willst:
			// return response; // oder einen Teil davon
			//this.log.info(JSON.stringify(response2.data));
			return(response2.data);
		} catch (e) {
			// fehler behandeln/loggen
			this.log.error('getstoveValues: ' + e.message);
		}
	}
	async buildWebAddress(){
		return('http://' + this.config.UserName + ':' + this.config.Password + '@' + this.config.IP + '/INCLUDE/api.cgi?jsonnode='+ this.config.CanBusId.toString() +'&jsonparam=' + this.config.Option1);
	}
	async WriteDataPoints(jsonString,point){
		//this.log.debug(point);
		//this.log.debug(JSON.stringify(jsonString));
		const rasJson = {'0':'Time/auto','1':'Standard','2':'Setback','3':'Standby/frost pr'};
		const unitJson = {'0':'','1':'°C','2':'W/m²','3':'l/h','4':'Sek','5':'Min','6':'l/Imp','7':'K','8':'%','10':'kW','11':'kWh','12':'MWh','13':'V','14':'mA','15':'Std','16':'Tage','17':'Imp','18':'KΩ','19':'l','20':'km/h','21':'Hz','22':'l/min','23':'bar','24':'','25':'km','26':'m','27':'mm','28':'m³','35':'l/d','36':'m/s','37':'m³/min','38':'m³/h','39':'m³/d','40':'mm/min','41':'mm/h','42':'mm/d','43':'Aus/Ein','44':'Nein/Ja','46':'°C','50':'€','51':'$','53':'','54':'°','56':'°','57':'Sek','58':'','59':'%','60':'Uhr','63':'A','65':'mbar','66':'Pa','67':'ppm','68':'','69':'W','70':'t','71':'kg','72':'g','73':'cm','74':'K','75':'lx','76':'Bg/m³'};
		let value = -1;
		let unit = 0;
		let ad = '';
		let state = 0;
		let ras = 0;
		let y =0;
		for (let x = 0; x <= 15; x++ ) {
			try{

				//this.log.debug(JSON.stringify(jsonString[x]));
				if(JSON.stringify(jsonString[x]).includes('Number')) {
					y= jsonString[x].Number;
					const jasoAtaString = [point,'.',(y),'.'].join('');
					//this.log.debug(jasoAtaString);
					//this.log.debug(y.toString());
					//this.log.debug('Vorhanden:   Number":' + (x+1));
					try{
						if(JSON.stringify(jsonString[x])){
							if(JSON.stringify(jsonString[x])==undefined){
								//this.log.debug('Value is undefinded');
								continue;
							}
							//else if(false){
							//this.log.debug(jsonString[x].Number);
							//this.log.debug('Value NICHT vorhanden');
							//continue;
							//}
							else{
								if(JSON.stringify(jsonString[x]).includes('Value')){
									//this.log.debug('Value ist vorhanden');
									value= jsonString[x].Value.Value;
									//this.log.debug(value.toString());
									try{
										await this.setObjectNotExistsAsync(point + '.'+ (y) + '.Value', {
											type: 'state',
											common: {
												name: 'Value',
												type: 'number',
												role: 'value',
												read: true,
												write: false
											},
											native: {},
										});
										await this.setStateChangedAsync(jasoAtaString + 'Value', { val: value, ack: true });
									}
									catch{
										//this.log.debug('Dataset  ' + x + ' not exist');
										continue;
									}
								}
								if(JSON.stringify(jsonString[x]).includes('Unit')){
									//this.log.debug('Unit ist vorhanden');
									unit = parseInt(jsonString[x].Value.Unit);
									//this.log.debug(unit.toString());
									//this.log.debug(unitJson[unit]);
									try{
										await this.setObjectNotExistsAsync(point + '.'+ (y) + '.Unit', {
											type: 'state',
											common: {
												name: 'Unit',
												type: 'string',
												role: 'value',
												read: true,
												write: false
											},
											native: {},
										});
										await this.setStateChangedAsync(jasoAtaString + 'Unit', { val: unitJson[unit], ack: true });
									}
									catch{
										//this.log.debug('Dataset  ' + x + ' not exist');
										//continue;
									}
								}
								if(JSON.stringify(jsonString[x]).includes('State')){
									//this.log.debug('State ist vorhanden');
									state = jsonString[x].Value.State;
									//this.log.debug(state.toString());
									try{
										await this.setObjectNotExistsAsync(point + '.'+ (y) + '.State', {
											type: 'state',
											common: {
												name: 'State',
												type: 'number',
												role: 'value',
												read: true,
												write: false
											},
											native: {},
										});
										await this.setStateChangedAsync(jasoAtaString + 'State', { val: state, ack: true });
									}
									catch{
										//this.log.debug('Dataset  ' + x + ' not exist');
										//continue;
									}
								}
								if(JSON.stringify(jsonString[x]).includes('AD')){
									//this.log.debug('AD ist vorhanden');
									ad = jsonString[x].AD;
									//this.log.debug(ad);
									try{
										await this.setObjectNotExistsAsync(point + '.'+ (y) + '.AD', {
											type: 'state',
											common: {
												name: 'AD',
												type: 'string',
												role: 'value',
												read: true,
												write: false
											},
											native: {},
										});
										await this.setStateChangedAsync(jasoAtaString + 'AD', { val: ad, ack: true });
									}
									catch{
										//this.log.debug('Dataset  ' + x + ' not exist');
										//continue;
									}
								}
								if(JSON.stringify(jsonString[x]).includes('RAS')){
									//this.log.debug('RAS ist vorhanden');
									ras = jsonString[x].Value.RAS;
									//this.log.debug('RAS:   ' + ras.toString());
									//this.log.debug(jasoAtaString + 'RAS');
									try{
										await this.setObjectNotExistsAsync(point + '.'+ (y) + '.RAS', {
											type: 'state',
											common: {
												name: 'RAS',
												type: 'string',
												role: 'value',
												read: true,
												write: false
											},
											native: {},
										});
										const rasStr = rasJson[ras];
										await this.setStateChangedAsync(jasoAtaString + 'RAS', { val: rasStr, ack: true });
									}
									catch{
										//this.log.debug('Dataset  ' + x + ' not exist');
										//continue;
									}
								}
							}
						}
						else{
							//this.log.debug('Value NICHT vorhanden');
							continue;
						}
					}
					catch(error){
						//this.log.debug('CATCH:   alue NICHT vorhanden' + error);
					}
				}
				else{
					//this.log.debug('NICHT Vorhanden:   Number":' + (x+1));
				}
			}
			catch{
				//this.log.debug('Catch');
			}
		}

	}
}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new CmiTa(options);
} else {
	// otherwise start the instance directly
	new CmiTa();
}