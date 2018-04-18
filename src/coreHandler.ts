
import { CoreConnection,
	CoreOptions,
	DeviceType,
	PeripheralDeviceAPI as P
} from 'core-integration'

import {
	IMOSConnectionStatus,
	IMOSDevice,
	IMOSListMachInfo,
	MosString128,
	MosTime,
	IMOSRunningOrder,
	IMOSRunningOrderBase,
	IMOSRunningOrderStatus,
	IMOSStoryStatus,
	IMOSItemStatus,
	IMOSStoryAction,
	IMOSROStory,
	IMOSROAction,
	IMOSItemAction,
	IMOSItem,
	IMOSROReadyToAir,
	IMOSROFullStory,
	MosDuration
} from 'mos-connection'

import * as _ from 'underscore'
import { MosHandler } from './mosHandler'
// import { STATUS_CODES } from 'http'

export interface CoreConfig {
	host: string,
	port: number
}
/**
 * Represents a connection between mos-integration and Core
 */
export class CoreHandler {
	core: CoreConnection

	init (config: CoreConfig): Promise<void> {
		console.log('========')
		this.core = new CoreConnection(this.getCoreConnectionOptions('MOS: Parent process', 'MosCoreParent'))

		this.core.onConnected(() => {
			console.log('Core Connected!')
		})
		this.core.onDisconnected(() => {
			console.log('Core Disconnected!')
		})
		this.core.onError((err) => {
			console.log('Core Error: ' + (err.message || err.toString() || err))
		})

		return this.core.init(config).then((id: string) => {
			id = id // tsignore

			this.core.setStatus({
				statusCode: P.StatusCode.GOOD
				// messages: []
			})
			// nothing
		})
	}
	destroy (): Promise<void> {
		return this.core.setStatus({
			statusCode: P.StatusCode.FATAL,
			messages: ['Shutting down']
		}).then(() => {
			return this.core.destroy()
		})
		.then(() => {
			// nothing
		})
	}
	getCoreConnectionOptions (name: string, deviceId: string): CoreOptions {
		let credentials = CoreConnection.getCredentials(deviceId)
		return _.extend(credentials, {
			deviceType: DeviceType.MOSDEVICE,
			deviceName: name
		})
	}
	registerMosDevice (mosDevice: IMOSDevice, mosHandler: MosHandler): Promise<CoreMosDeviceHandler> {
		console.log('registerMosDevice -------------')
		let coreMos = new CoreMosDeviceHandler(this, mosDevice, mosHandler)

		return coreMos.init()
		.then(() => {
			return coreMos
		})
	}
}
/**
 * Represents a connection between a mos-device and Core
 */
export class CoreMosDeviceHandler {

	core: CoreConnection
	private _coreParentHandler: CoreHandler
	private _mosDevice: IMOSDevice
	private _mosHandler: MosHandler

