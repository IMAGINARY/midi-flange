#!/usr/bin/env node

import Jzz from 'jzz';
import JzzMidiSmf from 'jzz-midi-smf';
import { readFile } from 'fs/promises';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

async function main() {
  JzzMidiSmf(Jzz);

  const jzz = Jzz();
  const jzzInfo = jzz.info();
  const allInputPortNames = jzzInfo.inputs.map(({ name }) => name);
  const allInputPortIds = jzzInfo.inputs.map((_, i) => i);
  const allOutputPortNames = jzzInfo.outputs.map(({ name }) => name);
  const allOutputPortIds = jzzInfo.outputs.map((_, i) => i);

  function findPort(portType, ports, arg) {
    const trimmed = arg.trim();
    const numberRegExp = /^[1-9][0-9]+$/;
    const regexRegExp = /^\/(.*)\/$/;
    const isNumber = numberRegExp.test(trimmed);
    const isRegExp = regexRegExp.test(trimmed);
    if (isNumber) {
      const index = Number.parseInt(trimmed);
      if (typeof ports[index] !== 'undefined') return index;
      else throw new Error(`There is no ${portType} port with index ${index}.`);
    } else if (isRegExp) {
      const regex = new RegExp(trimmed.match(regexRegExp)[1]);
      const index = ports.findIndex((port) => regex.test(port.name));
      if (index >= 0) {
        return index;
      } else {
        throw new Error(
          `There is no ${portType} port with a name matching the regex ${regex.toString()}.`,
        );
      }
    } else {
      const index = ports.findIndex((port) => port.name === arg);
      if (index >= 0) {
        return index;
      } else {
        throw new Error(`There is no ${portType} port with name "${arg}".`);
      }
    }
  }

  const binHiddenArgv = hideBin(process.argv);
  console.log(binHiddenArgv);
  const argv = yargs(binHiddenArgv)
    .scriptName('midi-flange')
    .usage('$0 [options]')
    .option('i', {
      alias: 'input',
      type: 'array',
      default: [],
      requiresArg: true,
      coerce: (a) => a.map((e) => findPort('input', jzzInfo.inputs, e)),
      describe:
        "MIDI input port(s) to receive MIDI events from. The argument can be the port's name, index or a /regex/ to match the port name against",
    })
    .option('o', {
      alias: 'output',
      type: 'array',
      default: [],
      requiresArg: true,
      coerce: (a) => a.map((e) => findPort('output', jzzInfo.outputs, e)),
      describe:
        "MIDI output port(s) to send MIDI events to. The argument can be the port's name, index or a /regex/ to match the port name against",
    })
    .option('all-inputs', {
      type: 'boolean',
      describe: 'Receive MIDI events from all known MIDI inputs',
    })
    .option('all-outputs', {
      type: 'boolean',
      describe: 'Send MIDI events to all known MIDI outputs',
    })
    .option('list-inputs', {
      type: 'boolean',
      describe: 'List MIDI inputs and exit',
    })
    .option('list-outputs', {
      type: 'boolean',
      describe: 'List MIDI outputs and exit',
    })
    .option('f', {
      alias: 'file',
      type: 'array',
      default: [],
      requiresArg: true,
      describe:
        'Play MIDI file(s) to output(s). If multiple files are provided, they are played in parallel',
    })
    .option('l', {
      alias: 'loop',
      type: 'boolean',
      default: false,
      describe:
        'Loop MIDI files instead of exiting after reaching the end of the files',
    })
    .option('c', {
      alias: 'continue',
      type: 'boolean',
      default: false,
      describe:
        'Continue running after all MIDI files have been played to the end',
    })
    .conflicts('list-outputs', 'list-inputs')
    .conflicts('i', 'all-inputs')
    .conflicts('o', 'all-outputs')
    .help()
    .check((argv) => {
      const hasInputs = argv.input.length > 0 || argv['all-inputs'];
      const hasFiles = argv.file.length > 0;
      const hasOutputs = argv.output.length > 0 || argv['all-outputs'];
      if (!hasInputs && !hasFiles)
        throw new Error('Specify at least one input port or file!');
      if (!hasOutputs) throw new Error('Specify at least one output port!');
      return true;
    }).argv;

  if (argv['list-inputs']) {
    allInputPortNames.forEach((p) => console.log(p));
    process.exit(0);
  }

  if (argv['list-outputs']) {
    allOutputPortNames.forEach((p) => console.log(p));
    process.exit(0);
  }

  const inputPortIds = argv['all-inputs'] ? allInputPortIds : argv.input;
  const outputPortIds = argv['all-outputs'] ? allOutputPortIds : argv.output;
  const inPorts = inputPortIds.map((p) => jzz.openMidiIn(p));
  const outPorts = outputPortIds.map((p) => jzz.openMidiOut(p));
  const fileContents = await Promise.all(
    argv.file.map((filename) => readFile(filename, 'binary')),
  );
  const players = fileContents.map((data) => new Jzz.MIDI.SMF(data).player());
  players.forEach((player) => player.loop(argv.loop));
  const inPortsAndPlayers = [...inPorts, ...players];

  let intervalId;
  if (inPorts.length * outPorts.length > 0 || argv['continue']) {
    const dayInMs = 24 * 60 * 60 * 1000;
    intervalId = setInterval(() => {}, dayInMs);
  } else {
    intervalId = 0;
  }

  let handleExitCalled = false;
  function handleExit() {
    if (!handleExitCalled) {
      handleExitCalled = true;
      clearInterval(intervalId);
      players.forEach((p) => p.stop());
      jzz.close();
    }
  }

  const eventNames = ['beforeExit', 'exit', 'SIGINT', 'SIGQUIT', 'SIGTERM'];
  eventNames.forEach((s) => process.on(s, handleExit));

  for (let i of inPortsAndPlayers) {
    for (let o of outPorts) {
      i.connect(o);
    }
  }

  players.forEach((player) => player.play());
}

main().then();
