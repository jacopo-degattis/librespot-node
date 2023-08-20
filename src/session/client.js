// import net from 'net'
import logger from '../utils/logger.js'

// let net = null
// import('net')
// 	.then(module => {
// 		net = module
// 	})
// 	.catch(err => console.log('firefox os detected', err))

export default class Client {
	constructor(address, port, runtimeEnv) {
		this.address = address
		this.port = port
		this.client
		this.runtimeEnv = runtimeEnv

		logger.info('Runtime env ', runtimeEnv)

		if (runtimeEnv === 'COMPUTER_OS') {
			// this.client = new net.Socket()
			this.client.setKeepAlive(true)
			this.client.on('close', () => {
				logger.info('Connection closed.')
			})
			this.dataReceived = Buffer.from('')
			this.client.on('data', data => this.onDataCallbackFn(data))
			this.readers = []
		} else {
			// eslint-disable-next-line no-undef
			this.client = navigator.mozTCPSocket.open(address, port)
			this.client.onclose = () => logger.info('Connection closed.')
			this.dataReceived = Buffer.from('')
			this.client.ondata = data => this.onDataCallbackFn(data)
			this.readers = []
		}
	}

	onDataCallbackFn(data) {
		console.log('> Received data, ', data)
		logger.info('> Received data, length:', data.length)
		logger.info('> Buffered data length', this.dataReceived.length)
		this.dataReceived = Buffer.concat([this.dataReceived, data])
		for (let i = 0; i < this.readers.length; i++) {
			const { nbOfBytes, partial, resolve } = this.readers[i]
			const dataRead = this.readAndSlice(nbOfBytes)
			if (dataRead) {
				resolve(dataRead)
				this.readers.shift()
				if (partial) break
			} else {
				break
			}
		}
	}

	connect() {
		return new Promise(resolve => {
			console.log('runtimeEnv', this.runtimeEnv)

			if (this.runtimeEnv === 'COMPUTER_OS') {
				this.client.connect(this.port, this.address, () => {
					logger.info('Connected to ' + this.address)
					resolve()
				})
			}

			resolve()
		})
	}

	destroy() {
		this.destroyed = true

		if (this.runtimeEnv === 'COMPUTER_OS') {
			this.client.destroy()
		} else {
			this.client.close()
		}
	}

	readAndSlice(nbOfBytes) {
		if (this.dataReceived.length >= nbOfBytes) {
			const readData = this.dataReceived.slice(0, nbOfBytes)
			this.dataReceived = this.dataReceived.slice(nbOfBytes)
			return readData
		}
		return null
	}

	read(nbOfBytes, { partial = false, prioritized = false } = {}) {
		logger.info('Trying to read', nbOfBytes, 'bytes')
		return new Promise(resolve => {
			const dataRead = this.readAndSlice(nbOfBytes)
			if (dataRead) return resolve(dataRead)
			this.readers[prioritized ? 'unshift' : 'push']({
				nbOfBytes,
				partial,
				resolve
			})
		})
	}

	write(payload) {
		console.log('> Writing payload, ', payload)
		if (this.runtimeEnv === 'COMPUTER_OS') {
			console.log('calling COMPUTER_OS write method')
			this.client.write(payload)
		} else if (this.runtimeEnv === 'FIREFOX_OS') {
			console.log('calling FIREFOX_OS write method')
			this.client.send(payload)
		}
	}

	async readHandshakePayload() {
		const length = await this.read(4, { partial: true })
		const payload = await this.read(length.readUInt32BE() - 4, {
			prioritized: true
		})
		return Buffer.concat([length, payload])
	}

	async readEncryptedPayload(shannon) {
		const cmdBuffer = await this.read(1, { partial: true })
		const decryptedCmdBuffer = shannon.decrypt(cmdBuffer)

		const sizeBuffer = await this.read(2, { partial: true, prioritized: true })
		const decryptedSizeBuffer = shannon.decrypt(sizeBuffer)

		const cmd = decryptedCmdBuffer.readUInt8()
		const size = decryptedSizeBuffer.readUInt16BE()

		const payload = await this.read(size, { partial: true, prioritized: true })
		const decryptedPayload = shannon.decrypt(payload)

		const mac = await this.read(4, { prioritized: true })

		const expectedMac = Buffer.alloc(4)
		const expectedDecryptedMac = shannon.finish(expectedMac)

		if (!expectedDecryptedMac.equals(mac))
			throw new Error('Received mac mismatch')

		logger.info('cmd: 0x' + cmd.toString(16).toUpperCase())

		return { cmd, payload: decryptedPayload }
	}
}
