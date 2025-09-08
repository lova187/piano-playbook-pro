// Web MIDI API type definitions
interface Navigator {
  requestMIDIAccess(options?: MIDIOptions): Promise<MIDIAccess>;
}

interface MIDIOptions {
  sysex?: boolean;
  software?: boolean;
}

interface MIDIAccess extends EventTarget {
  readonly inputs: Map<string, MIDIInput>;
  readonly outputs: Map<string, MIDIOutput>;
  readonly sysexEnabled: boolean;
  onstatechange: ((event: MIDIConnectionEvent) => void) | null;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

interface MIDIPort extends EventTarget {
  readonly id: string;
  readonly manufacturer?: string;
  readonly name?: string;
  readonly type: MIDIPortType;
  readonly version?: string;
  readonly state: MIDIPortDeviceState;
  readonly connection: MIDIPortConnectionState;
  onstatechange: ((event: MIDIConnectionEvent) => void) | null;
  open(): Promise<MIDIPort>;
  close(): Promise<MIDIPort>;
}

interface MIDIInput extends MIDIPort {
  onmidimessage: ((event: MIDIMessageEvent) => void) | null;
  addEventListener(type: 'midimessage', listener: (event: MIDIMessageEvent) => void): void;
  removeEventListener(type: 'midimessage', listener: (event: MIDIMessageEvent) => void): void;
}

interface MIDIOutput extends MIDIPort {
  send(data: number[], timestamp?: number): void;
  clear(): void;
}

interface MIDIMessageEvent extends Event {
  readonly receivedTime: number;
  readonly data: Uint8Array;
}

interface MIDIConnectionEvent extends Event {
  readonly port: MIDIPort;
}

type MIDIPortType = "input" | "output";
type MIDIPortDeviceState = "disconnected" | "connected";
type MIDIPortConnectionState = "open" | "closed" | "pending";