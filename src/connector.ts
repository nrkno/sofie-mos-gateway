
import {MosHandler} from "./mosHandler"
import {CoreHandler} from "./coreHandler"



export class Connector {
	
	private mosHandler:MosHandler;
	private coreHandler:CoreHandler;


	async init():Promise<number> {

		await this.initCore()

		

		await this.initMos();



		return 0;
		
	}
	initCore() {

		this.coreHandler = new CoreHandler();
		
		return this.coreHandler.init();

	}
	initMos():Promise<number> {


		// TODO: maybe get some config data from core here?

		this.mosHandler = new MosHandler();
		
		return this.mosHandler.init();

	}
}

