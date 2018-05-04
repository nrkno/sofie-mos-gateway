
import { MosHandler, MosConfig } from './mosHandler'
import { CoreHandler, CoreConfig } from './coreHandler'
import * as Winston from 'winston'

export interface Config {
	core: CoreConfig
	mos: MosConfig
}
export class Connector {

	private mosHandler: MosHandler
	private coreHandler: CoreHandler
	private _config: Config
	private _logger: Winston.LoggerInstance

	constructor (logger: Winston.LoggerInstance) {
		this._logger = logger
	}

	init (config: Config): Promise<number> {
		this._config = config

		return Promise.resolve()
		.then(() => {
			this._logger.info('Initializing Core...')
			return this.initCore()
		})
		.then(() => {
			this._logger.info('Initializing Mos...')
			return this.initMos()
		})
		.then(() => {
			this._logger.info('Initialization done')
			return 0
		})
		.catch((e) => {
			this._logger.error('Error during initialization:', e, e.stack)
			// this._logger.error(e)
			// this._logger.error(e.stack)
			return 0
		})
	}
	initCore () {
		this.coreHandler = new CoreHandler(this._logger)
		return this.coreHandler.init(this._config.core)
	}
	initMos (): Promise<void> {
		// TODO: maybe get some config data from core here?
		this.mosHandler = new MosHandler(this._logger)
		return this.mosHandler.init(this._config.mos, this.coreHandler)

	}
	dispose (): Promise<void> {
		return this.mosHandler.dispose()
		.then(() => {
			return this.coreHandler.dispose()
		})
		.then(() => {
			return
		})
	}
}
