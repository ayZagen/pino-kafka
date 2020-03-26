const stream = require('stream')
const Kafka = require('node-rdkafka')

module.exports = function pinoKafka(opts) {

  const through  = new stream.PassThrough()
  const inputStream = process.stdin
  through.pause()

  const kafkaStream = new Kafka.HighLevelProducer({
    ...opts.kafka,
    'metadata.broker.list': opts.brokers
  })

  kafkaStream.connect(null, (err)=>{
    if(err)
      throw new Error(err)
  })

  kafkaStream.on('ready', (info, metadata) => {
    through.pipe(outputStream)
    through.resume()
  })

  const outputStream = new stream.Writable({
    write (body, enc, cb) {
      // TODO: remove new line delimeters
      kafkaStream.produce(opts.defaultTopic, null, body, null, null, (err, offset) => {
        if(err){
          cb(err)
        }else{
          cb()
        }
      })
    }
  })

  inputStream.pipe(through)

  return through;
}

