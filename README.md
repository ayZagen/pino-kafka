<p align="center">
  <img src="assets/logo.png" alt="pino to kafka"/>
</p>

# pino-kafka

This module provides a "transport" for [pino][pino] that simply forwards
messages to kafka.

You should install `pino-kafka` globally for ease of use:

```shell
$ npm install --production -g pino-kafka
### or with yarn
$ yarn global add pino-kafka
```

[pino]: https://www.npmjs.com/package/pino

## Requirements
This library depends on `node-rdkafka`.
Have a look at [node-rdkafka requirements](https://github.com/Blizzard/node-rdkafka#requirements).


## Usage
### CLI
Given an application `foo` that logs via [pino][pino], and a kafka broker listening on `10.10.10.5:9200` you would use `pino-kafka` as:

```bash
$ node foo | pino-kafka -b 10.10.10.5:9200
```

### Programmatic Usage
Initialize `pino-kafka` and pass it to `pino`.
```js
const pino = require('pino')
const pkafka = require('pino-kafka')

const logger = pino({}, pkafka({ brokers: "10.10.10.5:9200"}))
logger.info('hello world')
```
## Options
+ `--brokers` (`-b`): broker list for kafka producer. Comma separated
+ `--defaultTopic` (`-d`): default topic name for kafka.
+ `--timeout` (`-t`): timeout for initial broker connection in milliseconds. Default 10000
+ `--echo` (`-e`): echo the received messages to stdout. Default: false.
+ `--settings`: path to config JSON file. Have a look at [Settings JSON file](#settings-json-file) section for details and examples
+ `--kafka.$config`: any kafka configuration can be passed with prefix `kafka`. Please visit [node-rdkafka configuration](https://github.com/edenhill/librdkafka/blob/v1.3.0/CONFIGURATION.md) for available options.
Note that only producer and global configuration properties will be used.
Have a look at [Kafka Settings](#kafka-settings) section for details and examples


### Settings JSON File

The `--settings` switch can be used to specify a JSON file that contains
a hash of settings for the application. A full settings file is:

```json
{
  "brokers": "10.6.25.11:9092, 10.6.25.12:9092",
  "defaultTopic": "blackbox",
  "kafka": {
    "compression.codec":"none",
    "enable.idempotence": "true",
    "max.in.flight.requests.per.connection": 4,
    "message.send.max.retries": 10000000,
    "acks": "all"
  }
}
```

Note that command line switches take precedence over settings in a settings
file. For example, given the settings file:

```json
{
  "brokers": "my.broker",
  "defaultTopic": "test"
}
```

And the command line:

```bash
$ yes | pino-kafka -s ./settings.json -b 10.10.10.11:9200
```

The connection will be made to address `10.10.10.11:9200` with the default topic `test`.

### Kafka Settings

You can pass `node-rdkafka` producer configuration by prefixing the property with `kafka.` For example:
```bash
$ yes | pino-kafka --kafka.retries=5 --kafka.retry.backoff.ms=500
```

In the Setting JSON File you can use followings:
```json
{
  "kafka": {
    "retries": "5",
    "retry.backoff.ms": "500"
  }
}
```

Following will work also:
```json
{
  "kafka": {
    "retries": "5",
    "retry":{
      "backoff": {
        "ms":  "500"
      }
    }
  }
}
```

## Accessing Internal Kafka Producer
You can access `node-rdkafka` producer from pino stream with `_kafka`.

For example:
```js
const pino = require('pino')
const pkafka = require('pino-kafka')

const pKafkaStream = pkafka({ brokers: "10.10.10.5:9200"})
const logger = pino({}, pKafkaStream)

// From pino-kafka instance
pKafkaStream._kafka.getMetadata({}, (err, data)=> {
    //...
})

// From logger
logger[pino.symbols.streamSym]._kafka.getMetadata({}, (err, data)=> {
    //...
})
```

## Testing
For running tests make sure you installed dependencies with `npm install` or `yarn` and have a running kafka.
More easily, if you have docker and docker-compose installed, you can create one with following.

```bash
$ cd pino-kafka
$ docker-compose up -d
```

Look at [docker-compose file](docker-compose.yml) for more details.

After you all setup, just run test command with following:
```bash
$ npm run test
# or with yarn
$ yarn test
```

> **NOTE**: If you use your own kafka setup, you may need to change test configuration accordingly to your needs(ip, topic etc.)

## License
[MIT](LICENSE)
