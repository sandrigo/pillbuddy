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
  const pollInterval = useRef<number>();
  const realtimeChannel = useRef<any>(null);
  const answerProcessed = useRef<boolean>(false);

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
      timerInterval.current = undefined;
    }
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = undefined;
    }
    if (realtimeChannel.current) {
      realtimeChannel.current.unsubscribe();
      realtimeChannel.current = null;
    }
    sessionId.current = '';
    answerProcessed.current = false;
  }, []);

  // Initialize WebRTC peer connection
  const createPeerConnection = useCallback((role: 'sender' | 'receiver') => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(configuration);
    const collectedCandidates: RTCIceCandidateInit[] = [];

    // Collect all ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        collectedCandidates.push(event.candidate.toJSON());
      }
    };

    // When gathering is complete, save all candidates at once
    pc.onicegatheringstatechange = async () => {
      if (pc.iceGatheringState === 'complete' && sessionId.current && collectedCandidates.length > 0) {
        console.log(`${role}: ICE gathering complete, saving ${collectedCandidates.length} candidates`);
        try {
          await (supabase as any)
            .from('sync_sessions')
            .update({
              ice_candidates: collectedCandidates
            })
            .eq('id', sessionId.current);
          console.log(`${role}: Candidates saved successfully`);
        } catch (err) {
          console.error('Error saving ICE candidates:', err);
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
      // Wait for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      setStatus('generating-code');
      setError('');
      setProgress(0);

      const code = generatePairingCode();
      setPairingCode(code);

      // Create peer connection
      peerConnection.current = createPeerConnection('sender');

      // Create data channel
      dataChannel.current = peerConnection.current.createDataChannel('medications', {
        ordered: true,
      });

      dataChannel.current.onopen = async () => {
        console.log('Data channel opened');
        setStatus('transferring');
        
        // Send medications data
        const dataStr = JSON.stringify(medications);
        dataChannel.current?.send(dataStr);
        
        setProgress(100);
        
        // Delete session after successful transfer
        try {
          if (sessionId.current) {
            await (supabase as any)
              .from('sync_sessions')
              .delete()
              .eq('id', sessionId.current);
            console.log('sender: Session deleted after transfer');
          }
        } catch (err) {
          console.error('Error deleting session:', err);
        }
        
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
      const currentSessionId = session.id;
      answerProcessed.current = false; // Reset for new session
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

      // Listen for answer via Realtime
      realtimeChannel.current = supabase
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
            // Only proceed if this is still the current session
            if (sessionId.current !== currentSessionId) {
              return;
            }
            
            const updatedSession = payload.new as SyncSession;
            
            if (updatedSession.answer && peerConnection.current && 
                !peerConnection.current.remoteDescription &&
                peerConnection.current.signalingState === 'have-local-offer' &&
                !answerProcessed.current) {
              
              answerProcessed.current = true; // Mark as processed IMMEDIATELY
              console.log('sender: Setting remote answer from realtime');
              setStatus('connecting');
              
              try {
                await peerConnection.current.setRemoteDescription(
                  new RTCSessionDescription(updatedSession.answer)
                );

                // Add ICE candidates from receiver (if any already available)
                if (updatedSession.ice_candidates) {
                  for (const candidate of updatedSession.ice_candidates) {
                    await peerConnection.current.addIceCandidate(
                      new RTCIceCandidate(candidate)
                    );
                  }
                }
              } catch (err: any) {
                console.error('Error setting remote description:', err);
                answerProcessed.current = false; // Reset on error
              }
              
              // DON'T stop polling - we still need to get receiver's ICE candidates!
            }
          }
        )
        .subscribe();

      // Fallback: Poll for updates every 2 seconds (in case Realtime isn't enabled)
      let lastReceiverCandidateCount = 0;
      pollInterval.current = window.setInterval(async () => {
        // Only proceed if this is still the current session
        if (sessionId.current !== currentSessionId) {
          if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = undefined;
          }
          return;
        }
        
        try {
          const { data: updatedSession } = await (supabase as any)
            .from('sync_sessions')
            .select('*')
            .eq('id', currentSessionId)
            .single();

          // Check for answer
          if (updatedSession?.answer && peerConnection.current && 
              !peerConnection.current.remoteDescription &&
              peerConnection.current.signalingState === 'have-local-offer' &&
              !answerProcessed.current) {
            
            answerProcessed.current = true; // Mark as processed IMMEDIATELY
            console.log('sender: Setting remote answer from polling');
            setStatus('connecting');
            
            try {
              await peerConnection.current.setRemoteDescription(
                new RTCSessionDescription(updatedSession.answer)
              );
            } catch (err: any) {
              console.error('Error setting remote description:', err);
              answerProcessed.current = false; // Reset on error
            }
          }
          
          // Check for new ICE candidates from receiver
          if (updatedSession?.ice_candidates && updatedSession.ice_candidates.length > lastReceiverCandidateCount) {
            const newCandidates = updatedSession.ice_candidates.slice(lastReceiverCandidateCount);
            console.log(`sender: Adding ${newCandidates.length} new ICE candidates from receiver`);
            for (const candidate of newCandidates) {
              try {
                if (peerConnection.current) {
                  await peerConnection.current.addIceCandidate(
                    new RTCIceCandidate(candidate)
                  );
                }
              } catch (err) {
                console.error('Error adding ICE candidate:', err);
              }
            }
            lastReceiverCandidateCount = updatedSession.ice_candidates.length;
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2000);
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
      // Wait for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 200));
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
      peerConnection.current = createPeerConnection('receiver');

      // Handle incoming data channel
      peerConnection.current.ondatachannel = (event) => {
        dataChannel.current = event.channel;
        
        dataChannel.current.onmessage = async (e) => {
          try {
            setStatus('transferring');
            const medications = JSON.parse(e.data);
            setProgress(100);
            
            // Delete session after successful transfer
            try {
              if (sessionId.current) {
                await (supabase as any)
                  .from('sync_sessions')
                  .delete()
                  .eq('id', sessionId.current);
                console.log('receiver: Session deleted after transfer');
              }
            } catch (err) {
              console.error('Error deleting session:', err);
            }
            
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

      // Listen for new ICE candidates (not used with complete gathering, but kept for compatibility)
      realtimeChannel.current = supabase
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

      // Fallback: Poll for sender's ICE candidates every 2 seconds
      let lastCandidateCount = session.ice_candidates?.length || 0;
      pollInterval.current = window.setInterval(async () => {
        try {
          const { data: updatedSession } = await (supabase as any)
            .from('sync_sessions')
            .select('ice_candidates')
            .eq('id', session.id)
            .single();

          if (updatedSession?.ice_candidates && updatedSession.ice_candidates.length > lastCandidateCount) {
            const newCandidates = updatedSession.ice_candidates.slice(lastCandidateCount);
            console.log(`receiver: Adding ${newCandidates.length} new ICE candidates from sender`);
            for (const candidate of newCandidates) {
              try {
                if (peerConnection.current) {
                  await peerConnection.current.addIceCandidate(
                    new RTCIceCandidate(candidate)
                  );
                }
              } catch (err) {
                console.error('Error adding ICE candidate:', err);
              }
            }
            lastCandidateCount = updatedSession.ice_candidates.length;
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2000);
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
