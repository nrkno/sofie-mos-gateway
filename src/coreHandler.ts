import { CoreConnection,
	CoreOptions,
	PeripheralDeviceAPI as P
} from 'core-integration'
import * as Winston from 'winston'

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
import { DeviceConfig } from './connector'
// import { STATUS_CODES } from 'http'
export interface PeripheralDeviceCommand {
	_id: string

	deviceId: string
	functionName: string
	args: Array<any>

	hasReply: boolean
	reply?: any
	replyError?: any

	time: number // time
}

/**
 * Represents a connection between a mos-device and Core
 */
export class CoreMosDeviceHandler {

	core: CoreConnection
	private _coreParentHandler: CoreHandler
	private _mosDevice: IMOSDevice
	private _mosHandler: MosHandler
	private _executedFunctions: {[id: string]: boolean} = {}
	private _observers: Array<any> = []
	private _subscriptions: Array<any> = []

	constructor (parent: CoreHandler, mosDevice: IMOSDevice, mosHandler: MosHandler) {
		this._coreParentHandler = parent
		this._mosDevice = mosDevice
		this._mosHandler = mosHandler

		this._mosDevice = this._mosDevice // ts-ignore fix

		this._coreParentHandler.logger.info('new CoreMosDeviceHandler ' + mosDevice.idPrimary)
		this.core = new CoreConnection(parent.getCoreConnectionOptions('MOS: ' + mosDevice.idPrimary, mosDevice.idPrimary, false))
	}
	init (): Promise<void> {
		return this.core.init(this._coreParentHandler.core)
		.then(() => {
			return this.setupSubscriptionsAndObservers()
		})
		.then(() => {
			return
		})
	}
	setupSubscriptionsAndObservers (): void {
		// console.log('setupObservers', this.core.deviceId)
		if (this._observers.length) {
			this._coreParentHandler.logger.info('Core: Clearing observers..')
			this._observers.forEach((obs) => {
				obs.stop()
			})
			this._observers = []
		}
		this._coreParentHandler.logger.info('CoreMos: Setting up subscriptions for ' + this.core.deviceId + ' ..')
		this._subscriptions = []
		Promise.all([
			this.core.subscribe('peripheralDeviceCommands', this.core.deviceId)
		])
		.then((subs) => {
			this._subscriptions = this._subscriptions.concat(subs)
		})
		.then(() => {
			return
		})

		this._coreParentHandler.logger.info('CoreMos: Setting up observers..')

		let observer = this.core.observe('peripheralDeviceCommands')
		this._observers.push(observer)
		let addedChangedCommand = (type: string, id: string) => {
			let cmds = this.core.getCollection('peripheralDeviceCommands')
			if (!cmds) throw Error('"peripheralDeviceCommands" collection not found!')
			let cmd = cmds.findOne(id) as PeripheralDeviceCommand
			if (!cmd) throw Error('PeripheralCommand "' + id + '" not found!')

			if (cmd.deviceId === this.core.deviceId) {
				this._coreParentHandler.logger.info(type, id, cmd)
				this.executeFunction(cmd)
			}
		}
		observer.added = (id: string) => {
			addedChangedCommand('added', id)
		}
		observer.changed = (id: string) => {
			addedChangedCommand('changed', id)
		}
		let cmds = this.core.getCollection('peripheralDeviceCommands')
		if (!cmds) throw Error('"peripheralDeviceCommands" collection not found!')
		cmds.find({}).forEach((cmd: PeripheralDeviceCommand) => {
			if (cmd.deviceId === this.core.deviceId) {
				this._coreParentHandler.logger.info('cmd', cmd)
				this.executeFunction(cmd)
			}
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

	executeFunction (cmd: PeripheralDeviceCommand) {
		if (cmd) {
			// console.log('executeFunction', cmd)
			this._executedFunctions[cmd._id] = true
			let cb = (err: any, res?: any) => {
				// console.log('cb', err, res)
				this.core.callMethod(P.methods.functionReply, [cmd._id, err, res])
				.then(() => {
					// console.log('cb done')
				})
				.catch((e) => {
					this._coreParentHandler.logger.error(e)
				})
			}
			// @ts-ignore
			let fcn: Function = this[cmd.functionName]
			try {
				if (!fcn) throw Error('Function "' + cmd.functionName + '" not found!')

				Promise.resolve(fcn.apply(this, cmd.args))
				.then((result) => {
					cb(null, result)
				})
				.catch((e) => {
					cb(e.toString(), null)
				})
			} catch (e) {
				cb(e.toString(), null)
			}
		}
	}
	triggerGetAllRunningOrders (): Promise<any> {
		// console.log('triggerGetAllRunningOrders')
		return this._mosDevice.getAllRunningOrders()
		.then((results) => {
			// console.log('GOT REPLY', results)
			return results
		})
		.catch((err) => {
			// console.log('GOT ERR', err)
			throw err
		})
	}
	triggerGetRunningOrder (roId: string): Promise<any> {
		// console.log('triggerGetRunningOrder ' + roId)
		return this._mosDevice.getRunningOrder(new MosString128(roId))
		.then((ro) => {
			// console.log('GOT REPLY', results)
			return ro
		})
		.catch((err) => {
			// console.log('GOT ERR', err)
			throw err
		})
	}
	test (a: string) {
		return new Promise(resolve => {
			setTimeout(() => {
				resolve('test' + a)
			},2000)
		})
	}
	dispose () {
		this._observers.forEach((obs) => {
			obs.stop()
		})
		return Promise.resolve()
	}
	killProcess (actually: number) {
		return this._coreParentHandler.killProcess(actually)
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
export interface CoreConfig {
	host: string,
	port: number
}
/**
 * Represents a connection between mos-integration and Core
 */
export class CoreHandler {
	core: CoreConnection
	logger: Winston.LoggerInstance
	private _deviceOptions: DeviceConfig
	private _coreMosHandlers: Array<CoreMosDeviceHandler> = []
	private _onConnected?: () => any
	private _subscriptions: Array<any> = []

	constructor (logger: Winston.LoggerInstance, deviceOptions: DeviceConfig) {
		this.logger = logger
		this._deviceOptions = deviceOptions
	}

	init (config: CoreConfig): Promise<void> {
		this.logger.info('========')
		this.core = new CoreConnection(this.getCoreConnectionOptions('MOS: Parent process', 'MosCoreParent', true))

		this.core.onConnected(() => {
			this.logger.info('Core Connected!')
			this.onConnectionRestored()
		})
		this.core.onDisconnected(() => {
			this.logger.info('Core Disconnected!')
		})
		this.core.onError((err) => {
			this.logger.error('Core Error: ' + (err.message || err.toString() || err))
		})

		return this.core.init(config).then((id: string) => {
			id = id // tsignore

			this.core.setStatus({
				statusCode: P.StatusCode.GOOD
				// messages: []
			})
			// nothing
		})
		.then(() => {
			return this.setupSubscriptions()
		})
	}
	dispose (): Promise<void> {
		return this.core.setStatus({
			statusCode: P.StatusCode.FATAL,
			messages: ['Shutting down']
		})
		.then(() => {
			return Promise.all(this._coreMosHandlers.map((cmh: CoreMosDeviceHandler) => {
				return cmh.dispose()
			}))
		})
		.then(() => {
			return this.core.destroy()
		})
		.then(() => {
			// nothing
		})
	}
	getCoreConnectionOptions (name: string, subDeviceId: string, parentProcess: boolean): CoreOptions {
		let credentials

		if (this._deviceOptions.deviceId && this._deviceOptions.deviceToken) {
			credentials = {
				deviceId: this._deviceOptions.deviceId + subDeviceId,
				deviceToken: this._deviceOptions.deviceToken
			}
		} else if (this._deviceOptions.deviceId) {
			this.logger.warn('Token not set, only id! This might be unsecure!')
			credentials = {
				deviceId: this._deviceOptions.deviceId + subDeviceId,
				deviceToken: 'unsecureToken'
			}
		} else {
			credentials = CoreConnection.getCredentials(subDeviceId)
		}
		return _.extend(credentials, {
			deviceType: (parentProcess ? P.DeviceType.MOSDEVICE : P.DeviceType.OTHER),
			deviceName: name
		})
	}
	registerMosDevice (mosDevice: IMOSDevice, mosHandler: MosHandler): Promise<CoreMosDeviceHandler> {
		this.logger.info('registerMosDevice -------------')
		let coreMos = new CoreMosDeviceHandler(this, mosDevice, mosHandler)

		this._coreMosHandlers.push(coreMos)
		return coreMos.init()
		.then(() => {
			return coreMos
		})
	}
	onConnectionRestored () {
		this.setupSubscriptions()
		.catch((e) => {
			this.logger.error(e)
		})
		if (this._onConnected) this._onConnected()
		this._coreMosHandlers.forEach((cmh: CoreMosDeviceHandler) => {
			cmh.setupSubscriptionsAndObservers()
		})
	}
	onConnected (fcn: () => any) {
		this._onConnected = fcn
	}
	setupSubscriptions (): Promise<void> {
		// console.log('setupObservers', this.core.deviceId)
		this._subscriptions = []

		this.logger.info('Core: Setting up subscriptions for ' + this.core.deviceId + '..')
		return Promise.all([
			this.core.subscribe('peripheralDevices', {
				_id: this.core.deviceId
			}),
			this.core.subscribe('peripheralDeviceCommands', this.core.deviceId)
		])
		.then((subs) => {
			this._subscriptions = this._subscriptions.concat(subs)
		})
		.then(() => {
			return
		})
	}
	killProcess (actually: number) {
		if (actually === 1) {
			this.logger.info('KillProcess command received, shutting down in 1000ms!')
			setTimeout(() => {
				process.exit(0)
			}, 1000)
			return true
		}
		return 0
	}
}
