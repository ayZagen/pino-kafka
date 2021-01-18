#! /usr/bin/env node
'use strict'

const minimist = require('minimist')
const pump = require('pump')
const fs = require('fs')
const path = require('path')
const pinoKafka = require('./pkafka')

function keysToDotNotation(obj, current, final) {
  if(!final) {
    final = {}
  }
  for (var key in obj) {
    var value = obj[key];
    var newKey = (current ? current + "." + key : key);  // joined key with dot
    if (value && typeof value === "object") {
      keysToDotNotation(value, newKey, final);  // it's a nested object, so do it again
    } else {
      final[newKey] = value;  // it's not an object, so set the property
    }
  }
  return final
}

function start (opts) {
  if(opts.kafka){
    if(typeof opts.kafka !== 'object'){
      throw new Error('Kafka options must be an object')
    }
    opts.kafka = keysToDotNotation(opts.kafka)
  }
  if (opts.help) {
    console.log(fs.readFileSync(path.join(__dirname, './help.txt'), 'utf8'))
    return
  }

  if (opts.version) {
    console.log('pino-kafka', require('./package.json').version)
    return
  }


  if (opts.settings) {
    try {
      const loadedSettings = require(path.resolve(opts.settings))
      const settings = Object.assign(loadedSettings, argv)
      opts = Object.assign(opts, settings)
    } catch (e) {
      console.error('`settings` parameter specified but could not load file: %s', e.message)
      process.exit(1)
    }
  }


  pump(process.stdin, pinoKafka(opts))
}

start(minimist(process.argv.slice(2), {
  alias: {
    version: 'v',
    help: 'h',
    brokers: 'b',
    defaultTopic: 'd',
    settings: 's',
    echo: 'e',
    timeout: 't'
  },
  default: {
    kafka: {
      'compression.codec':'none',
      'enable.idempotence': 'true',
      'max.in.flight.requests.per.connection': 4,
      'message.send.max.retries': 10000000,
      'acks': 'all'
    },
    echo: false,
    timeout: 10000,
    brokers: '10.6.25.11:9092, 10.6.25.12:9092',
    defaultTopic: 'blackbox'
  }
}))
