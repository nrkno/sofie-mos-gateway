
import {MosHandler, MosConfig} from './mosHandler'
import {CoreHandler, CoreConfig} from './coreHandler'

export interface Config {
	core: CoreConfig
	mos: MosConfig
}
export class Connector {

	private mosHandler: MosHandler
	private coreHandler: CoreHandler
	private _config: Config

	init (config: Config): Promise<number> {
		this._config = config

		return Promise.resolve()
		.then(() => {
			console.log('Initializing Core...')
			return this.initCore()
		})
		.then(() => {
			console.log('Initializing Mos...')
			return this.initMos()
		})
		.then(() => {
			console.log('Initialization done')
			return 0
		})
	}
	initCore () {
		this.coreHandler = new CoreHandler()
		return this.coreHandler.init(this._config.core)
	}
	initMos (): Promise<void> {
		// TODO: maybe get some config data from core here?
		this.mosHandler = new MosHandler()
		return this.mosHandler.init(this._config.mos, this.coreHandler)

	}
}
