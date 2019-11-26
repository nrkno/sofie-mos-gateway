import { CoreConnection,
	CoreOptions,
	PeripheralDeviceAPI as P
} from 'tv-automation-server-core-integration'
import * as Winston from 'winston'
import * as fs from 'fs'
import { Process } from './process'
import { DDPConnectorOptions } from 'tv-automation-server-core-integration/dist/lib/ddpConnector'

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
	MosDuration,
	IMOSObjectStatus
} from 'mos-connection'

import * as _ from 'underscore'
import { MosHandler } from './mosHandler'
import { DeviceConfig } from './connector'
import { MOS_DEVICE_CONFIG_MANIFEST } from './configManifest'
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
	public _observers: Array<any> = []
	public _mosDevice: IMOSDevice
	private _coreParentHandler: CoreHandler
	private _mosHandler: MosHandler
	private _subscriptions: Array<any> = []

	constructor (parent: CoreHandler, mosDevice: IMOSDevice, mosHandler: MosHandler) {
		this._coreParentHandler = parent
		this._mosDevice = mosDevice
		this._mosHandler = mosHandler

		this._mosDevice = this._mosDevice // ts-ignore fix

		this._coreParentHandler.logger.info('new CoreMosDeviceHandler ' + mosDevice.idPrimary)
		this.core = new CoreConnection(parent.getCoreConnectionOptions(mosDevice.idPrimary, mosDevice.idPrimary, false))
		this.core.onError((err) => {
			this._coreParentHandler.logger.error('Core Error: ' + (err.message || err.toString() || err))
		})

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
			this._coreParentHandler.logger.info('CoreMos: Clearing observers..')
			this._observers.forEach((obs) => {
				obs.stop()
			})
			this._observers = []
		}
		this._coreParentHandler.logger.info('CoreMos: Setting up subscriptions for ' + this.core.deviceId + ' for mosDevice ' + this._mosDevice.idPrimary + ' ..')
		this._subscriptions = []
		Promise.all([
			this.core.autoSubscribe('peripheralDeviceCommands', this.core.deviceId)
		])
		.then((subs) => {
			this._subscriptions = this._subscriptions.concat(subs)
		})
		.then(() => {
			return
		})
		.catch(e => {
			this._coreParentHandler.logger.error(e)
		})

		this._coreParentHandler.logger.info('CoreMos: Setting up observers..')

		// setup observers
		this._coreParentHandler.setupObserverForPeripheralDeviceCommands(this)
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
		.catch(e => this._coreParentHandler.logger.warn('Error when setting status:' + e))
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
	mosRoFullStory (story: IMOSROFullStory): Promise<any> {
		return this._coreMosManipulate(P.methods.mosRoFullStory, story)
	}

	triggerGetAllRunningOrders (): Promise<any> {
		// console.log('triggerGetAllRunningOrders')
		return this._mosDevice.getAllRunningOrders()
		.then((results) => {
			// console.log('GOT REPLY', results)
			return this.fixMosData(results)
		})
		.catch((err: Error) => {
			// console.log('GOT ERR', err)
			throw err
		})
	}
	triggerGetRunningOrder (roId: string): Promise<any> {
		// console.log('triggerGetRunningOrder ' + roId)
		return this._mosDevice.getRunningOrder(new MosString128(roId))
		.then((ro) => {
			// console.log('GOT REPLY', results)
			return this.fixMosData(ro)
		})
		.catch((err) => {
			// console.log('GOT ERR', err)
			throw err
		})
	}
	setROStatus (roId: string, status: IMOSObjectStatus): Promise<any> {
		// console.log('setStoryStatus')
		return this._mosDevice.setRunningOrderStatus({
			ID: new MosString128(roId),
			Status: status,
			Time: new MosTime()
		})
		.then((result) => {
			// console.log('got result', result)
			return this.fixMosData(result)
		})
	}
	setStoryStatus (roId: string, storyId: string, status: IMOSObjectStatus): Promise<any> {
		// console.log('setStoryStatus')
		return this._mosDevice.setStoryStatus({
			RunningOrderId: new MosString128(roId),
			ID: new MosString128(storyId),
			Status: status,
			Time: new MosTime()
		})
		.then((result) => {
			// console.log('got result', result)
			return this.fixMosData(result)
		})
	}
	setItemStatus (roId: string, storyId: string, itemId: string, status: IMOSObjectStatus): Promise<any> {
		// console.log('setStoryStatus')
		return this._mosDevice.setItemStatus({
			RunningOrderId: new MosString128(roId),
			StoryId: new MosString128(storyId),
			ID: new MosString128(itemId),
			Status: status,
			Time: new MosTime()
		})
		.then((result) => {
			// console.log('got result', result)
			return this.fixMosData(result)
		})
	}
	replaceStoryItem (roID: string, storyID: string, item: IMOSItem): Promise<any> {
		// console.log(roID, storyID, item)
		return this._mosDevice.mosItemReplace({
			roID: new MosString128(roID),
			storyID: new MosString128(storyID),
			item
		})
		.then(result => this.fixMosData(result))
	}
	test (a: string) {
		return new Promise(resolve => {
			setTimeout(() => {
				resolve('test' + a)
			},2000)
		})
	}
	dispose (): Promise<void> {
		this._observers.forEach((obs) => {
			obs.stop()
		})

		return this.core.setStatus({
			statusCode: P.StatusCode.BAD,
			messages: ['Uninitialized']
		})
		.then(() => {
			return
		})
	}
	killProcess (actually: number) {
		return this._coreParentHandler.killProcess(actually)
	}
	/**
	 * Convert mos-objects to look better over the wire
	 * @param o the object to convert
	 */
	private fixMosData (o: any): any {
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
				return this.fixMosData(val)
			})
		} else if (_.isObject(o)) {
			let o2: any = {}
			_.each(o, (val, key) => {
				o2[key] = this.fixMosData(val)
			})
			return o2
		} else {
			return o
		}
	}
	private _coreMosManipulate (method: string, ...attrs: Array<any>): Promise<any> {
		attrs = _.map(attrs, (attr) => {
			return this.fixMosData(attr)
		})
		// Make the commands be sent sequantially:
		return this.core.putOnQueue('mos', () => {

			// Log info about the sent command:
			let msg = 'Command: ' + method
			if (attrs[0] && attrs[0].ID) msg = `${method}: ${attrs[0].ID}`
			else if (attrs[0] && attrs[0] instanceof MosString128) msg = `${method}: ${attrs[0].toString()}`
			else if (attrs[0] && attrs[0].ObjectId) msg = `${method}: ${attrs[0].ObjectId}`
			else if (attrs[0] && attrs[0].StoryId) msg = `${method}: ${attrs[0].StoryId}`
			else if (attrs[0] && attrs[0].StoryID) msg = `${method}: ${attrs[0].StoryID}`
			else if (attrs[0] && attrs[0].ItemID) msg = `${method}: ${attrs[0].ItemID}`
			else if (attrs[0] && attrs[0].RunningOrderID) msg = `${method}: ${attrs[0].RunningOrderID}`
			else if (attrs[0] && attrs[0].toString) msg = `${method}: ${attrs[0].toString()}`

			this._coreParentHandler.logger.info('Recieved MOS command: ' + msg)

			return (
				this.core.mosManipulate(method, ...attrs)
				.catch(e => {
					this._coreParentHandler.logger.info('MOS command rejected: ' + ((e && e.toString()) || e))
					throw e
				})
			)
		})
	}
}
export interface CoreConfig {
	host: string,
	port: number,
	watchdog: boolean
}
/**
 * Represents a connection between mos-integration and Core
 */