	constructor (parent: CoreHandler, mosDevice: IMOSDevice, mosHandler: MosHandler) {
		this._coreParentHandler = parent
		this._mosDevice = mosDevice
		this._mosHandler = mosHandler

		console.log('new CoreMosDeviceHandler ' + mosDevice.idPrimary)
		this.core = new CoreConnection(parent.getCoreConnectionOptions('MOS: ' + mosDevice.idPrimary, mosDevice.idPrimary))

	}
	init (): Promise<void> {
		return this.core.init(this._coreParentHandler.core)
		.then((id: string) => {
			// nothing
			id = id // tsignore
		})
	}
	onMosConnectionChanged (connectionStatus: IMOSConnectionStatus) {

		let statusCode = P.StatusCode.UNKNOWN
		let messages: Array<string> = []

		if (connectionStatus.PrimaryConnected) {
			if (connectionStatus.SecondaryConnected) {
				statusCode = P.StatusCode.GOOD
			} else {
				statusCode = P.StatusCode.WARNING_MINOR
			}
		} else {
			if (connectionStatus.SecondaryConnected) {
				statusCode = P.StatusCode.WARNING_MAJOR
			} else {
				statusCode = P.StatusCode.BAD
			}
		}

		if (!connectionStatus.PrimaryConnected) {
			messages.push(connectionStatus.PrimaryStatus || 'Primary not connected')
		}
		if (!connectionStatus.SecondaryConnected) {
			messages.push(connectionStatus.SecondaryStatus || 'Fallback not connected')
		}

		this.core.setStatus({
			statusCode: statusCode,
			messages: messages
		})
	}
	getMachineInfo (): Promise<IMOSListMachInfo> {

		let info: IMOSListMachInfo = {
			manufacturer: new MosString128('SuperFly.tv'),
			model: new MosString128('Core'),
			hwRev: new MosString128('0'),
			swRev: new MosString128('0'),
			DOM: new MosTime('2018-01-01'),
			SN: new MosString128('0000'),
			ID: new MosString128('0000'),
			time: new MosTime(new Date()),
			mosRev: new MosString128('0'),
			supportedProfiles: {
				deviceType: 'MOS', // MOS, NCS
				profile0: this._mosHandler.mosOptions.self.profiles['0'],
				profile1: this._mosHandler.mosOptions.self.profiles['1'],
				profile2: this._mosHandler.mosOptions.self.profiles['2'],
				profile3: this._mosHandler.mosOptions.self.profiles['3'],
				profile4: this._mosHandler.mosOptions.self.profiles['4'],
				profile5: this._mosHandler.mosOptions.self.profiles['5'],
				profile6: this._mosHandler.mosOptions.self.profiles['6'],
				profile7: this._mosHandler.mosOptions.self.profiles['7']
			}
		}
		return Promise.resolve(info)
	}
	mosRoCreate (ro: IMOSRunningOrder): Promise<any> {
		return this._coreMosManipulate(P.methods.mosRoCreate, ro)
	}
	mosRoReplace (ro: IMOSRunningOrder): Promise<any> {
		return this._coreMosManipulate(P.methods.mosRoReplace, ro)
	}
	mosRoDelete (runningOrderId: MosString128): Promise<any> {
		return this._coreMosManipulate(P.methods.mosRoDelete, runningOrderId)
	}
	mosRoMetadata (metadata: IMOSRunningOrderBase): Promise<any> {
		return this._coreMosManipulate(P.methods.mosRoMetadata, metadata)
	}
	mosRoStatus (status: IMOSRunningOrderStatus): Promise<any> {
		return this._coreMosManipulate(P.methods.mosRoStatus, status)
	}
	mosRoStoryStatus (status: IMOSStoryStatus): Promise<any> {
		return this._coreMosManipulate(P.methods.mosRoStoryStatus, status)
	}
	mosRoItemStatus (status: IMOSItemStatus): Promise<any> {
		return this._coreMosManipulate(P.methods.mosRoItemStatus, status)
	}
	mosRoStoryInsert (Action: IMOSStoryAction, Stories: Array<IMOSROStory>): Promise<any> {
		return this._coreMosManipulate(P.methods.mosRoStoryInsert, Action, Stories)
	}
	mosRoStoryReplace (Action: IMOSStoryAction, Stories: Array<IMOSROStory>): Promise<any> {
		return this._coreMosManipulate(P.methods.mosRoStoryReplace, Action, Stories)
	}
	mosRoStoryMove (Action: IMOSStoryAction, Stories: Array<MosString128>): Promise<any> {
		return this._coreMosManipulate(P.methods.mosRoStoryMove, Action, Stories)
	}
	mosRoStoryDelete (Action: IMOSROAction, Stories: Array<MosString128>): Promise<any> {
		return this._coreMosManipulate(P.methods.mosRoStoryDelete, Action, Stories)
	}
	mosRoStorySwap (Action: IMOSROAction, StoryID0: MosString128, StoryID1: MosString128): Promise<any> {
		return this._coreMosManipulate(P.methods.mosRoStorySwap, Action, StoryID0, StoryID1)
	}
	mosRoItemInsert (Action: IMOSItemAction, Items: Array<IMOSItem>): Promise<any> {
		return this._coreMosManipulate(P.methods.mosRoItemInsert, Action, Items)
	}
	mosRoItemReplace (Action: IMOSItemAction, Items: Array<IMOSItem>): Promise<any> {
		return this._coreMosManipulate(P.methods.mosRoItemReplace, Action, Items)
	}
	mosRoItemMove (Action: IMOSItemAction, Items: Array<MosString128>): Promise<any> {
		return this._coreMosManipulate(P.methods.mosRoItemMove, Action, Items)
	}
	mosRoItemDelete (Action: IMOSStoryAction, Items: Array<MosString128>): Promise<any> {
		return this._coreMosManipulate(P.methods.mosRoItemDelete, Action, Items)
	}
	mosRoItemSwap (Action: IMOSStoryAction, ItemID0: MosString128, ItemID1: MosString128): Promise<any> {
		return this._coreMosManipulate(P.methods.mosRoItemSwap, Action, ItemID0, ItemID1)
	}
	mosRoReadyToAir (Action: IMOSROReadyToAir): Promise<any> {
		return this._coreMosManipulate(P.methods.mosRoReadyToAir, Action)
	}
	mosRoFullStory (story: IMOSROFullStory ): Promise<any> {
		return this._coreMosManipulate(P.methods.mosRoFullStory, story)
	}

	private fixBeforeSend (o: any): any {
		if (
			_.isObject(o) && (
			o instanceof MosTime ||
			o instanceof MosDuration ||
			o instanceof MosString128
		)) {
			return o.toString()
		}
		if (_.isArray(o)) {
			return _.map(o, (val) => {
				return this.fixBeforeSend(val)
			})
		} else if (_.isObject(o)) {
			let o2: any = {}
			_.each(o, (val, key) => {
				o2[key] = this.fixBeforeSend(val)
			})
			return o2
		} else {
			return o
		}
	}
	private _coreMosManipulate (method: string, ...attrs: Array<any>): Promise<any> {
		attrs = _.map(attrs, (attr) => {
			return this.fixBeforeSend(attr)
		})
		// console.log('mosManipulate', method, attrs)
		return this.core.mosManipulate(method, ...attrs)
	}
}
