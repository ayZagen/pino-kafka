const stream = require('stream')
const Kafka = require('node-rdkafka')
const util = require("util");

module.exports = function pinoKafka(opts) {

  opts.on = Object.assign({
    error(err) {
      process.stderr.write(util.format.apply(this, err) + '\n')
    },
    ready() {
    },
    disconnected(){},
    'event'(){},
    'event.log'(){},
    'event.stats'(){},
    'event.throttle'(){},
    'delivery-report'(){},
  }, opts.on || {})
  const through = new stream.PassThrough()
  const inputStream = process.stdin
  through.pause()

  const kafkaStream = new Kafka.HighLevelProducer({
    ...opts.kafka,
    'metadata.broker.list': opts.brokers
  })

  kafkaStream.connect({
    timeout: opts.timeout
  }, (err) => {
    if (err) {
      opts.on.error.call(kafkaStream, err)
    }
  })

  kafkaStream.on('ready', (info, metadata) => {
    through.pipe(outputStream)
    through.resume()
    opts.on.ready.call(kafkaStream, info, metadata)
  })

  kafkaStream.on('disconnected', opts.on.disconnected.bind(kafkaStream))
  kafkaStream.on('event', opts.on.event.bind(kafkaStream))
  kafkaStream.on('event.log', opts.on['event.log'].bind(kafkaStream))
  kafkaStream.on('event.stats', opts.on['event.stats'].bind(kafkaStream))
  kafkaStream.on('event.error', opts.on.error.bind(kafkaStream))
  kafkaStream.on('event.throttle', opts.on['event.throttle'].bind(kafkaStream))
  kafkaStream.on('delivery-report', opts.on['delivery-report'].bind(kafkaStream))

  const outputStream = new stream.Writable({
    write(body, enc, cb) {
      // TODO: remove new line delimeters
      kafkaStream.produce(opts.defaultTopic,
        null,
        body,
        null,
        null,
        (err, offset) => {
          if (err) {
            opts.on.error.call(kafkaStream, err)
            cb(err)
          } else {
            if (opts.echo){
              process.stdout.write(body)
            }
            cb()
          }
        })
    }
  })

  inputStream.pipe(through)

  return through;
}

