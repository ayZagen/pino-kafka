'use strict'

const pino = require('pino')
const {KafkaConsumer, CODES} = require('node-rdkafka')
const pKafka = require('../pkafka')
const assert = require('assert')
const options = {
  topic: 'test',
  brokers: 'localhost:29092',
  consumerGroup: 'kafka',
  timeout: 2000
}
let consumer

async function initConsumer() {
  return new Promise((resolve, reject) => {

    consumer = new KafkaConsumer({
      "metadata.request.timeout.ms": 2000,
      'socket.timeout.ms': 10000,
      'group.id': options.consumerGroup,
      'metadata.broker.list': options.brokers,
      'rebalance_cb': function (err, assignment) {

        if (err.code === CODES.ERRORS.ERR__ASSIGN_PARTITIONS) {
          // Note: this can throw when you are disconnected. Take care and wrap it in
          // a try catch if that matters to you
          this.assign(assignment);
        } else if (err.code == CODES.ERRORS.ERR__REVOKE_PARTITIONS) {
          // Same as above
          this.unassign();
        } else {
          console.error(err)
          reject(err)
        }

      }
    }, {})

    consumer.connect()
    consumer
      .on('ready', () => {
        consumer.subscribe([options.topic]);
        this.consumer = consumer
        this.consumer.consume();

        resolve(consumer)
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}

describe('simple produce', function () {

  before(initConsumer)

  it('should write successfully to kafka topic', function (done) {
    const logger = pino(pKafka({
      brokers: options.brokers,
      timeout: options.timeout,
      defaultTopic: options.topic
    }))

    const messages = []

    for (let i = 0; i < 500; i++) {
      messages.push({index: `field${i}`, time: new Date().getTime()})
    }


    const incomingMessages = []
    this.consumer.on("data", data => {
      incomingMessages.push(JSON.parse(data.value.toString('utf8')))
      if (incomingMessages.length === messages.length) {
        assert(incomingMessages.length === 500)
        done()
      }
    })

    messages.forEach(msg => {
      logger.info(msg)
    })
  })

  after(function (done) {
    this.consumer.disconnect(() => {
      done()
    })
  })

})
