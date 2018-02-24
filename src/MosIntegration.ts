
import {MosConnection} from "mos-connection"

export default class MosIntegration {
	static init() {
		
        const myMos = new MosConnection({
            mosID: "YAAS",
            ncs: {
                ncsID: "WINSERVERSOMETHINGENPS",
                host: "192.168.0.1"
            },
            /*ncsBuddy?: {
                ncsID: string;
                host: string;
            },*/
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

        myMos;

	}
}


