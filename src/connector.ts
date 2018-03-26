
import {MosHandler} from './mosHandler'
import {CoreHandler} from './coreHandler'

export class Connector {

	private mosHandler: MosHandler
	private coreHandler: CoreHandler

	init (): Promise<number> {

		return Promise.resolve()
		.then(() => {
			return this.initCore()
		})
		.then(() => {
			return this.initMos()
		})
		.then(() => {
			return 0
		})
	}
	initCore () {
		this.coreHandler = new CoreHandler()
		return this.coreHandler.init()
	}
	initMos (): Promise<void> {
		// TODO: maybe get some config data from core here?
		this.mosHandler = new MosHandler()
		return this.mosHandler.init(this.coreHandler)

	}
}
