import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const APP_ID = 'agora_api';
const TOKEN = null;

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [inputValue, setInputValue] = useState('');
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const client = useRef(null);
  const localTracks = useRef([]);
  const remoteUsers = useRef({});

  useEffect(() => {
    client.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

    client.current.on('user-published', async (user, mediaType) => {
      await client.current.subscribe(user, mediaType);
      if (mediaType === 'video') {
        const remoteTrack = user.videoTrack;
        remoteUsers.current[user.uid] = remoteTrack;
        remoteTrack.play(remoteVideoRef.current);
      }
      if (mediaType === 'audio') {
        user.audioTrack.play();
      }
    });

    client.current.on('user-unpublished', (user) => {
      delete remoteUsers.current[user.uid];
    });
  }, []);

  const joinChannel = async () => {
    if (!inputValue.trim()) {
      alert('Please enter a room name');
      return;
    }

    setRoomName(inputValue.trim());

    await client.current.join(APP_ID, inputValue.trim(), TOKEN, null);

    localTracks.current = await AgoraRTC.createMicrophoneAndCameraTracks();
    localTracks.current[1].play(localVideoRef.current);
    await client.current.publish(localTracks.current);

    setJoined(true);
  };

  const leaveChannel = async () => {
    localTracks.current.forEach(track => {
      track.stop();
      track.close();
    });

    await client.current.leave();
    setJoined(false);
    setRoomName('');
    setInputValue('');
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h2>Agora Video Call</h2>

      {!joined && (
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Enter room name"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{ padding: '0.5rem', fontSize: '1rem', width: '200px' }}
          />
          <button
            onClick={joinChannel}
            style={{ marginLeft: '1rem', padding: '0.5rem 1rem', fontSize: '1rem' }}
          >
            Join Call
          </button>
        </div>
      )}

      {joined && (
        <div>
          <p><strong>Joined Room:</strong> {roomName}</p>
          <button
            onClick={leaveChannel}
            style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}
          >
            Leave Call
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <div>
          <h3>👤 You</h3>
          <div
            ref={localVideoRef}
            style={{ width: '320px', height: '240px', background: '#ccc' }}
          />
        </div>

        <div>
          <h3>👥 Remote User</h3>
          <div
            ref={remoteVideoRef}
            style={{ width: '320px', height: '240px', background: '#eee' }}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
