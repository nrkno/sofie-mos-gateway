import {
	MosConnection, 
	IMosconnection,
	IMOSDevice,
	IMOSDeviceP0, 
	IMOSDeviceP1,
	IMOSDeviceP2,
	IMOSDeviceP3,
	IMOSDeviceP4,
	IMOSDeviceP5,
	IMOSDeviceP6
} from "mos-connection"

import {CoreHandler} from "./coreHandler"

interface IMyMOSDevice extends IMOSDeviceP1, IMOSDeviceP0 {}

export class MosHandler {

	public mos:MosConnection;

	private mosDevices:{[id:string]:IMOSDevice}

	init(coreHandler:CoreHandler) {

		this.mos = new MosConnection({
			acceptConnections: true, // default:true
			acceptConnectionFrom: ['127.0.0.1'],
			
			profiles: {
				'0': true,
				'1': false,
				'2': false,
				'3': false,
				'4': false,
				'5': false,
				'6': false,
				'7': false,
			}
		});

		this.mos.onConnection((mosDevice:IMyMOSDevice) => {
			// a new connection has been made

			this.mosDevices[mosDevice.id] = mosDevice;
			

			// Setup messages [ MOSDevice >>>> Core ] -----------------------
			/*mosDevice.onMessage((message:string) => {-

			});
			*/
			mosDevice.onConnectionChange((connectionStatus:IMOSConnectionStatus) => {
				coreHandler.connected = connected;
			});


			let coreMosHandler = coreHandler.registerMosDevice(mosDevice)

			// Setup messages [ MOSDevice <<<< Core     ] -----------------------
			coreMosHandler.onGetMachineInfo(() => {
				return mosDevice.getMachineInfo();
			});


		});

		// Connect to ENPS:
		return this.mos.connect({
			ncs: {
				id: "WINSERVERSOMETHINGENPS",
				host: "192.168.0.1"
			},
			/*ncsBuddy?: {
				ncsID: string;
				host: string;
			},*/
		}).then(() => {
			// called when a connection has been made
		})
	}
}