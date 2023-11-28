"use client"
import React, { useState, useEffect } from 'react';
import socketIOClient from 'socket.io-client';

interface Player {
  socketId: string;
  userInfo: {
    id: string | null;
    name: string | null;
  };
  score?: number;
}

const ENDPOINT = 'http://localhost:3000';

const Matchmaking: React.FC = () => {
  const [socket, setSocket] = useState<any>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [userInfo, setUserInfo] = useState({ id: null, name: null });
  const [timer, setTimer] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [questionTimer, setQuestionTimer] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');
  const [scores, setScores] = useState<Player[]>([]);
  const [finalScores, setFinalScores] = useState<Player[]>([]);
  const [showFinalScores, setShowFinalScores] = useState(false);
  const [gameInProgress, setGameInProgress] = useState(true);

  useEffect(() => {
    const newSocket: any = socketIOClient(ENDPOINT);

    newSocket.on('connect', () => {
      console.log(`Connected with socket id: ${newSocket.id}`);
      setSocket(newSocket);

      newSocket.emit('setUserInfo', { id: userInfo.id, name: userInfo.name });
    });

    newSocket.on('matchmakingSuccess', ({ room, players, timer }: any) => {
      console.log(`Matchmaking success! Room ID: ${room}`);
      setRoomId(room);
      setPlayers(players);
      setTimer(timer);

      // Clear interval when the component unmounts or the room changes
      return () => clearInterval(timer);
    });

    newSocket.on('playerLeft', ({ room, players }: any) => {
      console.log(`Player left! Room ID: ${room}`);
      setPlayers(players);
    });

    newSocket.on('timerZero', () => {
      console.log('Timer reached 0!');
      setTimer(0);
      // Start a new question round
      startQuestionRound();
    });

    newSocket.on('newQuestion', ({ question }: any) => {
      console.log(`New question: ${question}`);
      setCurrentQuestion(question);
      setAnswer(''); // Clear the answer field for the new question
    });

    newSocket.on('questionTimer', ({ timer }: any) => {
      setQuestionTimer(timer);
    });

    newSocket.on('questionTimerZero', () => {
      console.log('Question timer reached 0!');
      setQuestionTimer(0);
      handleAnswerSubmission();
    });

    newSocket.on('updateScores', ({ players }: any) => {
      console.log('Updating scores:', players);
      setScores(players);
    });

    newSocket.on('clearScores', () => {
      console.log('Clearing scores');
      setScores([]);
    });

    newSocket.on('displayFinalScores', ({ players }: any) => {
      console.log('Displaying final scores:', players);
      setFinalScores(players);
      setShowFinalScores(true);
    });

    newSocket.on('timerUpdate', ({ timer }: any) => {
      setTimer(timer);
    });

    newSocket.on('displayScores', ({ players }: any) => {
      console.log('Displaying scores:', players);
      setScores(players);
    });

    newSocket.on('answerResponse', ({ response }: any) => {
      console.log(`Jawaban Anda: ${response}`);
      // Implement logic to display the response to the user (e.g., show a message on the UI)
    });

    newSocket.on('scoresDisplayed', () => {
      // Wait for 5 seconds and then start a new question round
      setTimeout(() => {
        startQuestionRound();
      }, 5000);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [userInfo, showFinalScores]);

  const handleMatchmaking = () => {
    if (socket && roomId && currentQuestion) {
      handleAnswerSubmission();
    } else {
      socket.emit('matchmaking');
    }
  };

  const startQuestionRound = () => {
    setCurrentQuestion(null);
    setQuestionTimer(null);
    console.log('Starting question round...');
    setShowFinalScores(false);
  };



  const handleAnswerSubmission = () => {
    if (socket && roomId && currentQuestion) {
      socket.emit('answer', { room: roomId, answer, userId: userInfo.id });
    }
  };

  

  const handleReturnToMatchmaking = () => {
    setRoomId(null);
    setPlayers([]);
    setTimer(null);
    setCurrentQuestion(null);
    setQuestionTimer(null);
    setAnswer('');
    setScores([]);
    setFinalScores([]);
    setShowFinalScores(false);
    setGameInProgress(true);
    handleMatchmaking();
  };




  return (
    <div>
      <h1>Matchmaking</h1>
      {roomId ? (
      <div>

        {showFinalScores ? (
        <div>
          <h2>Final Scores:</h2>
          <ul>
            {finalScores.map((player) => (
              <li key={player.socketId}>
                Player {player.userInfo.name} (ID: {player.userInfo.id}) - Final Score: {player.score || 0}
              </li>
            ))}
          </ul>
          <h2>Winners:</h2>
          <ol>
            {finalScores
              .sort((a, b) => (a.score || 0) < (b.score || 0) ? 1 : -1)
              .slice(0, 3)
              .map((player, index) => (
                <li key={player.socketId}>
                  {index + 1}. Player {player.userInfo.name} (ID: {player.userInfo.id}) - Score: {player.score || 0}
                </li>
              ))}
          </ol>
          <button onClick={handleReturnToMatchmaking}>Return to Matchmaking</button>
        </div>
      ) : (
          <div>
            <h2>Room ID: {roomId}</h2>
            {timer !== null ? <p>Time remaining: {timer} seconds</p> : null}
            {currentQuestion ? (
              <div>
                <h3>Question:</h3>
                <p>{currentQuestion}</p>
                {questionTimer !== null ? <p>Time remaining: {questionTimer} seconds</p> : null}
                <label>
                  Your Answer:
                  <input
                    type="text"
                    value={answer}
                    onChange={(e: any) => setAnswer(e.target.value)}
                  />
                </label>
                <button onClick={handleMatchmaking}>Submit Answer</button>
              </div>
            ) : (
              <div>
                <h3>Players:</h3>
                <ul>
                  {players.map((player) => (
                    <li key={player.socketId}>
                      Player {player.userInfo.name} (ID: {player.userInfo.id}) - Score: {player.score || 0}
                    </li>
                  ))}
                </ul>
                {scores.length > 0 && (
                  <div>
                    <h3>Scores:</h3>
                    <ul>
                      {scores.map((player) => (
                        <li key={player.socketId}>
                          Player {player.userInfo.name} (ID: {player.userInfo.id}) - Score: {player.score || 0}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          )}
        </div>
        
    ) : (
        <div>
          <label>
            User ID:
            <input
              type="text"
              value={userInfo.id || ''}
              onChange={(e: any) => setUserInfo({ ...userInfo, id: e.target.value })}
            />
          </label>
          <label>
            User Name:
            <input
              type="text"
              value={userInfo.name || ''}
              onChange={(e: any) => setUserInfo({ ...userInfo, name: e.target.value })}
            />
          </label>
          <button onClick={handleMatchmaking}>Join Matchmaking</button>
        </div>
      )}
    </div>
  );
};

export default Matchmaking;

