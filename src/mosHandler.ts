import {
	MosConnection,
	IMOSDevice,
	IMOSConnectionStatus,
	IMOSRunningOrder,
	IMOSROAck,
	MosString128,
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
	IConnectionConfig,
	IMOSDeviceConnectionOptions,
	MosDevice
} from 'mos-connection'
import * as _ from 'underscore'
import * as Winston from 'winston'
import { CoreHandler } from './coreHandler'

// export interface MosOptions {
// 	mosID: string,
// 	acceptsConnections: boolean,
// 	profiles: {
// 		'0': boolean,
// 		'1': boolean,
// 		'2': boolean,
// 		'3': boolean,
// 		'4': boolean,
// 		'5': boolean,
// 		'6': boolean,
// 		'7': boolean
// 	}
// }
export interface MosConfig {
	self: IConnectionConfig
	devices: Array<IMOSDeviceConnectionOptions>
}

export class MosHandler {

	public mos: MosConnection

	public mosOptions: MosConfig

	private mosDevices: {[id: string]: IMOSDevice} = {}
	private _logger: Winston.LoggerInstance

	constructor (logger: Winston.LoggerInstance) {
		this._logger = logger
	}
	init (config: MosConfig, coreHandler: CoreHandler): Promise<void> {

		this.mosOptions = config
		/*{
			mosID: 'seff-tv-automation',
			acceptsConnections: true, // default:true
			// accepsConnectionsFrom: ['127.0.0.1'],
			profiles: {
				'0': true,
				'1': true,
				'2': true,
				'3': false,
				'4': false,
				'5': false,
				'6': false,
				'7': false
			}
		}
		*/

		this.mos = new MosConnection(this.mosOptions.self)
		this.mos.on('rawMessage', (source, type, message) => {
			this._logger.debug('rawMessage', source, type, message)
		})

		this.mos.onConnection((mosDevice: IMOSDevice) => {
			// a new connection to a device has been made
			this._logger.info('---------------------------------')

			this.mosDevices[mosDevice.idPrimary] = mosDevice

			return coreHandler.registerMosDevice(mosDevice, this)
			.then((coreMosHandler) => {
				// this._logger.info('mosDevice registered -------------')
				// Setup message flow between the devices:
				// Profile 0: -------------------------------------------------
				mosDevice.onConnectionChange((connectionStatus: IMOSConnectionStatus) => { //  MOSDevice >>>> Core
					coreMosHandler.onMosConnectionChanged(connectionStatus)
				})
				coreMosHandler.onMosConnectionChanged(mosDevice.getConnectionStatus()) // initial check
				mosDevice.onGetMachineInfo(() => { // MOSDevice >>>> Core
					return coreMosHandler.getMachineInfo()
				})
				// Profile 1: -------------------------------------------------
				/*
				mosDevice.onRequestMOSObject((objId: string) => {
					// coreMosHandler.fetchMosObject(objId)
					// return Promise<IMOSObject | null>
				})
				*/
				// onRequestMOSObject: (cb: (objId: string) => Promise<IMOSObject | null>) => void
				// onRequestAllMOSObjects: (cb: () => Promise<Array<IMOSObject>>) => void
				// getMOSObject: (objId: string) => Promise<IMOSObject>
				// getAllMOSObjects: () => Promise<Array<IMOSObject>>
				// Profile 2: -------------------------------------------------
				mosDevice.onCreateRunningOrder((ro: IMOSRunningOrder) => { // MOSDevice >>>> Core
					return this._getROAck(ro.ID, coreMosHandler.mosRoCreate(ro))
				})
				mosDevice.onReplaceRunningOrder((ro: IMOSRunningOrder) => { // MOSDevice >>>> Core
					return this._getROAck(ro.ID, coreMosHandler.mosRoReplace(ro))
				})
				mosDevice.onDeleteRunningOrder((runningOrderId: MosString128) => { // MOSDevice >>>> Core
					return this._getROAck(runningOrderId, coreMosHandler.mosRoDelete(runningOrderId))
				})
				mosDevice.onMetadataReplace((ro: IMOSRunningOrderBase) => { // MOSDevice >>>> Core
					return this._getROAck(ro.ID, coreMosHandler.mosRoMetadata(ro))
				})
				mosDevice.onRunningOrderStatus((status: IMOSRunningOrderStatus) => { // MOSDevice >>>> Core
					return this._getROAck(status.ID, coreMosHandler.mosRoStatus(status))
				})
				mosDevice.onStoryStatus((status: IMOSStoryStatus) => { // MOSDevice >>>> Core
					return this._getROAck(status.RunningOrderId, coreMosHandler.mosRoStoryStatus(status))
				})
				mosDevice.onItemStatus((status: IMOSItemStatus) => { // MOSDevice >>>> Core
					return this._getROAck(status.RunningOrderId, coreMosHandler.mosRoItemStatus(status))
				})
				mosDevice.onROInsertStories((Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => { // MOSDevice >>>> Core
					return this._getROAck(Action.RunningOrderID, coreMosHandler.mosRoStoryInsert(Action, Stories))
				})
				mosDevice.onROInsertItems((Action: IMOSItemAction, Items: Array<IMOSItem>) => { // MOSDevice >>>> Core
					return this._getROAck(Action.RunningOrderID, coreMosHandler.mosRoItemInsert(Action, Items))
				})
				mosDevice.onROReplaceStories((Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => { // MOSDevice >>>> Core
					return this._getROAck(Action.RunningOrderID, coreMosHandler.mosRoStoryReplace(Action, Stories))
				})
				mosDevice.onROReplaceItems((Action: IMOSItemAction, Items: Array<IMOSItem>) => { // MOSDevice >>>> Core
					return this._getROAck(Action.RunningOrderID, coreMosHandler.mosRoItemReplace(Action, Items))
				})
				mosDevice.onROMoveStories((Action: IMOSStoryAction, Stories: Array<MosString128>) => { // MOSDevice >>>> Core
					return this._getROAck(Action.RunningOrderID, coreMosHandler.mosRoStoryMove(Action, Stories))
				})
				mosDevice.onROMoveItems((Action: IMOSItemAction, Items: Array<MosString128>) => { // MOSDevice >>>> Core
					return this._getROAck(Action.RunningOrderID, coreMosHandler.mosRoItemMove(Action, Items))
				})
				mosDevice.onRODeleteStories((Action: IMOSROAction, Stories: Array<MosString128>) => { // MOSDevice >>>> Core
					return this._getROAck(Action.RunningOrderID, coreMosHandler.mosRoStoryDelete(Action, Stories))
				})
				mosDevice.onRODeleteItems((Action: IMOSStoryAction, Items: Array<MosString128>) => { // MOSDevice >>>> Core
					return this._getROAck(Action.RunningOrderID, coreMosHandler.mosRoItemDelete(Action, Items))
				})
				mosDevice.onROSwapStories((Action: IMOSROAction, StoryID0: MosString128, StoryID1: MosString128) => { // MOSDevice >>>> Core
					return this._getROAck(Action.RunningOrderID, coreMosHandler.mosRoStorySwap(Action, StoryID0, StoryID1))
				})
				mosDevice.onROSwapItems((Action: IMOSStoryAction, ItemID0: MosString128, ItemID1: MosString128) => { // MOSDevice >>>> Core
					return this._getROAck(Action.RunningOrderID, coreMosHandler.mosRoItemSwap(Action, ItemID0, ItemID1))
				})
				mosDevice.onReadyToAir((Action: IMOSROReadyToAir) => { // MOSDevice >>>> Core
					return this._getROAck(Action.ID, coreMosHandler.mosRoReadyToAir(Action))
				})
				// ----------------------------------------------------------------
				// Init actions
				/*
				mosDevice.getMachineInfo()
					.then((machineInfo: IMOSListMachInfo) => {
					})
				*/
				// Profile 3: -------------------------------------------------
				// Profile 4: -------------------------------------------------
				// onStory: (cb: (story: IMOSROFullStory) => Promise<any>) => void
				mosDevice.onROStory((story: IMOSROFullStory) => { // MOSDevice >>>> Core
					return this._getROAck(story.RunningOrderId, coreMosHandler.mosRoFullStory(story))
				})
			})
			.catch((e) => {
				this._logger.error('Error:',e)
			})

		})

		// Open mos-server for connections:
		return this.mos.init()
		.then (() => {
			// Connect to ENPS:
			return Promise.all(
				_.map(this.mosOptions.devices, (device) => {
					return this.mos.connect(device)
					.then((mosDevice: MosDevice) => {
						// called when a connection has been made
						return mosDevice.getMachineInfo()
						.then((machInfo) => {
							this._logger.info('Connected to Mos-device', machInfo)
							let machineId = machInfo.ID.toString()
							if (!(
								machineId === device.primary.id ||
								(
									device.secondary &&
									machineId === device.secondary.id
								)
							)) {
								throw new Error('Mos-device has ID "' + machineId + '" but specified ncs-id is "' + (device.primary.id || (device.secondary || {id: ''}).id) + '"')
							}
						})
					})
				})
			)
		})
		.then(() => {
			// All connections have been made at this point
		})
	}
	dispose (): Promise<void> {
		return this.mos.dispose()
	}
	private _getROAck (roId: MosString128, p: Promise<IMOSROAck>) {
		return p.then(() => {
			let roAck: IMOSROAck = {
				ID: roId,
				Status: new MosString128('OK'),
				Stories: [] // Array<IMOSROAckStory> // todo: implement this later (?) (unknown if we really need to)
			}
			return roAck
		})
		.catch((err) => {
			this._logger.error('ROAck error:', err)
			// console.log('Error', err)
			let roAck: IMOSROAck = {
				ID: roId,
				Status: new MosString128('Error: ' + err.toString()),
				Stories: [] // Array<IMOSROAckStory> // todo: implement this later (?) (unknown if we really need to)
			}
			return roAck
		})
	}
}
