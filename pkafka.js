const Writable = require('readable-stream').Writable
const stream = require('stream')
const backoff = require('backoff')
const { Producer } = require('node-rdkafka')

function pinoKafka(opts) {

  let connected = false
  let connecting = false
  let kafkaError = null
  const producer = new Producer({
    ...opts.kafka,
    'metadata.broker.list': opts.brokers,
    dr_cb: true
  })

  producer.on('delivery-report', (err, report) => {
    if (typeof report.opaque === 'function') {
      report.opaque.call(null, err, report);
    }
  });

  // passthrough to buffer incoming messages.
  const inputStream = new stream.PassThrough()
  process.stdin.pipe(inputStream)
  inputStream.pause()

  const outputStream = new Writable({
    close () { producer.disconnect() },
    /**
     *
     * @param { Buffer } body
     * @param { String } enc
     * @param { Function } cb
     */
    write (body, enc, cb) {
      if(body){
        body = JSON.parse(body.toString("utf8"))
      }

      // if topic provided in the message accept it. If not assign default
      const topic =  body.topic || opts.defaultTopic

      delete body.topic
      const value = JSON.stringify(body)

      if(opts.echo){
        console.log(value)
      }
      producer.produce(topic, null, Buffer.from(value), null, Date.now())
      cb()
    }
  })

  let pollLoop
  function connect (cb) {
    if (connecting) return
    connecting = true
    producer.connect()

    producer.on('ready', function() {
      connecting = false
      connected = true
      if (cb) cb(null, connected)
      inputStream.pipe(outputStream, { end: false })
      inputStream.resume()

      pollLoop =  setInterval(function() {
        producer.poll();
      }, opts.pollInterval || 1000);
    })
    addListeners()
  }

  function disconnect () {
    connected = false
    connecting = false
    inputStream.pause()
    inputStream.unpipe(outputStream)
  }

  function reconnect () {
    const retry = backoff.fibonacci()
    retry.failAfter(opts.reconnectTries)
    retry.on('ready', () => {
      connect((err) => {
        if (connected === false) return retry.backoff(err)
      })
    })
    retry.on('fail', (err) => process.stderr.write(`could not reconnect: ${err.message}`))
    retry.backoff()
  }
  // end: connection handlers

  // begin: connection listeners
  function closeListener (hadError) {
    disconnect()
    if (hadError) {
      process.stderr.write(kafkaError.message)
    }
    if (opts.reconnect) reconnect()
  }

  function endListener () {
    disconnect()
    removeListeners()
    if (opts.reconnect) reconnect()
  }

  function errorListener (err) {
    kafkaError = err
  }
  // end: connection listeners

  function addListeners () {
    producer.on('close', closeListener)
    producer.on('end', endListener)
    producer.on('error', errorListener)
    producer.on('event.error', errorListener)
    producer.on('connection.failure', errorListener)
  }

  function removeListeners () {
    producer.removeAllListeners('close')
    producer.removeAllListeners('end')
    producer.removeAllListeners('error')
    producer.removeAllListeners('event.error')
    producer.removeAllListeners('connection.failure')
  }

  connect()

  return outputStream
}

module.exports = pinoKafka