export class CoreHandler {
	core: CoreConnection
	logger: Winston.LoggerInstance
	public _observers: Array<any> = []
	private _deviceOptions: DeviceConfig
	private _coreMosHandlers: Array<CoreMosDeviceHandler> = []
	private _onConnected?: () => any
	private _subscriptions: Array<any> = []
	private _isInitialized: boolean = false
	private _executedFunctions: {[id: string]: boolean} = {}
	private _coreConfig?: CoreConfig
	private _process?: Process

	constructor (logger: Winston.LoggerInstance, deviceOptions: DeviceConfig) {
		this.logger = logger
		this._deviceOptions = deviceOptions
	}

	init (config: CoreConfig, process: Process): Promise<void> {
		// this.logger.info('========')
		this._coreConfig = config
		this._process = process
		this.core = new CoreConnection(this.getCoreConnectionOptions('MOS gateway', 'MosCoreParent', true))

		this.core.onConnected(() => {
			this.logger.info('Core Connected!')
			if (this._isInitialized) this.onConnectionRestored()
		})
		this.core.onDisconnected(() => {
			this.logger.info('Core Disconnected!')
		})
		this.core.onError((err) => {
			this.logger.error('Core Error: ' + (err.message || err.toString() || err))
		})

		let ddpConfig: DDPConnectorOptions = {
			host: config.host,
			port: config.port
		}
		if (this._process && this._process.certificates.length) {
			ddpConfig.tlsOpts = {
				ca: this._process.certificates
			}
		}
		return this.core.init(ddpConfig).then((id: string) => {
			id = id // tsignore

			this.core.setStatus({
				statusCode: P.StatusCode.GOOD
				// messages: []
			})
			.catch(e => this.logger.warn('Error when setting status:' + e))
			// nothing
		})
		.then(() => {
			return this.setupSubscriptionsAndObservers()
		})
		.then(() => {
			this._isInitialized = true
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
		let credentials: {
			deviceId: string
			deviceToken: string
		}

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
		let options: CoreOptions = {
			...credentials,

			deviceCategory: P.DeviceCategory.INGEST,
			deviceType: P.DeviceType.MOS, // @todo: should not have this...
			deviceSubType: (parentProcess ? P.SUBTYPE_PROCESS : 'mos_connection'),

			deviceName: name,
			watchDog: (this._coreConfig ? this._coreConfig.watchdog : true),

			configManifest: MOS_DEVICE_CONFIG_MANIFEST
		}
		if (parentProcess) options.versions = this._getVersions()
		return options
	}
	registerMosDevice (mosDevice: IMOSDevice, mosHandler: MosHandler): Promise<CoreMosDeviceHandler> {
		this.logger.info('registerMosDevice -------------')
		let coreMos = new CoreMosDeviceHandler(this, mosDevice, mosHandler)

		this._coreMosHandlers.push(coreMos)
		return coreMos.init()
		.then(() => {
			this.logger.info('registerMosDevice done!')
			return coreMos
		})
	}
	unRegisterMosDevice (mosDevice: IMOSDevice): Promise<void> {
		let foundI = -1
		for (let i = 0; i < this._coreMosHandlers.length; i++) {
			let cmh = this._coreMosHandlers[i]
			if (cmh._mosDevice.idPrimary === mosDevice.idSecondary) {
				foundI = i
				break
			}
		}
		let coreMosHandler = this._coreMosHandlers[foundI]
		if (coreMosHandler) {

			return coreMosHandler.dispose()
			.then(() => {
				this._coreMosHandlers.splice(foundI, 1)
				return
			})

		}
		return Promise.resolve()
	}
	onConnectionRestored () {
		this.setupSubscriptionsAndObservers()
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
	setupSubscriptionsAndObservers (): Promise<void> {
		// console.log('setupObservers', this.core.deviceId)
		if (this._observers.length) {
			this.logger.info('Core: Clearing observers..')
			this._observers.forEach((obs) => {
				obs.stop()
			})
			this._observers = []
		}
		this._subscriptions = []

		this.logger.info('Core: Setting up subscriptions for ' + this.core.deviceId + '..')
		return Promise.all([
			this.core.autoSubscribe('peripheralDevices', {
				_id: this.core.deviceId
			}),
			this.core.autoSubscribe('peripheralDeviceCommands', this.core.deviceId)
		])
		.then((subs) => {
			this._subscriptions = this._subscriptions.concat(subs)
		})
		.then(() => {

			this.setupObserverForPeripheralDeviceCommands(this)

			return
		})
	}
	executeFunction (cmd: PeripheralDeviceCommand, fcnObject: any) {
		if (cmd) {
			if (this._executedFunctions[cmd._id]) return // prevent it from running multiple times
			this.logger.debug(cmd.functionName, cmd.args)
			this._executedFunctions[cmd._id] = true
			// console.log('executeFunction', cmd)
			let cb = (err: any, res?: any) => {
				// console.log('cb', err, res)
				if (err) {
					this.logger.error('executeFunction error', err, err.stack)
				}
				this.core.callMethod(P.methods.functionReply, [cmd._id, err, res])
				.then(() => {
					// console.log('cb done')
				})
				.catch((e) => {
					this.logger.error(e)
				})
			}
			// @ts-ignore
			let fcn: Function = fcnObject[cmd.functionName]
			try {
				if (!fcn) throw Error('Function "' + cmd.functionName + '" not found!')

				Promise.resolve(fcn.apply(fcnObject, cmd.args))
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
	retireExecuteFunction (cmdId: string) {
		delete this._executedFunctions[cmdId]
	}
	setupObserverForPeripheralDeviceCommands (functionObject: CoreMosDeviceHandler | CoreHandler) {
		let observer = functionObject.core.observe('peripheralDeviceCommands')
		functionObject.killProcess(0) // just make sure it exists
		functionObject._observers.push(observer)
		let addedChangedCommand = (id: string) => {
			let cmds = functionObject.core.getCollection('peripheralDeviceCommands')
			if (!cmds) throw Error('"peripheralDeviceCommands" collection not found!')
			let cmd = cmds.findOne(id) as PeripheralDeviceCommand
			if (!cmd) throw Error('PeripheralCommand "' + id + '" not found!')
			// console.log('addedChangedCommand', id)
			if (cmd.deviceId === functionObject.core.deviceId) {
				this.executeFunction(cmd, functionObject)
			} else {
				// console.log('not mine', cmd.deviceId, this.core.deviceId)
			}
		}
		observer.added = (id: string) => {
			addedChangedCommand(id)
		}
		observer.changed = (id: string) => {
			addedChangedCommand(id)
		}
		observer.removed = (id: string) => {
			this.retireExecuteFunction(id)
		}
		let cmds = functionObject.core.getCollection('peripheralDeviceCommands')
		if (!cmds) throw Error('"peripheralDeviceCommands" collection not found!')
		cmds.find({}).forEach((cmd: PeripheralDeviceCommand) => {
			if (cmd.deviceId === functionObject.core.deviceId) {
				this.executeFunction(cmd, functionObject)
			}
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
	pingResponse (message: string) {
		this.core.setPingResponse(message)
		return true
	}
	getSnapshot (): any {
		this.logger.info('getSnapshot')
		return {} // TODO: send some snapshot data?
	}
	private _getVersions () {
		let versions: {[packageName: string]: string} = {}

		if (process.env.npm_package_version) {
			versions['_process'] = process.env.npm_package_version
		}

		let dirNames = [
			'tv-automation-server-core-integration',
			'mos-connection'
		]
		try {
			let nodeModulesDirectories = fs.readdirSync('node_modules')
			_.each(nodeModulesDirectories, (dir) => {
				try {
					if (dirNames.indexOf(dir) !== -1) {
						let file = 'node_modules/' + dir + '/package.json'
						file = fs.readFileSync(file, 'utf8')
						let json = JSON.parse(file)
						versions[dir] = json.version || 'N/A'
					}
				} catch (e) {
					this.logger.error(e)
				}
			})
		} catch (e) {
			this.logger.error(e)
		}
		return versions
	}
}
