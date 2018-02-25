let DDP = require("ddp");

import {EventEmitter} from 'events';


export interface DDPConnectorOptions {
	host: 	string;
	port: 	number;
	path?: 	string;
	ssl?: 	boolean;
	debug?:	boolean;
}
export interface Observer {
	added:  (id:string) => void;
	changed:(id:string, oldFields:any, clearedFields:any, newFields:any) => void;
	removed:(id:string, oldValue:any) => void;
}
export interface DDPClient {
	on:(event:string, data?:any) => void,
	close:() => void,
	connect:(callback?:(error:Error, wasReconnect:boolean) => void) => void,

	call:(methodName:string, data:Array<any>, callback:(err:Error, result:any) => void) => void
	subscribe: (subscriptionName:string, data:Array<any>, callback:() => void) => void
	observe: (collectionName:string) => Observer

	collections: {
		[collectionName:string]: {
			[id:string]: {
				_id: string,
				[attr:string]: any
			}
		}
	}

	socket:any,
	session:string,

	host: 				string,
	port: 				number,
	path: 				string,
	ssl: 				boolean,
	useSockJS: 			boolean;
	autoReconnect: 		boolean;
	autoReconnectTimer:	number;
	ddpVersion:			any;
}

export class DDPConnector extends EventEmitter {
	private _options:DDPConnectorOptions;
	public ddpClient:DDPClient;
	private _connected:boolean  = false;
	private _connecting:boolean = false;
	private _connectionId:string;

	onConnectionChanged?: (connected:boolean) => void;
	onConnected?: () => void;
	onDisconnected?: () => void;


	constructor(options:DDPConnectorOptions) {
		super();

		this._options = options;

	}
	createClient() {
		var o = {
			host: 					this._options.host, 
			port: 					this._options.port, 
			path: 					this._options.path || '', 
			ssl: 					this._options.ssl || false, 
			useSockJS: 				true, 
			autoReconnect: 			true, 
			autoReconnectTimer: 	1000,
			maintain_collections: 	true, 
			ddpVersion: 			"1"
		};
		if (!this.ddpClient) {

			

			this.ddpClient = new DDP(o);
			this.ddpClient.on("socket-close", () => {
				
				this._onclientConnectionChange(false)

			});
			this.ddpClient.on("message", (message: any) => this._onClientMessage(message));
			this.ddpClient.on("socket-error", (error: any) => this._onClientError(error));
			


		} else {
			
			
			if (this.ddpClient.socket) {
				this.ddpClient.close();
			}
			

			this.ddpClient.host = o.host;
			this.ddpClient.port = o.port;
			this.ddpClient.path = o.path;
			this.ddpClient.ssl 	= o.ssl;
			this.ddpClient.useSockJS 			= o.useSockJS;
			this.ddpClient.autoReconnect 		= o.autoReconnect;
			this.ddpClient.autoReconnectTimer	= o.autoReconnectTimer ;
			this.ddpClient.ddpVersion			= o.ddpVersion ;


			this.ddpClient.connect();

		}

		this.ddpClient.on("connected", () => {
			
			this._onclientConnectionChange(true);
		});
		this.ddpClient.on("failed", (error: any) => this._onClientConnectionFailed(error));
	}
	public connect() {
		return new Promise((resolve, reject) => {

			if (!this.ddpClient) {
				this.createClient();
			}
			if (this.ddpClient && !this._connecting) {

				this._connecting = true;
				
				this.ddpClient.connect((error: Object/*, isReconnecting: boolean*/) => {
					this._connecting = false;


					if (error) {
						reject(error);
					} else {
						this._connected = true;
						resolve();
					}
				});
			}
		});
	}
	public close() {
		if (this.ddpClient) {
			this.ddpClient.close();
			delete this.ddpClient;
		}
	}
	public get connected(): boolean{
		return this._connected;
	}
	public forceReconnect(): void {
		this.createClient();
	}

	private _onclientConnectionChange(connected:boolean) {
		if (connected !== this._connected) {
			this._connected = connected;

			if (connected) {
				this._connectionId = this.ddpClient.session;
			}

			//log.debug("DDP: _onclientConnectionChange "+connected);

			if (this.onConnectionChanged) {
				this.onConnectionChanged(this._connected);
			}
			if (this.onConnected && this._connected) {
				this.onConnected();
			}
			if (this.onDisconnected && !this._connected) {
				this.onDisconnected();
			}

			/*if(!this._connected && this.autoReconnect){
				this._createClient();
				this.handleAutoReconnect();
			}
			if (this._connected) {
				this._failedConnectionAttempts = 0;
			}
			*/
		}
	}
	private _onClientConnectionFailed(error:Error) {

		if (this.listenerCount('failed') > 0) {

			this.emit('failed', error);
		} else {
			console.log('failed',error);
			// last resort retry strategy:
			setTimeout(() => {
				if (!this._connected) {
					this.forceReconnect();
				}
			}, 5000);
		}
	}

	private _onClientMessage(message:any) {
		//console.log('message',message);
		message;
	}
	private _onClientError(error:Error) {
		this.emit('error', error);
	}
}