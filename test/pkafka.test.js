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

function initConsumer(done) {

  consumer = new KafkaConsumer({
    "metadata.request.timeout.ms": options.timeout,
    'socket.timeout.ms': options.timeout,
    'group.id': options.consumerGroup,
    'metadata.broker.list': options.brokers,
    'rebalance_cb': function (err, assignment) {

      if (err.code === CODES.ERRORS.ERR__ASSIGN_PARTITIONS) {
        this.assign(assignment);
      } else if (err.code == CODES.ERRORS.ERR__REVOKE_PARTITIONS) {
        this.unassign();
      } else {
        console.error(err)
        done(err)
      }
    }
  }, {})

  consumer.connect({timeout: options.timeout}, (err) => {
    if (err) {
      done(err)
    }
  })
  consumer
    .on('ready', () => {
      consumer.subscribe([options.topic]);
      this.consumer = consumer
      this.consumer.consume();
      done(null, consumer)
    })
    .on('error', (err) => {
      done(err)
    })
}

describe('simple produce', function () {

  before(function (done) {
    initConsumer.call(this,done)
  })

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
    if (this.consumer) {
      this.consumer.disconnect(() => {
        done()
      })
    } else {
      done()
    }
  })

})
