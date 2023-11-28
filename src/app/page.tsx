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
      setSocket(newSocket);
      newSocket.emit('setUserInfo', { id: userInfo.id, name: userInfo.name });
    });

    newSocket.on('matchmakingSuccess', ({ room, players, timer }: any) => {
      setRoomId(room);
      setPlayers(players);
      setTimer(timer);

      return () => clearInterval(timer);
    });

    newSocket.on('playerLeft', ({ room, players }: any) => {
      setPlayers(players);
    });

    newSocket.on('timerZero', () => {
      setTimer(0);
      startQuestionRound();
    });

    newSocket.on('newQuestion', ({ question }: any) => {
      setCurrentQuestion(question);
      setAnswer('');
    });

    newSocket.on('questionTimer', ({ timer }: any) => {
      setQuestionTimer(timer);
    });

    newSocket.on('questionTimerZero', () => {
      setQuestionTimer(0);
      handleAnswerSubmission();
    });

    newSocket.on('updateScores', ({ players }: any) => {
      setScores(players);
    });

    newSocket.on('clearScores', () => {
      setScores([]);
    });

    newSocket.on('displayFinalScores', ({ players }: any) => {
      setFinalScores(players);
      setShowFinalScores(true);
    });

    newSocket.on('timerUpdate', ({ timer }: any) => {
      setTimer(timer);
    });

    newSocket.on('displayScores', ({ players }: any) => {
      setScores(players);
    });

    newSocket.on('answerResponse', ({ response }: any) => {
      console.log(`Jawaban Anda: ${response}`);
    });

    newSocket.on('scoresDisplayed', () => {
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
            {timer !== null && <p>Time remaining: {timer} seconds</p>}
            {currentQuestion ? (
              <div>
                <h3>Question:</h3>
                <p>{currentQuestion}</p>
                {questionTimer !== null && <p>Time remaining: {questionTimer} seconds</p>}
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

