import path from 'path'
import protobuf from 'protobufjs'

export default class Message {
	constructor(protoFile, typeName) {
		this.protoFile = protoFile
		this.typeName = typeName
	}

	async init() {
		console.log('hereeeeeee boy')
		// const path = path.join('../../', 'proto/', this.protoFile)
		console.log('got path', path)
		this.protoRoot = await protobuf.load(
			`../../proto/${this.protoFile}`
			// path.join('../../', 'proto/', this.protoFile)
		)
		console.log('get  path', path)
		this.type = this.protoRoot.lookupType(this.typeName)
		console.log('gut  path', path)
		return this
	}

	fromObject(object) {
		this.payload = { ...object }
	}

	from(argument) {
		if (argument instanceof Buffer) {
			this.payload = this.type.decode(argument)
		} else {
			this.fromObject(argument)
		}
	}

	encode() {
		const messageObject = this.type.create(this.payload)
		const err = this.type.verify(messageObject)

		if (err) throw err

		return this.type.encode(messageObject).finish()
	}
}
