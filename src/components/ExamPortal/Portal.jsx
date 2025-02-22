import React, { useState, useEffect, useRef } from 'react';
import { io } from "socket.io-client";
import { X } from 'lucide-react';

const Toast = ({ message, onClose }) => (
  <div className="fixed top-4 right-4 flex items-center bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-in z-50">
    <span className="mr-2">{message}</span>
    <button onClick={onClose} className="p-1 hover:bg-red-700 rounded">
      <X size={16} />
    </button>
  </div>
);

const dummyQuestions = [
  {
    id: 1,
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: "Paris"
  },
  {
    id: 2,
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: "Mars"
  },
  {
    id: 3,
    question: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctAnswer: "4"
  },
  {
    id: 4,
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correctAnswer: "William Shakespeare"
  },
  {
    id: 5,
    question: "Which element has the symbol 'O'?",
    options: ["Gold", "Silver", "Oxygen", "Iron"],
    correctAnswer: "Oxygen"
  },
  {
    id: 6,
    question: "What is the largest mammal?",
    options: ["African Elephant", "Blue Whale", "Giraffe", "Hippopotamus"],
    correctAnswer: "Blue Whale"
  },
  {
    id: 7,
    question: "In which year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correctAnswer: "1945"
  },
  {
    id: 8,
    question: "What is the chemical formula for water?",
    options: ["CO2", "H2O", "NaCl", "O2"],
    correctAnswer: "H2O"
  },
  {
    id: 9,
    question: "Which programming language is this component written in?",
    options: ["Python", "Java", "JavaScript", "C++"],
    correctAnswer: "JavaScript"
  },
  {
    id: 10,
    question: "What is the square root of 64?",
    options: ["6", "7", "8", "9"],
    correctAnswer: "8"
  }
];

const Portal = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(2700); // 45 minutes in seconds
  const [imageSrc, setImageSrc] = useState("");
  const [focusStatus, setFocusStatus] = useState("Checking...");
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [unfocusedTime, setUnfocusedTime] = useState(0);
  const [score, setScore] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const unfocusedTimeoutRef = useRef(null);

  useEffect(() => {
    let frameInterval;
    let unfocusedInterval;

    const initializeWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise((resolve) => {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              resolve();
            };
          });
        }

        socketRef.current = io("https://web-production-28b98.up.railway.app/", {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5
        });

        socketRef.current.on('video_feed', (data) => {
          if (data.image) {
            setImageSrc(`data:image/jpeg;base64,${data.image}`);
            setFocusStatus(data.focus_status);
            
            // Handle focus status
            if (data.focus_status !== "Candidate is Focusing!") {
              if (unfocusedTimeoutRef.current) clearTimeout(unfocusedTimeoutRef.current);
              unfocusedTimeoutRef.current = setTimeout(() => {
                setShowToast(true);
                setWarningCount(prev => prev + 1);
              }, 5000);
            } else {
              if (unfocusedTimeoutRef.current) {
                clearTimeout(unfocusedTimeoutRef.current);
                setShowToast(false);
              }
            }
          }
        });

        const context = canvasRef.current.getContext('2d');
        canvasRef.current.width = 640;
        canvasRef.current.height = 480;
        
        frameInterval = setInterval(() => {
          if (videoRef.current?.readyState === 4 && socketRef.current?.connected) {
            context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            const frame = canvasRef.current.toDataURL('image/jpeg', 0.7).split(',')[1];
            socketRef.current.emit('video_frame', { frame });
          }
        }, 100);

      } catch (err) {
        setError(`Webcam error: ${err.message}`);
        setFocusStatus("Error: Cannot access webcam");
      }
    };

    initializeWebcam();

    // Timer countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Track unfocused time
    unfocusedInterval = setInterval(() => {
      if (showToast) {
        setUnfocusedTime(prev => prev + 1);
      }
    }, 1000);

    return () => {
      clearInterval(frameInterval);
      clearInterval(timer);
      clearInterval(unfocusedInterval);
      if (unfocusedTimeoutRef.current) clearTimeout(unfocusedTimeoutRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [showToast]);

  const handleAnswerSelect = (questionId, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = () => {
    let totalScore = 0;
    dummyQuestions.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        totalScore++;
      }
    });
    setScore(totalScore);
    setExamSubmitted(true);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (examSubmitted) {
    return (
      <div className="pt-24 min-h-screen bg-gray-100">
        <div className="container mx-auto p-4">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-3xl font-bold text-center mb-6">Exam Results</h2>
            <div className="text-center mb-8">
              <p className="text-2xl mb-4">Your Score: {score} out of {dummyQuestions.length}</p>
              <p className="text-xl mb-2">Percentage: {((score/dummyQuestions.length) * 100).toFixed(1)}%</p>
              <p className="text-gray-600">Time Unfocused: {formatTime(unfocusedTime)}</p>
              <p className="text-gray-600">Focus Warnings: {warningCount}</p>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Question Review:</h3>
              {dummyQuestions.map((question) => (
                <div key={question.id} className="mb-6 p-4 border rounded">
                  <p className="font-medium">{question.question}</p>
                  <p className="text-green-600">Correct Answer: {question.correctAnswer}</p>
                  <p className={`${
                    selectedAnswers[question.id] === question.correctAnswer 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    Your Answer: {selectedAnswers[question.id] || 'Not answered'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        {/* Toast Notification */}
        {showToast && (
          <Toast 
            message={`Warning: Please focus on your exam! (Warning ${warningCount} of 3)`}
            onClose={() => setShowToast(false)}
          />
        )}

        {/* Header with Focus Status */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Online Examination</h1>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-full ${
                focusStatus === "Candidate is Focusing!" 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {focusStatus}
              </div>
              <div className="text-lg font-semibold text-red-600">{formatTime(timeLeft)}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ position: 'absolute', opacity: 0 }}
                />
                {error ? (
                  <div className="absolute inset-0 flex items-center justify-center text-red-500">
                    {error}
                  </div>
                ) : imageSrc ? (
                  <img 
                    src={imageSrc} 
                    alt="Processed Video Feed" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    Loading webcam feed...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">
                  Question {currentQuestion + 1} of {dummyQuestions.length}
                </h2>
                <p className="text-lg">{dummyQuestions[currentQuestion].question}</p>
              </div>

              <div className="space-y-4">
                {dummyQuestions[currentQuestion].options.map((option, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedAnswers[dummyQuestions[currentQuestion].id] === option
                        ? 'bg-blue-100 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleAnswerSelect(dummyQuestions[currentQuestion].id, option)}
                  >
                    {option}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                  onClick={() => setCurrentQuestion(prev => prev - 1)}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </button>
                {currentQuestion === dummyQuestions.length - 1 ? (
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    onClick={handleSubmit}
                  >
                    Submit Exam
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => setCurrentQuestion(prev => prev + 1)}
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portal;