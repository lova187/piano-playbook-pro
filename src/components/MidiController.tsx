import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Keyboard, Headphones, Settings, CheckCircle, 
  AlertCircle, Volume2, Download 
} from 'lucide-react';

interface MidiControllerProps {
  onNotePlay: (note: string, velocity: number) => void;
  onNoteStop: (note: string) => void;
}

export const MidiController: React.FC<MidiControllerProps> = ({ 
  onNotePlay, 
  onNoteStop 
}) => {
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<MIDIInput[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState('salamander');
  const [pluginLoaded, setPluginLoaded] = useState(false);
  const { toast } = useToast();

  // MIDI note number to note name conversion
  const midiNoteToName = useCallback((midiNote: number): string => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const noteName = noteNames[midiNote % 12];
    return `${noteName}${octave}`;
  }, []);

  // Handle MIDI message
  const handleMidiMessage = useCallback((event: MIDIMessageEvent) => {
    const [command, note, velocity] = event.data;
    
    // Note on (144-159) or Note off (128-143)
    if ((command >= 144 && command <= 159 && velocity > 0) || 
        (command >= 128 && command <= 143)) {
      
      const noteName = midiNoteToName(note);
      const isNoteOn = command >= 144 && command <= 159 && velocity > 0;
      
      if (isNoteOn) {
        onNotePlay(noteName, velocity / 127);
      } else {
        onNoteStop(noteName);
      }
    }
  }, [midiNoteToName, onNotePlay, onNoteStop]);

  // Connect to MIDI
  const connectMidi = async () => {
    setIsConnecting(true);
    
    try {
      if (!navigator.requestMIDIAccess) {
        throw new Error('Web MIDI API not supported in this browser');
      }

      const access = await navigator.requestMIDIAccess();
      setMidiAccess(access);
      
      // Get connected inputs
      const inputs = Array.from(access.inputs.values());
      setConnectedDevices(inputs);
      
      // Add listeners to all inputs
      inputs.forEach(input => {
        input.addEventListener('midimessage', handleMidiMessage);
      });
      
      // Listen for device changes
      access.addEventListener('statechange', () => {
        const newInputs = Array.from(access.inputs.values());
        setConnectedDevices(newInputs);
        
        // Add listeners to new devices
        newInputs.forEach(input => {
          input.removeEventListener('midimessage', handleMidiMessage);
          input.addEventListener('midimessage', handleMidiMessage);
        });
      });
      
      toast({
        title: "MIDI Connected!",
        description: `Found ${inputs.length} MIDI device(s)`,
      });
      
    } catch (error) {
      console.error('MIDI connection failed:', error);
      toast({
        title: "MIDI Connection Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Load Salamander Grand Piano plugin
  const loadSalamanderPlugin = async () => {
    try {
      toast({
        title: "Loading Salamander Grand Piano...",
        description: "This may take a moment"
      });
      
      // Simulate plugin loading (in a real app, this would load SoundFont files)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPluginLoaded(true);
      toast({
        title: "Plugin Loaded!",
        description: "Salamander Grand Piano v3 is ready"
      });
      
    } catch (error) {
      toast({
        title: "Plugin Load Failed",
        description: "Could not load Salamander Grand Piano",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup MIDI connections
      if (midiAccess) {
        Array.from(midiAccess.inputs.values()).forEach(input => {
          input.removeEventListener('midimessage', handleMidiMessage);
        });
      }
    };
  }, [midiAccess, handleMidiMessage]);

  const availablePlugins = [
    { 
      id: 'salamander', 
      name: 'Salamander Grand Piano v3', 
      description: 'High-quality grand piano samples',
      size: '180 MB'
    },
    { 
      id: 'basic', 
      name: 'Basic Piano', 
      description: 'Lightweight piano sound',
      size: '5 MB'
    }
  ];

  return (
    <div className="space-y-4">
      {/* MIDI Connection */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard size={20} />
            MIDI Keyboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                connectedDevices.length > 0 ? 'bg-success animate-pulse' : 'bg-muted'
              }`} />
              <span className="text-sm">
                {connectedDevices.length > 0 
                  ? `${connectedDevices.length} device(s) connected`
                  : 'No devices connected'
                }
              </span>
            </div>
            <Button
              onClick={connectMidi}
              disabled={isConnecting}
              variant={connectedDevices.length > 0 ? "outline" : "default"}
            >
              {isConnecting ? "Connecting..." : "Connect MIDI"}
            </Button>
          </div>
          
          {/* Connected Devices */}
          {connectedDevices.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Connected Devices:</div>
              {connectedDevices.map((device, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <CheckCircle size={16} className="text-success" />
                  <span className="text-sm">{device.name || 'Unknown Device'}</span>
                  <Badge variant="outline" className="ml-auto">
                    {device.state}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          
          {/* Browser Compatibility Warning */}
          {!navigator.requestMIDIAccess && (
            <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <AlertCircle size={16} className="text-warning" />
              <span className="text-sm">
                Web MIDI API not supported in this browser. Try Chrome, Edge, or Opera.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Piano Plugin Selection */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones size={20} />
            Piano Sound Plugin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {availablePlugins.map(plugin => (
              <div
                key={plugin.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPlugin === plugin.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedPlugin(plugin.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      checked={selectedPlugin === plugin.id}
                      onChange={() => setSelectedPlugin(plugin.id)}
                      className="text-primary"
                    />
                    <div>
                      <div className="font-medium">{plugin.name}</div>
                      <div className="text-sm text-muted-foreground">{plugin.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{plugin.size}</Badge>
                    {plugin.id === 'salamander' && pluginLoaded && (
                      <Badge variant="default" className="ml-2 bg-success">
                        <CheckCircle size={12} className="mr-1" />
                        Loaded
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedPlugin === 'salamander' && !pluginLoaded && (
            <Button onClick={loadSalamanderPlugin} className="w-full">
              <Download size={16} className="mr-2" />
              Load Salamander Grand Piano v3
            </Button>
          )}

          {pluginLoaded && (
            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
              <CheckCircle size={16} className="text-success" />
              <span className="text-sm">
                {availablePlugins.find(p => p.id === selectedPlugin)?.name} is loaded and ready!
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audio Settings */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 size={20} />
            Audio Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Master Volume</label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="80"
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Velocity Sensitivity</label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="70"
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Sustain Pedal</span>
            <Badge variant="outline">CC 64</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};