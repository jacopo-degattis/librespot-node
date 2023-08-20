declare module 'crypto-browserify' {
	export interface DiffieHellmanGroup {
		generateKeys: () => any
		getPublicKey: () => any
		computeSecret: (param: any) => any
	}
	function getDiffieHellman(value: any): any
	function createHmac(p1: any, p2: any): any
}
