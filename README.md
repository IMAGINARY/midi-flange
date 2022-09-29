# midi-flange

`midi-flange` connects MIDI input and output ports and plays MIDI events from
MIDI files to MIDI output ports.

This tiny tool can be quite handy to for testing anything that can consume MIDI
events such as synthesizers.

## Usage

```
npx @imaginary-maths/midi-flange
midi-flange [options]

Options:
      --version       Show version number                              [boolean]
  -i, --input         MIDI input port(s) to receive MIDI events from. The
                      argument can be the port's name, index or a /regex/ to
                      match the port name against          [array] [default: []]
  -o, --output        MIDI output port(s) to send MIDI events to. The argument
                      can be the port's name, index or a /regex/ to match the
                      port name against                    [array] [default: []]
      --all-inputs    Receive MIDI events from all known MIDI inputs
                                                      [boolean] [default: false]
      --all-outputs   Send MIDI events to all known MIDI outputs
                                                      [boolean] [default: false]
      --list-inputs   List MIDI inputs and exit       [boolean] [default: false]
      --list-outputs  List MIDI outputs and exit      [boolean] [default: false]
  -f, --file          Play MIDI file(s) to output(s). If multiple files are
                      provided, they are played in parallel[array] [default: []]
  -l, --loop          Loop MIDI files instead of exiting after reaching the end
                      of the files                    [boolean] [default: false]
  -c, --continue      Continue running after all MIDI files have been played to
                      the end                         [boolean] [default: false]
      --help          Show help                                        [boolean]
```

## Credits

Created by [Christian Stussak](mailto:christian.stussak@imaginary.org) for
IMAGINARY gGmbH.

## License

Copyright 2022 IMAGINARY gGmbH

Licensed under the MIT license (see the [`LICENSE`](./LICENSE) file).
