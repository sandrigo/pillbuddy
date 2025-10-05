import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Medication } from '@/types/medication';
import { generatePairingCode } from '@/utils/pairingCode';

type SyncStatus = 'idle' | 'generating-code' | 'waiting' | 'connecting' | 'connected' | 'transferring' | 'completed' | 'error';

interface SyncSession {
  id: string;
  pairing_code: string;
  offer: RTCSessionDescriptionInit | null;
  answer: RTCSessionDescriptionInit | null;
  ice_candidates: RTCIceCandidateInit[];
  status: string;
  created_at: string;
  expires_at: string;
}

export const useWebRTCSync = () => {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const sessionId = useRef<string>('');
  const timerInterval = useRef<number>();

  // Cleanup function
  const cleanup = useCallback(() => {
    if (dataChannel.current) {
      dataChannel.current.close();
      dataChannel.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    sessionId.current = '';
  }, []);

  // Initialize WebRTC peer connection
  const createPeerConnection = useCallback(() => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = async (event) => {
      if (event.candidate && sessionId.current) {
        try {
          const { data: session } = await (supabase as any)
            .from('sync_sessions')
            .select('ice_candidates')
            .eq('id', sessionId.current)
            .single();

          if (session) {
            const candidates = session.ice_candidates || [];
            await (supabase as any)
              .from('sync_sessions')
              .update({
                ice_candidates: [...candidates, event.candidate.toJSON()]
              })
              .eq('id', sessionId.current);
          }
        } catch (err) {
          console.error('Error saving ICE candidate:', err);
        }
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setStatus('connected');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setError('Verbindung fehlgeschlagen');
        setStatus('error');
      }
    };

    return pc;
  }, []);

  // Start as sender (share data)
  const startSender = useCallback(async (medications: Medication[]) => {
    try {
      cleanup();
      setStatus('generating-code');
      setError('');
      setProgress(0);

      const code = generatePairingCode();
      setPairingCode(code);

      // Create peer connection
      peerConnection.current = createPeerConnection();

      // Create data channel
      dataChannel.current = peerConnection.current.createDataChannel('medications', {
        ordered: true,
      });

      dataChannel.current.onopen = () => {
        console.log('Data channel opened');
        setStatus('transferring');
        
        // Send medications data
        const dataStr = JSON.stringify(medications);
        dataChannel.current?.send(dataStr);
        
        setProgress(100);
        setTimeout(() => {
          setStatus('completed');
          cleanup();
        }, 1000);
      };

      dataChannel.current.onerror = (error) => {
        console.error('Data channel error:', error);
        setError('Datenübertragung fehlgeschlagen');
        setStatus('error');
      };

      // Create offer
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      // Save to Supabase
      const { data: session, error: dbError } = await (supabase as any)
        .from('sync_sessions')
        .insert({
          pairing_code: code,
          offer: offer,
          status: 'waiting',
        })
        .select()
        .single();

      if (dbError || !session) {
        throw new Error('Fehler beim Erstellen der Session');
      }

      sessionId.current = session.id;
      setStatus('waiting');

      // Start countdown timer
      const expiresAt = new Date(session.expires_at).getTime();
      timerInterval.current = window.setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          clearInterval(timerInterval.current);
          setError('Code abgelaufen');
          setStatus('error');
          cleanup();
        }
      }, 1000);

      // Listen for answer
      const channel = supabase
        .channel(`sync-${session.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'sync_sessions',
            filter: `id=eq.${session.id}`,
          },
          async (payload) => {
            const updatedSession = payload.new as SyncSession;
            
            if (updatedSession.answer && peerConnection.current) {
              setStatus('connecting');
              await peerConnection.current.setRemoteDescription(
                new RTCSessionDescription(updatedSession.answer)
              );

              // Add ICE candidates
              if (updatedSession.ice_candidates) {
                for (const candidate of updatedSession.ice_candidates) {
                  await peerConnection.current.addIceCandidate(
                    new RTCIceCandidate(candidate)
                  );
                }
              }
            }
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    } catch (err) {
      console.error('Error starting sender:', err);
      setError('Fehler beim Starten der Übertragung');
      setStatus('error');
      cleanup();
    }
  }, [cleanup, createPeerConnection]);

  // Start as receiver (receive data)
  const startReceiver = useCallback(async (
    code: string,
    onDataReceived: (medications: Medication[]) => void
  ) => {
    try {
      cleanup();
      setStatus('connecting');
      setError('');
      setProgress(0);

      // Find session by pairing code
      const { data: session, error: dbError } = await (supabase as any)
        .from('sync_sessions')
        .select('*')
        .eq('pairing_code', code.toUpperCase())
        .single();

      if (dbError || !session) {
        throw new Error('Code nicht gefunden oder abgelaufen');
      }

      sessionId.current = session.id;

      // Create peer connection
      peerConnection.current = createPeerConnection();

      // Handle incoming data channel
      peerConnection.current.ondatachannel = (event) => {
        dataChannel.current = event.channel;
        
        dataChannel.current.onmessage = (e) => {
          try {
            setStatus('transferring');
            const medications = JSON.parse(e.data);
            setProgress(100);
            
            setTimeout(() => {
              onDataReceived(medications);
              setStatus('completed');
              cleanup();
            }, 500);
          } catch (err) {
            console.error('Error parsing data:', err);
            setError('Fehler beim Empfangen der Daten');
            setStatus('error');
          }
        };

        dataChannel.current.onerror = (error) => {
          console.error('Data channel error:', error);
          setError('Datenübertragung fehlgeschlagen');
          setStatus('error');
        };
      };

      // Set remote description (offer)
      if (session.offer) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(session.offer)
        );
      }

      // Create answer
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      // Save answer to Supabase
      await (supabase as any)
        .from('sync_sessions')
        .update({
          answer: answer,
          status: 'connected',
        })
        .eq('id', session.id);

      // Add ICE candidates from sender
      if (session.ice_candidates) {
        for (const candidate of session.ice_candidates) {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        }
      }

      // Listen for new ICE candidates
      const channel = supabase
        .channel(`sync-${session.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'sync_sessions',
            filter: `id=eq.${session.id}`,
          },
          async (payload) => {
            const updatedSession = payload.new as SyncSession;
            
            if (updatedSession.ice_candidates && peerConnection.current) {
              for (const candidate of updatedSession.ice_candidates) {
                try {
                  await peerConnection.current.addIceCandidate(
                    new RTCIceCandidate(candidate)
                  );
                } catch (err) {
                  console.error('Error adding ICE candidate:', err);
                }
              }
            }
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    } catch (err: any) {
      console.error('Error starting receiver:', err);
      setError(err.message || 'Fehler beim Verbinden');
      setStatus('error');
      cleanup();
    }
  }, [cleanup, createPeerConnection]);

  // Cancel current operation
  const cancel = useCallback(() => {
    cleanup();
    setStatus('idle');
    setPairingCode('');
    setError('');
    setProgress(0);
    setTimeRemaining(0);
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    status,
    pairingCode,
    error,
    progress,
    timeRemaining,
    startSender,
    startReceiver,
    cancel,
  };
};
