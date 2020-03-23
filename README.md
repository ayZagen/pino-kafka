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

## Usage

Given an application `foo` that logs via [pino][pino], and a kafka broker listening on `10.10.10.5` you would use `pino-kafka` as:

```bash
$ node foo | pino-kafka -b 10.10.10.5
```

## Options

+ `--reconnect` (`-r`): enable reconnecting to kafka broker. Default: off
+ `--reconnectTries <n>` (`-t <n>`): set number (`<n>`) of reconnect attempts
  before giving up. Default: infinite
+ `--echo` (`-e`): echo the received messages to stdout. Default: enabled.
+ `--no-echo` (`-ne`): disable echoing received messages to stdout.

### Settings JSON File

The `--settings` switch can be used to specify a JSON file that contains
a hash of settings for the the application. A full settings file is:

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
$ yes | pino-socket -s ./settings.json -b 10.10.10.11
```

The connection will be made to address `10.10.10.11` with the default topic port `test`.
