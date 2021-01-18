# pino-kafka

This module provides a "transport" for [pino][pino] that simply forwards
messages to kafka.

You should install `pino-kafka` globally for ease of use:

```bash
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
Given an application `foo` that logs via [pino][pino], and a kafka broker listening on `10.10.10.5` you would use `pino-kafka` as:

```bash
$ node foo | pino-kafka -b 10.10.10.5
```

### Programmatic Usage
Initialize `pino-kafka` and pass it to `pino`.
```js
const pino = require('pino')
const pkafka = require('pino-kafka')

const logger = pino({}, pkafka({ brokers: "10.10.10.5"}))
```
## Options
+ `--brokers` (`-b`): broker list for kafka producer. Comma seperated hosts
+ `--defaultTopic` (`-d`): default topic name for kafka. If the log message contains a topic field it will be used instead.
+ `--reconnect` (`-r`): enable reconnecting to kafka broker. Default: off
+ `--reconnectTries <n>` (`-t <n>`): set number (`<n>`) of reconnect attempts
  before giving up. Default: infinite
+ `--echo` (`-e`): echo the received messages to stdout. Default: enabled.
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
$ yes | pino-kafka -s ./settings.json -b 10.10.10.11
```

The connection will be made to address `10.10.10.11` with the default topic port `test`.

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
